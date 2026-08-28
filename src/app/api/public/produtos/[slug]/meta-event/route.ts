import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function hashSha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

// POST - Envia eventos para a Meta Conversions API (CAPI) do lado do servidor
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json().catch(() => ({}));
    const { event_name = "PageView", event_source_url, user_data = {} } = body;

    const pool = getDbPool();

    // 1. Busca dados do produto e dados de Meta Ads da empresa
    const isId = /^\d+$/.test(slug);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.id, p.name, p.price, p.promo_price, p.company_id,
              c.meta_pixel_id, c.meta_pixel_access_token, c.meta_pixel_test_code, c.meta_pixel_active
       FROM company_products p
       JOIN companies c ON c.id = p.company_id
       WHERE ${isId ? "p.id = ?" : "p.slug = ?"} AND p.status = 'active'
       LIMIT 1`,
      [slug]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Produto não encontrado" }, { status: 404 });
    }

    const item = rows[0];

    // Se o rastreamento estiver desativado ou sem pixel/token, apenas responde ok sem disparar
    if (!item.meta_pixel_active || !item.meta_pixel_id || !item.meta_pixel_access_token) {
      return NextResponse.json({ success: true, tracked: false, reason: "Meta Ads não configurado ou inativo" });
    }

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "";
    const userAgent = request.headers.get("user-agent") || "";

    const eventTime = Math.floor(Date.now() / 1000);
    const eventId = `${event_name}_${item.id}_${eventTime}_${Math.random().toString(36).substring(2, 8)}`;

    const effectivePrice = item.promo_price !== null && item.promo_price !== undefined ? Number(item.promo_price) : Number(item.price) || 0;

    const payloadData: any = {
      event_name: event_name,
      event_time: eventTime,
      event_id: eventId,
      event_source_url: event_source_url || "",
      action_source: "website",
      user_data: {
        client_ip_address: clientIp || undefined,
        client_user_agent: userAgent || undefined,
        ...(user_data.em ? { em: [hashSha256(user_data.em)] } : {}),
        ...(user_data.ph ? { ph: [hashSha256(user_data.ph.replace(/\D/g, ""))] } : {}),
      },
      custom_data: {
        content_name: item.name,
        content_ids: [String(item.id)],
        content_type: "product",
        value: effectivePrice,
        currency: "BRL",
      },
    };

    const graphUrl = `https://graph.facebook.com/v19.0/${item.meta_pixel_id}/events?access_token=${encodeURIComponent(item.meta_pixel_access_token)}`;

    const capiBody: any = {
      data: [payloadData],
    };

    if (item.meta_pixel_test_code) {
      capiBody.test_event_code = item.meta_pixel_test_code;
    }

    // Disparo assíncrono para a Meta Graph API
    fetch(graphUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(capiBody),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errText = await res.text();
          console.warn("[Meta CAPI Error]", errText);
        }
      })
      .catch((err) => {
        console.warn("[Meta CAPI Network Error]", err);
      });

    return NextResponse.json({
      success: true,
      tracked: true,
      event_name,
      event_id: eventId,
    });
  } catch (error: any) {
    console.error("Erro na rota Meta CAPI:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
