import type { RoleName } from "@library-app/shared";

export const evidenceManagerRoles: RoleName[] = ["librarian", "collection_area_librarian", "head_librarian", "administrator"];

export function canManageEvidence(role: string) {
  return evidenceManagerRoles.includes(role as RoleName);
}
