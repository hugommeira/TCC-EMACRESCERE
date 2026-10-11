import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { auth }            from "@/lib/auth";
import { prisma }          from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { PaymentStatus } from "@prisma/client";
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
    const status = enumParam(searchParams, "status", Object.values(PaymentStatus));

    const where = status ? { status } : {};

    const [data, total, revenue] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        include: {
          consultation: { include: { patient: true, doctor: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where:  { status: "RECEIVED" },
        _sum:   { amount: true },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      data: {
        data,
        total,
        page,
        limit,
        pages:         Math.ceil(total / limit),
        totalRevenue:  Number(revenue._sum.amount ?? 0),
        paidCount:     revenue._count,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
