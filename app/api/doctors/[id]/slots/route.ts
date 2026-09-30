import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }             from "@/lib/auth";
import { getDoctorDaySlots } from "@/services/api/consultation";
import { isValidDateString } from "@/lib/scheduling";
import { toApiError }        from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/doctors/:id/slots?date=YYYY-MM-DD
 *
 * Horários que o médico oferece nesse dia (da agenda configurada por ele em
 * "Meu perfil"), cada um marcado como disponível ou não — ocupado por outra
 * consulta ou já no passado. Antes o agendamento listava 8h–18h fixo, todo
 * dia, e o paciente só descobria que o horário estava ocupado depois de
 * escrever o motivo da consulta.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const date = req.nextUrl.searchParams.get("date") ?? "";
    if (!isValidDateString(date)) {
      return NextResponse.json({ message: "Use date=AAAA-MM-DD" }, { status: 422 });
    }

    const slots = await getDoctorDaySlots(params.id, date);
    return NextResponse.json({ data: { date, slots } });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
