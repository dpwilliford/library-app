import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sessionMock = vi.hoisted(() => ({
  requireUser: vi.fn()
}));

const navigationMock = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  })
}));

vi.mock("@/lib/session", () => sessionMock);
vi.mock("next/navigation", () => navigationMock);

const librarian = {
  email: "librarian@library.test",
  name: "Librarian Demo",
  role: "librarian"
};

const student = {
  email: "student@library.test",
  name: "Student Demo",
  role: "student"
};

const professor = {
  email: "professor@library.test",
  name: "Professor Demo",
  role: "professor"
};

const administrator = {
  email: "admin@library.test",
  name: "Admin Demo",
  role: "administrator"
};

async function loadModules(dbPath: string) {
  process.env.LIBRARY_DB_PATH = dbPath;
  const db = await import("@/lib/phase2/db");
  db.resetDbForTests();
  return {
    db,
    phase3: await import("@/lib/phase3/claimsData")
  };
}

describe("Phase 3.4 read-only source routes", () => {
  let tempDir: string;
  let dbPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "library-source-routes-"));
    dbPath = join(tempDir, "test.sqlite");
    sessionMock.requireUser.mockReset();
    navigationMock.redirect.mockClear();
    navigationMock.notFound.mockClear();
  });

  afterEach(async () => {
    const { db } = await loadModules(dbPath);
    db.resetDbForTests();
    rmSync(tempDir, { recursive: true, force: true });
    delete process.env.LIBRARY_DB_PATH;
  });

  it("redirects student and professor users away from the source index and detail routes", async () => {
    await loadModules(dbPath);
    const { default: SourceIndexPage } = await import("./page");
    const { default: SourceDetailPage } = await import("./[sourceId]/page");

    for (const user of [student, professor]) {
      sessionMock.requireUser.mockResolvedValue(user);
      await expect(SourceIndexPage()).rejects.toThrow("REDIRECT:/dashboard");
      await expect(SourceDetailPage({ params: { sourceId: "missing" } })).rejects.toThrow("REDIRECT:/dashboard");
    }
    expect(navigationMock.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("allows administrator users to access the source index and detail routes", async () => {
    sessionMock.requireUser.mockResolvedValue(administrator);
    const { phase3 } = await loadModules(dbPath);
    const source = phase3.createSource({ sourceTitle: "Administrative source", sourceType: "book" }, administrator.email);
    const { default: SourceIndexPage } = await import("./page");
    const { default: SourceDetailPage } = await import("./[sourceId]/page");

    expect(textContent(await SourceIndexPage())).toContain("Administrative source");
    expect(textContent(await SourceDetailPage({ params: { sourceId: source!.id } }))).toContain("Administrative source");
  });

  it("renders the source index empty state for librarian users", async () => {
    sessionMock.requireUser.mockResolvedValue(librarian);
    await loadModules(dbPath);
    const { default: SourceIndexPage } = await import("./page");

    const page = await SourceIndexPage();
    const text = textContent(page);

    expect(text).toContain("Source Index");
    expect(text).toContain("Source index has no records");
    expect(text).toContain("Evidence Review");
  });

  it("renders normalized source rows and duplicate counts on the source index", async () => {
    sessionMock.requireUser.mockResolvedValue(librarian);
    const { phase3 } = await loadModules(dbPath);
    phase3.createSource(
      {
        sourceTitle: "Publisher source",
        sourceType: "publisher_page",
        sourceUrl: " HTTPS://Example.Test/Source#section ",
        citation: "Shared Citation."
      },
      librarian.email
    );
    phase3.createSource(
      {
        sourceTitle: "Duplicate publisher source",
        sourceType: "publisher_page",
        sourceUrl: "https://example.test/Source#other",
        citation: "Shared Citation"
      },
      librarian.email
    );
    const { default: SourceIndexPage } = await import("./page");

    const page = await SourceIndexPage();
    const text = textContent(page);

    expect(text).toContain("Publisher source");
    expect(text).toContain("https://example.test/Source");
    expect(text).toContain("shared citation");
    expect(text).toContain("Duplicate candidates");
  });

  it("renders source detail metadata, linked evidence, claims, and advisory duplicate candidates", async () => {
    sessionMock.requireUser.mockResolvedValue(librarian);
    const { phase3 } = await loadModules(dbPath);
    const source = phase3.createSource(
      {
        sourceTitle: "Reusable source",
        sourceType: "web_page",
        sourceUrl: "https://example.test/source#details",
        citation: "Reusable Citation."
      },
      librarian.email
    );
    phase3.createSource(
      {
        sourceTitle: "Likely duplicate source",
        sourceType: "web_page",
        sourceUrl: "https://example.test/source#other",
        citation: "Reusable Citation"
      },
      librarian.email
    );
    const claim = phase3.createClaim(
      { claimText: "A claim linked to reusable evidence.", claimType: "description", confidenceLevel: "medium" },
      librarian.email
    );
    const evidence = phase3.createEvidenceRecord(
      { sourceId: source!.id, excerpt: "A reusable excerpt.", dateAccessed: "2026-04-30" },
      librarian.email
    );
    phase3.attachEvidenceToClaim(claim!.id, evidence!.id, "supports", librarian.email);
    const { default: SourceDetailPage } = await import("./[sourceId]/page");

    const page = await SourceDetailPage({ params: { sourceId: source!.id } });
    const text = textContent(page);

    expect(text).toContain("Reusable source");
    expect(text).toContain("https://example.test/source");
    expect(text).toContain("reusable citation");
    expect(text).toContain("Likely duplicate source");
    expect(text).toContain("Matches by normalized URL and normalized citation key");
    expect(text).toContain("A claim linked to reusable evidence.");
    expect(text).toContain("A reusable excerpt.");
    expect(text).toContain("Accessed 2026-04-30");
  });

  it("returns not found for missing librarian-accessible source detail records", async () => {
    sessionMock.requireUser.mockResolvedValue(librarian);
    await loadModules(dbPath);
    const { default: SourceDetailPage } = await import("./[sourceId]/page");

    await expect(SourceDetailPage({ params: { sourceId: "missing-source" } })).rejects.toThrow("NOT_FOUND");
  });
});

function textContent(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(textContent).join(" ");
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return textContent(node.props.children);
  }
  return "";
}
