import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";
import { logoutEvolutionInstance, restartEvolutionInstance, connectEvolutionInstance } from "@/lib/evolution";

export const dynamic = "force-dynamic";

// PATCH - Conectar, Desconectar, Reiniciar ou Alterar Status de uma instância
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSaPermission("instances", "edit");
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const pool = getDbPool();
    const body = await request.json();

    const { action, status } = body;
    // action: 'connect' | 'disconnect' | 'restart' | 'set_status'

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM instances WHERE id = ? LIMIT 1",
      [Number(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Instância não encontrada." },
        { status: 404 }
      );
    }

    const instance = rows[0];
    let updatedStatus = instance.status;
    let message = "Ação executada com sucesso.";

    if (action === "connect") {
      updatedStatus = "connecting";
      message = "Comando de inicialização enviado. Aguardando conexão...";
      if (instance.name) {
        await connectEvolutionInstance(instance.name);
      }
    } else if (action === "disconnect") {
      updatedStatus = "disconnected";
      message = "Instância desconectada com sucesso.";
      if (instance.name) {
        await logoutEvolutionInstance(instance.name);
      }
    } else if (action === "restart") {
      updatedStatus = "connecting";
      message = "Instância reiniciando. Restabelecendo socket...";
      if (instance.name) {
        await restartEvolutionInstance(instance.name);
      }
    } else if (action === "set_status" && status) {
      updatedStatus = status;
      message = `Status da instância alterado para ${status}.`;
    }

    await pool.query<ResultSetHeader>(
      `UPDATE instances 
       SET status = ?, 
           phone_connected = CASE WHEN ? = 'disconnected' THEN NULL ELSE phone_connected END,
           profile_name = CASE WHEN ? = 'disconnected' THEN NULL ELSE profile_name END,
           profile_picture_url = CASE WHEN ? = 'disconnected' THEN NULL ELSE profile_picture_url END,
           last_activity_at = NOW() 
       WHERE id = ?`,
      [updatedStatus, updatedStatus, updatedStatus, updatedStatus, Number(id)]
    );

    return NextResponse.json({
      success: true,
      message,
      status: updatedStatus,
    });
  } catch (error: unknown) {
    console.error("Erro na rota PATCH /api/sa/instances/[id]/action:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao processar ação da instância" },
      { status: 500 }
    );
  }
}

// Suporte a POST e PATCH para compatibilidade
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context);
}
