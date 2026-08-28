import { NextResponse } from "next/server";
import { getCurrentSaUser, signSessionToken } from "@/lib/session";
import { requireSaPermission } from "@/lib/server-permissions";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { logAudit, getClientIpAndAgent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = parseInt(id, 10);

    if (isNaN(companyId)) {
      return NextResponse.json(
        { success: false, error: "ID de empresa inválido." },
        { status: 400 }
      );
    }

    // Valida permissão de impersonate no módulo companies
    const perm = await requireSaPermission("companies", "edit");
    if (!perm.authorized) {
      return perm.response;
    }

    const saUser = perm.user;
    const pool = getDbPool();
    const { ip, userAgent } = getClientIpAndAgent(request);

    // 1. Busca a empresa
    const [companies] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, status, plan, admin_whatsapp FROM companies WHERE id = ? LIMIT 1",
      [companyId]
    );

    if (companies.length === 0) {
      return NextResponse.json(
        { success: false, error: "Empresa não encontrada." },
        { status: 404 }
      );
    }

    const company = companies[0];

    // 2. Busca o admin da empresa ou o primeiro usuário da empresa
    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, email, role, status, company_id 
       FROM users 
       WHERE company_id = ? 
       ORDER BY CASE WHEN role = 'COMPANY_ADMIN' THEN 1 ELSE 2 END, id ASC 
       LIMIT 1`,
      [companyId]
    );

    let targetUser = users.length > 0 ? users[0] : null;

    // Se não houver usuário na empresa, usa dados virtuais do admin da empresa
    const impersonatedUserId = targetUser ? targetUser.id : saUser.id;
    const impersonatedEmail = targetUser ? targetUser.email : `admin_${company.id}@empresa.com`;
    const impersonatedName = targetUser ? targetUser.name : `Admin (${company.name})`;

    // Registra no log de auditoria
    await logAudit({
      userId: saUser.id,
      userName: saUser.name,
      userEmail: saUser.email,
      userRole: saUser.role,
      companyId: company.id,
      action: "COMPANY_IMPERSONATE",
      entityType: "company",
      entityId: company.id,
      ipAddress: ip,
      userAgent,
      status: "success",
      newValues: {
        company_name: company.name,
        impersonated_user_id: impersonatedUserId,
        impersonated_email: impersonatedEmail,
      },
    });

    const isProduction = process.env.NODE_ENV === "production";
    const authToken = signSessionToken({
      id: impersonatedUserId,
      email: impersonatedEmail,
      role: "COMPANY_ADMIN",
    });

    const response = NextResponse.json({
      success: true,
      message: `Impersonalizando empresa ${company.name}`,
      company: {
        id: company.id,
        name: company.name,
      },
      redirectTo: `/painel?impersonate=true&company_id=${company.id}&sa_operator=${encodeURIComponent(saUser.name)}`,
    });

    // Configura cookies com os dados da empresa alvo
    response.cookies.set("company_auth_token", authToken, {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
    });
    response.cookies.set("company_user_id", String(impersonatedUserId), {
      path: "/",
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
    });
    response.cookies.set("company_id", String(company.id), {
      path: "/",
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
    });
    response.cookies.set("impersonate_by_sa", saUser.name, {
      path: "/",
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao impersonar empresa";
    console.error("Erro em /api/sa/companies/[id]/impersonate:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
