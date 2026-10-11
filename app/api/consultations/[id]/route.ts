import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getConsultationById , stripPartyPii } from "@/services/api/consultation";
import { apiError, handleRouteError } from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("AUTH_SESSAO_EXPIRADA");
    }

    const consultation = await getConsultationById(params.id, session.user.id);
    return NextResponse.json({ data: stripPartyPii(consultation) });
  } catch (error) {
    return handleRouteError(error);
  }
}
