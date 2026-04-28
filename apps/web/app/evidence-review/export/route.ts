import { exportClaimsCsv } from "@/lib/phase3/claimsData";
import { canManageEvidence } from "@/lib/phase3/permissions";
import { requireUser } from "@/lib/session";

export async function GET() {
  const user = await requireUser();
  if (!canManageEvidence(user.role)) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(exportClaimsCsv(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=\"manual-claims-evidence.csv\""
    }
  });
}
