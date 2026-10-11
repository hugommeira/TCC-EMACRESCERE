import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";
import { apiError, handleRouteError, intParam } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return apiError("AUTH_SEM_PERMISSAO", { message: "Esta ação é exclusiva para médicos." });
    }

    const q     = (req.nextUrl.searchParams.get("q") ?? "").trim();
    const limit = intParam(req.nextUrl.searchParams, "limit", { default: 20, min: 1, max: 50 });

    if (q.length < 2) return NextResponse.json({ items: [] });

    const items = await prisma.medication.findMany({
      where: {
        active: true,
        OR: [
          { activeName:     { contains: q, mode: "insensitive" } },
          { commercialName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true, activeName: true, commercialName: true,
        presentation: true, laboratory: true, class: true, controlled: true,
        defaultDosage: true, defaultFrequency: true, defaultRoute: true,
      },
      orderBy: [{ activeName: "asc" }, { presentation: "asc" }],
      take: limit,
    });

    return NextResponse.json({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}
