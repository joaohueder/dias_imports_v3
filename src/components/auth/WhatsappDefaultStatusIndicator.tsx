"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, RefreshCw, CheckCircle2, AlertCircle, X, Shield, Phone, Radio } from "lucide-react";
import Link from "next/link";
import { maskPhone } from "@/lib/validators";
import { ClientPortal } from "@/components/portal/ClientPortal";

type WhatsappStatus = "checking" | "connected" | "disconnected" | "no_instance";

interface DefaultInstanceInfo {
  id?: number;
  name?: string;
  status?: string;
  phone_connected?: string | null;
  profile_name?: string | null;
}

export function WhatsappDefaultStatusIndicator() {
  const [status, setStatus] = useState<WhatsappStatus>("checking");
  const [instance, setInstance] = useState<DefaultInstanceInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/health/whatsapp-default", {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok && data.hasInstance && data.instance) {
        setInstance(data.instance);
        if (data.status === "connected" || data.instance.status === "connected") {
          setStatus("connected");
        } else {
          setStatus("disconnected");
        }
      } else {
        setInstance(null);
        setStatus("no_instance");
      }
    } catch {
      setStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await checkStatus();
    setIsRefreshing(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-[11px] font-medium select-none cursor-pointer whitespace-nowrap ${
          status === "connected"
            ? "border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 shadow-sm hover:shadow-emerald-950/50"
            : status === "disconnected" || status === "no_instance"
            ? "border-rose-500/50 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 shadow-sm hover:shadow-rose-950/60"
            : "border-slate-800 bg-slate-900/80 hover:bg-slate-800/80 text-slate-400"
        }`}
        title="Status do WhatsApp Matriz / Instância Padrão. Clique para ver detalhes."
      >
        <MessageSquare
          className={`w-3 h-3 shrink-0 ${
            status === "connected"
              ? "text-emerald-400"
              : status === "disconnected" || status === "no_instance"
              ? "text-rose-400"
              : "text-slate-400"
          }`}
        />
        <span className={status === "connected" ? "text-emerald-300/90" : status === "disconnected" || status === "no_instance" ? "text-rose-300/80" : "text-slate-400"}>WhatsApp:</span>

        {status === "checking" && (
          <span className="inline-flex items-center gap-1 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
            <span>Verificando...</span>
          </span>
        )}

        {status === "connected" && (
          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span>Conectado</span>
          </span>
        )}

        {status === "disconnected" && (
          <span className="inline-flex items-center gap-1 text-rose-400 font-semibold underline decoration-rose-500/40 underline-offset-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
            </span>
            <span>Desconectado</span>
          </span>
        )}

        {status === "no_instance" && (
          <span className="inline-flex items-center gap-1 text-rose-400 font-semibold underline decoration-rose-500/40 underline-offset-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
            </span>
            <span>Não Criada</span>
          </span>
        )}
      </button>

      {/* MODAL DE DETALHES DO WHATSAPP PADRÃO */}
      {isModalOpen && (
        <ClientPortal>
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setIsModalOpen(false)}
          >
            <div 
              className="w-full max-w-md rounded-2xl bg-[#0b1120] border border-slate-800 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl border ${
                      status === "connected"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Instância WhatsApp Matriz</h3>
                    <p className="text-xs text-slate-400">Conexão Global Super Admin</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400">Status da Conexão</span>
                  {status === "connected" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Conectado e Ativo
                    </span>
                  ) : status === "no_instance" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Instância Não Criada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Desconectado
                    </span>
                  )}
                </div>

                {instance && (
                  <>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-400">Nome da Instância</span>
                      <span className="font-mono text-indigo-300 font-bold">{instance.name}</span>
                    </div>

                    {instance.phone_connected && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400">Número Conectado</span>
                        <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          {maskPhone(instance.phone_connected)}
                        </span>
                      </div>
                    )}

                    {instance.profile_name && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400">Nome do Perfil</span>
                        <span className="text-slate-200 font-semibold">{instance.profile_name}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span>Atualizar</span>
                </button>

                <Link
                  href="/sa/default-instance"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Gerenciar Instância</span>
                </Link>
              </div>
            </div>
          </div>
        </ClientPortal>
      )}
    </>
  );
}
