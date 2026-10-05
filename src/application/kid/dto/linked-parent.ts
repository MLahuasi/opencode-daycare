import type { PersonStatus } from "@/domain/person";
import type { ParentRelationship } from "../ports";

/** Minimal person data required to render a linked parent in a kid profile. */
export type LinkedParent = {
  id: string;
  name: string;
  status: PersonStatus;
  relationship: ParentRelationship;
};
