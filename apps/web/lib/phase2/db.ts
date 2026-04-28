import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import DatabaseConstructor from "better-sqlite3";

type Statement = {
  all: (...values: unknown[]) => Array<Record<string, unknown>>;
  get: (...values: unknown[]) => Record<string, unknown> | undefined;
  run: (...values: unknown[]) => { changes: number; lastInsertRowid: number | bigint };
};

type Database = {
  close?: () => void;
  exec: (sql: string) => void;
  prepare: (sql: string) => Statement;
};

let cachedDb: Database | null = null;

export const seedCollectionAreas = [
  "Comics / Graphic Novels",
  "Manga / Anime",
  "Illustration",
  "Animation",
  "Film / DVD",
  "Video Games",
  "Books / Other",
  "Unassigned"
];

export function getDb(): Database {
  if (cachedDb) {
    return cachedDb;
  }

  const dbPath = process.env.LIBRARY_DB_PATH ?? join(process.cwd(), "data", "library.sqlite");
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseConstructor(dbPath) as unknown as Database;
  setupSchema(db);
  cachedDb = db;
  return db;
}

export function resetDbForTests() {
  cachedDb?.close?.();
  cachedDb = null;
}

function setupSchema(db: Database) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS collection_areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS import_batches (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      imported_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      row_count INTEGER NOT NULL,
      saved_count INTEGER NOT NULL DEFAULT 0,
      rejected_count INTEGER NOT NULL DEFAULT 0,
      skipped_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      headers_json TEXT NOT NULL,
      mapping_json TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS import_rows (
      id TEXT PRIMARY KEY,
      import_batch_id TEXT NOT NULL,
      row_number INTEGER NOT NULL,
      raw_data_json TEXT NOT NULL,
      mapped_data_json TEXT NOT NULL,
      validation_status TEXT NOT NULL,
      validation_messages_json TEXT NOT NULL,
      import_action TEXT NOT NULL DEFAULT 'pending',
      matched_holding_id TEXT,
      FOREIGN KEY (import_batch_id) REFERENCES import_batches(id)
    );

    CREATE TABLE IF NOT EXISTS holdings (
      id TEXT PRIMARY KEY,
      external_local_identifier TEXT NOT NULL UNIQUE,
      external_identifier_field TEXT NOT NULL,
      source_system_identifier TEXT,
      title TEXT NOT NULL,
      creator_contributor TEXT,
      publisher TEXT,
      publication_year TEXT,
      format TEXT,
      material_type TEXT,
      isbn TEXT,
      call_number TEXT,
      location TEXT,
      status TEXT NOT NULL,
      acquisition_date TEXT,
      collection_area_id TEXT,
      import_batch_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by_user_id TEXT NOT NULL,
      FOREIGN KEY (collection_area_id) REFERENCES collection_areas(id),
      FOREIGN KEY (import_batch_id) REFERENCES import_batches(id)
    );

    CREATE TABLE IF NOT EXISTS holding_original_values (
      holding_id TEXT PRIMARY KEY,
      original_raw_data_json TEXT NOT NULL,
      original_title TEXT,
      original_creator_contributor TEXT,
      original_publisher TEXT,
      original_publication_year TEXT,
      original_format TEXT,
      original_material_type TEXT,
      original_isbn TEXT,
      original_call_number TEXT,
      original_location TEXT,
      original_status TEXT,
      original_acquisition_date TEXT,
      FOREIGN KEY (holding_id) REFERENCES holdings(id)
    );

    CREATE TABLE IF NOT EXISTS holding_edit_logs (
      id TEXT PRIMARY KEY,
      holding_id TEXT NOT NULL,
      edited_by_user_id TEXT NOT NULL,
      edited_at TEXT NOT NULL,
      field_name TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      reason TEXT,
      FOREIGN KEY (holding_id) REFERENCES holdings(id)
    );

    CREATE TABLE IF NOT EXISTS holding_contributors (
      id TEXT PRIMARY KEY,
      holding_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL,
      source TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (holding_id) REFERENCES holdings(id)
    );

    CREATE TABLE IF NOT EXISTS claims (
      id TEXT PRIMARY KEY,
      claim_text TEXT NOT NULL CHECK (length(trim(claim_text)) > 0),
      claim_type TEXT NOT NULL CHECK (claim_type IN (
        'description',
        'historical_context',
        'creator_context',
        'format_context',
        'teaching_relevance',
        'collection_relevance',
        'other'
      )),
      related_holding_id TEXT REFERENCES holdings(id) ON DELETE SET NULL,
      collection_area_id TEXT REFERENCES collection_areas(id) ON DELETE SET NULL,
      confidence_level TEXT NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')),
      review_status TEXT NOT NULL CHECK (review_status IN (
        'draft',
        'ready_for_review',
        'approved',
        'rejected',
        'needs_revision'
      )),
      created_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      reviewed_by_user_id TEXT,
      reviewed_at TEXT,
      review_note TEXT
    );

    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      source_title TEXT,
      source_creator TEXT,
      source_type TEXT NOT NULL CHECK (source_type IN (
        'catalog',
        'book',
        'article',
        'publisher_page',
        'institutional_note',
        'course_material',
        'web_page',
        'other'
      )),
      source_url TEXT,
      citation TEXT,
      publisher TEXT,
      publication_date TEXT,
      created_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK (
        length(trim(coalesce(source_title, ''))) > 0
        OR length(trim(coalesce(source_url, ''))) > 0
        OR length(trim(coalesce(citation, ''))) > 0
      )
    );

    CREATE TABLE IF NOT EXISTS evidence_records (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
      excerpt TEXT,
      supporting_data TEXT,
      date_accessed TEXT,
      created_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK (
        length(trim(coalesce(excerpt, ''))) > 0
        OR length(trim(coalesce(supporting_data, ''))) > 0
      )
    );

    CREATE TABLE IF NOT EXISTS claim_evidence (
      id TEXT PRIMARY KEY,
      claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
      evidence_id TEXT NOT NULL REFERENCES evidence_records(id) ON DELETE RESTRICT,
      relationship TEXT NOT NULL CHECK (relationship IN (
        'supports',
        'contextualizes',
        'contradicts',
        'requires_followup'
      )),
      sort_order INTEGER NOT NULL DEFAULT 1,
      UNIQUE(claim_id, evidence_id)
    );

    CREATE TABLE IF NOT EXISTS claim_events (
      id TEXT PRIMARY KEY,
      claim_id TEXT REFERENCES claims(id) ON DELETE CASCADE,
      entity_type TEXT NOT NULL CHECK (entity_type IN (
        'claim',
        'source',
        'evidence',
        'claim_evidence'
      )),
      entity_id TEXT NOT NULL,
      acted_by_user_id TEXT NOT NULL,
      acted_at TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN (
        'created',
        'updated',
        'source_created',
        'source_updated',
        'evidence_attached',
        'evidence_updated',
        'evidence_removed',
        'submitted_for_review',
        'approved',
        'rejected',
        'revision_requested',
        'returned_to_revision_after_edit'
      )),
      old_status TEXT,
      new_status TEXT,
      old_value TEXT,
      new_value TEXT,
      note TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_claims_review_status ON claims(review_status);
    CREATE INDEX IF NOT EXISTS idx_claims_confidence_level ON claims(confidence_level);
    CREATE INDEX IF NOT EXISTS idx_claims_claim_type ON claims(claim_type);
    CREATE INDEX IF NOT EXISTS idx_claims_related_holding_id ON claims(related_holding_id);
    CREATE INDEX IF NOT EXISTS idx_claims_collection_area_id ON claims(collection_area_id);
    CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at);
    CREATE INDEX IF NOT EXISTS idx_sources_source_type ON sources(source_type);
    CREATE INDEX IF NOT EXISTS idx_sources_source_url ON sources(source_url);
    CREATE INDEX IF NOT EXISTS idx_sources_citation ON sources(citation);
    CREATE INDEX IF NOT EXISTS idx_evidence_records_source_id ON evidence_records(source_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_records_date_accessed ON evidence_records(date_accessed);
    CREATE INDEX IF NOT EXISTS idx_claim_evidence_claim_id ON claim_evidence(claim_id);
    CREATE INDEX IF NOT EXISTS idx_claim_evidence_evidence_id ON claim_evidence(evidence_id);
    CREATE INDEX IF NOT EXISTS idx_claim_evidence_relationship ON claim_evidence(relationship);
    CREATE INDEX IF NOT EXISTS idx_claim_events_claim_id ON claim_events(claim_id);
    CREATE INDEX IF NOT EXISTS idx_claim_events_entity ON claim_events(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_claim_events_action ON claim_events(action);
    CREATE INDEX IF NOT EXISTS idx_claim_events_acted_at ON claim_events(acted_at);
  `);

  seedCollectionAreas.forEach((name, index) => {
    db.prepare(
      `INSERT OR IGNORE INTO collection_areas (id, name, description, is_active, sort_order)
     VALUES (?, ?, ?, 1, ?)`
    ).run(slugify(name), name, `${name} seed value`, index + 1);
  });

  backfillLegacyContributors(db);
}

function backfillLegacyContributors(db: Database) {
  const holdings = db
    .prepare(
      `SELECT id, creator_contributor
       FROM holdings h
       WHERE creator_contributor IS NOT NULL
         AND creator_contributor != ''
         AND NOT EXISTS (SELECT 1 FROM holding_contributors hc WHERE hc.holding_id = h.id)`
    )
    .all();

  for (const holding of holdings) {
    const names = String(holding.creator_contributor)
      .split(";")
      .map((name) => name.trim())
      .filter(Boolean);
    const timestamp = nowIso();
    names.forEach((name, index) => {
      db.prepare(
        `INSERT INTO holding_contributors
         (id, holding_id, name, role, sort_order, source, created_at, updated_at)
         VALUES (?, ?, ?, '', ?, 'legacy_flat', ?, ?)`
      ).run(randomUUID(), String(holding.id), name, index + 1, timestamp, timestamp);
    });
  }
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function nowIso() {
  return new Date().toISOString();
}

export function jsonParse<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
