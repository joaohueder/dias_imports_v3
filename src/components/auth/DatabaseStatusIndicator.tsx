"use client";

import { useEffect, useState } from "react";
import { Database, AlertTriangle, X, Terminal, RefreshCw, Copy, Check } from "lucide-react";

type DbStatus = "checking" | "online" | "offline";

interface DbErrorDetails {
  status: string;
  message: string;
  code?: string;
  errno?: number;
  sqlState?: string;
  config?: {
    host: string;
    port: number;
    user: string;
    database: string;
  };
  timestamp?: string;
}

export function DatabaseStatusIndicator() {
  const [status, setStatus] = useState<DbStatus>("checking");
  const [errorDetails, setErrorDetails] = useState<DbErrorDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/health/db", {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok && data.status === "online") {
        setStatus("online");
        setErrorDetails(null);
      } else {
        setStatus("offline");
        setErrorDetails(data);
      }
    } catch (err: unknown) {
      setStatus("offline");
      setErrorDetails({
        status: "offline",
        message: err instanceof Error ? err.message : "Falha na requisição de healthcheck",
        timestamp: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);

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
    if (!errorDetails) return;
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (status === "offline") {
            setIsModalOpen(true);
          }
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-[11px] font-medium select-none ${
          status === "offline"
            ? "border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 cursor-pointer shadow-sm hover:shadow-rose-950/50"
            : "border-slate-800 bg-slate-900/80 text-slate-400 cursor-default"
        }`}
        title={status === "offline" ? "Banco offline. Clique para ver detalhes técnicos." : `Banco de dados: ${status}`}
      >
        <Database className={`w-3 h-3 ${status === "offline" ? "text-rose-400" : "text-slate-400"}`} />
        <span className={status === "offline" ? "text-rose-300/80" : "text-slate-400"}>DB:</span>
        
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

        {status === "offline" && (
          <span className="inline-flex items-center gap-1 text-rose-400 font-semibold underline decoration-rose-500/40 underline-offset-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
            </span>
            <span>Offline (ver log)</span>
          </span>
        )}
      </button>

      {/* Modal de Log Técnico */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    Diagnóstico Técnico do Banco de Dados
                  </h3>
                  <p className="text-xs text-slate-400">Conexão com MySQL falhou</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto font-mono text-xs">
              {/* Parameters info */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 font-sans">
                <div>
                  <span className="text-[11px] text-slate-500 block">Host / Porta</span>
                  <span className="text-xs text-slate-200 font-mono">
                    {errorDetails?.config?.host || "N/A"}:{errorDetails?.config?.port || "3306"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Banco de Dados</span>
                  <span className="text-xs text-slate-200 font-mono">
                    {errorDetails?.config?.database || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Usuário</span>
                  <span className="text-xs text-slate-200 font-mono">
                    {errorDetails?.config?.user || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Código do Erro</span>
                  <span className="text-xs font-mono font-semibold text-rose-400">
                    {errorDetails?.code || "N/A"} {errorDetails?.errno ? `(${errorDetails.errno})` : ""}
                  </span>
                </div>
              </div>

              {/* Raw JSON Log */}
              <div>
                <div className="flex items-center justify-between pb-1.5 font-sans">
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                    Stack / Resposta do Servidor
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLog}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-rose-300 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(errorDetails, null, 2)}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-slate-950/60">
              <span className="text-[11px] text-slate-500 font-sans">
                {errorDetails?.timestamp ? `Detectado em: ${new Date(errorDetails.timestamp).toLocaleTimeString()}` : ""}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span>Reverificar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
