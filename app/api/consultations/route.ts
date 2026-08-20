import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { scheduleConsultationSchema } from "@/lib/validations/consultation";
import { scheduleConsultation, listPatientConsultations, listDoctorConsultations } from "@/services/api/consultation";
import { toApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page   = Number(searchParams.get("page"))  || 1;
    const limit  = Number(searchParams.get("limit")) || 10;
    const status = searchParams.get("status") as Parameters<typeof listPatientConsultations>[1]["status"] | undefined;

    const result =
      session.user.role === "DOCTOR"
        ? await listDoctorConsultations(session.user.id,  { page, limit, status })
        : await listPatientConsultations(session.user.id, { page, limit, status });

    return NextResponse.json({ data: result });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "PATIENT") {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = scheduleConsultationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const consultation = await scheduleConsultation(session.user.id, parsed.data);
    return NextResponse.json({ data: consultation }, { status: 201 });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
