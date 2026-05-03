import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { canvases } from "@/db/schema";
import { eq, and } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [canvas] = await db
    .select()
    .from(canvases)
    .where(and(eq(canvases.id, id), eq(canvases.userId, session.user.id)))
    .limit(1);

  if (!canvas) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(canvas);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const [canvas] = await db
    .update(canvases)
    .set({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.data !== undefined && { data: body.data }),
      ...(body.thumbnail !== undefined && { thumbnail: body.thumbnail }),
      updatedAt: new Date(),
    })
    .where(and(eq(canvases.id, id), eq(canvases.userId, session.user.id)))
    .returning();

  if (!canvas) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(canvas);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db
    .delete(canvases)
    .where(and(eq(canvases.id, id), eq(canvases.userId, session.user.id)));

  return new NextResponse(null, { status: 204 });
}
