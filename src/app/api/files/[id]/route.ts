import { db } from "@/db";
import { canvasFiles } from "@/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const [file] = await db.select().from(canvasFiles).where(eq(canvasFiles.id, id)).limit(1);

  if (!file) return new Response(null, { status: 404 });

  const binary = Buffer.from(file.data, "base64");
  return new Response(binary, {
    headers: {
      "Content-Type": file.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
