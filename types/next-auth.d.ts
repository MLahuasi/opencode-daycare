import type { PersonRole } from "@/domain/person";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      personId: string;
      daycareId: string;
      role: PersonRole;
    } & DefaultSession["user"];
  }

  interface User {
    personId: string;
    daycareId: string;
    role: PersonRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    personId?: string;
    daycareId?: string;
    role?: PersonRole;
  }
}
