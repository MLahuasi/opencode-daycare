import "server-only";

import type { NextAuthOptions, Session } from "next-auth";
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
