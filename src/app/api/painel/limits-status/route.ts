import { NextRequest, NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser, getEffectiveCompanyId } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const companyId = await getEffectiveCompanyId(user);
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Empresa não identificada" }, { status: 403 });
    }

    const pool = getDbPool();

    // 1. Obter dados da empresa
    const [companies] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM companies WHERE id = ? LIMIT 1`,
      [companyId]
    );

    if (!companies || companies.length === 0) {
      return NextResponse.json({ success: true, exceeded: false, exceededItems: [], plan_name: "Iniciante" });
    }

    const company = companies[0];

    // 2. Obter assinatura ativa
    let sub: RowDataPacket | null = null;
    try {
      const [subs] = await pool.query<RowDataPacket[]>(
        `SELECT s.*, p.name as plan_name, p.max_groups as plan_max_groups, 
                p.max_products as plan_max_products, p.max_messages_day as plan_max_messages_day,
                p.max_views as plan_max_views, p.max_leads as plan_max_leads
         FROM subscriptions s
         LEFT JOIN plans p ON p.id = s.plan_id
         WHERE s.company_id = ? AND s.status = 'active'
         ORDER BY s.id DESC LIMIT 1`,
        [companyId]
      );
      if (subs && subs.length > 0) {
        sub = subs[0];
      }
    } catch {
      // Ignora erro se subscriptions não existir
    }

    // 3. Contagens de uso atual
    let currentGroups = 0;
    let currentProducts = 0;
    let currentViews = 0;
    let currentLeads = 0;

    try {
      const [g] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM company_whatsapp_groups WHERE company_id = ?`,
        [companyId]
      );
      currentGroups = Number(g[0]?.count || 0);
    } catch {}

    try {
      const [p] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count, COALESCE(SUM(views_count), 0) as total_views FROM company_products WHERE company_id = ?`,
        [companyId]
      );
      currentProducts = Number(p[0]?.count || 0);
      currentViews = Number(p[0]?.total_views || 0);
    } catch {}

    try {
      const [l] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM company_leads WHERE company_id = ?`,
        [companyId]
      );
      currentLeads = Number(l[0]?.count || 0);
    } catch {}

    // Resolução dos limites
    const planName = (sub?.plan_name as string) || (company?.plan as string) || "Personalizado";
    const maxGroups = Number(sub?.plan_snapshot_max_groups ?? sub?.plan_max_groups ?? company?.max_groups ?? 0);
    const maxProducts = Number(sub?.plan_snapshot_max_products ?? sub?.plan_max_products ?? company?.max_products ?? 0);
    const maxViews = Number(sub?.plan_snapshot_max_views ?? sub?.plan_max_views ?? company?.max_views ?? 0);
    const maxLeads = Number(sub?.plan_snapshot_max_leads ?? sub?.plan_max_leads ?? 0);

    const exceededItems: { key: string; label: string; current: number; max: number }[] = [];

    if (maxGroups > 0 && currentGroups >= maxGroups) {
      exceededItems.push({ key: "groups", label: "Grupos WhatsApp", current: currentGroups, max: maxGroups });
    }
    if (maxProducts > 0 && currentProducts >= maxProducts) {
      exceededItems.push({ key: "products", label: "Produtos no Catálogo", current: currentProducts, max: maxProducts });
    }
    if (maxViews > 0 && currentViews >= maxViews) {
      exceededItems.push({ key: "views", label: "Visualizações Mensais", current: currentViews, max: maxViews });
    }
    if (maxLeads > 0 && currentLeads >= maxLeads) {
      exceededItems.push({ key: "leads", label: "Leads Capturados", current: currentLeads, max: maxLeads });
    }

    return NextResponse.json({
      success: true,
      exceeded: exceededItems.length > 0,
      exceededItems,
      plan_name: planName,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao verificar limites";
    return NextResponse.json({ success: true, exceeded: false, exceededItems: [], error: message });
  }
}
