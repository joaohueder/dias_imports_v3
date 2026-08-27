import { NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { sendEvolutionText } from "@/lib/evolution";

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
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json({ success: false, message: "Número e mensagem são obrigatórios." }, { status: 400 });
    }

    const pool = getDbPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM instances WHERE company_id = ? AND status = 'connected' LIMIT 1",
      [companyId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Nenhuma instância conectada encontrada para enviar mensagem de teste. Conecte seu WhatsApp primeiro." },
        { status: 400 }
      );
    }

    const instance = rows[0];
    let cleanPhone = phone.replace(/\D/g, "");

    // Garante DDI 55 caso o número seja informado apenas com DDD (10 ou 11 dígitos)
    if ((cleanPhone.length === 10 || cleanPhone.length === 11) && !cleanPhone.startsWith("55")) {
      cleanPhone = "55" + cleanPhone;
    }

    const evoRes = await sendEvolutionText(instance.name, cleanPhone, message);

    if (!evoRes.ok) {
      let errMsg = "Erro ao enviar mensagem pelo WhatsApp";
      if (typeof evoRes.data === "object" && evoRes.data !== null) {
        const d = evoRes.data as Record<string, unknown>;
        errMsg = (d.response as string) || (d.message as string) || (d.error as string) || JSON.stringify(d);
      } else if (typeof evoRes.data === "string") {
        errMsg = evoRes.data;
      }

      return NextResponse.json(
        { success: false, message: `Falha no envio pela Evolution API: ${errMsg}` },
        { status: 400 }
      );
    }

    await pool.query(
      "UPDATE instances SET total_messages_sent = total_messages_sent + 1, last_activity_at = NOW() WHERE id = ?",
      [instance.id]
    );

    return NextResponse.json({
      success: true,
      message: "Mensagem de teste enviada com sucesso!",
      response: evoRes.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao enviar mensagem de teste." },
      { status: 500 }
    );
  }
}
