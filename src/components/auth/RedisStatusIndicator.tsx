"use client";

import { useEffect, useState } from "react";
import { Server, AlertTriangle, X, Terminal, RefreshCw, Copy, Check } from "lucide-react";
import { ClientPortal } from "@/components/portal/ClientPortal";

type RedisStatus = "checking" | "online" | "offline";

interface RedisErrorDetails {
  status: string;
  message: string;
  code?: string;
  host?: string;
  port?: number;
  timestamp?: string;
}

export function RedisStatusIndicator() {
  const [status, setStatus] = useState<RedisStatus>("checking");
  const [latency, setLatency] = useState<number | null>(null);
  const [errorDetails, setErrorDetails] = useState<RedisErrorDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/health/redis", {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok && data.status === "online") {
        setStatus("online");
        setLatency(data.latencyMs ?? null);
        setErrorDetails(null);
      } else {
        setStatus("offline");
        setLatency(null);
        setErrorDetails(data);
      }
    } catch (err: unknown) {
      setStatus("offline");
      setLatency(null);
      setErrorDetails({
        status: "offline",
        message: err instanceof Error ? err.message : "Falha na requisição de healthcheck do Redis",
        timestamp: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      checkStatus();
    }, 20000);

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
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
          status === "online"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : status === "offline"
            ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 cursor-pointer shadow-sm shadow-rose-500/20"
            : "bg-slate-800 border-slate-700 text-slate-400"
        }`}
        title={
          status === "online"
            ? `Redis Online (${latency ? latency + "ms" : "BullMQ/Cache"})`
            : status === "offline"
            ? "Redis Offline - Clique para ver detalhes"
            : "Verificando Redis..."
        }
      >
        <Server className="w-3.5 h-3.5" />
        <span className="font-mono text-[11px]">Redis:</span>
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              status === "online"
                ? "bg-emerald-400 animate-pulse"
                : "bg-rose-400 animate-ping"
            }`}
          />
          <span className="capitalize text-[11px]">
            {status === "checking" ? "Verificando..." : status === "online" ? "Online" : "Offline"}
          </span>
        </span>
      </button>

      {/* Modal de Detalhes do Erro do Redis */}
      {isModalOpen && errorDetails && (
        <ClientPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg overflow-hidden bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl shadow-rose-500/10">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-rose-500/5">
                <div className="flex items-center gap-2.5 text-rose-400">
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      Falha de Conexão com Redis
                    </h3>
                    <p className="text-xs text-rose-400/80">
                      Serviço de Filas / BullMQ / Cache Indisponível
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Detalhes do Diagnóstico</span>
                  </div>
                  <pre className="p-3 text-xs font-mono text-rose-300/90 bg-rose-950/20 border border-rose-500/20 rounded-lg overflow-x-auto whitespace-pre-wrap word-break">
                    {JSON.stringify(errorDetails, null, 2)}
                  </pre>
                </div>

                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
                  <p className="font-semibold text-slate-200">Recomendações:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>Verifique se o serviço do Redis está em execução (`redis-server`).</li>
                    <li>Confirme as variáveis `REDIS_HOST` e `REDIS_PORT` no arquivo `.env`.</li>
                    <li>Valide permissões de firewall ou credenciais caso use senha.</li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/50">
                <button
                  type="button"
                  onClick={handleCopyLog}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Log</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    <span>Testar Novamente</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ClientPortal>
      )}
    </>
  );
}
