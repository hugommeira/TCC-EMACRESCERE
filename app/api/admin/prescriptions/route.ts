import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import type { Prisma }       from "@prisma/client";
import { apiError, handleRouteError, intParam } from "@/lib/api-response";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return apiError("AUTH_SEM_PERMISSAO", { message: "Esta área é exclusiva para administradores." });
    }

    const page   = intParam(req.nextUrl.searchParams, "page", { default: 1, min: 1 });
    const status = req.nextUrl.searchParams.get("status") ?? undefined;
    const limit  = 20;
    const skip   = (page - 1) * limit;

    const where: Prisma.PrescriptionWhereInput =
      status === "ISSUED" || status === "DRAFT" || status === "CANCELLED"
        ? { status }
        : {};

    const [data, total] = await prisma.$transaction([
      prisma.prescription.findMany({
        where,
        include: {
          items: true,
          consultation: {
            select: {
              id: true,
              patient: { select: { id: true, name: true, email: true } },
              doctor:  { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit, skip,
      }),
      prisma.prescription.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    return handleRouteError(error);
  }
}
