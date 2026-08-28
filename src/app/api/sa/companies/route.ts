import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";
import { createEvolutionInstance } from "@/lib/evolution";
import crypto from "crypto";
import { logAudit, getClientIpAndAgent } from "@/lib/audit";

export const dynamic = "force-dynamic";

// GET - Listar empresas com filtros opcionais
export async function GET(request: Request) {
  try {
    const auth = await requireSaPermission("companies", "view");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const pool = getDbPool();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    let query = `
      SELECT 
        c.*,
        COALESCE(u.user_count, 0) as user_count,
        COALESCE(sub.plan_snapshot_name, p.name, c.plan) as current_plan_name,
        sub.status as subscription_status,
        sub.id as active_subscription_id,
        COALESCE(sub.plan_snapshot_max_groups, p.max_groups, 0) as quota_max_groups,
        COALESCE(sub.plan_snapshot_max_products, p.max_products, 0) as quota_max_products,
        COALESCE(sub.plan_snapshot_max_messages_day, p.max_messages_day, c.max_messages_day) as quota_max_messages_day,
        COALESCE(sub.plan_snapshot_max_views, p.max_views, 0) as quota_max_views,
        COALESCE(sub.plan_snapshot_max_leads, p.max_leads, 0) as quota_max_leads,
        COALESCE(sub.plan_snapshot_max_instances, p.max_instances, c.max_instances) as quota_max_instances,
        COALESCE(usage_groups.current_groups_count, 0) as current_groups_count,
        COALESCE(usage_products.current_products_count, 0) as current_products_count,
        COALESCE(usage_products.current_views_count, 0) as current_views_count,
        COALESCE(usage_leads.current_leads_count, 0) as current_leads_count,
        COALESCE(usage_instances.current_instances_count, 0) as current_instances_count,
        COALESCE(usage_jobs.current_messages_today, 0) as current_messages_today
      FROM companies c
      LEFT JOIN (
        SELECT company_id, COUNT(*) as user_count
        FROM users
        GROUP BY company_id
      ) u ON u.company_id = c.id
      LEFT JOIN (
        SELECT company_id, COUNT(*) as current_groups_count
        FROM company_whatsapp_groups
        GROUP BY company_id
      ) usage_groups ON usage_groups.company_id = c.id
      LEFT JOIN (
        SELECT company_id, COUNT(*) as current_products_count, COALESCE(SUM(views_count), 0) as current_views_count
        FROM company_products
        GROUP BY company_id
      ) usage_products ON usage_products.company_id = c.id
      LEFT JOIN (
        SELECT company_id, COUNT(*) as current_leads_count
        FROM company_leads
        GROUP BY company_id
      ) usage_leads ON usage_leads.company_id = c.id
      LEFT JOIN (
        SELECT company_id, COUNT(*) as current_instances_count
        FROM instances
        GROUP BY company_id
      ) usage_instances ON usage_instances.company_id = c.id
      LEFT JOIN (
        SELECT 
          COALESCE(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.company_id')), JSON_UNQUOTE(JSON_EXTRACT(payload, '$.companyId'))) as company_id_val,
          COUNT(*) as current_messages_today
        FROM background_jobs
        WHERE queue_name LIKE 'whatsapp-messages%'
          AND (status = 'completed' OR status = 'active' OR status = 'waiting' OR status = 'delayed')
          AND DATE(created_at) = CURDATE()
        GROUP BY company_id_val
      ) usage_jobs ON usage_jobs.company_id_val = CAST(c.id AS CHAR)
      LEFT JOIN (
        SELECT s1.*
        FROM subscriptions s1
        INNER JOIN (
          SELECT company_id, MAX(id) as max_id
          FROM subscriptions
          WHERE status = 'active'
          GROUP BY company_id
        ) s2 ON s1.id = s2.max_id
      ) sub ON sub.company_id = c.id
      LEFT JOIN plans p ON sub.plan_id = p.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (search) {
      query += ` AND (c.name LIKE ? OR c.trade_name LIKE ? OR c.document LIKE ? OR c.email LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (status && status !== "all") {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY c.created_at DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({
      success: true,
      companies: rows,
      total: rows.length,
    });
  } catch (error: unknown) {
    console.error("Erro na rota /api/sa/companies:", error);
    const message = error instanceof Error ? error.message : "Erro ao listar empresas";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST - Criar nova empresa
export async function POST(request: Request) {
  try {
    const auth = await requireSaPermission("companies", "create");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const pool = getDbPool();
    const body = await request.json();

    const {
      name,
      trade_name,
      document,
      email,
      whatsapp,
      admin_whatsapp,
      plan = "Pro",
      status = "active",
      max_instances = 5,
      max_messages_day = 5000,
      address_zipcode,
      address_street,
      address_number,
      address_complement,
      address_neighborhood,
      address_city,
      address_state,
    } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "A Razão Social / Nome da Empresa é obrigatório." },
        { status: 400 }
      );
    }

    if (!admin_whatsapp || admin_whatsapp.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "O WhatsApp de Acesso Admin é obrigatório." },
        { status: 400 }
      );
    }

    // Se informou documento (CNPJ/CPF), checar duplicidade
    if (document && document.trim().length > 0) {
      const [existingDoc] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM companies WHERE document = ?",
        [document.trim()]
      );
      if (existingDoc.length > 0) {
        return NextResponse.json(
          { success: false, error: "Já existe uma empresa cadastrada com este Documento (CNPJ/CPF)." },
          { status: 409 }
        );
      }
    }

    // Validação estrita de unicidade do admin_whatsapp em todo o sistema
    const cleanAdminWhatsapp = admin_whatsapp.replace(/\D/g, "");
    const [existingAdminWa] = await pool.query<RowDataPacket[]>(
      `SELECT id, name FROM companies 
       WHERE REPLACE(REPLACE(REPLACE(REPLACE(admin_whatsapp, ' ', ''), '-', ''), '(', ''), ')', '') = ?`,
      [cleanAdminWhatsapp]
    );

    if (existingAdminWa.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Este WhatsApp de Acesso Admin já está vinculado à empresa "${existingAdminWa[0].name}". O WhatsApp admin deve ser único no sistema todo.`,
        },
        { status: 409 }
      );
    }

    // Inserir empresa
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO companies (
        name, trade_name, document, email, whatsapp, admin_whatsapp, plan, status, 
        max_instances, max_messages_day, address_zipcode, address_street,
        address_number, address_complement, address_neighborhood, address_city, address_state
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        trade_name?.trim() || null,
        document?.trim() || null,
        email?.trim() || null,
        whatsapp?.trim() || null,
        admin_whatsapp?.trim() || null,
        plan,
        status,
        Number(max_instances) || 5,
        Number(max_messages_day) || 5000,
        address_zipcode?.trim() || null,
        address_street?.trim() || null,
        address_number?.trim() || null,
        address_complement?.trim() || null,
        address_neighborhood?.trim() || null,
        address_city?.trim() || null,
        address_state?.trim() || null,
      ]
    );

    const companyId = result.insertId;

    // Criar ou atualizar usuário COMPANY_ADMIN para acesso via OTP
    const [existingUser] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM users 
       WHERE REPLACE(REPLACE(REPLACE(REPLACE(whatsapp, ' ', ''), '-', ''), '(', ''), ')', '') = ?`,
      [cleanAdminWhatsapp]
    );

    if (existingUser.length === 0) {
      const generatedEmail = email?.trim() || `admin_${companyId}@empresa.com`;
      await pool.query(
        `INSERT INTO users (name, email, whatsapp, password, role, company_id, status)
         VALUES (?, ?, ?, ?, 'COMPANY_ADMIN', ?, 'active')
         ON DUPLICATE KEY UPDATE whatsapp = VALUES(whatsapp), company_id = VALUES(company_id)`,
        [
          trade_name?.trim() || name.trim(),
          generatedEmail,
          admin_whatsapp.trim(),
          "123456",
          companyId,
        ]
      );
    } else {
      await pool.query(
        "UPDATE users SET company_id = ?, role = 'COMPANY_ADMIN' WHERE id = ?",
        [companyId, existingUser[0].id]
      );
    }

    // Criar automaticamente uma instância do WhatsApp para a nova empresa
    try {
      const cleanCompanyName = (trade_name || name || "EMPRESA")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toUpperCase()
        .slice(0, 16);

      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const instanceName = `${cleanCompanyName || "EMPRESA"}-${randomSuffix}`;
      const instanceKey = `inst_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

      // Cria na Evolution API
      await createEvolutionInstance({
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      });

      // Salva no banco de dados local
      await pool.query(
        `INSERT INTO instances (
          company_id, name, whatsapp_number, server_url, api_key, instance_key, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'disconnected')`,
        [
          companyId,
          instanceName,
          whatsapp ? String(whatsapp).trim() : null,
          null,
          null,
          instanceKey,
        ]
      );
    } catch (instError) {
      console.error("Aviso: Erro ao criar instância automática para a empresa:", instError);
    }

    const { ip, userAgent } = getClientIpAndAgent(request);
    await logAudit({
      userId: auth.user.id,
      userName: auth.user.name,
      userEmail: auth.user.email,
      userRole: auth.user.role,
      action: "COMPANY_CREATE",
      entityType: "companies",
      entityId: companyId,
      newValues: { name, trade_name, admin_whatsapp: cleanAdminWhatsapp, plan, status },
      ipAddress: ip,
      userAgent,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "Empresa, credenciais de acesso e instância de WhatsApp cadastradas com sucesso.",
      companyId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao cadastrar empresa";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
