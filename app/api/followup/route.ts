import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { auth }            from "@/lib/auth";
import { createFollowUp, listFollowUps, respondToFollowUp } from "@/services/api/followup";
import { z }               from "zod";
import { apiError, validationError, handleRouteError, readJson } from "@/lib/api-response";

const createSchema = z.object({
  consultationId: z.string().cuid(),
  message:        z.string().min(5).max(1000),
  scheduledAt:    z.coerce.date().optional(),
});

const respondSchema = z.object({
  followUpId: z.string().cuid(),
  response:   z.string().min(5).max(1000),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");

    const consultationId = req.nextUrl.searchParams.get("consultationId");
    if (!consultationId) return apiError("PARAMETRO_INVALIDO", { message: "Informe a consulta." });

    const followUps = await listFollowUps(consultationId, session.user.id);
    return NextResponse.json({ data: followUps });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");

    const body = await readJson(req);

    // Doctor creates follow-up
    if (session.user.role === "DOCTOR") {
      const parsed = createSchema.safeParse(body);
      if (!parsed.success) {
        return validationError(parsed.error);
      }
      const fu = await createFollowUp(session.user.id, parsed.data.consultationId, parsed.data.message, parsed.data.scheduledAt);
      return NextResponse.json({ data: fu }, { status: 201 });
    }

    // Patient responds
    if (session.user.role === "PATIENT") {
      const parsed = respondSchema.safeParse(body);
      if (!parsed.success) {
        return validationError(parsed.error);
      }
      const fu = await respondToFollowUp(parsed.data.followUpId, session.user.id, parsed.data.response);
      return NextResponse.json({ data: fu });
    }

    return apiError("AUTH_SEM_PERMISSAO");
  } catch (error) {
    return handleRouteError(error);
  }
}
