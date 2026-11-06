import { UUID_PATTERN } from "./identifiers";

/** Marker carried only by sessions issued after the PostgreSQL cutover. */
export const POSTGRES_SESSION_SOURCE = "postgres" as const;

/** Session identity fields before they are trusted by server-side Auth. */
export type SessionIdentityCandidate = {
  personId?: unknown;
  daycareId?: unknown;
  role?: unknown;
  persistenceSource?: unknown;
};

/** Session identity narrowed to the values required by runtime Auth. */
export type SessionIdentity = {
  personId: string;
  daycareId: string;
  role: string;
};

/** Identity issued by the PostgreSQL runtime after the cutover. */
export type PostgresSessionIdentity = SessionIdentity & {
  persistenceSource: typeof POSTGRES_SESSION_SOURCE;
};

/** Minimal persisted person projection required for session validation. */
export type SessionPerson = {
  daycareId: string;
  role: string;
  status: string;
};

/** Checks that a token or session carries valid PostgreSQL entity identifiers. */
export function hasValidSessionIdentifiers(
  identity: Pick<SessionIdentityCandidate, "personId" | "daycareId">,
): identity is Pick<SessionIdentity, "personId" | "daycareId"> {
  return (
    typeof identity.personId === "string" &&
    typeof identity.daycareId === "string" &&
    UUID_PATTERN.test(identity.personId) &&
    UUID_PATTERN.test(identity.daycareId)
  );
}

/** Checks that a token or session carries a complete PostgreSQL identity. */
export function isValidSessionIdentity(
  identity: SessionIdentityCandidate,
): identity is SessionIdentity {
  return (
    typeof identity.role === "string" && hasValidSessionIdentifiers(identity)
  );
}

/** Checks that a session was issued by the PostgreSQL runtime. */
export function isPostgresSessionIdentity(
  identity: SessionIdentityCandidate,
): identity is PostgresSessionIdentity {
  return (
    identity.persistenceSource === POSTGRES_SESSION_SOURCE &&
    isValidSessionIdentity(identity)
  );
}

/** Checks that the persisted person is active and belongs to the session tenant. */
export function isActiveSessionPerson(
  person: SessionPerson | null | undefined,
  identity: Pick<SessionIdentity, "daycareId" | "role">,
): person is SessionPerson {
  return Boolean(
    person &&
      person.daycareId === identity.daycareId &&
      person.status === "active" &&
      person.role === identity.role,
  );
}
