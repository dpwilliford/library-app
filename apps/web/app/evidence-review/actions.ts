"use server";

import { redirect } from "next/navigation";
import {
  approveClaim,
  createClaim,
  createEvidenceFromExistingSourceForClaim,
  createSourceEvidenceForClaim,
  rejectClaim,
  requestClaimRevision,
  submitClaimForReview,
  updateClaim,
  updateSourceAndEvidenceRecord
} from "@/lib/phase3/claimsData";
import { canManageEvidence } from "@/lib/phase3/permissions";
import { requireUser } from "@/lib/session";

async function requireEvidenceManager() {
  const user = await requireUser();
  if (!canManageEvidence(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function redirectWithError(path: string, error: unknown): never {
  const message = error instanceof Error ? error.message : "Unable to save evidence workflow change.";
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createClaimAction(formData: FormData) {
  const user = await requireEvidenceManager();
  let claimId = "";
  try {
    const claim = createClaim(
      {
        claimText: text(formData, "claimText"),
        claimType: text(formData, "claimType"),
        confidenceLevel: text(formData, "confidenceLevel"),
        relatedHoldingId: text(formData, "relatedHoldingId"),
        collectionAreaId: text(formData, "collectionAreaId")
      },
      user.email
    );
    claimId = claim?.id ?? "";
  } catch (error) {
    redirectWithError("/evidence-review/new", error);
  }
  redirect(`/evidence-review/${claimId}`);
}

export async function updateClaimAction(formData: FormData) {
  const user = await requireEvidenceManager();
  const claimId = text(formData, "claimId");
  try {
    updateClaim(
      claimId,
      {
        claimText: text(formData, "claimText"),
        claimType: text(formData, "claimType"),
        confidenceLevel: text(formData, "confidenceLevel"),
        relatedHoldingId: text(formData, "relatedHoldingId"),
        collectionAreaId: text(formData, "collectionAreaId")
      },
      user.email
    );
  } catch (error) {
    redirectWithError(`/evidence-review/${claimId}/edit`, error);
  }
  redirect(`/evidence-review/${claimId}`);
}

export async function createEvidenceAction(formData: FormData) {
  const user = await requireEvidenceManager();
  const claimId = text(formData, "claimId");
  try {
    createSourceEvidenceForClaim(
      claimId,
      {
        sourceTitle: text(formData, "sourceTitle"),
        sourceCreator: text(formData, "sourceCreator"),
        sourceType: text(formData, "sourceType"),
        sourceUrl: text(formData, "sourceUrl"),
        citation: text(formData, "citation"),
        publisher: text(formData, "publisher"),
        publicationDate: text(formData, "publicationDate")
      },
      {
        excerpt: text(formData, "excerpt"),
        supportingData: text(formData, "supportingData"),
        dateAccessed: text(formData, "dateAccessed")
      },
      text(formData, "relationship"),
      user.email
    );
  } catch (error) {
    redirectWithError(`/evidence-review/${claimId}/evidence/new`, error);
  }
  redirect(`/evidence-review/${claimId}`);
}

export async function createEvidenceFromExistingSourceAction(formData: FormData) {
  const user = await requireEvidenceManager();
  const claimId = text(formData, "claimId").trim();
  try {
    const sourceId = text(formData, "sourceId").trim();
    const excerpt = text(formData, "excerpt");
    const supportingData = text(formData, "supportingData");
    if (!claimId) {
      throw new Error("Claim is required.");
    }
    if (!sourceId) {
      throw new Error("Source is required.");
    }
    if (!excerpt.trim() && !supportingData.trim()) {
      throw new Error("Evidence requires an excerpt or supporting data.");
    }
    createEvidenceFromExistingSourceForClaim(
      claimId,
      sourceId,
      {
        excerpt,
        supportingData,
        dateAccessed: text(formData, "dateAccessed")
      },
      text(formData, "relationship"),
      user.email
    );
  } catch (error) {
    redirectWithError(`/evidence-review/${claimId}/evidence/new`, error);
  }
  redirect(`/evidence-review/${claimId}`);
}

export async function updateEvidenceAction(formData: FormData) {
  const user = await requireEvidenceManager();
  const claimId = text(formData, "claimId");
  const evidenceId = text(formData, "evidenceId");
  const sourceId = text(formData, "sourceId");
  try {
    updateSourceAndEvidenceRecord(
      sourceId,
      {
        sourceTitle: text(formData, "sourceTitle"),
        sourceCreator: text(formData, "sourceCreator"),
        sourceType: text(formData, "sourceType"),
        sourceUrl: text(formData, "sourceUrl"),
        citation: text(formData, "citation"),
        publisher: text(formData, "publisher"),
        publicationDate: text(formData, "publicationDate")
      },
      evidenceId,
      {
        excerpt: text(formData, "excerpt"),
        supportingData: text(formData, "supportingData"),
        dateAccessed: text(formData, "dateAccessed")
      },
      user.email
    );
  } catch (error) {
    redirectWithError(`/evidence-review/${claimId}/evidence/${evidenceId}/edit`, error);
  }
  redirect(`/evidence-review/${claimId}`);
}

export async function submitClaimForReviewAction(formData: FormData) {
  const user = await requireEvidenceManager();
  const claimId = text(formData, "claimId");
  try {
    submitClaimForReview(claimId, user.email);
  } catch (error) {
    redirectWithError(`/evidence-review/${claimId}`, error);
  }
  redirect(`/evidence-review/${claimId}`);
}

export async function approveClaimAction(formData: FormData) {
  const user = await requireEvidenceManager();
  const claimId = text(formData, "claimId");
  try {
    approveClaim(claimId, text(formData, "note"), user.email);
  } catch (error) {
    redirectWithError(`/evidence-review/${claimId}`, error);
  }
  redirect(`/evidence-review/${claimId}`);
}

export async function rejectClaimAction(formData: FormData) {
  const user = await requireEvidenceManager();
  const claimId = text(formData, "claimId");
  try {
    rejectClaim(claimId, text(formData, "note"), user.email);
  } catch (error) {
    redirectWithError(`/evidence-review/${claimId}`, error);
  }
  redirect(`/evidence-review/${claimId}`);
}

export async function requestClaimRevisionAction(formData: FormData) {
  const user = await requireEvidenceManager();
  const claimId = text(formData, "claimId");
  try {
    requestClaimRevision(claimId, text(formData, "note"), user.email);
  } catch (error) {
    redirectWithError(`/evidence-review/${claimId}`, error);
  }
  redirect(`/evidence-review/${claimId}`);
}
