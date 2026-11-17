import "server-only";

import type { NextAuthOptions, Session } from "next-auth";
import type { PersonRoles } from "@/domain/person";
import type { PostViewer } from "@/application/post";
import {
  PostgresPersonRoleRepository,
  type PostgresQueryClient,
} from "@/infrastructure/persistence/postgres";
import { getPostgresRuntimeClient } from "../postgres-runtime";
import {
  authOptions as infrastructureAuthOptions,
  getAuthSession as readInfrastructureAuthSession,
  requireActiveSession as requireInfrastructureActiveSession,
  requireStaffSession as requireInfrastructureStaffSession,
} from "@/infrastructure/auth/auth";

/** Server-side NextAuth options assembled by the Auth Composition Root. */
export const authOptions: NextAuthOptions = infrastructureAuthOptions;

/** Reads the current server-side session through Auth Composition. */
export function getAuthSession() {
  return readInfrastructureAuthSession();
}

/** Requires an active session through Auth Composition. */
export function requireActiveSession(): Promise<Session> {
  return requireInfrastructureActiveSession();
}

/** Requires an active staff session through Auth Composition. */
export function requireStaffSession(): Promise<Session> {
  return requireInfrastructureStaffSession();
}

/**
 * Reads the current tenant-scoped roles without placing them in the session.
 *
 * @param daycareId - PostgreSQL daycare identifier.
 * @param personId - PostgreSQL person identifier.
 * @returns Roles currently assigned to the person in the daycare.
 */
export async function getSessionPersonRoles(
  daycareId: string,
  personId: string,
): Promise<PersonRoles> {
  const client: PostgresQueryClient = getPostgresRuntimeClient();
  return new PostgresPersonRoleRepository(client).findByPersonAndDaycare(
    personId,
    daycareId,
  );
}

/**
 * Builds an authorization viewer from session identifiers and live roles.
 *
 * @param session - Authenticated session containing only tenant identifiers.
 * @returns A Post authorization viewer with current PostgreSQL roles.
 */
export async function getPostViewer(session: Session): Promise<PostViewer> {
  return {
    daycareId: session.user.daycareId,
    personId: session.user.personId,
    roles: await getSessionPersonRoles(
      session.user.daycareId,
      session.user.personId,
    ),
  };
}
