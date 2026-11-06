import type { PersonRole } from "@/domain/person";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      personId: string;
      daycareId: string;
      role: PersonRole;
      persistenceSource: "postgres";
    } & DefaultSession["user"];
  }

  interface User {
    personId: string;
    daycareId: string;
    role: PersonRole;
    persistenceSource: "postgres";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    personId?: string;
    daycareId?: string;
    role?: PersonRole;
    persistenceSource?: "postgres";
  }
}
