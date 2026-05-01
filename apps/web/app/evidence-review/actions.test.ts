import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sessionMock = vi.hoisted(() => ({
  requireUser: vi.fn()
}));

const navigationMock = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  })
}));

vi.mock("@/lib/session", () => sessionMock);
vi.mock("next/navigation", () => navigationMock);

const librarian = {
  email: "librarian@library.test",
  name: "Librarian Demo",
  role: "librarian"
};

const administrator = {
  email: "admin@library.test",
  name: "Admin Demo",
  role: "administrator"
};

const student = {
  email: "student@library.test",
  name: "Student Demo",
  role: "student"
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

function reuseForm(input: {
  claimId?: string;
  sourceId?: string;
  excerpt?: string;
  supportingData?: string;
  dateAccessed?: string;
  relationship?: string;
}) {
  const formData = new FormData();
  formData.set("claimId", input.claimId ?? "");
  formData.set("sourceId", input.sourceId ?? "");
  formData.set("excerpt", input.excerpt ?? "");
  formData.set("supportingData", input.supportingData ?? "");
  formData.set("dateAccessed", input.dateAccessed ?? "");
  formData.set("relationship", input.relationship ?? "supports");
  return formData;
}

describe("Phase 3.4 source reuse server action", () => {
  let tempDir: string;
  let dbPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "library-source-reuse-action-"));
    dbPath = join(tempDir, "test.sqlite");
    sessionMock.requireUser.mockReset();
    navigationMock.redirect.mockClear();
  });

  afterEach(async () => {
    const { db } = await loadModules(dbPath);
    db.resetDbForTests();
    rmSync(tempDir, { recursive: true, force: true });
    delete process.env.LIBRARY_DB_PATH;
  });

  it("rejects unauthorized roles before source reuse writes", async () => {
    sessionMock.requireUser.mockResolvedValue(student);
    const { db, phase3 } = await loadModules(dbPath);
    const claim = phase3.createClaim({ claimText: "Unauthorized reuse claim.", claimType: "description", confidenceLevel: "medium" }, librarian.email);
    const source = phase3.createSource({ sourceTitle: "Unauthorized reuse source", sourceType: "book" }, librarian.email);
    const { createEvidenceFromExistingSourceAction } = await import("./actions");

    await expect(
      createEvidenceFromExistingSourceAction(reuseForm({ claimId: claim!.id, sourceId: source!.id, excerpt: "No write." }))
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM evidence_records").get()?.count).toBe(0);
    expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM claim_evidence").get()?.count).toBe(0);
    expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM sources").get()?.count).toBe(1);
  });

  it("allows librarian and administrator requests to create one evidence record and one claim-evidence link", async () => {
    const { db, phase3 } = await loadModules(dbPath);
    const { createEvidenceFromExistingSourceAction } = await import("./actions");

    for (const user of [librarian, administrator]) {
      sessionMock.requireUser.mockResolvedValue(user);
      const claim = phase3.createClaim({ claimText: `Reuse claim ${user.role}.`, claimType: "description", confidenceLevel: "medium" }, user.email);
      const source = phase3.createSource({ sourceTitle: `Reusable source ${user.role}`, sourceType: "book" }, user.email);
      const beforeSource = phase3.getSource(source!.id);
      const sourceCountBefore = db.getDb().prepare("SELECT COUNT(*) AS count FROM sources").get()?.count;
      const evidenceCountBefore = Number(db.getDb().prepare("SELECT COUNT(*) AS count FROM evidence_records").get()?.count ?? 0);
      const linkCountBefore = Number(db.getDb().prepare("SELECT COUNT(*) AS count FROM claim_evidence").get()?.count ?? 0);

      await expect(
        createEvidenceFromExistingSourceAction(reuseForm({ claimId: claim!.id, sourceId: source!.id, excerpt: "Reused excerpt." }))
      ).rejects.toThrow(`REDIRECT:/evidence-review/${claim!.id}`);

      expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM sources").get()?.count).toBe(sourceCountBefore);
      expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM evidence_records").get()?.count).toBe(evidenceCountBefore + 1);
      expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM claim_evidence").get()?.count).toBe(linkCountBefore + 1);
      expect(phase3.getSource(source!.id)).toEqual(beforeSource);
      expect(phase3.getEvidenceForClaim(claim!.id)).toHaveLength(1);
      expect(phase3.getEvidenceForClaim(claim!.id)[0]).toMatchObject({ sourceId: source!.id });
    }
  });

  it("redirects action-level validation errors for invalid source and claim inputs before writes", async () => {
    sessionMock.requireUser.mockResolvedValue(librarian);
    const { db, phase3 } = await loadModules(dbPath);
    const claim = phase3.createClaim({ claimText: "Invalid reuse claim.", claimType: "description", confidenceLevel: "medium" }, librarian.email);
    const source = phase3.createSource({ sourceTitle: "Invalid reuse source", sourceType: "book" }, librarian.email);
    const { createEvidenceFromExistingSourceAction } = await import("./actions");

    await expect(
      createEvidenceFromExistingSourceAction(reuseForm({ claimId: "", sourceId: source!.id, excerpt: "Excerpt." }))
    ).rejects.toThrow("error=Claim%20is%20required.");
    await expect(
      createEvidenceFromExistingSourceAction(reuseForm({ claimId: claim!.id, sourceId: "", excerpt: "Excerpt." }))
    ).rejects.toThrow("error=Source%20is%20required.");
    await expect(
      createEvidenceFromExistingSourceAction(reuseForm({ claimId: claim!.id, sourceId: "missing-source", excerpt: "Excerpt." }))
    ).rejects.toThrow("error=Source%20not%20found.");
    await expect(
      createEvidenceFromExistingSourceAction(reuseForm({ claimId: "missing-claim", sourceId: source!.id, excerpt: "Excerpt." }))
    ).rejects.toThrow("error=Claim%20not%20found.");
    await expect(
      createEvidenceFromExistingSourceAction(reuseForm({ claimId: claim!.id, sourceId: source!.id }))
    ).rejects.toThrow("error=Evidence%20requires%20an%20excerpt%20or%20supporting%20data.");

    expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM evidence_records").get()?.count).toBe(0);
    expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM claim_evidence").get()?.count).toBe(0);
    expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM sources").get()?.count).toBe(1);
  });

  it("keeps existing new-source evidence action behavior unchanged", async () => {
    sessionMock.requireUser.mockResolvedValue(librarian);
    const { db, phase3 } = await loadModules(dbPath);
    const claim = phase3.createClaim({ claimText: "Existing new-source action claim.", claimType: "description", confidenceLevel: "medium" }, librarian.email);
    const formData = new FormData();
    formData.set("claimId", claim!.id);
    formData.set("sourceTitle", "New source action source");
    formData.set("sourceType", "book");
    formData.set("citation", "New source action citation.");
    formData.set("excerpt", "New source action excerpt.");
    formData.set("relationship", "supports");
    const { createEvidenceAction } = await import("./actions");

    await expect(createEvidenceAction(formData)).rejects.toThrow(`REDIRECT:/evidence-review/${claim!.id}`);

    expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM sources").get()?.count).toBe(1);
    expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM evidence_records").get()?.count).toBe(1);
    expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM claim_evidence").get()?.count).toBe(1);
    expect(phase3.getEvidenceForClaim(claim!.id)[0]?.source.sourceTitle).toBe("New source action source");
  });
});
