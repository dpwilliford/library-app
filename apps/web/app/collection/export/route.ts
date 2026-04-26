import { exportHoldingsCsv } from "@/lib/phase2/collectionData";
import { canManageHoldings } from "@/lib/phase2/permissions";
import { requireUser } from "@/lib/session";

export async function GET() {
  const user = await requireUser();
  if (!canManageHoldings(user.role)) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(exportHoldingsCsv(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=\"local-holdings.csv\""
    }
  });
}

