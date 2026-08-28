import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

// GET - Estatísticas detalhadas do produto
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const cookieStore = request.cookies;
    const impersonateCompanyId = cookieStore.get("company_id")?.value;
    const companyId = user.company_id || (impersonateCompanyId ? parseInt(impersonateCompanyId, 10) : 1);

    const pool = getDbPool();

    // 1. Dados do produto
    const [productRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, slug, price, promo_price, status, sends_count, views_count, clicks_count, last_accessed_at, created_at, updated_at
       FROM company_products 
       WHERE id = ? AND company_id = ? 
       LIMIT 1`,
      [id, companyId]
    );

    if (productRows.length === 0) {
      return NextResponse.json({ success: false, message: "Produto não encontrado" }, { status: 404 });
    }

    const product = productRows[0];

    // 2. Histórico de disparos associados a este produto (via background_jobs)
    let jobsRows: any[] = [];
    let jobStats = {
      total_dispatches: 0,
      completed_dispatches: 0,
      failed_dispatches: 0,
      pending_dispatches: 0,
    };

    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id, queue_name, name, status, attempts, failed_reason as error_message, created_at, updated_at,
                COALESCE(
                  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.group_name')), 'null'),
                  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.groupName')), 'null'),
                  'Grupo WhatsApp'
                ) as group_name,
                COALESCE(
                  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.group_jid')), 'null'),
                  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.groupJid')), 'null'),
                  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.recipient')), 'null')
                ) as group_jid,
                COALESCE(
                  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.template_title')), 'null'),
                  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.templateTitle')), 'null'),
                  'Modelo Padrão'
                ) as template_title
         FROM background_jobs
         WHERE (
           JSON_UNQUOTE(JSON_EXTRACT(payload, '$.productId')) = ?
           OR JSON_UNQUOTE(JSON_EXTRACT(payload, '$.product_id')) = ?
         )
         ORDER BY created_at DESC
         LIMIT 50`,
        [String(id), String(id)]
      );
      jobsRows = rows || [];

      // 3. Totais por status dos disparos deste produto
      const [statsRows] = await pool.query<RowDataPacket[]>(
        `SELECT 
           COUNT(*) as total_dispatches,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_dispatches,
           SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_dispatches,
           SUM(CASE WHEN status = 'active' OR status = 'waiting' OR status = 'delayed' THEN 1 ELSE 0 END) as pending_dispatches
         FROM background_jobs
         WHERE (
           JSON_UNQUOTE(JSON_EXTRACT(payload, '$.productId')) = ?
           OR JSON_UNQUOTE(JSON_EXTRACT(payload, '$.product_id')) = ?
         )`,
        [String(id), String(id)]
      );

      if (statsRows && statsRows.length > 0) {
        jobStats = {
          total_dispatches: Number(statsRows[0].total_dispatches) || 0,
          completed_dispatches: Number(statsRows[0].completed_dispatches) || 0,
          failed_dispatches: Number(statsRows[0].failed_dispatches) || 0,
          pending_dispatches: Number(statsRows[0].pending_dispatches) || 0,
        };
      }
    } catch (jobErr) {
      console.warn("Aviso ao buscar background_jobs para estatísticas do produto:", jobErr);
    }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        price: Number(product.price) || 0,
        promo_price: product.promo_price !== null ? Number(product.promo_price) : null,
        sends_count: Number(product.sends_count) || 0,
        views_count: Number(product.views_count) || 0,
        clicks_count: Number(product.clicks_count) || 0,
      },
      stats: {
        total_dispatches: Number(jobStats.total_dispatches) || 0,
        completed_dispatches: Number(jobStats.completed_dispatches) || 0,
        failed_dispatches: Number(jobStats.failed_dispatches) || 0,
        pending_dispatches: Number(jobStats.pending_dispatches) || 0,
      },
      recentJobs: jobsRows || [],
    });
  } catch (error: any) {
    console.error("Erro ao buscar estatísticas do produto:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
