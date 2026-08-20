import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { auth }            from "@/lib/auth";
import { prisma }          from "@/lib/prisma";
import { toApiError, ForbiddenError } from "@/lib/errors";
import type { PaymentStatus } from "@prisma/client";

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
    const status = searchParams.get("status") as PaymentStatus | null;

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
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
