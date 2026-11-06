import type { DaycareScoped } from "@/domain/daycare";

/** Persisted role codes assigned to a person in a daycare. */
export const PERSON_ROLE_CODES = [
  "admin",
  "personal",
  "teacher",
  "parent",
] as const;

export type PersonRoleCode = (typeof PERSON_ROLE_CODES)[number];

/** Capabilities derived from one or more persisted person roles. */
export type PersonCapability =
  | "staff-shell"
  | "manage-kids"
  | "manage-posts"
  | "family-feed";

/** Account lifecycle status assigned to a person. */
export type PersonStatus = "active" | "inactive" | "pending";

/** A person who participates in the daycare community. */
export type Person = DaycareScoped & {
  id: string;
  name: string;
  email: string;
  roles: readonly PersonRoleCode[];
  status: PersonStatus;
};
