import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";
import { logAudit, getClientIpAndAgent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireSaPermission("logs", "view");
    if (!auth.authorized) return auth.response;

    const pool = getDbPool();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const action = searchParams.get("action") || "all";
    const entityType = searchParams.get("entityType") || "all";
    const status = searchParams.get("status") || "all";
    const limit = Math.min(200, Math.max(10, Number(searchParams.get("limit")) || 50));

    let query = `
      SELECT 
        id, user_id, user_name, user_email, user_role, company_id, 
        action, entity_type, entity_id, old_values, new_values, 
        ip_address, user_agent, status, created_at
      FROM audit_logs
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (search) {
      query += " AND (user_name LIKE ? OR user_email LIKE ? OR action LIKE ? OR entity_type LIKE ? OR ip_address LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (action !== "all") {
      query += " AND action = ?";
      params.push(action);
    }

    if (entityType !== "all") {
      query += " AND entity_type = ?";
      params.push(entityType);
    }

    if (status !== "all") {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({
      success: true,
      logs: rows,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao listar logs de auditoria";
    console.error("Erro na rota GET /api/sa/logs:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireSaPermission("logs", "delete");
    if (!auth.authorized) {
      return auth.response;
    }

    const pool = getDbPool();
    const { ip, userAgent } = getClientIpAndAgent(request);

    await pool.query<ResultSetHeader>("DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)");

    await logAudit({
      userId: auth.user.id,
      userName: auth.user.name,
      userEmail: auth.user.email,
      userRole: auth.user.role,
      action: "AUDIT_LOGS_PURGE",
      entityType: "logs",
      ipAddress: ip,
      userAgent,
      newValues: { retainedDays: 90 },
    });

    return NextResponse.json({
      success: true,
      message: "Logs com mais de 90 dias expurgados com sucesso.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao limpar logs de auditoria";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
