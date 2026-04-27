import type { ReactNode } from "react";

type BadgeVariant = "primary" | "subtle" | "warning" | "error" | "success";

export function Badge({ children, variant = "subtle" }: { children: ReactNode; variant?: BadgeVariant }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
