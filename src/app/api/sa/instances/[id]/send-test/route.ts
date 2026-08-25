import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";
import { sendEvolutionText } from "@/lib/evolution";

export const dynamic = "force-dynamic";

// POST - Dispara mensagem de teste para o WhatsApp informado
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSaPermission("instances", "edit");
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const pool = getDbPool();
    const body = await request.json();

    const { number, phone, message } = body;

    let cleanNumber = String(number || phone || "").replace(/\D/g, "");
    if (!cleanNumber || cleanNumber.length < 10) {
      return NextResponse.json(
        { success: false, error: "Informe um número de WhatsApp válido com DDD." },
        { status: 400 }
      );
    }

    // Se o número nacional (com DDD) tiver 10 ou 11 dígitos sem DDI 55, adiciona 55
    if ((cleanNumber.length === 10 || cleanNumber.length === 11) && !cleanNumber.startsWith("55")) {
      cleanNumber = "55" + cleanNumber;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM instances WHERE id = ? LIMIT 1",
      [Number(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Instância não encontrada." },
        { status: 404 }
      );
    }

    const instance = rows[0];

    // Monta a mensagem de teste padrão caso não informada
    const textToSend = message?.trim() || 
      `*JH7 Marketing - Teste de Conexão*\n\nOlá! Esta é uma mensagem de teste enviada com sucesso pela instância *${instance.name}*.\n\n_Data e Hora:_ ${new Date().toLocaleString("pt-BR")}`;

    // Dispara via Evolution API v2.3.7
    const evoRes = await sendEvolutionText(instance.name, cleanNumber, textToSend);

    if (!evoRes.ok) {
      let errMsg = "Erro ao enviar mensagem pelo WhatsApp";
      if (typeof evoRes.data === "object" && evoRes.data !== null) {
        const d = evoRes.data as Record<string, unknown>;
        errMsg = (d.response as string) || (d.message as string) || (d.error as string) || JSON.stringify(d);
      } else if (typeof evoRes.data === "string") {
        errMsg = evoRes.data;
      }

      return NextResponse.json(
        { success: false, error: `Falha no envio: ${errMsg}` },
        { status: evoRes.status === 502 ? 502 : 400 }
      );
    }

    // Incrementa contagem de envios da instância
    await pool.query<ResultSetHeader>(
      `UPDATE instances 
       SET total_messages_sent = total_messages_sent + 1,
           last_activity_at = NOW()
       WHERE id = ?`,
      [Number(id)]
    );

    return NextResponse.json({
      success: true,
      message: "Mensagem de teste enviada com sucesso!",
      data: evoRes.data,
    });
  } catch (error: unknown) {
    console.error("Erro na rota POST /api/sa/instances/[id]/send-test:", error);
    const msg = error instanceof Error ? error.message : "Erro interno ao processar envio";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
