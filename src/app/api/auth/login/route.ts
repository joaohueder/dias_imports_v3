import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "USER";
  company_id: number | null;
  status: "active" | "inactive";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, portalType } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "E-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    try {
      await initAuthDatabase();
    } catch (dbInitErr) {
      console.error("Erro ao inicializar/verificar tabela de usuários:", dbInitErr);
      return NextResponse.json(
        {
          success: false,
          message: "Não foi possível conectar ao banco de dados para autenticação.",
        },
        { status: 503 }
      );
    }

    const db = getDbPool();

    const [rows] = await db.query<UserRow[]>(
      "SELECT id, name, email, password, role, company_id, status FROM users WHERE LOWER(email) = ? LIMIT 1",
      [cleanEmail]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Usuário ou senha incorretos." },
        { status: 401 }
      );
    }

    const user = rows[0];

    if (user.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Conta desativada. Entre em contato com o suporte." },
        { status: 403 }
      );
    }

    if (user.password !== password) {
      return NextResponse.json(
        { success: false, message: "Usuário ou senha incorretos." },
        { status: 401 }
      );
    }

    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json({
        success: true,
        role: "SUPER_ADMIN",
        redirectTo: "/sa",
        message:
          portalType === "painel"
            ? "Super Administrador identificado. Redirecionando para /sa."
            : undefined,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    if (portalType === "sa" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Acesso negado. Esta conta não possui privilégios de Super Administrador.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      role: user.role,
      redirectTo: "/painel",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no processamento de login:", message);
    return NextResponse.json(
      { success: false, message: "Erro interno no processamento do login." },
      { status: 500 }
    );
  }
}
