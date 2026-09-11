import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { auth }            from "@/lib/auth";
import { toApiError, ForbiddenError } from "@/lib/errors";
import { listDoctorsForApproval } from "@/services/api/user";
import type { DoctorApprovalStatus } from "@prisma/client";

const STATUSES: DoctorApprovalStatus[] = ["PENDING", "APPROVED", "REJECTED"];

/**
 * GET /api/admin/doctors?status=PENDING
 * Lista médicos (todos, ou filtrados pelo status de credenciamento) com o
 * perfil e o resultado da verificação de CRM — pra tela de aprovação.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      throw new ForbiddenError();
    }

    const raw = req.nextUrl.searchParams.get("status");
    const status = raw && (STATUSES as string[]).includes(raw) ? (raw as DoctorApprovalStatus) : undefined;

    const doctors = await listDoctorsForApproval(status);
    return NextResponse.json({
      data: doctors.map((d) => ({
        id:        d.id,
        name:      d.name,
        email:     d.email,
        phone:     d.phone,
        cpf:       d.cpf,
        active:    d.active,
        createdAt: d.createdAt,
        profile:   d.doctorProfile && {
          crm:             d.doctorProfile.crm,
          crmState:        d.doctorProfile.crmState,
          specialty:       d.doctorProfile.specialty,
          approvalStatus:  d.doctorProfile.approvalStatus,
          approvalNote:    d.doctorProfile.approvalNote,
          approvedAt:      d.doctorProfile.approvedAt,
          crmVerifiedAt:   d.doctorProfile.crmVerifiedAt,
          crmVerification: d.doctorProfile.crmVerification,
        },
      })),
    });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
