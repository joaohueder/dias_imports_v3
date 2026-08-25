import { NextResponse } from "next/server";
import { getCurrentSaUser } from "@/lib/session";
import { hasUserPermission } from "@/lib/permissions";

/**
 * Valida a sessão do usuário e suas permissões para requisições de API no Super Admin (Server-side)
 */
export async function requireSaPermission(
  moduleId: string,
  action: "view" | "create" | "edit" | "delete" = "view"
) {
  const user = await getCurrentSaUser();

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Não autenticado ou sessão expirada" },
        { status: 401 }
      ),
      user: null,
    };
  }

  const allowed = hasUserPermission(user.role, user.permissions, moduleId, action);
  if (!allowed) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: `Acesso negado: sem permissão para '${action}' no módulo '${moduleId}'` },
        { status: 403 }
      ),
      user,
    };
  }

  return {
    authorized: true,
    response: null,
    user,
  };
}
