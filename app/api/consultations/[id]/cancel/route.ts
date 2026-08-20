import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { auth }            from "@/lib/auth";
import { cancelConsultation } from "@/services/api/consultation";
import { cancelConsultationSchema } from "@/lib/validations/consultation";
import { toApiError }      from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = cancelConsultationSchema.safeParse({
      ...body,
      consultationId: params.id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const consultation = await cancelConsultation(session.user.id, parsed.data);
    return NextResponse.json({ data: consultation });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
