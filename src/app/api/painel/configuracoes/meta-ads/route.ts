import { NextRequest, NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

// GET - Obter configurações do Meta Ads da empresa
export async function GET(request: NextRequest) {
  try {
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

    // Garante colunas de Meta Ads Pixel na tabela companies se não existirem
    try {
      await pool.query(`
        ALTER TABLE companies 
        ADD COLUMN meta_pixel_id VARCHAR(50) NULL AFTER logo_url,
        ADD COLUMN meta_pixel_access_token TEXT NULL AFTER meta_pixel_id,
        ADD COLUMN meta_pixel_test_code VARCHAR(50) NULL AFTER meta_pixel_access_token,
        ADD COLUMN meta_pixel_active BOOLEAN NOT NULL DEFAULT FALSE AFTER meta_pixel_test_code;
      `);
    } catch {}

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, meta_pixel_id, meta_pixel_access_token, meta_pixel_test_code, meta_pixel_active
       FROM companies 
       WHERE id = ? 
       LIMIT 1`,
      [companyId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Empresa não encontrada" }, { status: 404 });
    }

    const company = rows[0];

    return NextResponse.json({
      success: true,
      meta_ads: {
        meta_pixel_id: company.meta_pixel_id || "",
        meta_pixel_access_token: company.meta_pixel_access_token || "",
        meta_pixel_test_code: company.meta_pixel_test_code || "",
        meta_pixel_active: Boolean(company.meta_pixel_active),
      },
    });
  } catch (error: any) {
    console.error("Erro ao buscar configurações do Meta Ads:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao buscar configurações do Meta Ads" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar configurações do Meta Ads da empresa
export async function PUT(request: NextRequest) {
  try {
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

    const body = await request.json();
    const {
      meta_pixel_id,
      meta_pixel_access_token,
      meta_pixel_test_code,
      meta_pixel_active,
    } = body;

    const pool = getDbPool();

    // Garante colunas de Meta Ads Pixel
    try {
      await pool.query(`
        ALTER TABLE companies 
        ADD COLUMN meta_pixel_id VARCHAR(50) NULL AFTER logo_url,
        ADD COLUMN meta_pixel_access_token TEXT NULL AFTER meta_pixel_id,
        ADD COLUMN meta_pixel_test_code VARCHAR(50) NULL AFTER meta_pixel_access_token,
        ADD COLUMN meta_pixel_active BOOLEAN NOT NULL DEFAULT FALSE AFTER meta_pixel_test_code;
      `);
    } catch {}

    const [existingRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, meta_pixel_id, meta_pixel_active FROM companies WHERE id = ? LIMIT 1`,
      [companyId]
    );

    if (existingRows.length === 0) {
      return NextResponse.json({ success: false, message: "Empresa não encontrada" }, { status: 404 });
    }

    const cleanPixelId = meta_pixel_id ? String(meta_pixel_id).trim() : null;
    const cleanToken = meta_pixel_access_token ? String(meta_pixel_access_token).trim() : null;
    const cleanTestCode = meta_pixel_test_code ? String(meta_pixel_test_code).trim() : null;
    const isActive = Boolean(meta_pixel_active);

    await pool.query<ResultSetHeader>(
      `UPDATE companies 
       SET meta_pixel_id = ?,
           meta_pixel_access_token = ?,
           meta_pixel_test_code = ?,
           meta_pixel_active = ?
       WHERE id = ?`,
      [cleanPixelId, cleanToken, cleanTestCode, isActive ? 1 : 0, companyId]
    );

    await logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: "update_meta_ads",
      entityType: "companies",
      entityId: String(companyId),
      companyId: companyId,
      oldValues: {
        meta_pixel_id: existingRows[0].meta_pixel_id,
        meta_pixel_active: existingRows[0].meta_pixel_active,
      },
      newValues: {
        meta_pixel_id: cleanPixelId,
        meta_pixel_active: isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Configurações do Meta Ads atualizadas com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro ao salvar configurações do Meta Ads:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao salvar configurações do Meta Ads" },
      { status: 500 }
    );
  }
}
