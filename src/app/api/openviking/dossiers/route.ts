import { NextResponse } from "next/server";

const OV_URL = process.env.OPENVIKING_URL || "https://openviking-nrwp.srv1583696.hstgr.cloud";
const OV_KEY = process.env.OPENVIKING_API_KEY || "nq2lj31F87xtkajA7LFBowgQ2Bxb2gxd";

interface DossierSummary {
  id: string;
  overview: string;
  fileCount: number;
  files: string[];
}

export async function GET() {
  try {
    // Get full tree of resources
    const treeRes = await fetch(`${OV_URL}/api/v1/fs/tree?uri=/`, {
      headers: { "x-api-key": OV_KEY },
    });

    if (!treeRes.ok) {
      throw new Error(`OpenViking tree error: ${treeRes.status}`);
    }

    const treeData = await treeRes.json();
    const items: Array<{ uri: string; rel_path: string; isDir: boolean; size: number }> =
      treeData.result || [];

    // Group by upload_xxx directory
    const dossiersMap: Record<string, DossierSummary> = {};

    for (const item of items) {
      const relPath: string = item.rel_path || "";
      if (!relPath.startsWith("resources/upload_")) continue;

      const parts = relPath.split("/");
      const dossierId = parts[1];
      const fileName = parts[2] || "";

      if (!dossierId) continue;

      if (!dossiersMap[dossierId]) {
        dossiersMap[dossierId] = {
          id: dossierId,
          overview: "",
          fileCount: 0,
          files: [],
        };
      }

      if (!item.isDir && fileName && !fileName.startsWith(".")) {
        dossiersMap[dossierId].files.push(fileName);
        dossiersMap[dossierId].fileCount++;
      }
    }

    // Fetch overview for each dossier (first .overview.md if exists)
    const dossiers = Object.values(dossiersMap);

    for (const dossier of dossiers) {
      try {
        const overviewRes = await fetch(
          `${OV_URL}/api/v1/search/grep`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": OV_KEY,
            },
            body: JSON.stringify({
              uri: `viking://resources/${dossier.id}/`,
              pattern: ".",
              limit: 1,
            }),
          }
        );
        if (overviewRes.ok) {
          const overviewData = await overviewRes.json();
          const firstMatch = overviewData.result?.matches?.[0];
          if (firstMatch) {
            dossier.overview = firstMatch.content?.slice(0, 300) || "";
          }
        }
      } catch {
        // skip overview fetch errors
      }
    }

    // Sort by ID (chronological)
    dossiers.sort((a, b) => b.id.localeCompare(a.id));

    return NextResponse.json({ dossiers, total: dossiers.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
