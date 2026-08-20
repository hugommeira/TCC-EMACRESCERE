import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Apenas administradores" }, { status: 403 });
  }

  const page  = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? 1));
  const limit = 20;
  const skip  = (page - 1) * limit;

  const [data, total] = await prisma.$transaction([
    prisma.medicalCertificate.findMany({
      include: { doctor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: limit, skip,
    }),
    prisma.medicalCertificate.count(),
  ]);

  return NextResponse.json({ data, total, page, pages: Math.ceil(total / limit) });
}
