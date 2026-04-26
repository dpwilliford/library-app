export const roles = [
  "student",
  "professor",
  "librarian",
  "collection_area_librarian",
  "head_librarian",
  "administrator"
] as const;

export type RoleName = (typeof roles)[number];

export const roleLabels: Record<RoleName, string> = {
  student: "Student",
  professor: "Professor",
  librarian: "Librarian",
  collection_area_librarian: "Collection-Area Librarian",
  head_librarian: "Head Librarian",
  administrator: "Administrator"
};

export const permissions = {
  viewDashboard: ["student", "professor", "librarian", "collection_area_librarian", "head_librarian", "administrator"],
  viewPlaceholders: ["student", "professor", "librarian", "collection_area_librarian", "head_librarian", "administrator"]
} satisfies Record<string, RoleName[]>;

export type Permission = keyof typeof permissions;

export function hasPermission(userRoles: readonly string[], permission: Permission) {
  return permissions[permission].some((role) => userRoles.includes(role));
}

export function isRoleName(value: string): value is RoleName {
  return roles.includes(value as RoleName);
}
