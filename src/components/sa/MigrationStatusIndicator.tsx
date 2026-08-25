"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, AlertTriangle, ArrowRight } from "lucide-react";

export function MigrationStatusIndicator() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Apenas renderiza no painel /sa (e não na página de login /sa/login ou em /painel)
  const isSaPanel = pathname?.startsWith("/sa") && pathname !== "/sa/login";

  const checkPendingMigrations = useCallback(async () => {
    try {
      const res = await fetch("/api/sa/migrations");
      const data = await res.json();
      if (data.success) {
        setPendingCount(data.pendingCount || 0);
      }
    } catch {
      // Falha silenciosa no footer para não quebrar a UI
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSaPanel) return;
    checkPendingMigrations();
    // Verifica a cada 10 segundos
    const interval = setInterval(checkPendingMigrations, 10000);
    return () => clearInterval(interval);
  }, [isSaPanel, checkPendingMigrations]);

  if (!isSaPanel || (loading && pendingCount === null)) {
    return null;
  }

  if (pendingCount && pendingCount > 0) {
    return (
      <div className="relative flex items-center">
        {/* Camadas de Ondas Sonar / Radar pulsando para fora */}
        <span className="absolute inset-0 -m-1 rounded-full border border-amber-500/70 bg-amber-500/20 animate-sonar-1 pointer-events-none" />
        <span className="absolute inset-0 -m-1 rounded-full border border-amber-400/50 bg-amber-400/10 animate-sonar-2 pointer-events-none" />
        <span className="absolute inset-0 -m-1 rounded-full border border-amber-300/30 bg-amber-500/5 animate-sonar-3 pointer-events-none" />

        {/* Glow halo adicional de destaque */}
        <span className="absolute -inset-1.5 rounded-full bg-amber-500/30 blur-md animate-pulse pointer-events-none" />

        {/* Botão de alerta Sonar */}
        <Link
          href="/sa/migrations"
          className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/30 via-amber-600/30 to-amber-500/30 border border-amber-400/80 text-[11px] font-bold text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:shadow-[0_0_30px_rgba(245,158,11,0.8)] hover:scale-105 hover:bg-amber-500/40 transition-all group"
          title={`${pendingCount} migration(s) pendente(s) de aplicação. Clique para revisar e executar imediatamente.`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-80" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
          <span className="tracking-tight">
            {pendingCount} Migration{pendingCount > 1 ? "s" : ""} Pendente{pendingCount > 1 ? "s" : ""}
          </span>
          <ArrowRight className="w-3 h-3 text-amber-300 opacity-80 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/sa/migrations"
      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
      title="Banco de dados sincronizado e atualizado."
    >
      <Database className="w-3 h-3 text-emerald-400" />
      <span>DB Sync</span>
    </Link>
  );
}

