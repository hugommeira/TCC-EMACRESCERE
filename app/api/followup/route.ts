import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { auth }            from "@/lib/auth";
import { createFollowUp, listFollowUps, respondToFollowUp } from "@/services/api/followup";
import { toApiError }      from "@/lib/errors";
import { z }               from "zod";

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
    if (!session?.user) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

    const consultationId = req.nextUrl.searchParams.get("consultationId");
    if (!consultationId) return NextResponse.json({ message: "consultationId obrigatório" }, { status: 400 });

    const followUps = await listFollowUps(consultationId, session.user.id);
    return NextResponse.json({ data: followUps });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

    const body = await req.json();

    // Doctor creates follow-up
    if (session.user.role === "DOCTOR") {
      const parsed = createSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
      }
      const fu = await createFollowUp(session.user.id, parsed.data.consultationId, parsed.data.message, parsed.data.scheduledAt);
      return NextResponse.json({ data: fu }, { status: 201 });
    }

    // Patient responds
    if (session.user.role === "PATIENT") {
      const parsed = respondSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
      }
      const fu = await respondToFollowUp(parsed.data.followUpId, session.user.id, parsed.data.response);
      return NextResponse.json({ data: fu });
    }

    return NextResponse.json({ message: "Não autorizado" }, { status: 403 });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
