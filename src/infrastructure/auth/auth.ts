import "server-only";

import { getServerSession, type NextAuthOptions, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { UUID_PATTERN } from "@/config";
import { getApplicationEnvironment, getAuthEnvironment } from "@/config/server";
import { BcryptPasswordHasher } from "@/infrastructure/adapters/password";
import {
  PostgresCredentialRepository,
  PostgresPersonRepository,
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
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        const daycareId =
          typeof credentials?.daycareId === "string"
            ? credentials.daycareId.trim()
            : "";

        if (!email || !password || !UUID_PATTERN.test(daycareId)) {
          return null;
        }

        const client = getAuthPostgresClient();
        const credentialRepository = new PostgresCredentialRepository(client);
        const passwordHasher = new BcryptPasswordHasher();
        const peopleRepository = new PostgresPersonRepository(client);
        const person = await peopleRepository.findByEmail(daycareId, email);
        const storedCredential = person
          ? await credentialRepository.findByPersonId(daycareId, person.id)
          : null;

        if (!person || person.status !== "active" || !storedCredential) {
          return null;
        }

        try {
           if (!(await passwordHasher.compare(password, storedCredential.passwordHash))) {
            return null;
          }
        } catch {
          return null;
        }

        return {
          id: person.id,
          name: person.name,
          email: person.email,
          personId: person.id,
          daycareId: person.daycareId,
          role: person.role,
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
        token.role = user.role;
      }

      if (!token.personId || !token.daycareId || !token.role) {
        return {};
      }

       const person = await new PostgresPersonRepository(
         getAuthPostgresClient(),
       ).findById(token.daycareId, token.personId);

      if (!person || person.status !== "active" || person.role !== token.role) {
        return {};
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.personId && token.daycareId && token.role) {
        session.user.personId = token.personId;
        session.user.daycareId = token.daycareId;
        session.user.role = token.role;
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

  if (!session?.user?.personId || !session.user.daycareId) {
    redirect("/auth/login");
  }

  const person = await new PostgresPersonRepository(
    getAuthPostgresClient(),
  ).findById(session.user.daycareId, session.user.personId);

  if (!person || person.status !== "active" || person.role !== session.user.role) {
    redirect("/auth/login");
  }

  return session;
}

/**
 * Requires an active staff session and revalidates its persisted role.
 *
 * @returns The active staff session.
 */
export async function requireStaffSession(): Promise<Session> {
  const session = await requireActiveSession();

  if (session.user.role !== "personal") {
    redirect("/home");
  }

  return session;
}
