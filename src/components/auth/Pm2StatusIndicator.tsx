"use client";

import { useEffect, useState } from "react";
import { Terminal, AlertTriangle, X, RefreshCw, Copy, Check, Play } from "lucide-react";
import { ClientPortal } from "@/components/portal/ClientPortal";

type Pm2Status = "checking" | "online" | "offline";

interface Pm2ErrorDetails {
  status: string;
  message?: string;
  totalProcesses?: number;
  onlineProcesses?: number;
  timestamp?: string;
}

export function Pm2StatusIndicator() {
  const [status, setStatus] = useState<Pm2Status>("checking");
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [errorDetails, setErrorDetails] = useState<Pm2ErrorDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/health/pm2", {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok && data.status === "online") {
        setStatus("online");
        setOnlineCount(data.onlineProcesses || 0);
        setErrorDetails(null);
      } else {
        setStatus("offline");
        setOnlineCount(0);
        setErrorDetails(data);
      }
    } catch (err: unknown) {
      setStatus("offline");
      setOnlineCount(0);
      setErrorDetails({
        status: "offline",
        message: err instanceof Error ? err.message : "Falha na requisição de status do PM2",
        timestamp: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);

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
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
          status === "checking"
            ? "bg-slate-900/80 border-slate-800 text-slate-400 cursor-default"
            : status === "online"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300 cursor-default"
            : "bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20 cursor-pointer shadow-sm shadow-rose-500/10"
        }`}
        title={
          status === "checking"
            ? "Verificando PM2..."
            : status === "online"
            ? `PM2 Online (${onlineCount} processo(s))`
            : "PM2 Offline ou Parado - Clique para ver detalhes"
        }
      >
        <Terminal
          className={`w-3 h-3 ${
            status === "checking"
              ? "text-slate-400 animate-spin"
              : status === "online"
              ? "text-emerald-400"
              : "text-rose-400 animate-pulse"
          }`}
        />
        <span className="font-semibold">PM2</span>
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            status === "checking"
              ? "bg-slate-500"
              : status === "online"
              ? "bg-emerald-400"
              : "bg-rose-400 animate-ping"
          }`}
        />
        {status === "online" && onlineCount > 0 && (
          <span className="text-[9px] font-mono text-emerald-400/80">({onlineCount})</span>
        )}
      </button>

      {/* Modal de Detalhes / Diagnóstico de Queda do PM2 */}
      {isModalOpen && (
        <ClientPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">PM2 Inativo / Offline</h3>
                    <p className="text-[11px] text-slate-400">
                      Nenhum processo gerenciado pelo PM2 está em execução no momento
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-300">
                  Para iniciar os processos de fila em background e Next.js via PM2, utilize o comando:
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-emerald-400">
                  pm2 start ecosystem.config.js
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleCopyLog}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? "Copiado!" : "Copiar Diagnóstico"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    <span>Verificar Novamente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    Fechar
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
