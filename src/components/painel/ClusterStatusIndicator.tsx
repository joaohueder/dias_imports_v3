"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, XCircle } from "lucide-react";

type ClusterState = "loading" | "online" | "degraded" | "offline";

interface ServiceDetail {
  status: string;
  label: string;
}

interface ClusterData {
  status: "online" | "degraded" | "offline";
  summary: {
    total: number;
    online: number;
    offline: number;
    degraded: number;
  };
  services: {
    db: ServiceDetail;
    redis: ServiceDetail;
    pm2: ServiceDetail;
    evolution: ServiceDetail;
    whatsapp: ServiceDetail;
  };
}

export function ClusterStatusIndicator() {
  const [clusterData, setClusterData] = useState<ClusterData | null>(null);
  const [state, setState] = useState<ClusterState>("loading");
  const [showTooltip, setShowTooltip] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/health/cluster", { cache: "no-store" });
      if (res.ok) {
        const json: ClusterData = await res.json();
        setClusterData(json);
        setState(json.status);
      } else {
        setState("degraded");
      }
    } catch {
      setState("offline");
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 20000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const config = {
    loading: {
      dotColor: "bg-slate-400 animate-pulse",
      textColor: "text-slate-400",
      label: "Verificando...",
      borderColor: "border-slate-800",
      bgColor: "bg-slate-900/60",
    },
    online: {
      dotColor: "bg-emerald-500 shadow-sm shadow-emerald-500/50",
      textColor: "text-emerald-300",
      label: "Cluster Operacional",
      borderColor: "border-emerald-500/20",
      bgColor: "bg-emerald-500/5",
    },
    degraded: {
      dotColor: "bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50",
      textColor: "text-amber-300",
      label: "Instabilidade no Cluster",
      borderColor: "border-amber-500/30",
      bgColor: "bg-amber-500/10",
    },
    offline: {
      dotColor: "bg-rose-500 animate-pulse shadow-sm shadow-rose-500/50",
      textColor: "text-rose-300",
      label: "Falha Geral no Cluster",
      borderColor: "border-rose-500/40",
      bgColor: "bg-rose-500/15",
    },
  }[state];

  const servicesNames: Record<string, string> = {
    db: "Banco de Dados (MySQL)",
    redis: "Fila & Cache (Redis)",
    pm2: "Gerenciador (PM2)",
    evolution: "Evolution API",
    whatsapp: "WhatsApp Principal",
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none ${config.bgColor} ${config.borderColor} ${config.textColor}`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotColor}`} />
        <span className="whitespace-nowrap">{config.label}</span>
      </div>

      {/* TOOLTIP / POPOVER INFORMATIVO DOS SERVIÇOS */}
      {showTooltip && clusterData && (
        <div className="absolute bottom-full right-0 mb-2 w-64 rounded-2xl bg-[#0b1222] border border-slate-800 shadow-2xl shadow-black/80 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Saúde da Infraestrutura
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {clusterData.summary.online}/{clusterData.summary.total} OK
            </span>
          </div>

          <div className="space-y-1.5">
            {Object.entries(clusterData.services).map(([key, item]) => {
              const isOk = item.status === "online";
              return (
                <div
                  key={key}
                  className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-900/60 border border-slate-800/60"
                >
                  <span className="text-[11px] text-slate-300">
                    {servicesNames[key] || key}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOk ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-bold ${
                        isOk ? "text-emerald-300" : "text-rose-400"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {state !== "online" && (
            <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] leading-tight">
              {state === "degraded"
                ? "Algum serviço essencial está fora do ar. A operação pode sofrer lentidão ou instabilidade."
                : "Múltiplos serviços críticos estão offline. Verifique os servidores ou contate o suporte."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
