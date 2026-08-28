"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MessageSquare, RefreshCw, CheckCircle2, AlertCircle, X, Phone, Radio, Smartphone } from "lucide-react";
import { maskPhone } from "@/lib/validators";
import { ClientPortal } from "@/components/portal/ClientPortal";

type WhatsappStatus = "checking" | "connected" | "disconnected" | "no_instance";

interface CompanyInstanceInfo {
  id?: number;
  name?: string;
  status?: string;
  phone_connected?: string | null;
  profile_name?: string | null;
  total_instances?: number;
  connected_instances?: number;
}

export function CompanyWhatsappStatusIndicator() {
  const [status, setStatus] = useState<WhatsappStatus>("checking");
  const [instance, setInstance] = useState<CompanyInstanceInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/painel/instances/status", {
        cache: "no-store",
      });
      if (response.status === 401) {
        setStatus("no_instance");
        return;
      }
      const data = await response.json();
      if (response.ok && data.success) {
        setInstance(data.primaryInstance || data);
        if (data.status === "connected" || data.connected_instances > 0) {
          setStatus("connected");
        } else if (data.total_instances === 0) {
          setStatus("no_instance");
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
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      checkStatus();
    }, 25000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await checkStatus();
    setIsRefreshing(false);
  };

  const getStatusDisplay = () => {
    switch (status) {
      case "connected":
        return {
          text: "Conectado",
          color: "text-emerald-300",
          dotColor: "bg-emerald-400",
          iconColor: "text-emerald-400",
          container: "bg-emerald-950/40 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-900/40 shadow-sm shadow-emerald-950/40",
        };
      case "disconnected":
        return {
          text: "Desconectado",
          color: "text-rose-300",
          dotColor: "bg-rose-500",
          iconColor: "text-rose-400",
          container: "bg-rose-950/30 border-rose-500/30 hover:border-rose-500/50 hover:bg-rose-900/40 shadow-sm shadow-rose-950/40",
        };
      case "no_instance":
        return {
          text: "Sem Instância",
          color: "text-amber-300",
          dotColor: "bg-amber-400",
          iconColor: "text-amber-400",
          container: "bg-amber-950/30 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-900/40 shadow-sm shadow-amber-950/40",
        };
      default:
        return {
          text: "Verificando...",
          color: "text-slate-400",
          dotColor: "bg-slate-500",
          iconColor: "text-slate-400",
          container: "bg-slate-900/60 border-slate-800 hover:bg-slate-800/80",
        };
    }
  };

  const currentStatus = getStatusDisplay();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs select-none cursor-pointer whitespace-nowrap ${currentStatus.container}`}
        title="Status da conexão WhatsApp da empresa. Clique para ver detalhes."
      >
        <div className="relative flex items-center justify-center">
          <MessageSquare className={`w-3.5 h-3.5 ${currentStatus.iconColor} transition-transform group-hover:scale-110`} />
          {status === "connected" && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>
        <span className="text-slate-400 text-[11px] font-medium hidden md:inline">WhatsApp</span>
        <span className="text-slate-600 hidden md:inline">&bull;</span>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${currentStatus.dotColor} ${status === "connected" ? "animate-pulse" : ""}`} />
          <span className={`text-[11px] font-bold ${currentStatus.color}`}>{currentStatus.text}</span>
        </div>
      </button>

      {/* Modal de Detalhes do WhatsApp da Empresa */}
      {isModalOpen && (
        <ClientPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-[#0b1222] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
              
              {/* Header do Modal */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    status === "connected"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  }`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Instância de WhatsApp da Empresa</h3>
                    <p className="text-xs text-slate-400">Canal de disparo e automação da sua empresa</p>
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

              {/* Informações da Instância */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-400">Status de Conexão</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className={`w-2 h-2 rounded-full ${currentStatus.dotColor}`} />
                    <span className={currentStatus.color}>{currentStatus.text}</span>
                  </div>
                </div>

                {instance?.name && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400">Nome da Instância</span>
                    <span className="font-semibold text-white truncate max-w-[200px]">{instance.name}</span>
                  </div>
                )}

                {instance?.phone_connected && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400">Número Conectado</span>
                    <span className="font-bold text-emerald-400 tracking-wide">
                      {maskPhone(instance.phone_connected)}
                    </span>
                  </div>
                )}

                {instance?.profile_name && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400">Perfil WhatsApp</span>
                    <span className="font-medium text-slate-200">{instance.profile_name}</span>
                  </div>
                )}
              </div>

              {/* Ações do Modal */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span>{isRefreshing ? "Verificando..." : "Atualizar"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-600/20"
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
