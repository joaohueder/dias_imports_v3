import { NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// PUT - Atualizar modelo de mensagem
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const templateId = parseInt(id, 10);
    if (!templateId) {
      return NextResponse.json({ success: false, message: "ID inválido." }, { status: 400 });
    }

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

    const pool = getDbPool();

    // Verifica posse
    const [check] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM company_message_templates WHERE id = ? AND company_id = ?`,
      [templateId, companyId]
    );

    if (check.length === 0) {
      return NextResponse.json({ success: false, message: "Modelo não encontrado." }, { status: 404 });
    }

    await pool.query(
      `UPDATE company_message_templates 
       SET title = ?, content = ?, type = ?, status = ?, updated_at = NOW()
       WHERE id = ? AND company_id = ?`,
      [
        title.trim(),
        content.trim(),
        type || "product_offer",
        status === "inactive" ? "inactive" : "active",
        templateId,
        companyId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Modelo atualizado com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro ao atualizar modelo de mensagem:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao atualizar modelo." },
      { status: 500 }
    );
  }
}

// DELETE - Excluir modelo de mensagem
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const templateId = parseInt(id, 10);
    if (!templateId) {
      return NextResponse.json({ success: false, message: "ID inválido." }, { status: 400 });
    }

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
    const pool = getDbPool();

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM company_message_templates WHERE id = ? AND company_id = ?`,
      [templateId, companyId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Modelo não encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Modelo excluído com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro ao excluir modelo de mensagem:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao excluir modelo." },
      { status: 500 }
    );
  }
}
