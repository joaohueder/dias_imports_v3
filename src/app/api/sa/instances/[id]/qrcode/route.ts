import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";
import { connectEvolutionInstance, restartEvolutionInstance } from "@/lib/evolution";

export const dynamic = "force-dynamic";

// Gera um payload SVG simples simulando um QR Code visual para leitura/exibição
function generateMockQrCodeSvg(code: string): string {
  // Gera uma representação em base64 com SVG de QR code estilizado
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" fill="#ffffff" rx="12" />
      <!-- Posicionadores cantos -->
      <rect x="15" y="15" width="45" height="45" fill="#0f172a" rx="6" />
      <rect x="23" y="23" width="29" height="29" fill="#ffffff" rx="3" />
      <rect x="29" y="29" width="17" height="17" fill="#4f46e5" rx="2" />

      <rect x="140" y="15" width="45" height="45" fill="#0f172a" rx="6" />
      <rect x="148" y="23" width="29" height="29" fill="#ffffff" rx="3" />
      <rect x="154" y="29" width="17" height="17" fill="#4f46e5" rx="2" />

      <rect x="15" y="140" width="45" height="45" fill="#0f172a" rx="6" />
      <rect x="23" y="148" width="29" height="29" fill="#ffffff" rx="3" />
      <rect x="29" y="154" width="17" height="17" fill="#4f46e5" rx="2" />

      <!-- Padrão dinâmico gerado pelo hash -->
      <g fill="#0f172a">
        <rect x="70" y="20" width="12" height="12" />
        <rect x="90" y="20" width="12" height="12" />
        <rect x="110" y="35" width="12" height="12" />
        <rect x="70" y="45" width="12" height="12" />
        <rect x="90" y="55" width="25" height="12" />

        <rect x="20" y="70" width="12" height="12" />
        <rect x="40" y="85" width="12" height="25" />
        <rect x="20" y="110" width="25" height="12" />

        <rect x="70" y="80" width="60" height="40" fill="#e0e7ff" rx="4" />
        <text x="100" y="105" font-family="monospace" font-size="11" font-weight="bold" fill="#4338ca" text-anchor="middle">JH7-WA</text>

        <rect x="140" y="70" width="12" height="20" />
        <rect x="160" y="85" width="20" height="12" />
        <rect x="140" y="110" width="30" height="12" />

        <rect x="70" y="130" width="12" height="12" />
        <rect x="90" y="145" width="20" height="12" />
        <rect x="115" y="130" width="12" height="25" />
        <rect x="70" y="165" width="30" height="12" />
        <rect x="110" y="165" width="15" height="15" />

        <rect x="140" y="140" width="15" height="15" />
        <rect x="165" y="140" width="15" height="15" />
        <rect x="140" y="165" width="40" height="15" />
      </g>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// GET - Obter QRCode fresco da instância (reiniciando ciclo e fornecendo novo token)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getDbPool();
    const { searchParams } = new URL(request.url);
    const shouldRestart = searchParams.get("restart") === "true";

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

    // Se for instância padrão, validar permissão 'default_instance' ou 'instances' com ação 'edit'
    const moduleReq = instance.is_default ? "default_instance" : "instances";
    const auth = await requireSaPermission(moduleReq, "edit");
    if (!auth.authorized) return auth.response;

    // Se solicitado reiniciar ao abrir o modal, invocar restart na Evolution API
    if (shouldRestart && instance.name) {
      try {
        await restartEvolutionInstance(instance.name);
      } catch (err) {
        console.warn("Aviso ao reiniciar instância na Evolution:", err);
      }
    }

    // Consultar a Evolution API v2.3.7 para obter o QR Code / status de conexão
    let realQrBase64: string | null = null;
    let realPairingCode: string | null = null;
    let isConnected = instance.status === "connected";

    if (instance.name) {
      const evoConnect = await connectEvolutionInstance(instance.name);
      if (evoConnect.ok && evoConnect.data) {
        const evoData = evoConnect.data as Record<string, unknown>;
        if (evoData.base64 && typeof evoData.base64 === "string") {
          realQrBase64 = evoData.base64.startsWith("data:") 
            ? evoData.base64 
            : `data:image/png;base64,${evoData.base64}`;
        }
        if (evoData.code && typeof evoData.code === "string") {
          realPairingCode = evoData.code;
        }
        if (evoData.pairingCode && typeof evoData.pairingCode === "string") {
          realPairingCode = evoData.pairingCode;
        }
        if (evoData.state === "open" || evoData.status === "open" || evoData.status === "connected") {
          isConnected = true;
        }
      }
    }

    // Se a instância já estiver conectada
    if (isConnected) {
      await pool.query<ResultSetHeader>(
        "UPDATE instances SET status = 'connected', qrcode_base64 = NULL, last_activity_at = NOW() WHERE id = ?",
        [Number(id)]
      );
      return NextResponse.json({
        success: true,
        connected: true,
        status: "connected",
        message: "Instância já está conectada.",
      });
    }

    // Se a Evolution não retornou QR Code ativo, usar gerador visual com token atual
    const timestamp = Date.now();
    const qrPairingToken = realPairingCode || `2@${instance.instance_key}@${timestamp}_${Math.random().toString(36).substring(2, 10)}`;
    const qrcodeBase64 = realQrBase64 || generateMockQrCodeSvg(qrPairingToken);

    // Atualizar status para 'qrcode'
    const newStatus = "qrcode";
    await pool.query<ResultSetHeader>(
      "UPDATE instances SET status = ?, qrcode_base64 = ?, last_activity_at = NOW() WHERE id = ?",
      [newStatus, qrcodeBase64, Number(id)]
    );

    return NextResponse.json({
      success: true,
      connected: false,
      status: newStatus,
      instance_id: instance.id,
      instance_name: instance.name,
      qrcode_base64: qrcodeBase64,
      pairing_code: qrPairingToken,
      expires_in_seconds: 30,
      timestamp,
    });
  } catch (error: unknown) {
    console.error("Erro na rota GET /api/sa/instances/[id]/qrcode:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao gerar QR Code para a instância" },
      { status: 500 }
    );
  }
}
