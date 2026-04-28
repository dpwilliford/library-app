import { randomUUID } from "node:crypto";
import { toCsv } from "../phase2/csv";
import { getDb, nowIso } from "../phase2/db";
import {
  claimEventActions,
  claimTypes,
  confidenceLevels,
  evidenceRelationships,
  reviewStatuses,
  sourceTypes,
  type Claim,
  type ClaimDetail,
  type ClaimEvent,
  type ClaimEventAction,
  type ClaimFilters,
  type ConfidenceLevel,
  type CreateClaimInput,
  type CreateEvidenceInput,
  type CreateSourceInput,
  type EvidenceForClaim,
  type EvidenceRecord,
  type EvidenceRelationship,
  type ReviewStatus,
  type Source,
  type SourceType,
  type UpdateClaimInput,
  type UpdateEvidenceInput,
  type UpdateSourceInput
} from "./models";

export {
  claimEventActions,
  claimTypes,
  confidenceLevels,
  evidenceRelationships,
  reviewStatuses,
  sourceTypes
};
export type * from "./models";

type ClaimEventInput = {
  claimId?: string;
  entityType: ClaimEvent["entityType"];
  entityId: string;
  actedByUserId: string;
  action: ClaimEventAction;
  oldStatus?: string;
  newStatus?: string;
  oldValue?: string;
  newValue?: string;
  note?: string;
};

export function listClaims(filters: ClaimFilters = {}) {
  const clauses: string[] = [];
  const values: string[] = [];

  if (filters.reviewStatus) {
    clauses.push("c.review_status = ?");
    values.push(filters.reviewStatus);
  }
  if (filters.confidenceLevel) {
    clauses.push("c.confidence_level = ?");
    values.push(filters.confidenceLevel);
  }
  if (filters.claimType) {
    clauses.push("c.claim_type = ?");
    values.push(filters.claimType);
  }
  if (filters.relatedHoldingId?.trim()) {
    clauses.push("c.related_holding_id = ?");
    values.push(filters.relatedHoldingId.trim());
  }
  if (filters.collectionAreaId?.trim()) {
    clauses.push("c.collection_area_id = ?");
    values.push(filters.collectionAreaId.trim());
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  return getDb()
    .prepare(
      `SELECT c.*, h.title AS related_holding_title, h.external_local_identifier AS related_holding_identifier,
              h.status AS related_holding_status, hca.name AS related_holding_collection_area_name,
              ca.name AS collection_area_name, COUNT(ce.id) AS evidence_count
       FROM claims c
       LEFT JOIN holdings h ON h.id = c.related_holding_id
       LEFT JOIN collection_areas hca ON hca.id = h.collection_area_id
       LEFT JOIN collection_areas ca ON ca.id = c.collection_area_id
       LEFT JOIN claim_evidence ce ON ce.claim_id = c.id
       ${where}
       GROUP BY c.id
       ORDER BY c.updated_at DESC, c.created_at DESC`
    )
    .all(...values)
    .map(claimFromDb);
}

export function getClaim(claimId: string) {
  return listClaims({}).find((claim) => claim.id === claimId) ?? null;
}

export function getClaimDetail(claimId: string): ClaimDetail | null {
  const claim = getClaim(claimId);
  if (!claim) {
    return null;
  }
  return {
    claim,
    evidence: getEvidenceForClaim(claimId),
    events: getClaimEvents(claimId)
  };
}

export function getClaimEvents(claimId: string) {
  return getDb()
    .prepare("SELECT * FROM claim_events WHERE claim_id = ? ORDER BY acted_at DESC")
    .all(claimId)
    .map(eventFromDb);
}

export function getClaimEvidence(claimId: string) {
  return getDb()
    .prepare("SELECT * FROM claim_evidence WHERE claim_id = ? ORDER BY sort_order, id")
    .all(claimId)
    .map((row) => ({
      id: String(row.id),
      claimId: String(row.claim_id),
      evidenceId: String(row.evidence_id),
      relationship: String(row.relationship) as EvidenceRelationship,
      sortOrder: Number(row.sort_order)
    }));
}

export function listSources() {
  return getDb()
    .prepare("SELECT * FROM sources ORDER BY updated_at DESC, source_title COLLATE NOCASE")
    .all()
    .map(sourceFromDb);
}

export function getSource(sourceId: string) {
  const row = getDb().prepare("SELECT * FROM sources WHERE id = ?").get(sourceId);
  return row ? sourceFromDb(row) : null;
}

export function getEvidenceRecord(evidenceId: string) {
  const row = getDb().prepare("SELECT * FROM evidence_records WHERE id = ?").get(evidenceId);
  return row ? evidenceFromDb(row) : null;
}

export function getEvidenceForClaim(claimId: string) {
  return getDb()
    .prepare(
      `SELECT ce.id AS claim_evidence_id, ce.claim_id, ce.evidence_id, ce.relationship, ce.sort_order,
              er.*, s.id AS source_row_id, s.source_title, s.source_creator, s.source_type, s.source_url,
              s.citation, s.publisher, s.publication_date, s.created_by_user_id AS source_created_by_user_id,
              s.created_at AS source_created_at, s.updated_at AS source_updated_at
       FROM claim_evidence ce
       JOIN evidence_records er ON er.id = ce.evidence_id
       JOIN sources s ON s.id = er.source_id
       WHERE ce.claim_id = ?
       ORDER BY ce.sort_order, ce.id`
    )
    .all(claimId)
    .map(evidenceForClaimFromDb);
}

export function exportClaimsCsv() {
  const rows = listClaims().flatMap((claim) => {
    const evidence = getEvidenceForClaim(claim.id);
    if (evidence.length === 0) {
      return [exportRowFor(claim)];
    }
    return evidence.map((item) => exportRowFor(claim, item));
  });
  return toCsv(rows);
}

export function runPhase3Transaction<T>(callback: () => T) {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = callback();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function createClaim(input: CreateClaimInput, userId: string) {
  const values = validateClaimInput(input);
  const id = randomUUID();
  const timestamp = nowIso();
  getDb()
    .prepare(
      `INSERT INTO claims
       (id, claim_text, claim_type, related_holding_id, collection_area_id, confidence_level, review_status,
        created_by_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)`
    )
    .run(
      id,
      values.claimText,
      values.claimType,
      values.relatedHoldingId || null,
      values.collectionAreaId || null,
      values.confidenceLevel,
      userId,
      timestamp,
      timestamp
    );
  insertClaimEvent({
    claimId: id,
    entityType: "claim",
    entityId: id,
    actedByUserId: userId,
    action: "created",
    newStatus: "draft",
    newValue: summarizeClaimValues(values)
  });
  return getClaim(id);
}

export function updateClaim(claimId: string, input: UpdateClaimInput, userId: string) {
  const current = getClaim(claimId);
  if (!current) {
    throw new Error("Claim not found.");
  }
  const values = validateClaimInput({
    claimText: input.claimText ?? current.claimText,
    claimType: input.claimType ?? current.claimType,
    confidenceLevel: input.confidenceLevel ?? current.confidenceLevel,
    relatedHoldingId: input.relatedHoldingId ?? current.relatedHoldingId,
    collectionAreaId: input.collectionAreaId ?? current.collectionAreaId
  });
  const timestamp = nowIso();
  const nextStatus = current.reviewStatus === "approved" ? "needs_revision" : current.reviewStatus;
  getDb()
    .prepare(
      `UPDATE claims
       SET claim_text = ?, claim_type = ?, related_holding_id = ?, collection_area_id = ?,
           confidence_level = ?, review_status = ?, updated_at = ?,
           reviewed_by_user_id = CASE WHEN ? = 'needs_revision' THEN NULL ELSE reviewed_by_user_id END,
           reviewed_at = CASE WHEN ? = 'needs_revision' THEN NULL ELSE reviewed_at END
       WHERE id = ?`
    )
    .run(
      values.claimText,
      values.claimType,
      values.relatedHoldingId || null,
      values.collectionAreaId || null,
      values.confidenceLevel,
      nextStatus,
      timestamp,
      nextStatus,
      nextStatus,
      claimId
    );
  insertClaimEvent({
    claimId,
    entityType: "claim",
    entityId: claimId,
    actedByUserId: userId,
    action: "updated",
    oldStatus: current.reviewStatus,
    newStatus: nextStatus,
    oldValue: summarizeClaimValues(current),
    newValue: summarizeClaimValues(values)
  });
  if (current.reviewStatus === "approved") {
    insertClaimEvent({
      claimId,
      entityType: "claim",
      entityId: claimId,
      actedByUserId: userId,
      action: "returned_to_revision_after_edit",
      oldStatus: "approved",
      newStatus: "needs_revision",
      note: "Approved claim edited; returned to revision for librarian review."
    });
  }
  return getClaim(claimId);
}

export function createSource(input: CreateSourceInput, userId: string) {
  const values = validateSourceInput(input);
  const id = randomUUID();
  const timestamp = nowIso();
  getDb()
    .prepare(
      `INSERT INTO sources
       (id, source_title, source_creator, source_type, source_url, citation, publisher, publication_date,
        created_by_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      values.sourceTitle,
      values.sourceCreator,
      values.sourceType,
      values.sourceUrl,
      values.citation,
      values.publisher,
      values.publicationDate,
      userId,
      timestamp,
      timestamp
    );
  insertClaimEvent({
    entityType: "source",
    entityId: id,
    actedByUserId: userId,
    action: "source_created",
    newValue: summarizeSourceValues(values)
  });
  return getSource(id);
}

export function createSourceEvidenceForClaim(
  claimId: string,
  sourceInput: CreateSourceInput,
  evidenceInput: Omit<CreateEvidenceInput, "sourceId">,
  relationship: EvidenceRelationship | string,
  userId: string
) {
  return runPhase3Transaction(() => {
    const source = createSource(sourceInput, userId);
    if (!source) {
      throw new Error("Source could not be created.");
    }
    const evidence = createEvidenceRecord(
      {
        sourceId: source.id,
        excerpt: evidenceInput.excerpt,
        supportingData: evidenceInput.supportingData,
        dateAccessed: evidenceInput.dateAccessed
      },
      userId
    );
    if (!evidence) {
      throw new Error("Evidence could not be created.");
    }
    attachEvidenceToClaim(claimId, evidence.id, relationship, userId);
    return getEvidenceForClaim(claimId);
  });
}

export function updateSource(sourceId: string, input: UpdateSourceInput, userId: string) {
  const current = getSource(sourceId);
  if (!current) {
    throw new Error("Source not found.");
  }
  const values = validateSourceInput({
    sourceTitle: input.sourceTitle ?? current.sourceTitle,
    sourceCreator: input.sourceCreator ?? current.sourceCreator,
    sourceType: input.sourceType ?? current.sourceType,
    sourceUrl: input.sourceUrl ?? current.sourceUrl,
    citation: input.citation ?? current.citation,
    publisher: input.publisher ?? current.publisher,
    publicationDate: input.publicationDate ?? current.publicationDate
  });
  const timestamp = nowIso();
  getDb()
    .prepare(
      `UPDATE sources
       SET source_title = ?, source_creator = ?, source_type = ?, source_url = ?, citation = ?,
           publisher = ?, publication_date = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      values.sourceTitle,
      values.sourceCreator,
      values.sourceType,
      values.sourceUrl,
      values.citation,
      values.publisher,
      values.publicationDate,
      timestamp,
      sourceId
    );
  insertClaimEvent({
    entityType: "source",
    entityId: sourceId,
    actedByUserId: userId,
    action: "source_updated",
    oldValue: summarizeSourceValues(current),
    newValue: summarizeSourceValues(values)
  });
  for (const claimId of approvedClaimIdsForSource(sourceId)) {
    returnApprovedClaimToRevisionIfNeeded(claimId, userId, "Source metadata changed; approved claim returned to revision.");
  }
  return getSource(sourceId);
}

export function createEvidenceRecord(input: CreateEvidenceInput, userId: string) {
  const source = getSource(input.sourceId);
  if (!source) {
    throw new Error("Source not found.");
  }
  const values = validateEvidenceInput(input, source);
  const id = randomUUID();
  const timestamp = nowIso();
  getDb()
    .prepare(
      `INSERT INTO evidence_records
       (id, source_id, excerpt, supporting_data, date_accessed, created_by_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, values.sourceId, values.excerpt, values.supportingData, values.dateAccessed, userId, timestamp, timestamp);
  return getEvidenceRecord(id);
}

export function updateEvidenceRecord(evidenceId: string, input: UpdateEvidenceInput, userId: string) {
  const current = getEvidenceRecord(evidenceId);
  if (!current) {
    throw new Error("Evidence record not found.");
  }
  const sourceId = input.sourceId ?? current.sourceId;
  const source = getSource(sourceId);
  if (!source) {
    throw new Error("Source not found.");
  }
  const values = validateEvidenceInput(
    {
      sourceId,
      excerpt: input.excerpt ?? current.excerpt,
      supportingData: input.supportingData ?? current.supportingData,
      dateAccessed: input.dateAccessed ?? current.dateAccessed
    },
    source
  );
  const timestamp = nowIso();
  getDb()
    .prepare(
      `UPDATE evidence_records
       SET source_id = ?, excerpt = ?, supporting_data = ?, date_accessed = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(values.sourceId, values.excerpt, values.supportingData, values.dateAccessed, timestamp, evidenceId);
  for (const claimId of claimIdsForEvidence(evidenceId)) {
    insertClaimEvent({
      claimId,
      entityType: "evidence",
      entityId: evidenceId,
      actedByUserId: userId,
      action: "evidence_updated",
      oldValue: summarizeEvidenceValues(current),
      newValue: summarizeEvidenceValues(values)
    });
    returnApprovedClaimToRevisionIfNeeded(claimId, userId, "Evidence changed; approved claim returned to revision.");
  }
  return getEvidenceRecord(evidenceId);
}

export function updateSourceAndEvidenceRecord(
  sourceId: string,
  sourceInput: UpdateSourceInput,
  evidenceId: string,
  evidenceInput: Omit<UpdateEvidenceInput, "sourceId">,
  userId: string
) {
  return runPhase3Transaction(() => {
    updateSource(sourceId, sourceInput, userId);
    return updateEvidenceRecord(
      evidenceId,
      {
        sourceId,
        excerpt: evidenceInput.excerpt,
        supportingData: evidenceInput.supportingData,
        dateAccessed: evidenceInput.dateAccessed
      },
      userId
    );
  });
}

export function attachEvidenceToClaim(
  claimId: string,
  evidenceId: string,
  relationship: EvidenceRelationship | string,
  userId: string
) {
  const claim = getClaim(claimId);
  if (!claim) {
    throw new Error("Claim not found.");
  }
  if (!getEvidenceRecord(evidenceId)) {
    throw new Error("Evidence record not found.");
  }
  if (!evidenceRelationships.includes(relationship as EvidenceRelationship)) {
    throw new Error("Invalid evidence relationship.");
  }
  const row = getDb().prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM claim_evidence WHERE claim_id = ?").get(claimId);
  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO claim_evidence (id, claim_id, evidence_id, relationship, sort_order)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(id, claimId, evidenceId, relationship, Number(row?.next_order ?? 1));
  insertClaimEvent({
    claimId,
    entityType: "claim_evidence",
    entityId: id,
    actedByUserId: userId,
    action: "evidence_attached",
    oldStatus: claim.reviewStatus,
    newStatus: claim.reviewStatus,
    newValue: `${relationship}:${evidenceId}`
  });
  returnApprovedClaimToRevisionIfNeeded(claimId, userId, "Evidence link changed; approved claim returned to revision.");
  return getClaimEvidence(claimId);
}

export function removeEvidenceFromClaim(claimId: string, evidenceId: string, userId: string) {
  const claim = getClaim(claimId);
  if (!claim) {
    throw new Error("Claim not found.");
  }
  const link = getDb().prepare("SELECT id FROM claim_evidence WHERE claim_id = ? AND evidence_id = ?").get(claimId, evidenceId);
  if (!link) {
    return getClaimEvidence(claimId);
  }
  getDb().prepare("DELETE FROM claim_evidence WHERE claim_id = ? AND evidence_id = ?").run(claimId, evidenceId);
  insertClaimEvent({
    claimId,
    entityType: "claim_evidence",
    entityId: String(link.id),
    actedByUserId: userId,
    action: "evidence_removed",
    oldStatus: claim.reviewStatus,
    newStatus: claim.reviewStatus,
    oldValue: evidenceId
  });
  returnApprovedClaimToRevisionIfNeeded(claimId, userId, "Evidence removed; approved claim returned to revision.");
  return getClaimEvidence(claimId);
}

export function submitClaimForReview(claimId: string, userId: string) {
  const claim = requireClaim(claimId);
  assertAllowedTransition(claim.reviewStatus, "ready_for_review");
  assertClaimHasCompleteEvidence(claimId);
  setClaimStatus(claimId, "ready_for_review", userId, "submitted_for_review");
  return getClaim(claimId);
}

export function approveClaim(claimId: string, note: string, userId: string) {
  const claim = requireClaim(claimId);
  assertAllowedTransition(claim.reviewStatus, "approved");
  assertClaimHasCompleteEvidence(claimId);
  setClaimStatus(claimId, "approved", userId, "approved", note);
  return getClaim(claimId);
}

export function rejectClaim(claimId: string, reason: string, userId: string) {
  if (!reason.trim()) {
    throw new Error("Rejection requires a note.");
  }
  const claim = requireClaim(claimId);
  assertAllowedTransition(claim.reviewStatus, "rejected");
  setClaimStatus(claimId, "rejected", userId, "rejected", reason);
  return getClaim(claimId);
}

export function requestClaimRevision(claimId: string, note: string, userId: string) {
  if (!note.trim()) {
    throw new Error("Revision request requires a note.");
  }
  const claim = requireClaim(claimId);
  assertAllowedTransition(claim.reviewStatus, "needs_revision");
  setClaimStatus(claimId, "needs_revision", userId, "revision_requested", note);
  return getClaim(claimId);
}

export function validateClaimInput(input: CreateClaimInput) {
  const claimText = input.claimText.trim();
  if (!claimText) {
    throw new Error("Claim text is required.");
  }
  if (!claimTypes.includes(input.claimType as never)) {
    throw new Error("Invalid claim type.");
  }
  if (!confidenceLevels.includes(input.confidenceLevel as never)) {
    throw new Error("Invalid confidence level.");
  }
  const relatedHoldingId = input.relatedHoldingId?.trim() ?? "";
  const collectionAreaId = input.collectionAreaId?.trim() ?? "";
  if (relatedHoldingId && !getDb().prepare("SELECT id FROM holdings WHERE id = ?").get(relatedHoldingId)) {
    throw new Error("Linked holding was not found.");
  }
  if (collectionAreaId && !getDb().prepare("SELECT id FROM collection_areas WHERE id = ?").get(collectionAreaId)) {
    throw new Error("Collection area was not found.");
  }
  return {
    claimText,
    claimType: input.claimType as (typeof claimTypes)[number],
    confidenceLevel: input.confidenceLevel as ConfidenceLevel,
    relatedHoldingId,
    collectionAreaId
  };
}

export function validateSourceInput(input: CreateSourceInput) {
  if (!sourceTypes.includes(input.sourceType as never)) {
    throw new Error("Invalid source type.");
  }
  const values = {
    sourceTitle: input.sourceTitle?.trim() ?? "",
    sourceCreator: input.sourceCreator?.trim() ?? "",
    sourceType: input.sourceType as SourceType,
    sourceUrl: input.sourceUrl?.trim() ?? "",
    citation: input.citation?.trim() ?? "",
    publisher: input.publisher?.trim() ?? "",
    publicationDate: input.publicationDate?.trim() ?? ""
  };
  if (!values.sourceTitle && !values.sourceUrl && !values.citation) {
    throw new Error("Source requires a title, URL, or citation.");
  }
  return values;
}

export function validateEvidenceInput(input: CreateEvidenceInput, source: Source) {
  const values = {
    sourceId: input.sourceId.trim(),
    excerpt: input.excerpt?.trim() ?? "",
    supportingData: input.supportingData?.trim() ?? "",
    dateAccessed: input.dateAccessed?.trim() ?? ""
  };
  if (!values.excerpt && !values.supportingData) {
    throw new Error("Evidence requires an excerpt or supporting data.");
  }
  if ((source.sourceType === "web_page" || source.sourceType === "publisher_page") && !values.dateAccessed) {
    throw new Error("Web and publisher page evidence requires date accessed.");
  }
  return values;
}

export function assertAllowedTransition(fromStatus: ReviewStatus | string, toStatus: ReviewStatus | string) {
  const allowed: Record<ReviewStatus, ReviewStatus[]> = {
    draft: ["ready_for_review"],
    ready_for_review: ["approved", "rejected", "needs_revision"],
    approved: ["needs_revision"],
    rejected: [],
    needs_revision: ["ready_for_review"]
  };
  if (!reviewStatuses.includes(fromStatus as never) || !reviewStatuses.includes(toStatus as never)) {
    throw new Error("Invalid review status.");
  }
  if (!allowed[fromStatus as ReviewStatus].includes(toStatus as ReviewStatus)) {
    throw new Error(`Cannot change claim from ${fromStatus} to ${toStatus}.`);
  }
}

export function assertClaimHasCompleteEvidence(claimId: string) {
  const evidence = getEvidenceForClaim(claimId);
  if (evidence.length === 0) {
    throw new Error("Claim requires evidence before review.");
  }
  for (const item of evidence) {
    validateEvidenceInput(item, item.source);
  }
}

export function returnApprovedClaimToRevisionIfNeeded(claimId: string, userId: string, note: string) {
  const claim = getClaim(claimId);
  if (!claim || claim.reviewStatus !== "approved") {
    return;
  }
  getDb()
    .prepare(
      `UPDATE claims
       SET review_status = 'needs_revision', reviewed_by_user_id = NULL, reviewed_at = NULL,
           review_note = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(note, nowIso(), claimId);
  insertClaimEvent({
    claimId,
    entityType: "claim",
    entityId: claimId,
    actedByUserId: userId,
    action: "returned_to_revision_after_edit",
    oldStatus: "approved",
    newStatus: "needs_revision",
    note
  });
}

export function insertClaimEvent(event: ClaimEventInput) {
  getDb()
    .prepare(
      `INSERT INTO claim_events
       (id, claim_id, entity_type, entity_id, acted_by_user_id, acted_at, action, old_status, new_status,
        old_value, new_value, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      randomUUID(),
      event.claimId ?? null,
      event.entityType,
      event.entityId,
      event.actedByUserId,
      nowIso(),
      event.action,
      event.oldStatus ?? null,
      event.newStatus ?? null,
      event.oldValue ?? null,
      event.newValue ?? null,
      event.note ?? null
    );
}

function setClaimStatus(claimId: string, status: ReviewStatus, userId: string, action: ClaimEventAction, note = "") {
  const claim = requireClaim(claimId);
  const timestamp = nowIso();
  getDb()
    .prepare(
      `UPDATE claims
       SET review_status = ?, updated_at = ?, reviewed_by_user_id = ?, reviewed_at = ?, review_note = ?
       WHERE id = ?`
    )
    .run(status, timestamp, userId, timestamp, note.trim(), claimId);
  insertClaimEvent({
    claimId,
    entityType: "claim",
    entityId: claimId,
    actedByUserId: userId,
    action,
    oldStatus: claim.reviewStatus,
    newStatus: status,
    note
  });
}

function requireClaim(claimId: string) {
  const claim = getClaim(claimId);
  if (!claim) {
    throw new Error("Claim not found.");
  }
  return claim;
}

function claimIdsForEvidence(evidenceId: string) {
  return getDb()
    .prepare("SELECT claim_id FROM claim_evidence WHERE evidence_id = ?")
    .all(evidenceId)
    .map((row) => String(row.claim_id));
}

function approvedClaimIdsForSource(sourceId: string) {
  return getDb()
    .prepare(
      `SELECT DISTINCT c.id
       FROM claims c
       JOIN claim_evidence ce ON ce.claim_id = c.id
       JOIN evidence_records er ON er.id = ce.evidence_id
       WHERE er.source_id = ? AND c.review_status = 'approved'`
    )
    .all(sourceId)
    .map((row) => String(row.id));
}

function claimFromDb(row: Record<string, unknown>): Claim {
  return {
    id: String(row.id),
    claimText: String(row.claim_text),
    claimType: String(row.claim_type) as Claim["claimType"],
    relatedHoldingId: String(row.related_holding_id ?? ""),
    relatedHoldingTitle: String(row.related_holding_title ?? ""),
    relatedHoldingIdentifier: String(row.related_holding_identifier ?? ""),
    relatedHoldingStatus: String(row.related_holding_status ?? ""),
    relatedHoldingCollectionAreaName: String(row.related_holding_collection_area_name ?? ""),
    collectionAreaId: String(row.collection_area_id ?? ""),
    collectionAreaName: String(row.collection_area_name ?? ""),
    confidenceLevel: String(row.confidence_level) as ConfidenceLevel,
    reviewStatus: String(row.review_status) as ReviewStatus,
    evidenceCount: Number(row.evidence_count ?? 0),
    createdByUserId: String(row.created_by_user_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    reviewedByUserId: String(row.reviewed_by_user_id ?? ""),
    reviewedAt: String(row.reviewed_at ?? ""),
    reviewNote: String(row.review_note ?? "")
  };
}

function sourceFromDb(row: Record<string, unknown>): Source {
  return {
    id: String(row.id),
    sourceTitle: String(row.source_title ?? ""),
    sourceCreator: String(row.source_creator ?? ""),
    sourceType: String(row.source_type) as SourceType,
    sourceUrl: String(row.source_url ?? ""),
    citation: String(row.citation ?? ""),
    publisher: String(row.publisher ?? ""),
    publicationDate: String(row.publication_date ?? ""),
    createdByUserId: String(row.created_by_user_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function evidenceFromDb(row: Record<string, unknown>): EvidenceRecord {
  return {
    id: String(row.id),
    sourceId: String(row.source_id),
    excerpt: String(row.excerpt ?? ""),
    supportingData: String(row.supporting_data ?? ""),
    dateAccessed: String(row.date_accessed ?? ""),
    createdByUserId: String(row.created_by_user_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function evidenceForClaimFromDb(row: Record<string, unknown>): EvidenceForClaim {
  return {
    id: String(row.claim_evidence_id),
    claimId: String(row.claim_id),
    evidenceId: String(row.evidence_id),
    relationship: String(row.relationship) as EvidenceRelationship,
    sortOrder: Number(row.sort_order),
    sourceId: String(row.source_id),
    excerpt: String(row.excerpt ?? ""),
    supportingData: String(row.supporting_data ?? ""),
    dateAccessed: String(row.date_accessed ?? ""),
    createdByUserId: String(row.created_by_user_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    source: {
      id: String(row.source_row_id),
      sourceTitle: String(row.source_title ?? ""),
      sourceCreator: String(row.source_creator ?? ""),
      sourceType: String(row.source_type) as SourceType,
      sourceUrl: String(row.source_url ?? ""),
      citation: String(row.citation ?? ""),
      publisher: String(row.publisher ?? ""),
      publicationDate: String(row.publication_date ?? ""),
      createdByUserId: String(row.source_created_by_user_id),
      createdAt: String(row.source_created_at),
      updatedAt: String(row.source_updated_at)
    }
  };
}

function eventFromDb(row: Record<string, unknown>): ClaimEvent {
  return {
    id: String(row.id),
    claimId: String(row.claim_id ?? ""),
    entityType: String(row.entity_type) as ClaimEvent["entityType"],
    entityId: String(row.entity_id),
    actedByUserId: String(row.acted_by_user_id),
    actedAt: String(row.acted_at),
    action: String(row.action) as ClaimEventAction,
    oldStatus: String(row.old_status ?? ""),
    newStatus: String(row.new_status ?? ""),
    oldValue: String(row.old_value ?? ""),
    newValue: String(row.new_value ?? ""),
    note: String(row.note ?? "")
  };
}

function summarizeClaimValues(input: Pick<Claim, "claimText" | "claimType" | "confidenceLevel" | "relatedHoldingId" | "collectionAreaId">) {
  return JSON.stringify({
    claimText: input.claimText,
    claimType: input.claimType,
    confidenceLevel: input.confidenceLevel,
    relatedHoldingId: input.relatedHoldingId,
    collectionAreaId: input.collectionAreaId
  });
}

function summarizeSourceValues(input: Pick<Source, "sourceTitle" | "sourceCreator" | "sourceType" | "sourceUrl" | "citation" | "publisher" | "publicationDate">) {
  return JSON.stringify(input);
}

function summarizeEvidenceValues(input: Pick<EvidenceRecord, "sourceId" | "excerpt" | "supportingData" | "dateAccessed">) {
  return JSON.stringify(input);
}

function exportRowFor(claim: Claim, evidence?: EvidenceForClaim) {
  return {
    claim_id: claim.id,
    claim_text: claim.claimText,
    claim_type: claim.claimType,
    review_status: claim.reviewStatus,
    confidence_level: claim.confidenceLevel,
    related_holding_id: claim.relatedHoldingId,
    related_holding_title: claim.relatedHoldingTitle,
    collection_area_id: claim.collectionAreaId,
    collection_area_name: claim.collectionAreaName,
    evidence_count: claim.evidenceCount,
    claim_created_at: claim.createdAt,
    claim_updated_at: claim.updatedAt,
    reviewed_by_user_id: claim.reviewedByUserId,
    reviewed_at: claim.reviewedAt,
    review_note: claim.reviewNote,
    claim_evidence_id: evidence?.id ?? "",
    evidence_id: evidence?.evidenceId ?? "",
    relationship: evidence?.relationship ?? "",
    source_id: evidence?.source.id ?? "",
    source_type: evidence?.source.sourceType ?? "",
    source_title: evidence?.source.sourceTitle ?? "",
    source_url: evidence?.source.sourceUrl ?? "",
    citation: evidence?.source.citation ?? "",
    excerpt: evidence?.excerpt ?? "",
    supporting_data: evidence?.supportingData ?? "",
    date_accessed: evidence?.dateAccessed ?? ""
  };
}
