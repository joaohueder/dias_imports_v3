import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { getCurrentSaUser } from "@/lib/session";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireSaPermission("users", "edit");
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    await initAuthDatabase();
    const pool = getDbPool();
    const currentUser = await getCurrentSaUser();

    const body = await request.json();
    const { status } = body;

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json({ success: false, message: "Status inválido." }, { status: 400 });
    }

    const [targetRows] = await pool.query<RowDataPacket[]>(
      "SELECT id, role, email, status FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    if (targetRows.length === 0) {
      return NextResponse.json({ success: false, message: "Usuário não encontrado." }, { status: 404 });
    }

    const targetUser = targetRows[0];
    if (currentUser && status === "inactive") {
      const isSameId = Number(currentUser.id) === Number(id);
      const isSameEmail = currentUser.email.trim().toLowerCase() === targetUser.email.trim().toLowerCase();

      if (isSameId || isSameEmail) {
        return NextResponse.json(
          {
            success: false,
            message: "Ação não permitida. Você não pode inativar a sua própria conta de usuário.",
          },
          { status: 403 }
        );
      }
    }

    // Se for inativar super admin, verifica se não é o único ativo
    if (status === "inactive") {
      const [superAdmins] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM users WHERE role = 'SUPER_ADMIN' AND status = 'active'"
      );
      if (targetUser.role === "SUPER_ADMIN" && superAdmins.length <= 1) {
        return NextResponse.json(
          {
            success: false,
            message: "Não é possível inativar o único Super Admin ativo do sistema.",
          },
          { status: 403 }
        );
      }
    }

    await pool.query<ResultSetHeader>("UPDATE users SET status = ? WHERE id = ?", [status, id]);

    return NextResponse.json({
      success: true,
      message: `Usuário ${status === "active" ? "ativado" : "inativado"} com sucesso!`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
