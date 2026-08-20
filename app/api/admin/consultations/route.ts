import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { auth }            from "@/lib/auth";
import { prisma }          from "@/lib/prisma";
import { toApiError, ForbiddenError } from "@/lib/errors";
import type { ConsultationStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")
    ) {
      throw new ForbiddenError();
    }

    const { searchParams } = req.nextUrl;
    const page   = Number(searchParams.get("page"))  || 1;
    const limit  = Number(searchParams.get("limit")) || 20;
    const skip   = (page - 1) * limit;
    const status = searchParams.get("status") as ConsultationStatus | null;
    const search = searchParams.get("search") ?? undefined;

    const where = {
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { patient: { name:  { contains: search, mode: "insensitive" as const } } },
          { doctor:  { name:  { contains: search, mode: "insensitive" as const } } },
        ],
      } : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.consultation.findMany({
        where,
        include: { patient: true, doctor: true, payment: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.consultation.count({ where }),
    ]);

    return NextResponse.json({
      data: {
        data,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
