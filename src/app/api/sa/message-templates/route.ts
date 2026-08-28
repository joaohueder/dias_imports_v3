import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { requireSaPermission } from "@/lib/server-permissions";
import { logAudit } from "@/lib/audit";

// GET /api/sa/message-templates - Lista todos os modelos mestres do SaaS
export async function GET() {
  try {
    const auth = await requireSaPermission("message_templates", "view");
    if (!auth.authorized) {
      return auth.response;
    }

    const pool = getDbPool();

    // Garante que a tabela exista caso a migration ainda esteja pendente
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sa_message_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        content TEXT NOT NULL,
        type ENUM('standard', 'offer', 'urgency', 'custom') DEFAULT 'standard',
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [rows]: any = await pool.query(
      "SELECT id, title, content, type, status, created_at, updated_at FROM sa_message_templates ORDER BY id ASC"
    );

    return NextResponse.json({ success: true, templates: rows });
  } catch (error: any) {
    console.error("Erro ao listar modelos mestres de mensagem:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// POST /api/sa/message-templates - Cria um novo modelo mestre
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSaPermission("message_templates", "create");
    if (!auth.authorized) {
      return auth.response;
    }

    const pool = getDbPool();
    const body = await req.json();
    const { title, content, type = "standard", status = "active" } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Conteúdo da mensagem é obrigatório" }, { status: 400 });
    }

    const validTypes = ["standard", "offer", "urgency", "custom"];
    const templateType = validTypes.includes(type) ? type : "standard";
    const templateStatus = status === "inactive" ? "inactive" : "active";

    const [result]: any = await pool.query(
      "INSERT INTO sa_message_templates (title, content, type, status) VALUES (?, ?, ?, ?)",
      [title.trim(), content.trim(), templateType, templateStatus]
    );

    await logAudit({
      userId: auth.user.id,
      userName: auth.user.name,
      userEmail: auth.user.email,
      userRole: auth.user.role,
      action: "CREATE_SA_MESSAGE_TEMPLATE",
      entityType: "sa_message_templates",
      entityId: result.insertId,
      newValues: { id: result.insertId, title: title.trim(), type: templateType, status: templateStatus },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "Modelo mestre criado com sucesso",
      id: result.insertId,
    });
  } catch (error: any) {
    console.error("Erro ao criar modelo mestre:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
