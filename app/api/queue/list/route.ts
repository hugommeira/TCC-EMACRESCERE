import { NextResponse } from "next/server";
import { auth }          from "@/lib/auth";
import { listQueue }     from "@/services/api/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DOCTOR") {
    return NextResponse.json({ message: "Apenas médicos" }, { status: 403 });
  }
  const items = await listQueue({ take: 50 });
  return NextResponse.json({ items });
}
