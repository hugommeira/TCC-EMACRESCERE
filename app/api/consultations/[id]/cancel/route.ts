import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { auth }            from "@/lib/auth";
import { cancelConsultation , stripPartyPii } from "@/services/api/consultation";
import { cancelConsultationSchema } from "@/lib/validations/consultation";
import { apiError, validationError, handleRouteError, readJson } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("AUTH_SESSAO_EXPIRADA");
    }

    const body   = await readJson(req);
    const parsed = cancelConsultationSchema.safeParse({
      ...body,
      consultationId: params.id,
    });

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const consultation = await cancelConsultation(session.user.id, parsed.data);
    return NextResponse.json({ data: stripPartyPii(consultation) });
  } catch (error) {
    return handleRouteError(error);
  }
}
