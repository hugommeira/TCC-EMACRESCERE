import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { authConfig } from "@/lib/auth.config";
import { auditLog, AuditAction } from "@/lib/audit";
import type { Role } from "@prisma/client";

// Hash dummy fixo (cost 12) usado pra anular timing attack quando user não existe.
// O bcrypt.compare ainda gasta o mesmo tempo do que contra um hash real.
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8dGyR7e2YwHQk8C9X9eKQjE1XQ1L9C";

// ─── Tipos aumentados ──────────────────────────────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      role: Role;
    };
  }

  interface User {
    role: Role;
  }
}

// ─── Configuração NextAuth v5 ─────────────────────────────────────────────────
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),

  session: { strategy: "jwt" },

  pages: {
    signIn:  "/auth/login",
    signOut: "/auth/login",
    error:   "/auth/error",
    verifyRequest: "/auth/verify",
  },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email:    { label: "E-mail", type: "email" },
        password: { label: "Senha",  type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Rate-limit por email: 5 tentativas a cada 15 min
        const { rateLimit } = await import("@/lib/security");
        const rl = rateLimit({ key: `login:${email.toLowerCase()}`, limit: 5, windowSec: 60 * 15 });
        if (!rl.ok) return null;

        const user = await prisma.user.findUnique({ where: { email } });

        // Sempre rodar bcrypt.compare uma vez, independente de existir user/account.
        // Isso previne enumeration de e-mails via timing attack.
        const account = user
          ? await prisma.account.findFirst({
              where: { userId: user.id, provider: "credentials" },
            })
          : null;

        const hashToCompare = account?.access_token ?? DUMMY_HASH;
        const passwordOk    = await bcrypt.compare(password, hashToCompare);

        // Bail out só agora — sem revelar se foi user, account ou senha
        if (!user || !user.active || !account?.access_token || !passwordOk) {
          auditLog({
            actorEmail: email,
            action:     AuditAction.USER_LOGIN_FAILED,
            entity:     "User",
          });
          return null;
        }

        auditLog({
          actorId:    user.id,
          actorEmail: user.email ?? null,
          action:     AuditAction.USER_LOGIN,
          entity:     "User",
          entityId:   user.id,
        });

        return {
          id:    user.id,
          name:  user.name,
          email: user.email,
          image: user.avatarUrl,
          role:  user.role,
        };
      },
    }),

    // Login com Facebook. `allowDangerousEmailAccountLinking` permite que uma
    // conta Facebook seja vinculada automaticamente a um usuário já existente
    // com o mesmo e-mail (ex: cadastrado via e-mail/senha) — sem isso, o
    // Auth.js recusaria o login com erro OAuthAccountNotLinked. É seguro aqui
    // porque o Facebook só retorna e-mails que ele mesmo verificou.
    ...(process.env["FACEBOOK_CLIENT_ID"] && process.env["FACEBOOK_CLIENT_SECRET"]
      ? [
          Facebook({
            clientId:     process.env["FACEBOOK_CLIENT_ID"],
            clientSecret: process.env["FACEBOOK_CLIENT_SECRET"],
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],

  events: {
    async createUser({ user }) {
      // Só dispara quando o adapter cria um usuário novo (ex: 1º login via
      // Facebook). Usuários registrados via /api/users/register já chegam
      // com patientProfile — aqui cobrimos o cadastro via OAuth.
      if (!user.id) return;
      await prisma.patientProfile.upsert({
        where:  { userId: user.id },
        create: { userId: user.id },
        update: {},
      });
      auditLog({
        actorId:    user.id,
        actorEmail: user.email ?? null,
        action:     AuditAction.USER_REGISTER,
        entity:     "User",
        entityId:   user.id,
      });
    },
    async linkAccount({ user, account }) {
      if (account.provider === "facebook") {
        auditLog({
          actorId:    user.id,
          actorEmail: user.email ?? null,
          action:     AuditAction.OAUTH_ACCOUNT_LINKED,
          entity:     "User",
          entityId:   user.id,
        });
      }
    },
  },

  callbacks: {
    async signIn({ user, account }) {
      // Só bloqueia se explicitamente desativado por um admin. Em usuários
      // novos (ainda não persistidos) `active` vem undefined — permite.
      const active = (user as { active?: boolean }).active;
      if (account?.provider === "facebook" && active === false) return false;
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token["id"]   = user.id;
        token["role"] = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id   = token["id"] as string;
        session.user.role = token["role"] as Role;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
});

// ─── Helper: obter sessão do servidor ─────────────────────────────────────────
export async function getServerSession() {
  return await auth();
}

// ─── Helper: exigir autenticação (use em Server Components) ───────────────────
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

// ─── Helper: exigir role específica ──────────────────────────────────────────
export async function requireRole(role: Role) {
  const session = await requireAuth();
  if (session.user.role !== role) throw new Error("Forbidden");
  return session;
}
