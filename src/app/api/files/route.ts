import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { canvasFiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.id || !body?.mimeType || !body?.dataURL) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const base64 = (body.dataURL as string).replace(/^data:[^;]+;base64,/, "");

  const existing = await db.select({ id: canvasFiles.id }).from(canvasFiles).where(eq(canvasFiles.id, body.id)).limit(1);
  if (!existing.length) {
    await db.insert(canvasFiles).values({ id: body.id, mimeType: body.mimeType, data: base64 });
  }

  return NextResponse.json({ url: `/api/files/${body.id}` }, { status: 201 });
}
