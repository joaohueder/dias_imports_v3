"use client";

import { useEffect, useState } from "react";
import { Server, AlertTriangle, X, Terminal, RefreshCw, Copy, Check } from "lucide-react";
import { ClientPortal } from "@/components/portal/ClientPortal";

type EvolutionStatus = "checking" | "online" | "offline" | "degraded";

interface EvolutionDetails {
  status: string;
  url?: string;
  httpStatus?: number;
  latencyMs?: number;
  version?: string;
  message?: string;
  timestamp?: string;
}

export function EvolutionStatusIndicator() {
  const [status, setStatus] = useState<EvolutionStatus>("checking");
  const [details, setDetails] = useState<EvolutionDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/health/evolution", {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok && (data.status === "online" || data.status === "degraded")) {
        setStatus(data.status as EvolutionStatus);
        setDetails(data);
      } else {
        setStatus("offline");
        setDetails(data);
      }
    } catch (err: unknown) {
      setStatus("offline");
      setDetails({
        status: "offline",
        message: err instanceof Error ? err.message : "Falha na requisição de healthcheck",
        timestamp: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      checkStatus();
    }, 25000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await checkStatus();
    setIsRefreshing(false);
  };

  const handleCopyLog = () => {
    if (!details) return;
    navigator.clipboard.writeText(JSON.stringify(details, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsModalOpen(true);
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-[11px] font-medium select-none cursor-pointer ${
          status === "offline"
            ? "border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 shadow-sm hover:shadow-rose-950/50"
            : status === "degraded"
            ? "border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300"
            : "border-slate-800 bg-slate-900/80 hover:bg-slate-800/80 text-slate-400"
        }`}
        title="Evolution API Status. Clique para ver detalhes de conexão."
      >
        <Server className={`w-3 h-3 ${status === "offline" ? "text-rose-400" : status === "online" ? "text-indigo-400" : "text-slate-400"}`} />
        <span className={status === "offline" ? "text-rose-300/80" : "text-slate-400"}>Evolution:</span>
        
        {status === "checking" && (
          <span className="inline-flex items-center gap-1 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>Verificando...</span>
          </span>
        )}

        {status === "online" && (
          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span>Online</span>
          </span>
        )}

        {status === "degraded" && (
          <span className="inline-flex items-center gap-1 text-rose-400 font-semibold underline decoration-rose-500/40 underline-offset-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
            </span>
            <span>Instável</span>
          </span>
        )}

        {status === "offline" && (
          <span className="inline-flex items-center gap-1 text-rose-400 font-semibold underline decoration-rose-500/40 underline-offset-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
            </span>
            <span>Offline</span>
          </span>
        )}
      </button>

      {/* MODAL DE DETALHES TÉCNICOS */}
      {isModalOpen && (
        <ClientPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-[#0b101b] shadow-2xl p-6 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">
                      Status da Evolution API (WhatsApp)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Diagnóstico da conexão de webhook e socket
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Conteúdo */}
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-medium">Status</span>
                    <span className={`text-sm font-bold mt-1 inline-flex items-center gap-1.5 ${
                      status === "online" ? "text-emerald-400" : status === "degraded" ? "text-amber-400" : "text-rose-400"
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-current" />
                      {status.toUpperCase()}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-medium">Latência</span>
                    <span className="text-sm font-bold text-slate-200 mt-1 block">
                      {details?.latencyMs !== undefined ? `${details.latencyMs} ms` : "--"}
                    </span>
                  </div>
                </div>

                {details?.url && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-medium">Endpoint Configurado</span>
                    <span className="text-xs font-mono text-indigo-300 mt-1 block break-all">
                      {details.url}
                    </span>
                  </div>
                )}

                {details?.message && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-medium">Mensagem</span>
                    <span className="text-xs text-slate-300 mt-1 block">
                      {details.message}
                    </span>
                  </div>
                )}

                {/* Log JSON */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                      Raw Response Log
                    </span>
                    <button
                      onClick={handleCopyLog}
                      className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? "Copiado!" : "Copiar"}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto p-2 bg-slate-900/40 rounded-lg max-h-36 scrollbar-thin">
                    {JSON.stringify(details, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span>{isRefreshing ? "Testando..." : "Testar Agora"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm shadow-indigo-600/30"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </ClientPortal>
      )}
    </>
  );
}
