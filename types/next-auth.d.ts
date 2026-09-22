import type { PersonRole } from "@/app/features/people";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      personId: string;
      role: PersonRole;
    } & DefaultSession["user"];
  }

  interface User {
    personId: string;
    role: PersonRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    personId?: string;
    role?: PersonRole;
  }
}
