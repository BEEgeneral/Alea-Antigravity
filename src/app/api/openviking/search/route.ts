import { NextResponse } from "next/server";

const OV_URL = process.env.OPENVIKING_URL || "https://openviking-nrwp.srv1583696.hstgr.cloud";
const OV_KEY = process.env.OPENVIKING_API_KEY || "nq2lj31F87xtkajA7LFBowgQ2Bxb2gxd";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query.trim()) {
      return NextResponse.json({ dossiers: [], total: 0 });
    }

    const response = await fetch(`${OV_URL}/api/v1/search/grep`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": OV_KEY,
      },
      body: JSON.stringify({
        uri: "viking://resources/",
        pattern: query.trim(),
        limit,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenViking error: ${response.status}`);
    }

    const data = await response.json();
    const matches: Array<{
      uri: string;
      content: string;
      line: number;
      dossierId: string;
      fileName: string;
    }> = [];

    for (const match of data.result?.matches || []) {
      const uri = match.uri || "";
      const parts = uri.replace("viking://resources/", "").split("/");
      const dossierId = parts[0] || "";
      const fileName = parts[1] || "";

      matches.push({
        uri,
        content: match.content || "",
        line: match.line || 0,
        dossierId,
        fileName,
      });
    }

    // Deduplicate by dossier
    const byDossier: Record<string, { id: string; files: string[]; samples: string[] }> = {};
    for (const m of matches) {
      if (!byDossier[m.dossierId]) {
        byDossier[m.dossierId] = { id: m.dossierId, files: [], samples: [] };
      }
      if (!byDossier[m.dossierId].files.includes(m.fileName)) {
        byDossier[m.dossierId].files.push(m.fileName);
      }
      if (byDossier[m.dossierId].samples.length < 3) {
        byDossier[m.dossierId].samples.push(m.content.slice(0, 200));
      }
    }

    const dossiers = Object.values(byDossier).map((d) => ({
      id: d.id,
      files: d.files,
      sample: d.samples[0] || "",
    }));

    return NextResponse.json({ dossiers, total: dossiers.length, query });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
