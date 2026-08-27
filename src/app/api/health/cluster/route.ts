import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface ClusterStatusResult {
  status: "online" | "degraded" | "offline";
  summary: {
    total: number;
    online: number;
    offline: number;
    degraded: number;
  };
  services: {
    db: { status: string; label: string };
    redis: { status: string; label: string };
    pm2: { status: string; label: string };
    evolution: { status: string; label: string };
    whatsapp: { status: string; label: string };
  };
  timestamp: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const fetchService = async (endpoint: string) => {
    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok && res.status !== 503) {
        return { status: "offline" };
      }
      return await res.json();
    } catch {
      return { status: "offline" };
    }
  };

  const [dbRes, redisRes, pm2Res, evoRes, waRes] = await Promise.all([
    fetchService("/api/health/db"),
    fetchService("/api/health/redis"),
    fetchService("/api/health/pm2"),
    fetchService("/api/health/evolution"),
    fetchService("/api/health/whatsapp-default"),
  ]);

  const isDbOnline = dbRes.status === "online";
  const isRedisOnline = redisRes.status === "online";
  const isPm2Online = pm2Res.status === "online";
  const isEvoOnline = evoRes.status === "online";
  // Para o WhatsApp padrão, conectado ou online é considerado ok; no_instance também não quebra totalmente, mas não conectado quando existe conta como instabilidade
  const isWaOnline = waRes.status === "connected" || waRes.status === "online" || waRes.isConnected === true || (waRes.status === "no_instance" && isEvoOnline);

  const services = {
    db: {
      status: isDbOnline ? "online" : "offline",
      label: isDbOnline ? "Online" : "Offline",
    },
    redis: {
      status: isRedisOnline ? "online" : "offline",
      label: isRedisOnline ? "Online" : "Offline",
    },
    pm2: {
      status: isPm2Online ? "online" : "offline",
      label: isPm2Online ? "Online" : "Offline",
    },
    evolution: {
      status: isEvoOnline ? "online" : "offline",
      label: isEvoOnline ? "Online" : "Offline",
    },
    whatsapp: {
      status: isWaOnline ? "online" : "offline",
      label: isWaOnline ? "Conectado" : "Desconectado",
    },
  };

  const serviceList = Object.values(services);
  const total = serviceList.length;
  const offlineCount = serviceList.filter((s) => s.status === "offline").length;
  const onlineCount = serviceList.filter((s) => s.status === "online").length;

  let overallStatus: "online" | "degraded" | "offline" = "online";
  if (offlineCount >= 2 || !isDbOnline) {
    overallStatus = "offline";
  } else if (offlineCount === 1) {
    overallStatus = "degraded";
  }

  return NextResponse.json({
    status: overallStatus,
    summary: {
      total,
      online: onlineCount,
      offline: offlineCount,
      degraded: overallStatus === "degraded" ? 1 : 0,
    },
    services,
    timestamp: new Date().toISOString(),
  });
}
