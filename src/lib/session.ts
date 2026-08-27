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

  if (!token) {
    return null;
  }

  const verified = verifySessionToken(token);
  if (!verified) {
    return null;
  }

  const targetId = verified.id;
  const targetEmail = verified.email;

  const pool = getDbPool();

  try {
    const query = "SELECT id, name, email, role, status, company_id, permissions FROM users WHERE id = ? AND email = ? LIMIT 1";
    const [rows] = await pool.query<RowDataPacket[]>(query, [targetId, targetEmail]);
    if (rows.length > 0) {
      const user = rows[0];
      if (user.status !== "active") return null;
      if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") return null;

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
  }

  return null;
}

export async function getCurrentCompanyUser(): Promise<CurrentUserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("company_auth_token")?.value || cookieStore.get("sa_auth_token")?.value;

  if (!token) {
    return null;
  }

  const verified = verifySessionToken(token);
  if (!verified) {
    return null;
  }

  const targetId = verified.id;
  const targetEmail = verified.email;

  const pool = getDbPool();

  try {
    const query = "SELECT id, name, email, role, status, company_id, permissions FROM users WHERE id = ? AND email = ? LIMIT 1";
    const [rows] = await pool.query<RowDataPacket[]>(query, [targetId, targetEmail]);
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
        system_role: user.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : user.role === "ADMIN" ? "ADMIN" : null,
      };
    }
  } catch (err) {
    console.error("Erro ao buscar sessão do usuário da empresa:", err);
  }

  return null;
}

/**
 * Resolve com segurança o company_id para operações no Painel do Tenant.
 * - Usuários normais (COMPANY_ADMIN, USER): OBRIGATORIAMENTE usam user.company_id.
 * - Super Admins ou Admins globais: Podem usar cookie de impersonate se existir, senão user.company_id ou default.
 */
export async function getEffectiveCompanyId(
  user: CurrentUserSession,
  cookieStore?: { get: (name: string) => { value: string } | undefined }
): Promise<number | null> {
  const isGlobalAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.system_role === "SUPER_ADMIN";

  if (isGlobalAdmin) {
    const cookiesObj = cookieStore || (await cookies());
    const impersonateCookie = cookiesObj.get("company_id")?.value;
    if (impersonateCookie) {
      const parsed = parseInt(impersonateCookie, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return user.company_id || 1;
  }

  // Tenant/Usuário regular: sempre restrito ao seu próprio tenant
  return user.company_id || null;
}
