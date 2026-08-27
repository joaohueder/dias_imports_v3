import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const pool = getDbPool();
    // Suporta tanto id numérico quanto slug
    if (/^\d+$/.test(slug)) {
      await pool.query(`UPDATE company_products SET clicks_count = clicks_count + 1 WHERE id = ?`, [slug]);
    } else {
      await pool.query(`UPDATE company_products SET clicks_count = clicks_count + 1 WHERE slug = ?`, [slug]);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
