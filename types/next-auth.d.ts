import type { DefaultSession } from "next-auth";
import type { Role }           from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id:    string;
      name:  string;
      email: string;
      image?: string | null;
      role:  Role;
    } & DefaultSession["user"];
  }

  interface User {
    id:    string;
    role:  Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:   string;
    role: Role;
  }
}
