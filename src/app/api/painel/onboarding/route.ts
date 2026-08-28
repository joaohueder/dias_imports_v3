import { NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser, getEffectiveCompanyId } from "@/lib/session";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { logAudit, getClientIpAndAgent } from "@/lib/audit";

export const dynamic = "force-dynamic";

// GET: Obter o status atual do onboarding da empresa
export async function GET() {
  try {
    await initAuthDatabase();
    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Não autorizado." },
        { status: 401 }
      );
    }

    const companyId = (await getEffectiveCompanyId(user)) || user.company_id || 1;
    const pool = getDbPool();

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, trade_name, document, phone, admin_whatsapp, logo_url,
              meta_pixel_id, meta_pixel_active,
              onboarding_completed, onboarding_current_step, onboarding_completed_steps
       FROM companies 
       WHERE id = ? 
       LIMIT 1`,
      [companyId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Empresa não encontrada." },
        { status: 404 }
      );
    }

    const comp = rows[0];

    // Consultar contagens para auto-detectar passos já configurados
    const [
      [instCount],
      [tmplCount],
      [grpCount],
      [lpCount],
      [prodCount]
    ] = await Promise.all([
      pool.query<RowDataPacket[]>(`SELECT COUNT(*) as total FROM instances WHERE company_id = ? AND status = 'connected'`, [companyId]),
      pool.query<RowDataPacket[]>(`SELECT COUNT(*) as total FROM company_message_templates WHERE company_id = ?`, [companyId]),
      pool.query<RowDataPacket[]>(`SELECT COUNT(*) as total FROM company_whatsapp_groups WHERE company_id = ?`, [companyId]),
      pool.query<RowDataPacket[]>(`SELECT COUNT(*) as total FROM company_group_landing_pages WHERE company_id = ?`, [companyId]),
      pool.query<RowDataPacket[]>(`SELECT COUNT(*) as total FROM company_products WHERE company_id = ?`, [companyId]),
    ]);

    const liveStatus = {
      step1_company_data: !!(comp.name && (comp.document || comp.phone || comp.admin_whatsapp)),
      step2_whatsapp: (instCount[0]?.total || 0) > 0,
      step3_templates: (tmplCount[0]?.total || 0) > 0,
      step4_meta_ads: !!(comp.meta_pixel_id && comp.meta_pixel_active),
      step5_groups: (grpCount[0]?.total || 0) > 0,
      step6_landing_page: (lpCount[0]?.total || 0) > 0,
      step7_products: (prodCount[0]?.total || 0) > 0,
    };

    let completedSteps: number[] = [];
    if (comp.onboarding_completed_steps) {
      try {
        completedSteps = typeof comp.onboarding_completed_steps === "string"
          ? JSON.parse(comp.onboarding_completed_steps)
          : comp.onboarding_completed_steps;
      } catch {}
    }

    return NextResponse.json({
      success: true,
      onboarding: {
        completed: Boolean(comp.onboarding_completed),
        currentStep: comp.onboarding_current_step || 1,
        completedSteps,
        liveStatus,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao carregar onboarding";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// POST/PUT: Atualizar progresso do onboarding da empresa
export async function POST(request: Request) {
  try {
    await initAuthDatabase();
    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Não autorizado." },
        { status: 401 }
      );
    }

    const companyId = (await getEffectiveCompanyId(user)) || user.company_id || 1;
    const pool = getDbPool();
    const body = await request.json();
    const { currentStep, completed, completedSteps } = body;

    const updates: string[] = [];
    const params: (number | string | boolean)[] = [];

    if (typeof currentStep === "number") {
      updates.push("onboarding_current_step = ?");
      params.push(Math.max(1, Math.min(8, currentStep)));
    }

    if (typeof completed === "boolean") {
      updates.push("onboarding_completed = ?");
      params.push(completed ? 1 : 0);
    }

    if (Array.isArray(completedSteps)) {
      updates.push("onboarding_completed_steps = ?");
      params.push(JSON.stringify(completedSteps));
    }

    if (updates.length > 0) {
      params.push(companyId);
      await pool.query<ResultSetHeader>(
        `UPDATE companies SET ${updates.join(", ")} WHERE id = ?`,
        params
      );

      const { ip, userAgent } = getClientIpAndAgent(request);
      await logAudit({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        companyId,
        action: completed ? "ONBOARDING_COMPLETED" : "ONBOARDING_PROGRESS_UPDATED",
        entityType: "company_onboarding",
        entityId: companyId,
        ipAddress: ip,
        userAgent,
        status: "success",
        newValues: { currentStep, completed, completedSteps },
      });
    }

    return NextResponse.json({
      success: true,
      message: completed ? "Onboarding concluído com sucesso!" : "Progresso salvo!",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar onboarding";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
