import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { updateConsultationStatus } from "@/services/api/consultation";
import { toApiError } from "@/lib/errors";
import { z } from "zod";
import type { ConsultationStatus } from "@prisma/client";

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
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Status inválido", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const consultation = await updateConsultationStatus(
      params.id,
      parsed.data.status as ConsultationStatus,
      session.user.id,
    );

    return NextResponse.json({ data: consultation });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
