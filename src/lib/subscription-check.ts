import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export interface CompanySubscriptionStatus {
  hasActiveSubscription: boolean;
  status: "active" | "expired" | "past_due" | "canceled" | "none";
  currentPeriodEnd: string | null;
  planName: string | null;
  subscriptionId: number | null;
}

/**
 * Valida de forma centralizada se a empresa possui assinatura ativa.
 */
export async function checkCompanyActiveSubscription(companyId: number): Promise<CompanySubscriptionStatus> {
  const pool = getDbPool();

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.status, s.current_period_end,
              COALESCE(s.plan_snapshot_name, p.name) as plan_name
       FROM subscriptions s
       LEFT JOIN plans p ON p.id = s.plan_id
       WHERE s.company_id = ?
       ORDER BY 
         CASE WHEN s.status = 'active' THEN 1 ELSE 2 END,
         s.id DESC
       LIMIT 1`,
      [companyId]
    );

    if (rows.length === 0) {
      return {
        hasActiveSubscription: false,
        status: "none",
        currentPeriodEnd: null,
        planName: null,
        subscriptionId: null,
      };
    }

    const sub = rows[0];
    const isActive = sub.status === "active";

    return {
      hasActiveSubscription: isActive,
      status: sub.status,
      currentPeriodEnd: sub.current_period_end,
      planName: sub.plan_name,
      subscriptionId: sub.id,
    };
  } catch (error) {
    console.error("Erro ao verificar assinatura da empresa:", error);
    return {
      hasActiveSubscription: false,
      status: "none",
      currentPeriodEnd: null,
      planName: null,
      subscriptionId: null,
    };
  }
}
