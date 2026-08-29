import crypto from "crypto";
import { cookies } from "next/headers";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL SECURITY ERROR: SESSION_SECRET is not configured in production environment.");
    }
    return "jh7_super_secure_session_secret_key_2026_marketing_dev_only";
  }
  return secret;
}

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
  const secret = getSessionSecret();
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): { id: number; email: string; role: string } | null {
  try {
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;

    const secret = getSessionSecret();
    const expectedSignature = crypto.createHmac("sha256", secret).update(data).digest("base64url");
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
  const rawUserId = cookieStore.get("sa_user_id")?.value;
  const rawUserEmail = cookieStore.get("sa_user_email")?.value;

  const pool = getDbPool();

  let targetId: number | null = null;
  let targetEmail: string | null = null;

  if (token) {
    const verified = verifySessionToken(token);
    if (verified) {
      targetId = verified.id;
      targetEmail = verified.email;
    }
  }

  // Recuperação resiliente caso o token HMAC falhe ou cookies de transição estejam ativos
  if (!targetId && rawUserId) {
    const parsedId = parseInt(rawUserId, 10);
    if (!isNaN(parsedId)) {
      targetId = parsedId;
    }
  }

  if (!targetEmail && rawUserEmail) {
    targetEmail = decodeURIComponent(rawUserEmail).trim().toLowerCase();
  }

  if (!targetId && !targetEmail) {
    return null;
  }

  try {
    let query = "SELECT id, name, email, role, status, company_id, permissions FROM users WHERE ";
    const params: (string | number)[] = [];

    if (targetId && targetEmail) {
      query += "id = ? AND email = ? LIMIT 1";
      params.push(targetId, targetEmail);
    } else if (targetId) {
      query += "id = ? LIMIT 1";
      params.push(targetId);
    } else if (targetEmail) {
      query += "email = ? LIMIT 1";
      params.push(targetEmail);
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
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
        system_role: user.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
      };
    }
  } catch (err) {
    console.error("Erro ao buscar sessão do usuário SA:", err);
  }

  return null;
}

export async function getCurrentCompanyUser(): Promise<CurrentUserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("company_auth_token")?.value || cookieStore.get("sa_auth_token")?.value;
  const rawUserId = cookieStore.get("company_user_id")?.value || cookieStore.get("sa_user_id")?.value;
  const rawCompanyId = cookieStore.get("company_id")?.value;

  if (!token) {
    // Se houver cookie de ID de usuário ou company_id em ambiente de desenvolvimento/transição
    if (rawUserId) {
      const parsedId = parseInt(rawUserId, 10);
      if (!isNaN(parsedId)) {
        try {
          const pool = getDbPool();
          const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id, name, email, role, status, company_id, permissions FROM users WHERE id = ? LIMIT 1",
            [parsedId]
          );
          if (rows.length > 0 && rows[0].status === "active") {
            const user = rows[0];
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
              company_id: user.company_id || (rawCompanyId ? parseInt(rawCompanyId, 10) : 1),
              permissions,
              system_role: user.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : user.role === "ADMIN" ? "ADMIN" : null,
            };
          }
        } catch {}
      }
    }
    return null;
  }

  const verified = verifySessionToken(token);
  if (!verified) {
    // Se o token HMAC falhou (ex: segredo reiniciado), tenta recuperar pelo cookie company_user_id / sa_user_id
    if (rawUserId) {
      const parsedId = parseInt(rawUserId, 10);
      if (!isNaN(parsedId)) {
        try {
          const pool = getDbPool();
          const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id, name, email, role, status, company_id, permissions FROM users WHERE id = ? LIMIT 1",
            [parsedId]
          );
          if (rows.length > 0 && rows[0].status === "active") {
            const user = rows[0];
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
              company_id: user.company_id || (rawCompanyId ? parseInt(rawCompanyId, 10) : 1),
              permissions,
              system_role: user.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : user.role === "ADMIN" ? "ADMIN" : null,
            };
          }
        } catch {}
      }
    }
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

    // Se o token for válido e corresponder a um login/impersonação mesmo sem usuário físico
    if (verified.id && verified.email) {
      const isSa = verified.role === "SUPER_ADMIN" || verified.role === "ADMIN";
      const userCompanyId = (verified as any).company_id || (rawCompanyId ? parseInt(rawCompanyId, 10) : null);
      return {
        id: verified.id,
        name: verified.email.split("@")[0] || "Administrador",
        email: verified.email,
        role: (verified.role as any) || "COMPANY_ADMIN",
        company_id: userCompanyId,
        permissions: null,
        system_role: isSa ? (verified.role as any) : null,
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
  const cookiesObj = cookieStore || (await cookies());
  const impersonateCookie = cookiesObj.get("company_id")?.value;
  const isImpersonating = cookiesObj.get("impersonate_by_sa")?.value === "1";
  const isGlobalAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.system_role === "SUPER_ADMIN" || isImpersonating;

  if (isGlobalAdmin && impersonateCookie) {
    const parsed = parseInt(impersonateCookie, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  if (user.company_id) {
    return user.company_id;
  }

  if (impersonateCookie) {
    const parsed = parseInt(impersonateCookie, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  if (isGlobalAdmin) {
    return 1;
  }

  return null;
}
