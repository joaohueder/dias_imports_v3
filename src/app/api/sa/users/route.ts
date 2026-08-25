import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";

export const dynamic = "force-dynamic";

// GET: Lista usuários do sistema SaaS (SUPER_ADMIN e ADMIN)
export async function GET(request: Request) {
  try {
    const auth = await requireSaPermission("users", "view");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const pool = getDbPool();

    // Executa migration automática da coluna permissions caso ainda não tenha rodado
    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN permissions JSON NULL AFTER role;
      `);
    } catch {
      // Já existe a coluna
    }

    try {
      await pool.query(`
        ALTER TABLE users MODIFY COLUMN role ENUM('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'USER') NOT NULL DEFAULT 'ADMIN';
      `);
    } catch {
      // Já modificado
    }

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role");
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search");

    let query = `
      SELECT 
        id, 
        name, 
        email, 
        whatsapp, 
        role, 
        permissions, 
        status, 
        created_at, 
        updated_at
      FROM users
      WHERE role IN ('SUPER_ADMIN', 'ADMIN')
    `;

    const params: (string | number)[] = [];

    if (roleFilter && (roleFilter === "SUPER_ADMIN" || roleFilter === "ADMIN")) {
      query += ` AND role = ?`;
      params.push(roleFilter);
    }

    if (statusFilter && (statusFilter === "active" || statusFilter === "inactive")) {
      query += ` AND status = ?`;
      params.push(statusFilter);
    }

    if (search && search.trim() !== "") {
      query += ` AND (name LIKE ? OR email LIKE ? OR whatsapp LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY role ASC, name ASC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({
      success: true,
      users: rows.map((u) => ({
        ...u,
        permissions: typeof u.permissions === "string" ? JSON.parse(u.permissions) : u.permissions || {},
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// POST: Cria um novo usuário SaaS (SUPER_ADMIN ou ADMIN)
export async function POST(request: Request) {
  try {
    const auth = await requireSaPermission("users", "create");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const pool = getDbPool();

    const body = await request.json();
    const { name, email, whatsapp, password, role, permissions, status } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: "Nome, e-mail, senha e papel são obrigatórios." },
        { status: 400 }
      );
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { success: false, message: "O papel do usuário SaaS deve ser 'SUPER_ADMIN' ou 'ADMIN'." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanWhatsapp = whatsapp ? String(whatsapp).trim() : null;

    // Verifica unicidade de email
    const [existingEmail] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1",
      [cleanEmail]
    );

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { success: false, message: "Já existe um usuário com este e-mail cadastrado." },
        { status: 409 }
      );
    }

    // Se WhatsApp informado, verifica unicidade
    if (cleanWhatsapp) {
      const [existingPhone] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM users WHERE whatsapp = ? LIMIT 1",
        [cleanWhatsapp]
      );
      if (existingPhone.length > 0) {
        return NextResponse.json(
          { success: false, message: "Já existe um usuário com este WhatsApp cadastrado." },
          { status: 409 }
        );
      }
    }

    const userPermissions = role === "SUPER_ADMIN" ? null : permissions || {};

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (name, email, whatsapp, password, role, permissions, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        cleanEmail,
        cleanWhatsapp,
        password.trim(),
        role,
        userPermissions ? JSON.stringify(userPermissions) : null,
        status === "inactive" ? "inactive" : "active",
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Usuário cadastrado com sucesso!",
      userId: result.insertId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
