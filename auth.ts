import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getEnvironment } from "@/app/shared/config/server";

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
      async authorize() {
        // Credential lookup is connected in the login implementation step.
        return null;
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
