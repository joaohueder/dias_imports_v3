import { NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import {
  restartEvolutionInstance,
  logoutEvolutionInstance,
} from "@/lib/evolution";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const impersonateCompanyId = cookieStore.get("company_id")?.value;

    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado." }, { status: 401 });
    }

    const companyId = user.company_id || (impersonateCompanyId ? parseInt(impersonateCompanyId, 10) : 1);
    const body = await request.json();
    const { action } = body;

    const pool = getDbPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM instances WHERE company_id = ? ORDER BY is_default DESC, id DESC LIMIT 1",
      [companyId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Instância não encontrada." }, { status: 404 });
    }

    const instance = rows[0];

    // Reiniciar Sessão
    if (action === "restart") {
      try {
        await restartEvolutionInstance(instance.name);
      } catch (err: any) {
        console.warn("Erro ao reiniciar:", err.message);
      }
      await pool.query("UPDATE instances SET status = 'connecting', updated_at = NOW() WHERE id = ?", [instance.id]);
      return NextResponse.json({ success: true, message: "Instância reiniciada com sucesso." });
    }

    // Desconectar WhatsApp (Logout de sessão para permitir nova conexão/troca de chip)
    if (action === "disconnect") {
      try {
        await logoutEvolutionInstance(instance.name);
      } catch (err: any) {
        console.warn("Erro ao desconectar:", err.message);
      }
      await pool.query(
        "UPDATE instances SET status = 'disconnected', phone_connected = NULL, updated_at = NOW() WHERE id = ?",
        [instance.id]
      );
      return NextResponse.json({ success: true, message: "WhatsApp desconectado com sucesso." });
    }

    // A empresa não tem permissão para deletar a instância (apenas o Super Admin no painel /sa)
    if (action === "delete") {
      return NextResponse.json(
        { success: false, message: "A remoção de instâncias é restrita à administração da plataforma (Super Admin)." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: false, message: "Ação inválida." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao processar ação." },
      { status: 500 }
    );
  }
}
