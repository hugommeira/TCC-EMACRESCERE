import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { auth }            from "@/lib/auth";
import { prisma }          from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { ConsultationStatus } from "@prisma/client";
import { handleRouteError, intParam, enumParam } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")
    ) {
      throw new AppError("AUTH_SEM_PERMISSAO");
    }

    const { searchParams } = req.nextUrl;
    const page   = intParam(searchParams, "page",  { default: 1,  min: 1 });
    const limit  = intParam(searchParams, "limit", { default: 20, min: 1, max: 100 });
    const skip   = (page - 1) * limit;
    const status = enumParam(searchParams, "status", Object.values(ConsultationStatus));
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
    return handleRouteError(error);
  }
}
