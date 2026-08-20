import { NextResponse } from "next/server";
import { auth }         from "@/lib/auth";
import { prisma }       from "@/lib/prisma";
import { toApiError }   from "@/lib/errors";
import type { AdminDashboardStats } from "@/types";

export async function GET() {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalConsultations,
      revenueResult,
      pendingPayments,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { role: "DOCTOR" } }),
      prisma.user.count({ where: { role: "PATIENT" } }),
      prisma.consultation.count(),
      prisma.payment.aggregate({
        where:   { status: "RECEIVED" },
        _sum:    { amount: true },
      }),
      prisma.payment.count({ where: { status: "PENDING" } }),
    ]);

    const stats: AdminDashboardStats = {
      totalUsers,
      totalDoctors,
      totalPatients,
      totalConsultations,
      totalRevenue:    Number(revenueResult._sum.amount ?? 0),
      pendingPayments,
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
