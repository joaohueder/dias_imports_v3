import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const evolutionUrl = process.env.EVOLUTION_API_URL?.trim();
  const evolutionApiKey = process.env.EVOLUTION_API_KEY?.trim();

  if (!evolutionUrl) {
    return NextResponse.json(
      {
        status: "offline",
        message: "Variável EVOLUTION_API_URL não configurada no ambiente (.env)",
        configured: false,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }

  const cleanUrl = evolutionUrl.replace(/\/+$/, "");
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    // Tentativa de ping no endpoint raiz ou healthcheck da Evolution API
    const res = await fetch(`${cleanUrl}/`, {
      method: "GET",
      headers: {
        ...(evolutionApiKey ? { apikey: evolutionApiKey } : {}),
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (res.ok || res.status === 401 || res.status === 403 || res.status === 200) {
      // 200, 401 ou 403 confirmam que a Evolution API está de pé e respondendo
      let responseBody: any = null;
      try {
        responseBody = await res.json();
      } catch {
        // resposta não JSON, mas online
      }

      return NextResponse.json({
        status: "online",
        url: cleanUrl,
        httpStatus: res.status,
        latencyMs,
        version: responseBody?.version || null,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      status: "degraded",
      url: cleanUrl,
      httpStatus: res.status,
      latencyMs,
      message: `Resposta inesperada HTTP ${res.status}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;
    const isAbort = error instanceof Error && error.name === "AbortError";
    const message = isAbort
      ? "Timeout de conexão (> 4s) com a Evolution API"
      : error instanceof Error
      ? error.message
      : "Falha de conexão com a Evolution API";

    return NextResponse.json(
      {
        status: "offline",
        url: cleanUrl,
        latencyMs,
        message,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
