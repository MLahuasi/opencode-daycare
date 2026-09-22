import { getServerSession, type NextAuthOptions, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getEnvironment } from "@/app/shared/config/server";
import { readCollection } from "@/app/infrastructure";
import type { Person } from "@/app/features/people";
import { redirect } from "next/navigation";

const { auth: authEnvironment } = getEnvironment();

/**
 * Stable NextAuth v4 configuration for the application's credential session.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

        const [people, credentialsCollection] = await Promise.all([
          readCollection<Person>("people.json"),
          readCollection<{ personId: string; passwordHash: string }>(
            "credential.json",
          ),
        ]);
        const person = people.find(
          (candidate) =>
            candidate.email.toLowerCase() === email &&
            candidate.status === "active",
        );
        const storedCredential = person
          ? credentialsCollection.find(
              (candidate) => candidate.personId === person.id,
            )
          : undefined;

        if (!person || !storedCredential) {
          return null;
        }

        try {
          if (!(await bcrypt.compare(password, storedCredential.passwordHash))) {
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
        secure: authEnvironment.AUTH_SESSION_COOKIE_SECURE,
        path: authEnvironment.AUTH_SESSION_COOKIE_PATH,
      },
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.personId = user.personId;
        token.role = user.role;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.personId && token.role) {
        session.user.personId = token.personId;
        session.user.role = token.role;
      }

      return session;
    },
  },
};

/**
 * Reads the current NextAuth session from a server component or server action.
 *
 * @returns The current session or null when no session exists.
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

  if (!session?.user?.personId) {
    redirect("/auth/login");
  }

  const people = await readCollection<Person>("people.json");
  const person = people.find((candidate) => candidate.id === session.user.personId);

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
