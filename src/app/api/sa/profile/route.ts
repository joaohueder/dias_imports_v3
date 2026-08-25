import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

// GET - Obter perfil do Super Admin logado
export async function GET() {
  try {
    try {
      await initAuthDatabase();
    } catch (dbInitErr) {
      console.warn("Aviso ao inicializar DB no profile GET:", dbInitErr);
    }

    const email = "joaohueder@gmail.com";

    try {
      const pool = getDbPool();
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT id, name, email, whatsapp, role, status, created_at, updated_at FROM users WHERE email = ? LIMIT 1",
        [email]
      );

      if (rows.length > 0) {
        return NextResponse.json({
          success: true,
          user: rows[0],
        });
      }
    } catch (queryErr) {
      console.warn("Aviso ao consultar usuário no banco, retornando fallback seguro:", queryErr);
    }

    // Fallback padrão se não houver conexão com o banco
    return NextResponse.json({
      success: true,
      user: {
        id: 1,
        name: "João Hueder",
        email: "joaohueder@gmail.com",
        whatsapp: "",
        role: "SUPER_ADMIN",
        status: "active",
        created_at: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao carregar perfil";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT - Atualizar perfil do Super Admin (Nome, WhatsApp, Senha)
export async function PUT(request: Request) {
  try {
    try {
      await initAuthDatabase();
    } catch (dbInitErr) {
      console.warn("Aviso ao inicializar DB no profile PUT:", dbInitErr);
    }

    const pool = getDbPool();
    const body = await request.json();

    const {
      name,
      whatsapp,
      currentPassword,
      newPassword,
      confirmNewPassword,
    } = body;

    const email = "joaohueder@gmail.com";

    if (!name || name.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Nome completo deve ter no mínimo 3 caracteres." },
        { status: 400 }
      );
    }

    // 1. Obter usuário atual no banco
    let userId: number | null = null;
    let storedPassword = "123456";

    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT id, password FROM users WHERE email = ? LIMIT 1",
        [email]
      );

      if (rows.length > 0) {
        userId = rows[0].id;
        storedPassword = rows[0].password;
      }
    } catch (findErr) {
      console.warn("Aviso ao buscar usuário para update:", findErr);
    }

    // 2. Se informou intenção de alterar senha
    let passwordToUpdate = storedPassword;
    if (newPassword || currentPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Informe sua senha atual para alterar a senha de acesso." },
          { status: 400 }
        );
      }

      if (currentPassword !== storedPassword) {
        return NextResponse.json(
          { success: false, error: "Senha atual incorreta." },
          { status: 401 }
        );
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "A nova senha deve ter no mínimo 6 caracteres." },
          { status: 400 }
        );
      }

      if (newPassword !== confirmNewPassword) {
        return NextResponse.json(
          { success: false, error: "A confirmação da nova senha não confere." },
          { status: 400 }
        );
      }

      passwordToUpdate = newPassword;
    }

    // 3. Validação de WhatsApp único se informado
    const cleanWhatsapp = whatsapp ? whatsapp.replace(/\D/g, "") : null;
    if (cleanWhatsapp && cleanWhatsapp.length >= 10) {
      try {
        const [waExists] = await pool.query<RowDataPacket[]>(
          "SELECT id FROM users WHERE whatsapp = ? AND email != ? LIMIT 1",
          [whatsapp, email]
        );
        if (waExists.length > 0) {
          return NextResponse.json(
            { success: false, error: "Este número de WhatsApp já está vinculado a outro usuário." },
            { status: 409 }
          );
        }
      } catch (waErr) {
        console.warn("Aviso ao checar unicidade de WhatsApp:", waErr);
      }
    }

    // 4. Salvar no banco (Insert se não existir ou Update)
    if (userId) {
      // Tentar atualizar com a coluna whatsapp. Se ela ainda não existir na migration antiga, atualiza com fallback.
      try {
        await pool.query<ResultSetHeader>(
          "UPDATE users SET name = ?, whatsapp = ?, password = ?, updated_at = NOW() WHERE id = ?",
          [name.trim(), whatsapp || null, passwordToUpdate, userId]
        );
      } catch (updateErr: unknown) {
        const sqlMsg = updateErr instanceof Error ? updateErr.message : "";
        if (sqlMsg.includes("Unknown column 'whatsapp'")) {
          await pool.query<ResultSetHeader>(
            "UPDATE users SET name = ?, password = ?, updated_at = NOW() WHERE id = ?",
            [name.trim(), passwordToUpdate, userId]
          );
        } else {
          throw updateErr;
        }
      }
    } else {
      try {
        await pool.query<ResultSetHeader>(
          "INSERT INTO users (name, email, whatsapp, password, role, status) VALUES (?, ?, ?, ?, 'SUPER_ADMIN', 'active')",
          [name.trim(), email, whatsapp || null, passwordToUpdate]
        );
      } catch (insertErr: unknown) {
        const sqlMsg = insertErr instanceof Error ? insertErr.message : "";
        if (sqlMsg.includes("Unknown column 'whatsapp'")) {
          await pool.query<ResultSetHeader>(
            "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'SUPER_ADMIN', 'active')",
            [name.trim(), email, passwordToUpdate]
          );
        } else {
          throw insertErr;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso!",
      user: {
        name: name.trim(),
        email,
        whatsapp,
        role: "SUPER_ADMIN",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar perfil";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
