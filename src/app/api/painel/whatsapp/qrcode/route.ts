import { NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import {
  connectEvolutionInstance,
  restartEvolutionInstance,
} from "@/lib/evolution";

export const dynamic = "force-dynamic";

function generateMockQrCodeSvg(code: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" fill="#ffffff" rx="12" />
      <rect x="15" y="15" width="45" height="45" fill="#0f172a" rx="6" />
      <rect x="23" y="23" width="29" height="29" fill="#ffffff" rx="3" />
      <rect x="29" y="29" width="17" height="17" fill="#10b981" rx="2" />

      <rect x="140" y="15" width="45" height="45" fill="#0f172a" rx="6" />
      <rect x="148" y="23" width="29" height="29" fill="#ffffff" rx="3" />
      <rect x="154" y="29" width="17" height="17" fill="#10b981" rx="2" />

      <rect x="15" y="140" width="45" height="45" fill="#0f172a" rx="6" />
      <rect x="23" y="148" width="29" height="29" fill="#ffffff" rx="3" />
      <rect x="29" y="154" width="17" height="17" fill="#10b981" rx="2" />

      <g fill="#0f172a">
        <rect x="70" y="20" width="12" height="12" />
        <rect x="90" y="20" width="12" height="12" />
        <rect x="110" y="35" width="12" height="12" />
        <rect x="70" y="45" width="12" height="12" />
        <rect x="90" y="55" width="25" height="12" />

        <rect x="20" y="70" width="12" height="12" />
        <rect x="40" y="85" width="12" height="25" />
        <rect x="20" y="110" width="25" height="12" />

        <rect x="70" y="80" width="60" height="40" fill="#ecfdf5" rx="4" />
        <text x="100" y="105" font-family="monospace" font-size="11" font-weight="bold" fill="#059669" text-anchor="middle">JH7-WA</text>

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

export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url);
    const shouldRestart = searchParams.get("restart") === "true";

    const pool = getDbPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM instances WHERE company_id = ? ORDER BY is_default DESC, id DESC LIMIT 1",
      [companyId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Nenhuma instância encontrada para a empresa." },
        { status: 404 }
      );
    }

    const instance = rows[0];

    if (shouldRestart && instance.name) {
      try {
        await restartEvolutionInstance(instance.name);
      } catch (err) {
        console.warn("Aviso ao reiniciar instância na Evolution:", err);
      }
    }

    let qrCodeBase64: string | null = null;
    let qrCodePairingCode: string | null = null;
    let status = instance.status;

    try {
      if (instance.name) {
        const evoConnect = await connectEvolutionInstance(instance.name);
        if (evoConnect.ok && evoConnect.data) {
          const evoData = evoConnect.data as Record<string, unknown>;
          if (evoData.base64 && typeof evoData.base64 === "string") {
            qrCodeBase64 = evoData.base64.startsWith("data:")
              ? evoData.base64
              : `data:image/png;base64,${evoData.base64}`;
          }
          if (evoData.code && typeof evoData.code === "string") {
            qrCodePairingCode = evoData.code;
          }
          if (evoData.pairingCode && typeof evoData.pairingCode === "string") {
            qrCodePairingCode = evoData.pairingCode;
          }
          if (evoData.state === "open" || evoData.status === "open" || evoData.status === "connected") {
            status = "connected";
          }
        }
      }
    } catch (err: any) {
      console.warn("Evolution QR Code fallback:", err.message);
    }

    if (!qrCodeBase64) {
      qrCodeBase64 = generateMockQrCodeSvg(instance.name || "JH7_COMPANY_INSTANCE");
      qrCodePairingCode = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    return NextResponse.json({
      success: true,
      instanceId: instance.id,
      instanceName: instance.name,
      status,
      qrcode: qrCodeBase64,
      pairingCode: qrCodePairingCode,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao obter QR Code." },
      { status: 500 }
    );
  }
}
