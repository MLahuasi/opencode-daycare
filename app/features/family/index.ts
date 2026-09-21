/**
 * Public API of the Family domain.
 *
 * Exposes the parent-to-kid relationship contracts used by kid profiles and
 * consent resolution. This entry is client-safe: it reexports neither
 * server-only data access nor actions.
 */
export type { LinkedParent, ParentKid, ParentRelationship } from "./types";