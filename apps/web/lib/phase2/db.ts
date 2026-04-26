import { mkdirSync } from "node:fs";
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
  `);

  seedCollectionAreas.forEach((name, index) => {
    db.prepare(
      `INSERT OR IGNORE INTO collection_areas (id, name, description, is_active, sort_order)
       VALUES (?, ?, ?, 1, ?)`
    ).run(slugify(name), name, `${name} seed value`, index + 1);
  });
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
