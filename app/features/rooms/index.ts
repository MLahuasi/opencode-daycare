/**
 * Public API of the Rooms domain.
 *
 * Exposes the room model contract used by kid assignment and room grouping.
 * This entry is client-safe: it reexports neither server-only data access nor
 * actions.
 */
export type { Room } from "./types";