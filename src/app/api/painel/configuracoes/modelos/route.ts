import { NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Helper para garantir que a tabela de modelos exista e contenha a coluna status
async function ensureTemplateTableExists() {
  const pool = getDbPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_message_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      type ENUM('product_offer', 'simple_text', 'welcome', 'reminder', 'custom') NOT NULL DEFAULT 'product_offer',
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_company_msg_templates_company_id (company_id),
      INDEX idx_company_msg_templates_type (type),
      INDEX idx_company_msg_templates_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Migração defensiva: adiciona coluna status caso não exista
  try {
    const [cols] = await pool.query<RowDataPacket[]>(
      `SHOW COLUMNS FROM company_message_templates LIKE 'status'`
    );
    if (cols.length === 0) {
      await pool.query(
        `ALTER TABLE company_message_templates ADD COLUMN status ENUM('active', 'inactive') NOT NULL DEFAULT 'active' AFTER type`
      );
    }
  } catch (err) {
    console.error("Erro ao verificar coluna status em company_message_templates:", err);
  }
}

// GET - Listar todos os modelos de mensagens da empresa
export async function GET() {
  try {
    const cookieStore = await cookies();
    const impersonateCompanyId = cookieStore.get("company_id")?.value;

    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado." }, { status: 401 });
    }

    const companyId = user.company_id || (impersonateCompanyId ? parseInt(impersonateCompanyId, 10) : 1);
    await ensureTemplateTableExists();
    const pool = getDbPool();

    // Se a empresa ainda não tiver nenhum modelo cadastrado, gera um modelo inicial de exemplo
    const [existingCount] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM company_message_templates WHERE company_id = ?`,
      [companyId]
    );

    if (existingCount[0].total === 0) {
      await pool.query(
        `INSERT INTO company_message_templates (company_id, title, content, type, status)
         VALUES (?, ?, ?, ?, ?)`,
        [
          companyId,
          "🔥 Oferta Exclusiva com Link e Preço",
          "🚀 *{nome_produto}*\n\n{headline}\n\nDe: ~{preco_de}~\n🔥 *Por apenas: {preco_por}*\n\n🛒 Garanta o seu agora no link exclusivo:\n{link_produto}\n\n_Promoção por tempo limitado enquanto durarem os estoques!_",
          "product_offer",
          "active",
        ]
      );
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM company_message_templates 
       WHERE company_id = ? 
       ORDER BY status = 'active' DESC, updated_at DESC`,
      [companyId]
    );

    return NextResponse.json({
      success: true,
      templates: rows,
    });
  } catch (error: any) {
    console.error("Erro ao listar modelos de mensagens:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao buscar modelos." },
      { status: 500 }
    );
  }
}

// POST - Criar um novo modelo de mensagem
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const impersonateCompanyId = cookieStore.get("company_id")?.value;

    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado." }, { status: 401 });
    }

    const companyId = user.company_id || (impersonateCompanyId ? parseInt(impersonateCompanyId, 10) : 1);
    const body = await request.json();
    const { title, content, type, status } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, message: "O título do modelo é obrigatório." }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, message: "O conteúdo do modelo é obrigatório." }, { status: 400 });
    }

    await ensureTemplateTableExists();
    const pool = getDbPool();

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO company_message_templates (company_id, title, content, type, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        companyId,
        title.trim(),
        content.trim(),
        type || "product_offer",
        status === "inactive" ? "inactive" : "active",
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Modelo criado com sucesso!",
      templateId: result.insertId,
    });
  } catch (error: any) {
    console.error("Erro ao criar modelo de mensagem:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao criar modelo." },
      { status: 500 }
    );
  }
}
