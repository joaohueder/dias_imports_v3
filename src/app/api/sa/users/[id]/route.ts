import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { getCurrentSaUser } from "@/lib/session";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";
import { hashPassword } from "@/lib/passwords";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Retorna dados de um usuário específico
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireSaPermission("users", "view");
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    await initAuthDatabase();
    const pool = getDbPool();

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, email, whatsapp, role, permissions, status, created_at, updated_at
       FROM users
       WHERE id = ? AND role IN ('SUPER_ADMIN', 'ADMIN')
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Usuário não encontrado." }, { status: 404 });
    }

    const user = rows[0];
    return NextResponse.json({
      success: true,
      user: {
        ...user,
        permissions: typeof user.permissions === "string" ? JSON.parse(user.permissions) : user.permissions || {},
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// PUT: Atualiza usuário
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireSaPermission("users", "edit");
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    await initAuthDatabase();
    const pool = getDbPool();
    const currentUser = await getCurrentSaUser();

    const body = await request.json();
    const { name, whatsapp, password, role, permissions, status } = body;

    if (!name || !role) {
      return NextResponse.json(
        { success: false, message: "Nome e papel são obrigatórios." },
        { status: 400 }
      );
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Papel inválido para usuário do sistema SaaS." },
        { status: 400 }
      );
    }

    // Regra de segurança: Não é permitido inativar ou alterar o papel do próprio usuário logado
    const [existingTarget] = await pool.query<RowDataPacket[]>(
      "SELECT id, role, email, status FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    if (existingTarget.length === 0) {
      return NextResponse.json({ success: false, message: "Usuário não encontrado." }, { status: 404 });
    }

    const targetUser = existingTarget[0];
    if (currentUser) {
      const isSameId = Number(currentUser.id) === Number(id);
      const isSameEmail = currentUser.email.trim().toLowerCase() === targetUser.email.trim().toLowerCase();

      if (isSameId || isSameEmail) {
        if (role !== targetUser.role) {
          return NextResponse.json(
            {
              success: false,
              message: "Ação não permitida. Você não pode alterar o papel da sua própria conta de usuário.",
            },
            { status: 403 }
          );
        }

        if (status === "inactive" && targetUser.status === "active") {
          return NextResponse.json(
            {
              success: false,
              message: "Ação não permitida. Você não pode inativar sua própria conta de usuário.",
            },
            { status: 403 }
          );
        }
      }
    }

    const cleanWhatsapp = whatsapp ? String(whatsapp).trim() : null;

    // Se WhatsApp informado, verifica duplicidade
    if (cleanWhatsapp) {
      const [existingPhone] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM users WHERE whatsapp = ? AND id != ? LIMIT 1",
        [cleanWhatsapp, id]
      );
      if (existingPhone.length > 0) {
        return NextResponse.json(
          { success: false, message: "Este WhatsApp já está em uso por outro usuário." },
          { status: 409 }
        );
      }
    }

    const userPermissions = role === "SUPER_ADMIN" ? null : permissions || {};

    let query = `
      UPDATE users 
      SET name = ?, whatsapp = ?, role = ?, permissions = ?, status = ?
    `;
    const values: (string | number | null)[] = [
      name.trim(),
      cleanWhatsapp,
      role,
      userPermissions ? JSON.stringify(userPermissions) : null,
      status === "inactive" ? "inactive" : "active",
    ];

    if (password && password.trim() !== "") {
      query += `, password = ?`;
      const hashed = await hashPassword(password.trim());
      values.push(hashed);
    }

    query += ` WHERE id = ?`;
    values.push(id);

    await pool.query<ResultSetHeader>(query, values);

    return NextResponse.json({
      success: true,
      message: "Usuário atualizado com sucesso!",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// DELETE: Exclui usuário SaaS
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireSaPermission("users", "delete");
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    await initAuthDatabase();
    const pool = getDbPool();
    const currentUser = await getCurrentSaUser();

    // Impede exclusão do super admin id = 1 ou único super admin
    const [superAdmins] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE role = 'SUPER_ADMIN' AND status = 'active'"
    );

    const [userToDelete] = await pool.query<RowDataPacket[]>(
      "SELECT id, role, email FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    if (userToDelete.length === 0) {
      return NextResponse.json({ success: false, message: "Usuário não encontrado." }, { status: 404 });
    }

    const targetUser = userToDelete[0];

    // Impede exclusão do único super admin ativo caso o alvo seja SUPER_ADMIN
    if (targetUser.role === "SUPER_ADMIN" && superAdmins.length <= 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Operação não permitida. O sistema deve manter pelo menos um Super Admin ativo.",
        },
        { status: 403 }
      );
    }

    // Impede auto-exclusão apenas se o usuário logado estiver identificado e for de fato o mesmo
    if (currentUser) {
      const isSameId = Number(currentUser.id) === Number(id);
      const isSameEmail = currentUser.email.trim().toLowerCase() === targetUser.email.trim().toLowerCase();

      if (isSameId || isSameEmail) {
        return NextResponse.json(
          {
            success: false,
            message: "Ação não permitida. Você não pode excluir a sua própria conta de usuário.",
          },
          { status: 403 }
        );
      }
    }

    await pool.query("DELETE FROM users WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Usuário excluído com sucesso!",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
