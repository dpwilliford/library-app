import type { RoleName } from "@library-app/shared";

export const holdingsManagerRoles: RoleName[] = ["librarian", "collection_area_librarian", "head_librarian"];

export function canManageHoldings(role: string) {
  return holdingsManagerRoles.includes(role as RoleName);
}

