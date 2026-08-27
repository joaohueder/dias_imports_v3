import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";
import { deleteEvolutionInstance } from "@/lib/evolution";

export const dynamic = "force-dynamic";

// GET - Obter detalhes de uma instância
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSaPermission("instances", "view");
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const pool = getDbPool();

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        i.*,
        COALESCE(c.name, 'Sistema / Matriz SaaS') as company_name,
        COALESCE(c.trade_name, 'SaaS Padrão') as company_trade_name
       FROM instances i
       LEFT JOIN companies c ON i.company_id = c.id
       WHERE i.id = ? LIMIT 1`,
      [Number(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Instância não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      instance: rows[0],
    });
  } catch (error: unknown) {
    console.error("Erro na rota GET /api/sa/instances/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar detalhes da instância" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar dados da instância
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSaPermission("instances", "edit");
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const pool = getDbPool();
    const body = await request.json();

    const { name, whatsapp_number, server_url, api_key } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Nome da instância é obrigatório." },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE instances 
       SET name = ?, 
           whatsapp_number = ?, 
           server_url = ?, 
           api_key = ? 
       WHERE id = ?`,
      [
        name.trim(),
        whatsapp_number ? String(whatsapp_number).trim() : null,
        server_url ? String(server_url).trim() : null,
        api_key ? String(api_key).trim() : null,
        Number(id),
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Instância não encontrada para atualização." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Instância atualizada com sucesso!",
    });
  } catch (error: unknown) {
    console.error("Erro na rota PUT /api/sa/instances/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar instância" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir instância
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSaPermission("instances", "delete");
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const pool = getDbPool();

    // 1. Buscar a instância para capturar o nome antes de deletar
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, name FROM instances WHERE id = ? LIMIT 1",
      [Number(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Instância não encontrada para exclusão." },
        { status: 404 }
      );
    }

    const instanceName = rows[0].name;

    // 2. Tentar remover na Evolution API
    if (instanceName) {
      try {
        await deleteEvolutionInstance(instanceName);
      } catch (evoErr) {
        console.warn(`Aviso ao excluir instância (${instanceName}) na Evolution API:`, evoErr);
      }
    }

    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM instances WHERE id = ?",
      [Number(id)]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Instância não encontrada para exclusão." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Instância removida com sucesso da plataforma e da Evolution API!",
    });
  } catch (error: unknown) {
    console.error("Erro na rota DELETE /api/sa/instances/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao excluir instância" },
      { status: 500 }
    );
  }
}
