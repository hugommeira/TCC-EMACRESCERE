import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { updateConsultationStatus , stripPartyPii } from "@/services/api/consultation";
import { z } from "zod";
import type { ConsultationStatus } from "@prisma/client";
import { apiError, validationError, handleRouteError, readJson } from "@/lib/api-response";

const schema = z.object({
  status: z.enum([
    "SCHEDULED", "WAITING", "IN_PROGRESS",
    "COMPLETED",  "CANCELLED", "NO_SHOW",
  ]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("AUTH_SESSAO_EXPIRADA");
    }

    const body   = await readJson(req);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error, "Status inválido");
    }

    const consultation = await updateConsultationStatus(
      params.id,
      parsed.data.status as ConsultationStatus,
      session.user.id,
    );

    return NextResponse.json({ data: stripPartyPii(consultation) });
  } catch (error) {
    return handleRouteError(error);
  }
}
