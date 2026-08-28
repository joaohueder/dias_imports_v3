import { NextRequest, NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

// POST - Testa conexão direta com a API da Meta (Graph API / CAPI)
export async function POST(request: NextRequest) {
  try {
    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const cookieStore = request.cookies;
    const impersonateCompanyId = cookieStore.get("company_id")?.value;
    const companyId = user.company_id || (impersonateCompanyId ? parseInt(impersonateCompanyId, 10) : 1);

    const body = await request.json().catch(() => ({}));
    let { meta_pixel_id, meta_pixel_access_token, meta_pixel_test_code } = body;

    // Se não foram enviados dados no body, busca do banco de dados
    if (!meta_pixel_id || !meta_pixel_access_token) {
      const pool = getDbPool();
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT meta_pixel_id, meta_pixel_access_token, meta_pixel_test_code FROM companies WHERE id = ? LIMIT 1",
        [companyId]
      );
      if (rows.length > 0) {
        meta_pixel_id = meta_pixel_id || rows[0].meta_pixel_id;
        meta_pixel_access_token = meta_pixel_access_token || rows[0].meta_pixel_access_token;
        meta_pixel_test_code = meta_pixel_test_code || rows[0].meta_pixel_test_code;
      }
    }

    if (!meta_pixel_id || !meta_pixel_id.trim()) {
      return NextResponse.json(
        { success: false, message: "O ID do Pixel do Facebook é obrigatório para testar a conexão." },
        { status: 400 }
      );
    }

    if (!meta_pixel_access_token || !meta_pixel_access_token.trim()) {
      return NextResponse.json(
        { success: false, message: "O Token de Acesso da API de Conversões é obrigatório para testar a conexão." },
        { status: 400 }
      );
    }

    const cleanPixelId = meta_pixel_id.trim();
    const cleanToken = meta_pixel_access_token.trim();

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

    // 1. Tenta validar os dados do Pixel (opcional se o token tiver permissões de leitura)
    let pixelName = cleanPixelId;
    try {
      const verifyUrl = `https://graph.facebook.com/v19.0/${cleanPixelId}?fields=id,name&access_token=${encodeURIComponent(
        cleanToken
      )}`;
      const verifyRes = await fetch(verifyUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const verifyJson = await verifyRes.json().catch(() => ({}));
      if (verifyRes.ok && verifyJson.name) {
        pixelName = `${verifyJson.name} (ID: ${cleanPixelId})`;
      }
    } catch {}

    // 2. Dispara evento de teste na Conversions API (CAPI)
    const testEventPayload: any = {
      event_name: "PageView",
      event_time: Math.floor(Date.now() / 1000),
      event_id: `test_capi_${Date.now()}`,
      event_source_url: "https://diasimports.com/teste-conexao",
      action_source: "website",
      user_data: {
        client_ip_address: clientIp,
        client_user_agent: userAgent,
      },
      custom_data: {
        status: "test_ok",
        platform: "JH7 Marketing SaaS",
      },
    };

    const capiBody: any = {
      data: [testEventPayload],
    };

    if (meta_pixel_test_code && meta_pixel_test_code.trim()) {
      capiBody.test_event_code = meta_pixel_test_code.trim();
    }

    const eventsUrl = `https://graph.facebook.com/v19.0/${cleanPixelId}/events?access_token=${encodeURIComponent(
      cleanToken
    )}`;

    const eventsRes = await fetch(eventsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(capiBody),
    });

    const eventsJson = await eventsRes.json().catch(() => ({}));

    if (!eventsRes.ok) {
      console.warn("[Meta CAPI Test Error]", eventsJson);
      const fbErrorMsg =
        eventsJson?.error?.message ||
        eventsJson?.error?.error_user_msg ||
        "Não foi possível validar o Pixel e Token junto à Meta.";

      return NextResponse.json(
        {
          success: false,
          message: `Falha na Meta API: ${fbErrorMsg}`,
          meta_error: eventsJson?.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Conexão validada com sucesso! O Pixel ${pixelName} recebeu o evento de teste e está pronto para rastrear suas conversões.`,
      pixel_name: pixelName,
      events_received: eventsJson.events_received || 1,
      fbtrace_id: eventsJson.fbtrace_id,
    });
  } catch (error: any) {
    console.error("Erro ao testar conexão Meta Ads:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro interno ao validar conexão com a Meta." },
      { status: 500 }
    );
  }
}
