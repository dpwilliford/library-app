import type { RoleName } from "@library-app/shared";

export type ReviewStatus = "mock_pending_review" | "mock_reviewed" | "mock_deferred";
export type OwnershipStatus = "owned" | "not_owned";
export type RecommendationStatus = "mock_submitted" | "mock_under_review" | "mock_deferred";

export type User = {
  id: string;
  name: string;
  role: RoleName;
  department?: string;
};

export type Title = {
  id: string;
  name: string;
  collectionArea: string;
  summary: string;
  workIds: string[];
};

export type Work = {
  id: string;
  titleId: string;
  name: string;
  originalYear: number;
  creators: string[];
  originCountry: string;
  medium: string;
};

export type Instantiation = {
  id: string;
  workId: string;
  label: string;
  format: string;
  year: number;
  relationToWork: "original" | "collected_edition" | "translation" | "adaptation" | "reissue" | "critical_edition";
  ownershipStatus: OwnershipStatus;
  holdingId?: string;
};

export type Holding = {
  id: string;
  instantiationId: string;
  localIdentifier: string;
  location: string;
  acquisitionYear: number;
  status: "available" | "in_review" | "missing";
};

export type Evidence = {
  id: string;
  sourceLabel: string;
  supportingData: string;
  dateAccessed: string;
  confidence: "low" | "medium" | "high";
  reviewStatus: ReviewStatus;
};

export type Claim = {
  id: string;
  titleId: string;
  statement: string;
  evidenceIds: string[];
  reviewStatus: ReviewStatus;
};

export type Recommendation = {
  id: string;
  titleId: string;
  submittedByUserId: string;
  reason: string;
  courseOrProgram?: string;
  status: RecommendationStatus;
};

