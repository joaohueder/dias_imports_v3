import { getDbPool } from "@/lib/db";

export interface AuditLogInput {
  userId?: number | null;
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  companyId?: number | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  status?: "success" | "failed";
}

export function getClientIpAndAgent(req?: Request): { ip: string | null; userAgent: string | null } {
  if (!req) return { ip: null, userAgent: null };

  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || null;
  const userAgent = headers.get("user-agent") || null;

  return { ip, userAgent };
}

export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    const pool = getDbPool();
    await pool.query(
      `INSERT INTO audit_logs 
       (user_id, user_name, user_email, user_role, company_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.userId ?? null,
        input.userName ?? null,
        input.userEmail ?? null,
        input.userRole ?? null,
        input.companyId ?? null,
        input.action,
        input.entityType,
        input.entityId != null ? String(input.entityId) : null,
        input.oldValues ? JSON.stringify(input.oldValues) : null,
        input.newValues ? JSON.stringify(input.newValues) : null,
        input.ipAddress ?? null,
        input.userAgent ?? null,
        input.status ?? "success",
      ]
    );
  } catch (err) {
    console.error("Falha ao registrar log de auditoria:", err);
  }
}
