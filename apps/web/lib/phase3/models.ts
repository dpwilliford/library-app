export const claimTypes = [
  "description",
  "historical_context",
  "creator_context",
  "format_context",
  "teaching_relevance",
  "collection_relevance",
  "other"
] as const;

export const confidenceLevels = ["low", "medium", "high"] as const;

export const reviewStatuses = ["draft", "ready_for_review", "approved", "rejected", "needs_revision"] as const;

export const sourceTypes = [
  "catalog",
  "book",
  "article",
  "publisher_page",
  "institutional_note",
  "course_material",
  "web_page",
  "other"
] as const;

export const evidenceRelationships = ["supports", "contextualizes", "contradicts", "requires_followup"] as const;

export const claimEventActions = [
  "created",
  "updated",
  "source_created",
  "source_updated",
  "evidence_attached",
  "evidence_updated",
  "evidence_removed",
  "submitted_for_review",
  "approved",
  "rejected",
  "revision_requested",
  "returned_to_revision_after_edit"
] as const;

export type ClaimType = (typeof claimTypes)[number];
export type ConfidenceLevel = (typeof confidenceLevels)[number];
export type ReviewStatus = (typeof reviewStatuses)[number];
export type SourceType = (typeof sourceTypes)[number];
export type EvidenceRelationship = (typeof evidenceRelationships)[number];
export type ClaimEventAction = (typeof claimEventActions)[number];

export type Claim = {
  id: string;
  claimText: string;
  claimType: ClaimType;
  relatedHoldingId: string;
  relatedHoldingTitle: string;
  relatedHoldingIdentifier: string;
  relatedHoldingStatus: string;
  relatedHoldingCollectionAreaName: string;
  collectionAreaId: string;
  collectionAreaName: string;
  confidenceLevel: ConfidenceLevel;
  reviewStatus: ReviewStatus;
  evidenceCount: number;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  reviewedByUserId: string;
  reviewedAt: string;
  reviewNote: string;
};

export type Source = {
  id: string;
  sourceTitle: string;
  sourceCreator: string;
  sourceType: SourceType;
  sourceUrl: string;
  citation: string;
  publisher: string;
  publicationDate: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceRecord = {
  id: string;
  sourceId: string;
  excerpt: string;
  supportingData: string;
  dateAccessed: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type ClaimEvidence = {
  id: string;
  claimId: string;
  evidenceId: string;
  relationship: EvidenceRelationship;
  sortOrder: number;
};

export type EvidenceForClaim = ClaimEvidence &
  EvidenceRecord & {
    source: Source;
  };

export type ClaimEvent = {
  id: string;
  claimId: string;
  entityType: "claim" | "source" | "evidence" | "claim_evidence";
  entityId: string;
  actedByUserId: string;
  actedAt: string;
  action: ClaimEventAction;
  oldStatus: string;
  newStatus: string;
  oldValue: string;
  newValue: string;
  note: string;
};

export type ClaimDetail = {
  claim: Claim;
  evidence: EvidenceForClaim[];
  events: ClaimEvent[];
};

export type ClaimFilters = {
  reviewStatus?: ReviewStatus | "";
  confidenceLevel?: ConfidenceLevel | "";
  claimType?: ClaimType | "";
  relatedHoldingId?: string;
  collectionAreaId?: string;
};

export type CreateClaimInput = {
  claimText: string;
  claimType: ClaimType | string;
  confidenceLevel: ConfidenceLevel | string;
  relatedHoldingId?: string;
  collectionAreaId?: string;
};

export type UpdateClaimInput = Partial<CreateClaimInput>;

export type CreateSourceInput = {
  sourceTitle?: string;
  sourceCreator?: string;
  sourceType: SourceType | string;
  sourceUrl?: string;
  citation?: string;
  publisher?: string;
  publicationDate?: string;
};

export type UpdateSourceInput = Partial<CreateSourceInput>;

export type CreateEvidenceInput = {
  sourceId: string;
  excerpt?: string;
  supportingData?: string;
  dateAccessed?: string;
};

export type UpdateEvidenceInput = Partial<CreateEvidenceInput>;
