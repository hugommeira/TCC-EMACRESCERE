import { NextResponse } from "next/server";
import { auth }         from "@/lib/auth";
import { prisma }       from "@/lib/prisma";
import type { AdminDashboardStats } from "@/types";
import { apiError, handleRouteError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")
    ) {
      return apiError("AUTH_SEM_PERMISSAO");
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
      prisma.user.count({ where: { role: "DOCTOR", doctorProfile: { approvalStatus: "APPROVED" } } }), // só credenciados (igual ao painel)
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
    return handleRouteError(error);
  }
}
