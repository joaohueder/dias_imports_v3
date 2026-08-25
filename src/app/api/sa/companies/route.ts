import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

// GET - Listar empresas com filtros opcionais
export async function GET(request: Request) {
  try {
    await initAuthDatabase();
    const pool = getDbPool();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    let query = `
      SELECT 
        c.*,
        COUNT(DISTINCT u.id) as user_count
      FROM companies c
      LEFT JOIN users u ON u.company_id = c.id
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

    query += ` GROUP BY c.id ORDER BY c.created_at DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({
      success: true,
      companies: rows,
      total: rows.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao listar empresas";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST - Criar nova empresa
export async function POST(request: Request) {
  try {
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

    return NextResponse.json({
      success: true,
      message: "Empresa e credenciais de acesso cadastradas com sucesso.",
      companyId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao cadastrar empresa";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
