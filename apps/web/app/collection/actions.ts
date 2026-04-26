"use server";

import { redirect } from "next/navigation";
import {
  confirmImportBatch,
  createImportPreview,
  remapImportPreview,
  updateHolding,
  type ColumnMapping
} from "@/lib/phase2/collectionData";
import { canManageHoldings } from "@/lib/phase2/permissions";
import { requireUser } from "@/lib/session";

async function requireHoldingsManager() {
  const user = await requireUser();
  if (!canManageHoldings(user.role)) {
    redirect("/collection");
  }
  return user;
}

export async function createImportPreviewAction(formData: FormData) {
  const user = await requireHoldingsManager();
  const file = formData.get("csvFile");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/collection/import?error=missing-file");
  }

  const csvText = Buffer.from(await file.arrayBuffer()).toString("utf8");
  const batchId = createImportPreview(file.name, csvText, user.email);
  redirect(`/collection/import/${batchId}`);
}

export async function remapImportPreviewAction(formData: FormData) {
  await requireHoldingsManager();
  const batchId = String(formData.get("batchId") ?? "");
  const mapping: ColumnMapping = {
    externalLocalIdentifier: String(formData.get("externalLocalIdentifier") ?? ""),
    title: String(formData.get("title") ?? ""),
    status: String(formData.get("status") ?? ""),
    creatorContributor: String(formData.get("creatorContributor") ?? ""),
    format: String(formData.get("format") ?? ""),
    isbn: String(formData.get("isbn") ?? ""),
    callNumber: String(formData.get("callNumber") ?? ""),
    location: String(formData.get("location") ?? ""),
    collectionArea: String(formData.get("collectionArea") ?? ""),
    publisher: String(formData.get("publisher") ?? ""),
    publicationYear: String(formData.get("publicationYear") ?? "")
  };

  remapImportPreview(batchId, mapping);
  redirect(`/collection/import/${batchId}`);
}

export async function confirmImportBatchAction(formData: FormData) {
  const user = await requireHoldingsManager();
  const batchId = String(formData.get("batchId") ?? "");
  confirmImportBatch(batchId, user.email);
  redirect("/collection");
}

export async function updateHoldingAction(formData: FormData) {
  const user = await requireHoldingsManager();
  const id = String(formData.get("id") ?? "");
  updateHolding(
    id,
    {
      title: String(formData.get("title") ?? ""),
      creatorContributor: String(formData.get("creatorContributor") ?? ""),
      format: String(formData.get("format") ?? ""),
      isbn: String(formData.get("isbn") ?? ""),
      callNumber: String(formData.get("callNumber") ?? ""),
      location: String(formData.get("location") ?? ""),
      status: String(formData.get("status") ?? ""),
      publisher: String(formData.get("publisher") ?? ""),
      publicationYear: String(formData.get("publicationYear") ?? ""),
      collectionAreaId: String(formData.get("collectionAreaId") ?? "")
    },
    user.email
  );
  redirect(`/collection/holdings/${id}`);
}

