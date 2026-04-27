import pool from "@/lib/vps-pg";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const { id, ...updates } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Property ID required" }, { status: 400 });
    }

    const allowedFields = [
      "title", "description", "asset_type", "address", "reference", "price",
      "meters", "rooms", "bathrooms", "is_off_market", "is_published",
      "thumbnail_url", "owner_id", "dossier_url", "features", "climatization",
      "category", "external_id", "extended_data", "investor_id"
    ];

    const updateParts: string[] = [];
    const params: any[] = [];
    let i = 1;

    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key)) {
        updateParts.push(`${key} = $${i++}`);
        params.push(updates[key]);
      }
    }

    if (updateParts.length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    updateParts.push(`updated_at = NOW()`);
    params.push(id);

    const result = await pool.query(
      `UPDATE properties SET ${updateParts.join(", ")} WHERE id = $${i} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({ property: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
