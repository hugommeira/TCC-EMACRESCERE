import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { apiError, handleRouteError, intParam } from "@/lib/api-response";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return apiError("AUTH_SEM_PERMISSAO", { message: "Esta área é exclusiva para administradores." });
    }

    const page  = intParam(req.nextUrl.searchParams, "page", { default: 1, min: 1 });
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
  } catch (error) {
    return handleRouteError(error);
  }
}
