import { NextResponse }  from "next/server";
import type { NextRequest } from "next/server";
import { auth }           from "@/lib/auth";
import { listUsers, listDoctors } from "@/services/api/user";
import { toApiError }     from "@/lib/errors";
import type { Role }      from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page    = Number(searchParams.get("page"))  || 1;
    const limit   = Number(searchParams.get("limit")) || 10;
    const search  = searchParams.get("search") ?? undefined;
    const role    = searchParams.get("role") as Role | null;
    const doctors = searchParams.get("doctors") === "true";

    // Rota pública (autenticada): listar médicos para agendamento
    if (doctors) {
      const specialty = searchParams.get("specialty") ?? undefined;
      const result    = await listDoctors({ page, limit, search, specialty });
      return NextResponse.json({ data: result });
    }

    // Rota admin: listar todos os usuários
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    }

    const result = await listUsers({ page, limit, search, role: role ?? undefined });
    return NextResponse.json({ data: result });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
