import type { Person } from "@/app/features/people";
import type { ParentRelationship } from "./parent-kid";

/** Minimal person data required to render a linked parent in a kid profile. */
export type LinkedParent = Pick<Person, "id" | "name" | "status"> & {
  relationship: ParentRelationship;
};