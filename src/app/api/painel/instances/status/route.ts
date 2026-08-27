import { NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const impersonateCompanyId = cookieStore.get("company_id")?.value;

    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Não autorizado." },
        { status: 401 }
      );
    }

    const pool = getDbPool();
    const companyId = user.company_id || (impersonateCompanyId ? parseInt(impersonateCompanyId, 10) : 1);

    // Busca instâncias da empresa específica
    const [instances] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, whatsapp_number, status, phone_connected, profile_name, 
              profile_picture_url, is_default, total_messages_sent, total_messages_received, updated_at
       FROM instances 
       WHERE company_id = ?
       ORDER BY is_default DESC, id DESC`,
      [companyId]
    );

    const totalInstances = instances.length;
    const connectedInstances = instances.filter((i) => i.status === "connected");
    const primaryInstance = connectedInstances.length > 0 ? connectedInstances[0] : (instances.length > 0 ? instances[0] : null);

    return NextResponse.json({
      success: true,
      company_id: companyId,
      total_instances: totalInstances,
      connected_instances: connectedInstances.length,
      status: connectedInstances.length > 0 ? "connected" : (totalInstances > 0 ? "disconnected" : "no_instance"),
      primaryInstance,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao checar status de instâncias da empresa";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
