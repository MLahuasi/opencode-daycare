/**
 * Public API of the People domain.
 *
 * Exposes the person model contracts used across the application. This entry
 * is client-safe: it reexports neither server-only data access nor actions.
 */
export type { Person, PersonRole, PersonStatus } from "./types";