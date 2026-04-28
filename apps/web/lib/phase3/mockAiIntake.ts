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

export function validateSelectedAICandidatesForSave(candidates: AICandidatePreview[]) {
  return candidates.map((candidate) => ({
    candidate,
    isValidForSave: Boolean(candidate.candidateClaimText.trim() && candidate.candidateEvidenceText.trim()),
    validationMessages: [
      ...(candidate.candidateClaimText.trim() ? [] : ["Candidate requires claim text before save."]),
      ...(candidate.candidateEvidenceText.trim() ? [] : ["Candidate requires evidence text before save."])
    ]
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
