import {
  mockClaims,
  mockEvidence,
  mockHoldings,
  mockInstantiations,
  mockRecommendations,
  mockTitles,
  mockWorks
} from "./mockData";

export function getTitleById(titleId: string) {
  return mockTitles.find((title) => title.id === titleId) ?? null;
}

export function getWorksForTitle(titleId: string) {
  return mockWorks.filter((work) => work.titleId === titleId);
}

export function getInstantiationsForTitle(titleId: string) {
  const workIds = getWorksForTitle(titleId).map((work) => work.id);
  return mockInstantiations.filter((instantiation) => workIds.includes(instantiation.workId));
}

export function getHoldingForInstantiation(instantiationId: string) {
  return mockHoldings.find((holding) => holding.instantiationId === instantiationId) ?? null;
}

export function getClaimsForTitle(titleId: string) {
  return mockClaims.filter((claim) => claim.titleId === titleId);
}

export function getEvidenceForClaim(evidenceIds: string[]) {
  return mockEvidence.filter((evidence) => evidenceIds.includes(evidence.id));
}

export function getMockCollectionSummary() {
  const ownedInstantiationCount = mockInstantiations.filter((item) => item.ownershipStatus === "owned").length;
  const notOwnedInstantiationCount = mockInstantiations.filter((item) => item.ownershipStatus === "not_owned").length;
  const pendingClaimCount = mockClaims.filter((claim) => claim.reviewStatus === "mock_pending_review").length;
  const activeRecommendationCount = mockRecommendations.filter((recommendation) => recommendation.status !== "mock_deferred").length;

  return {
    titleCount: mockTitles.length,
    workCount: mockWorks.length,
    instantiationCount: mockInstantiations.length,
    ownedInstantiationCount,
    notOwnedInstantiationCount,
    holdingCount: mockHoldings.length,
    pendingClaimCount,
    activeRecommendationCount
  };
}

export function getTitlesWithOwnership() {
  return mockTitles.map((title) => {
    const instantiations = getInstantiationsForTitle(title.id);
    return {
      title,
      instantiations,
      ownedCount: instantiations.filter((item) => item.ownershipStatus === "owned").length,
      notOwnedCount: instantiations.filter((item) => item.ownershipStatus === "not_owned").length
    };
  });
}

export function getLibrarianReviewItems() {
  return mockClaims
    .filter((claim) => claim.reviewStatus === "mock_pending_review")
    .map((claim) => ({
      claim,
      title: getTitleById(claim.titleId),
      evidence: getEvidenceForClaim(claim.evidenceIds)
    }));
}

