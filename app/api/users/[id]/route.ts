import { NextResponse }    from "next/server";
import type { NextRequest } from "next/server";
import { auth }            from "@/lib/auth";
import { getUserById, updatePatientProfile } from "@/services/api/user";
import { z }               from "zod";
import { apiError, validationError, handleRouteError, readJson } from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("AUTH_SESSAO_EXPIRADA");
    }

    // Usuário só pode ver o próprio perfil; admin vê qualquer um
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
    if (!isAdmin && session.user.id !== params.id) {
      return apiError("AUTH_SEM_PERMISSAO");
    }

    const user = await getUserById(params.id);

    // Omitir campos sensíveis para não-admin
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ...safeUser } = user;

    return NextResponse.json({ data: safeUser });
  } catch (error) {
    return handleRouteError(error);
  }
}

const updateProfileSchema = z.object({
  birthDate:   z.coerce.date().optional(),
  gender:      z.string().max(20).optional(),
  bloodType:   z.string().max(5).optional(),
  allergies:   z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  notes:       z.string().max(1000).optional(),
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

    if (session.user.id !== params.id) {
      return apiError("AUTH_SEM_PERMISSAO");
    }

    const body   = await readJson(req);
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const user = await updatePatientProfile(params.id, parsed.data);
    return NextResponse.json({ data: user });
  } catch (error) {
    return handleRouteError(error);
  }
}
