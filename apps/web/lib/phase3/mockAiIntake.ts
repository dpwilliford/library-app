import { createClaim, createSourceEvidenceForClaim, getClaim } from "./claimsData";
import { canManageEvidence } from "./permissions";
import type { SessionUser } from "../session";
import type { Claim, CreateSourceInput } from "./models";

export type AICandidateClaimKind =
  | "candidate_description"
  | "candidate_historical_context"
  | "candidate_creator_context"
  | "candidate_format_context"
  | "candidate_teaching_relevance"
  | "candidate_collection_relevance"
  | "candidate_other";

export type AICandidateConfidenceHint = "candidate_low" | "candidate_medium" | "candidate_high";

export type AICandidateEvidenceLink = "candidate_supports" | "candidate_contextualizes" | "candidate_requires_followup";

export type AICandidatePreview = {
  candidateClaimText: string;
  candidateClaimKind: AICandidateClaimKind;
  candidateConfidenceHint: AICandidateConfidenceHint;
  candidateSourceLabel: string;
  candidateSourceLocator: string;
  candidateEvidenceText: string;
  candidateEvidenceLink: AICandidateEvidenceLink;
  candidateUncertaintyNote: string;
};

export type AICandidateSaveUser = Pick<SessionUser, "email" | "role">;

export type AICandidateSaveValidation = {
  candidate: AICandidatePreview;
  isValidForSave: boolean;
  validationMessages: string[];
};

export type SavedAIDraftConfirmationItem = {
  id: string;
  title: string;
};

const forbiddenRecordKeys = ["id", "claimId", "sourceId", "evidenceId", "reviewStatus", "review_status", "claimEventId"];

export type GenerateAICandidatesOptions = {
  maxCandidates?: number;
};

const defaultMaxCandidates = 5;

export function generateAICandidates(rawText: string, options: GenerateAICandidatesOptions = {}) {
  const normalized = rawText.replace(/\r\n?/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const maxCandidates = Math.max(1, Math.min(options.maxCandidates ?? defaultMaxCandidates, 10));
  return normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .slice(0, maxCandidates)
    .map(candidateFromBlock);
}

export const previewAICandidates = generateAICandidates;

export function validateSelectedAICandidatesForSave(candidates: AICandidatePreview[], user: AICandidateSaveUser) {
  if (!Array.isArray(candidates)) {
    throw new Error("Selected candidates must be an array.");
  }
  const permissionMessages = canManageEvidence(user.role) ? [] : ["Only evidence manager roles can save AI intake candidates."];
  const seenCandidateKeys = new Set<string>();

  return candidates.map((candidate) => {
    const candidateKey = candidateDedupeKey(candidate);
    const duplicateMessages =
      candidateKey && seenCandidateKeys.has(candidateKey) ? ["Duplicate selected AI intake candidate."] : [];
    if (candidateKey) {
      seenCandidateKeys.add(candidateKey);
    }
    const validationMessages = [
      ...permissionMessages,
      ...duplicateMessages,
      ...candidateRecordKeyMessages(candidate),
      ...candidateShapeMessages(candidate),
      ...(trimmedValue(candidate, "candidateClaimText") ? [] : ["Candidate requires claim text before save."]),
      ...(trimmedValue(candidate, "candidateEvidenceText") ? [] : ["Candidate requires evidence text before save."]),
      ...(trimmedValue(candidate, "candidateSourceLabel") || trimmedValue(candidate, "candidateSourceLocator")
        ? []
        : ["Candidate requires source label or source locator before save."])
    ];

    return {
      candidate,
      isValidForSave: validationMessages.length === 0,
      validationMessages
    };
  });
}

export function saveSelectedAICandidatesAsDraftRecords(candidates: AICandidatePreview[], user: AICandidateSaveUser) {
  if (!canManageEvidence(user.role)) {
    throw new Error("Only evidence manager roles can save AI intake candidates.");
  }
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error("Select at least one AI intake candidate to save.");
  }
  const validation = validateSelectedAICandidatesForSave(candidates, user);
  const invalid = validation.find((result) => !result.isValidForSave);
  if (invalid) {
    throw new Error(invalid.validationMessages[0] ?? "Selected AI intake candidate is malformed.");
  }

  return candidates.map((candidate) => {
    const claim = createClaim(
      {
        claimText: candidate.candidateClaimText,
        claimType: claimTypeFromCandidate(candidate.candidateClaimKind),
        confidenceLevel: confidenceFromCandidate(candidate.candidateConfidenceHint)
      },
      user.email
    );
    if (!claim) {
      throw new Error("Claim could not be created from selected AI intake candidate.");
    }
    createSourceEvidenceForClaim(
      claim.id,
      sourceInputFromCandidate(candidate),
      {
        excerpt: candidate.candidateEvidenceText,
        dateAccessed: dateAccessedFromCandidate(candidate)
      },
      relationshipFromCandidate(candidate.candidateEvidenceLink),
      user.email
    );
    const savedClaim = getClaim(claim.id);
    if (!savedClaim) {
      throw new Error("Saved AI intake draft claim could not be loaded.");
    }
    return savedClaim;
  });
}

export function evidenceReviewRedirectForSavedAICandidates(claims: Pick<Claim, "id">[]) {
  if (claims.length === 0) {
    return "/evidence-review";
  }
  const params = new URLSearchParams();
  for (const claim of claims) {
    params.append("aiSavedDraftId", claim.id);
  }
  return `/evidence-review?${params.toString()}`;
}

export function listSavedAIDraftConfirmationItems(claimIds: string | string[] | undefined): SavedAIDraftConfirmationItem[] {
  const ids = Array.isArray(claimIds) ? claimIds : claimIds ? [claimIds] : [];
  const seen = new Set<string>();
  return ids
    .map((id) => id.trim())
    .filter(Boolean)
    .filter((id) => {
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    })
    .map((id) => getClaim(id))
    .filter((claim): claim is Claim => Boolean(claim))
    .map((claim) => ({
      id: claim.id,
      title: claim.claimText
    }));
}

function candidateFromBlock(block: string): AICandidatePreview {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const compact = lines.join(" ").replace(/\s+/g, " ").trim();
  const sourceLocator = extractUrl(compact);
  const evidenceText = extractQuotedText(compact) || firstSentence(compact);
  const claimText = firstSentence(compact.replace(sourceLocator, "").trim()) || compact;
  const hasEvidenceMarker = Boolean(extractQuotedText(compact));

  return {
    candidateClaimText: truncate(cleanSentence(claimText), 280),
    candidateClaimKind: inferClaimKind(compact),
    candidateConfidenceHint: inferConfidenceHint(sourceLocator, hasEvidenceMarker, evidenceText),
    candidateSourceLabel: truncate(lines[0]?.replace(sourceLocator, "").trim() || "Unspecified pasted source", 160),
    candidateSourceLocator: sourceLocator,
    candidateEvidenceText: truncate(cleanSentence(evidenceText), 500),
    candidateEvidenceLink: inferEvidenceLink(compact),
    candidateUncertaintyNote: uncertaintyNote(sourceLocator, hasEvidenceMarker)
  };
}

function extractUrl(value: string) {
  return value.match(/https?:\/\/[^\s)]+/i)?.[0] ?? "";
}

function extractQuotedText(value: string) {
  return value.match(/["“]([^"”]+)["”]/)?.[1]?.trim() ?? "";
}

function firstSentence(value: string) {
  return value.match(/[^.!?]+[.!?]?/)?.[0]?.trim() ?? "";
}

function cleanSentence(value: string) {
  return value.replace(/\s+/g, " ").replace(/^[\-–—:;,\s]+/, "").trim();
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function inferClaimKind(value: string): AICandidateClaimKind {
  const lower = value.toLowerCase();
  if (/\b(course|class|curriculum|teach|teaching|student|faculty)\b/.test(lower)) {
    return "candidate_teaching_relevance";
  }
  if (/\b(collection|holding|gap|library|acquisition|own|owned)\b/.test(lower)) {
    return "candidate_collection_relevance";
  }
  if (/\b(creator|artist|author|director|illustrator|writer)\b/.test(lower)) {
    return "candidate_creator_context";
  }
  if (/\b(format|edition|dvd|blu-?ray|manga|anime|game|graphic novel)\b/.test(lower)) {
    return "candidate_format_context";
  }
  if (/\b(history|historical|origin|published|released|movement)\b/.test(lower)) {
    return "candidate_historical_context";
  }
  if (lower.length < 30) {
    return "candidate_other";
  }
  return "candidate_description";
}

function inferConfidenceHint(sourceLocator: string, hasEvidenceMarker: boolean, evidenceText: string): AICandidateConfidenceHint {
  if (sourceLocator && hasEvidenceMarker) {
    return "candidate_high";
  }
  if (sourceLocator || hasEvidenceMarker || evidenceText.length > 80) {
    return "candidate_medium";
  }
  return "candidate_low";
}

function inferEvidenceLink(value: string): AICandidateEvidenceLink {
  const lower = value.toLowerCase();
  if (/\b(unclear|verify|follow up|needs review|unknown)\b/.test(lower)) {
    return "candidate_requires_followup";
  }
  if (/\b(context|background|related|alongside)\b/.test(lower)) {
    return "candidate_contextualizes";
  }
  return "candidate_supports";
}

function uncertaintyNote(sourceLocator: string, hasEvidenceMarker: boolean) {
  if (!sourceLocator && !hasEvidenceMarker) {
    return "Generated from pasted text only; librarian review and evidence cleanup required before save.";
  }
  if (!sourceLocator) {
    return "Quoted evidence detected, but source locator is missing; librarian review required before save.";
  }
  if (!hasEvidenceMarker) {
    return "Source locator detected, but excerpt boundaries are inferred; librarian review required before save.";
  }
  return "Candidate is deterministic preview output and remains non-record until explicit librarian/admin save.";
}

function candidateRecordKeyMessages(candidate: AICandidatePreview) {
  if (!candidate || typeof candidate !== "object") {
    return [];
  }
  return forbiddenRecordKeys.filter((key) => Object.prototype.hasOwnProperty.call(candidate, key)).map((key) => `Candidate must not include record field ${key}.`);
}

function candidateShapeMessages(candidate: AICandidatePreview) {
  const messages: string[] = [];
  if (!candidate || typeof candidate !== "object") {
    return ["Candidate is malformed."];
  }
  for (const key of candidateStringKeys) {
    if (typeof candidate[key] !== "string") {
      messages.push(`Candidate ${key} must be text.`);
    }
  }
  if (!candidateKinds.includes(candidate.candidateClaimKind)) {
    messages.push("Candidate has an invalid claim kind.");
  }
  if (!candidateConfidenceHints.includes(candidate.candidateConfidenceHint)) {
    messages.push("Candidate has an invalid confidence hint.");
  }
  if (!candidateEvidenceLinks.includes(candidate.candidateEvidenceLink)) {
    messages.push("Candidate has an invalid evidence relationship.");
  }
  return messages;
}

function trimmedValue(candidate: AICandidatePreview, key: keyof AICandidatePreview) {
  const value = candidate?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function candidateDedupeKey(candidate: AICandidatePreview) {
  if (!candidate || typeof candidate !== "object") {
    return "";
  }
  return candidateStringKeys.map((key) => trimmedValue(candidate, key)).join("\u001f");
}

const candidateStringKeys: (keyof AICandidatePreview)[] = [
  "candidateClaimText",
  "candidateClaimKind",
  "candidateConfidenceHint",
  "candidateSourceLabel",
  "candidateSourceLocator",
  "candidateEvidenceText",
  "candidateEvidenceLink",
  "candidateUncertaintyNote"
];

const candidateKinds: AICandidateClaimKind[] = [
  "candidate_description",
  "candidate_historical_context",
  "candidate_creator_context",
  "candidate_format_context",
  "candidate_teaching_relevance",
  "candidate_collection_relevance",
  "candidate_other"
];

const candidateConfidenceHints: AICandidateConfidenceHint[] = ["candidate_low", "candidate_medium", "candidate_high"];

const candidateEvidenceLinks: AICandidateEvidenceLink[] = ["candidate_supports", "candidate_contextualizes", "candidate_requires_followup"];

function claimTypeFromCandidate(kind: AICandidateClaimKind) {
  return kind.replace(/^candidate_/, "");
}

function confidenceFromCandidate(hint: AICandidateConfidenceHint) {
  return hint.replace(/^candidate_/, "");
}

function relationshipFromCandidate(link: AICandidateEvidenceLink) {
  return link.replace(/^candidate_/, "");
}

function sourceInputFromCandidate(candidate: AICandidatePreview): CreateSourceInput {
  const sourceLocator = candidate.candidateSourceLocator.trim();
  return {
    sourceTitle: candidate.candidateSourceLabel,
    sourceType: sourceLocator.startsWith("http://") || sourceLocator.startsWith("https://") ? "web_page" : "institutional_note",
    sourceUrl: sourceLocator
  };
}

function dateAccessedFromCandidate(candidate: AICandidatePreview) {
  const sourceLocator = candidate.candidateSourceLocator.trim();
  if (!sourceLocator.startsWith("http://") && !sourceLocator.startsWith("https://")) {
    return "";
  }
  return new Date().toISOString().slice(0, 10);
}
