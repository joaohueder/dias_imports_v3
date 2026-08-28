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
  const [state, setState] = useState<ClusterState>("loading");

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/health/cluster", { cache: "no-store" });
      if (res.ok) {
        const json: ClusterData = await res.json();
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
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetchStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const config = {
    loading: {
      dotColor: "bg-slate-400 animate-pulse",
      textColor: "text-slate-400",
      label: "Sistema: Verificando...",
      borderColor: "border-slate-800",
      bgColor: "bg-slate-900/60",
      hint: "Verificando saúde geral do sistema",
    },
    online: {
      dotColor: "bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse",
      textColor: "text-emerald-300",
      label: "Sistema: Online",
      borderColor: "border-emerald-500/25",
      bgColor: "bg-emerald-500/10",
      hint: "Todos os serviços do sistema estão operando normalmente",
    },
    degraded: {
      dotColor: "bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50",
      textColor: "text-amber-300",
      label: "Sistema: Instável",
      borderColor: "border-amber-500/30",
      bgColor: "bg-amber-500/10",
      hint: "O sistema está operando com instabilidade",
    },
    offline: {
      dotColor: "bg-rose-500 animate-pulse shadow-sm shadow-rose-500/50",
      textColor: "text-rose-300",
      label: "Sistema: Offline",
      borderColor: "border-rose-500/40",
      bgColor: "bg-rose-500/15",
      hint: "Sistema indisponível",
    },
  }[state];

  return (
    <div
      title={config.hint}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all select-none ${config.bgColor} ${config.borderColor} ${config.textColor}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotColor}`} />
      <span className="whitespace-nowrap">{config.label}</span>
    </div>
  );
}
