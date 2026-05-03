import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { canvases } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(canvases)
    .where(eq(canvases.userId, session.user.id))
    .orderBy(canvases.updatedAt);

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = body.title ?? "Untitled Canvas";

  const [canvas] = await db
    .insert(canvases)
    .values({ userId: session.user.id, title })
    .returning();

  return NextResponse.json(canvas, { status: 201 });
}
