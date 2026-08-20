import { NextResponse }     from "next/server";
import type { NextRequest } from "next/server";
import { auth }              from "@/lib/auth";
import { prisma }            from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DOCTOR") {
    return NextResponse.json({ message: "Apenas médicos" }, { status: 403 });
  }

  const q     = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const limit = Math.min(50, Number(req.nextUrl.searchParams.get("limit") ?? 20));

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
}
