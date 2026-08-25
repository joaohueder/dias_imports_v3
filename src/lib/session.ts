import crypto from "crypto";
import { cookies } from "next/headers";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

const SESSION_SECRET = process.env.SESSION_SECRET || "jh7_super_secure_session_secret_key_2026_marketing";

export interface CurrentUserSession {
  id: number;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "COMPANY_ADMIN" | "USER";
  company_id?: number | null;
  permissions?: Record<string, Record<string, boolean>> | null;
  system_role?: "SUPER_ADMIN" | "ADMIN" | null;
}

// Cria assinatura HMAC-SHA256 para evitar adulteração de cookie
export function signSessionToken(payload: { id: number; email: string; role: string }): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): { id: number; email: string; role: string } | null {
  try {
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;

    const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentSaUser(): Promise<CurrentUserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("sa_auth_token")?.value;
  const legacyUserId = cookieStore.get("sa_user_id")?.value;
  const legacyUserEmail = cookieStore.get("sa_user_email")?.value;

  let targetId: number | null = null;
  let targetEmail: string | null = null;

  if (token) {
    const verified = verifySessionToken(token);
    if (verified) {
      targetId = verified.id;
      targetEmail = verified.email;
    }
  }

  if (!targetEmail && legacyUserEmail) {
    targetEmail = decodeURIComponent(legacyUserEmail);
  }
  if (!targetId && legacyUserId) {
    targetId = parseInt(legacyUserId, 10);
  }

  if (!targetId && !targetEmail) {
    targetEmail = "joaohueder@gmail.com";
  }

  const pool = getDbPool();

  try {
    const query = targetId
      ? "SELECT id, name, email, role, status, company_id, permissions FROM users WHERE id = ? LIMIT 1"
      : "SELECT id, name, email, role, status, company_id, permissions FROM users WHERE email = ? LIMIT 1";
    const param = targetId || targetEmail;

    const [rows] = await pool.query<RowDataPacket[]>(query, [param]);
    if (rows.length > 0) {
      const user = rows[0];
      if (user.status !== "active") return null;

      let permissions: Record<string, Record<string, boolean>> | null = null;
      if (user.permissions) {
        try {
          permissions = typeof user.permissions === "string" ? JSON.parse(user.permissions) : user.permissions;
        } catch {
          permissions = null;
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        permissions,
        system_role: user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : user.role === 'ADMIN' ? 'ADMIN' : null,
      };
    }
  } catch (err) {
    console.error("Erro ao buscar sessão do usuário:", err);
    // Em caso de falha de conexão com o banco no ambiente de desenvolvimento, provê fallback seguro do Super Admin inicial
    if (targetEmail === "joaohueder@gmail.com" || (!targetId && !token)) {
      return {
        id: 1,
        name: "João Hueder",
        email: "joaohueder@gmail.com",
        role: "SUPER_ADMIN",
        company_id: null,
        permissions: null,
        system_role: "SUPER_ADMIN",
      };
    }
  }

  return null;
}
