import { Badge } from "@/components/Badge";
import type { ConfidenceLevel, ReviewStatus } from "@/lib/phase3/models";

export function ClaimStatusBadge({ status }: { status: ReviewStatus }) {
  const variant = status === "approved" ? "success" : status === "rejected" ? "error" : status === "needs_revision" ? "warning" : "subtle";
  return <Badge variant={variant}>{status.replaceAll("_", " ")}</Badge>;
}

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const variant = level === "high" ? "success" : level === "low" ? "warning" : "subtle";
  return <Badge variant={variant}>{level} confidence</Badge>;
}
