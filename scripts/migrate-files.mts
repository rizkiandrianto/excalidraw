import pg from "pg";

try {
  const { config } = await import("dotenv");
  config({ path: ".env.local" });
} catch {}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  const { rows: canvases } = await client.query<{ id: string; data: Record<string, unknown> }>(
    `SELECT id, data FROM canvases WHERE data->'files' IS NOT NULL`
  );

  console.log(`Found ${canvases.length} canvas(es) with files`);

  let totalMigrated = 0;
  let totalSkipped = 0;

  for (const canvas of canvases) {
    const files = canvas.data.files as Record<string, { mimeType: string; dataURL: string; created: number }> | undefined;
    if (!files) continue;

    const updatedFiles: Record<string, unknown> = {};
    let changed = false;

    for (const [fileId, fileData] of Object.entries(files)) {
      if (!fileData.dataURL.startsWith("data:")) {
        updatedFiles[fileId] = fileData;
        totalSkipped++;
        continue;
      }

      const base64 = fileData.dataURL.replace(/^data:[^;]+;base64,/, "");

      await client.query(
        `INSERT INTO canvas_files (id, mime_type, data, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (id) DO NOTHING`,
        [fileId, fileData.mimeType, base64]
      );

      updatedFiles[fileId] = { ...fileData, dataURL: `/api/files/${fileId}` };
      changed = true;
      totalMigrated++;
    }

    if (changed) {
      const updatedData = { ...canvas.data, files: updatedFiles };
      await client.query(`UPDATE canvases SET data = $1 WHERE id = $2`, [
        JSON.stringify(updatedData),
        canvas.id,
      ]);
      console.log(`Canvas ${canvas.id}: migrated ${Object.keys(updatedFiles).length} file(s)`);
    }
  }

  console.log(`\nDone. Migrated: ${totalMigrated}, Skipped (already hosted): ${totalSkipped}`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
