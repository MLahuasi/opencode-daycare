import "server-only";

import { getServerSession, type NextAuthOptions, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import {
  hasValidSessionIdentifiers,
  isActiveSessionPerson,
  isPostgresSessionIdentity,
  isValidSessionIdentity,
  POSTGRES_SESSION_SOURCE,
  UUID_PATTERN,
} from "@/config";
import {
  getApplicationEnvironment,
  getAuthEnvironment,
  getLoginRateLimitEnvironment,
} from "@/config/server";
import { hasCapability } from "@/domain/person";
import {
  isCredentialLoginEligible,
} from "@/application/auth";
import {
  isPasswordWithinUtf8Limit,
  normalizePassword,
} from "@/domain/auth";
import { BcryptPasswordHasher } from "@/infrastructure/adapters/password";
import {
  PostgresCredentialRepository,
  PostgresPersonRepository,
  PostgresPersonRoleRepository,
  PostgresLoginAttemptLimitRepository,
  PostgresClientProvider,
  type PostgresClient,
} from "@/infrastructure/persistence/postgres";

let postgresClient: PostgresClient | undefined;

function getAuthPostgresClient(): PostgresClient {
  postgresClient ??= new PostgresClientProvider().createClient();
  return postgresClient;
}

const authEnvironment = getAuthEnvironment();
const applicationEnvironment = getApplicationEnvironment();
const loginRateLimitEnvironment = getLoginRateLimitEnvironment();
/** Concrete NextAuth v4 configuration for the application's credential session. */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        daycareId: { label: "Daycare", type: "text" },
      },
      /**
       * Authenticates an active person against the credential repository.
       *
       * @param credentials - Submitted email and password values.
       * @returns The authenticated user projection or `null` when credentials fail.
       */
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const submittedPassword =
          typeof credentials?.password === "string" ? credentials.password : "";
        const password = normalizePassword(submittedPassword);
        const daycareId =
          typeof credentials?.daycareId === "string"
            ? credentials.daycareId.trim()
            : "";

        if (
          !email ||
          !password ||
          !isPasswordWithinUtf8Limit(password) ||
          !UUID_PATTERN.test(daycareId)
        ) {
          return null;
        }

        const client = getAuthPostgresClient();
        const loginAttemptLimits = new PostgresLoginAttemptLimitRepository(
          client,
          loginRateLimitEnvironment.hmacSecret,
        );
        if (await loginAttemptLimits.isBlocked("account", email)) {
          return null;
        }

        const credentialRepository = new PostgresCredentialRepository(client);
        const passwordHasher = new BcryptPasswordHasher();
        const peopleRepository = new PostgresPersonRepository(client);
        const personRoleRepository = new PostgresPersonRoleRepository(client);
        const person = await peopleRepository.findByEmail(daycareId, email);
        const storedCredential = person
          ? await credentialRepository.findByPersonId(daycareId, person.id)
          : null;

        const rejectInvalidLogin = async (): Promise<null> => {
          await loginAttemptLimits.recordFailure("account", email);
          return null;
        };

        if (!person || !storedCredential) {
          await passwordHasher.compareWithDummyHash(password);
          return rejectInvalidLogin();
        }

        const roles = await personRoleRepository.findRoles(person.id, daycareId);
        if (!isCredentialLoginEligible(person, storedCredential, roles, daycareId)) {
          return rejectInvalidLogin();
        }

        let passwordMatches: boolean;
        try {
          passwordMatches = await passwordHasher.compare(
            password,
            storedCredential.passwordHash,
          );
        } catch {
          return null;
        }

        if (!passwordMatches) {
          return rejectInvalidLogin();
        }

        return {
          id: person.id,
          name: person.name,
          email: person.email,
          personId: person.id,
          daycareId: person.daycareId,
          persistenceSource: POSTGRES_SESSION_SOURCE,
        };
      },
    }),
  ],
  pages: {
    signIn: authEnvironment.AUTH_SIGN_IN_PATH,
  },
  secret: authEnvironment.AUTH_SECRET,
  session: {
    maxAge: authEnvironment.AUTH_SESSION_MAX_AGE_SECONDS,
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: authEnvironment.AUTH_SESSION_COOKIE_NAME,
      options: {
        httpOnly: authEnvironment.AUTH_SESSION_COOKIE_HTTP_ONLY,
        sameSite: authEnvironment.AUTH_SESSION_COOKIE_SAME_SITE,
        secure:
          applicationEnvironment.nodeEnvironment === "production" ||
          authEnvironment.AUTH_SESSION_COOKIE_SECURE,
        path: authEnvironment.AUTH_SESSION_COOKIE_PATH,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.personId = user.personId;
        token.daycareId = user.daycareId;
        token.persistenceSource = POSTGRES_SESSION_SOURCE;
      }

      delete token.role;

      if (
        token.persistenceSource !== POSTGRES_SESSION_SOURCE ||
        !isValidSessionIdentity(token)
      ) {
        return {};
      }

       const person = await new PostgresPersonRepository(
         getAuthPostgresClient(),
       ).findById(token.daycareId, token.personId);

       if (!isActiveSessionPerson(person, token)) {
         return {};
       }

      return token;
    },
    session({ session, token }) {
        if (session.user && isPostgresSessionIdentity(token)) {
          session.user.personId = token.personId;
          session.user.daycareId = token.daycareId;
          session.user.persistenceSource = token.persistenceSource;
      }

      return session;
    },
  },
};

/**
 * Reads the current NextAuth session from a server component or action.
 *
 * @returns The current session or `null` when no session exists.
 */
export function getAuthSession() {
  return getServerSession(authOptions);
}

/**
 * Requires an active session whose persisted person and role still match.
 *
 * @returns The active session for a parent or staff member.
 */
export async function requireActiveSession(): Promise<Session> {
  const session = await getAuthSession();

  if (
    !session?.user ||
    !hasValidSessionIdentifiers(session.user) ||
    !isPostgresSessionIdentity(session.user)
  ) {
    redirect("/auth/login");
  }

  const person = await new PostgresPersonRepository(
    getAuthPostgresClient(),
  ).findById(session.user.daycareId, session.user.personId);

  const roles = await new PostgresPersonRoleRepository(
    getAuthPostgresClient(),
  ).findRoles(session.user.personId, session.user.daycareId);

  if (!isActiveSessionPerson(person, session.user) || roles.length === 0) {
    redirect("/auth/login");
  }

  return session;
}

/**
 * Requires an active staff session and revalidates its persisted capabilities.
 *
 * @returns The active staff session.
 */
export async function requireStaffSession(): Promise<Session> {
  const session = await requireActiveSession();

  const roles = await new PostgresPersonRoleRepository(
    getAuthPostgresClient(),
  ).findRoles(session.user.personId, session.user.daycareId);

  if (!hasCapability(roles, "staff-shell")) {
    redirect("/home");
  }

  return session;
}
