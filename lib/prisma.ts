import { PrismaClient } from "@prisma/client";

// ─── Singleton pattern para Next.js (hot reload safe) ─────────────────────────
// Evita criar múltiplas conexões durante desenvolvimento

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
