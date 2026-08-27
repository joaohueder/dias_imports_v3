"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Smartphone,
  QrCode,
  RotateCw,
  Send,
  RefreshCw,
  X,
  WifiOff,
  Activity,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Users2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { maskPhone } from "@/lib/validators";

interface MetricItem {
  sent: number;
  limit: number;
  unlimited: boolean;
}

interface GroupMetricItem {
  total: number;
  limit: number;
  unlimited: boolean;
}

interface InstanceData {
  id: number;
  company_id: number;
  name: string;
  whatsapp_number: string | null;
  server_url: string | null;
  api_key: string | null;
  instance_key: string;
  status: "connected" | "connecting" | "disconnected" | "banned" | "qrcode";
  qrcode_base64?: string | null;
  phone_connected?: string | null;
  profile_name?: string | null;
  profile_picture_url?: string | null;
  total_messages_sent: number;
  total_messages_received: number;
  last_activity_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface InstanceResponse {
  success: boolean;
  hasInstance: boolean;
  instance: InstanceData | null;
  metrics?: {
    messagesCycle: MetricItem;
    messagesToday: MetricItem;
    groups: GroupMetricItem;
  };
}

export function WhatsappSettingsTab() {
  const [instance, setInstance] = useState<InstanceData | null>(null);
  const [metrics, setMetrics] = useState<InstanceResponse["metrics"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modais de ação
  const [restartModalOpen, setRestartModalOpen] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);

  // QR Code Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrStatusText, setQrStatusText] = useState("Carregando QR Code...");
  const qrPollingRef = useRef<NodeJS.Timeout | null>(null);

  // Test Message Modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState(
    "Olá! Esta é uma mensagem de teste enviada pela instância de WhatsApp da sua empresa."
  );
  const [sendingTest, setSendingTest] = useState(false);

  const fetchInstance = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch("/api/painel/whatsapp/instance", { cache: "no-store" });
      const data: InstanceResponse = await res.json();
      if (res.ok && data.hasInstance && data.instance) {
        setInstance(data.instance);
        setMetrics(data.metrics || null);
      } else {
        setInstance(null);
        setMetrics(null);
      }
    } catch (err) {
      console.error("Erro ao carregar instância:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstance();
  }, [fetchInstance]);

  // Abrir Modal de QR Code e iniciar polling de sincronização
  const handleOpenQrModal = async (restart = false) => {
    setQrModalOpen(true);
    setQrLoading(true);
    setQrStatusText(restart ? "Reiniciando sessão e gerando novo QR Code..." : "Buscando QR Code...");

    try {
      const res = await fetch(`/api/painel/whatsapp/qrcode?restart=${restart ? "true" : "false"}`);
      const data = await res.json();
      if (res.ok && data.qrcode) {
        setQrBase64(data.qrcode);
        setQrStatusText("Aponte a câmera do WhatsApp para o código abaixo.");
      } else {
        setQrStatusText("Aguardando geração do código QR pela Evolution API...");
      }
    } catch {
      setQrStatusText("Erro ao conectar à API para obter o QR Code.");
    } finally {
      setQrLoading(false);
    }

    if (qrPollingRef.current) clearInterval(qrPollingRef.current);
    qrPollingRef.current = setInterval(async () => {
      try {
        const checkRes = await fetch("/api/painel/whatsapp/instance", { cache: "no-store" });
        const checkData: InstanceResponse = await checkRes.json();
        if (checkRes.ok && checkData.instance) {
          if (checkData.instance.status === "connected") {
            if (qrPollingRef.current) clearInterval(qrPollingRef.current);
            setQrModalOpen(false);
            toast.success("WhatsApp conectado com sucesso!");
            setInstance(checkData.instance);
            setMetrics(checkData.metrics || null);
          }
        }
      } catch (e) {
        console.warn("Polling WhatsApp status:", e);
      }
    }, 4000);
  };

  const handleCloseQrModal = () => {
    if (qrPollingRef.current) {
      clearInterval(qrPollingRef.current);
      qrPollingRef.current = null;
    }
    setQrModalOpen(false);
    fetchInstance(true);
  };

  // Executar Ações (Reiniciar ou Desconectar)
  const handleAction = async (action: "restart" | "disconnect") => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/painel/whatsapp/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Ação realizada com sucesso!");
        setRestartModalOpen(false);
        setDisconnectModalOpen(false);
        await fetchInstance(true);
      } else {
        toast.error(data.message || "Erro ao executar ação.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro de comunicação com o servidor.");
    } finally {
      setActionLoading(false);
    }
  };

  // Enviar Mensagem de Teste
  const handleSendTestMessage = async () => {
    if (!testPhone) {
      toast.error("Informe um número de telefone com DDD.");
      return;
    }
    try {
      setSendingTest(true);
      const res = await fetch("/api/painel/whatsapp/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Mensagem de teste enviada com sucesso!");
        setTestModalOpen(false);
        fetchInstance(true);
      } else {
        toast.error(data.message || "Falha ao enviar mensagem de teste.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar mensagem.");
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-xs font-medium">Carregando status do WhatsApp da empresa...</p>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-[#090e1c] p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <Smartphone className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-bold text-white">Nenhuma Instância Atribuída</h3>
          <p className="text-xs text-slate-400">
            A criação e provisionamento de instâncias são realizados pela administração do sistema (Super Admin).
          </p>
        </div>
      </div>
    );
  }

  const isConnected = instance.status === "connected";
  const isConnecting = instance.status === "connecting" || instance.status === "qrcode";

  // Percentuais de uso
  const cyclePercent = metrics?.messagesCycle.unlimited || !metrics?.messagesCycle.limit
    ? 0
    : Math.min(100, Math.round((metrics.messagesCycle.sent / metrics.messagesCycle.limit) * 100));

  const todayPercent = metrics?.messagesToday.unlimited || !metrics?.messagesToday.limit
    ? 0
    : Math.min(100, Math.round((metrics.messagesToday.sent / metrics.messagesToday.limit) * 100));

  const groupsPercent = metrics?.groups.unlimited || !metrics?.groups.limit
    ? 0
    : Math.min(100, Math.round((metrics.groups.total / metrics.groups.limit) * 100));

  return (
    <div className="space-y-6">
      {/* CARD PRINCIPAL DA INSTÂNCIA */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/90 bg-[#090e1c] p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* CABEÇALHO DO CARD COM STATUS E AÇÕES */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${
                  isConnected
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10"
                    : isConnecting
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                <Smartphone className="w-7 h-7" />
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#090e1c] ${
                  isConnected
                    ? "bg-emerald-500"
                    : isConnecting
                    ? "bg-amber-400 animate-pulse"
                    : "bg-rose-500"
                }`}
                title={isConnected ? "Online" : "Desconectado"}
              />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight uppercase">
                  {instance.profile_name || instance.name}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    isConnected
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      : isConnecting
                      ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected
                        ? "bg-emerald-400"
                        : isConnecting
                        ? "bg-amber-400 animate-pulse"
                        : "bg-rose-400"
                    }`}
                  />
                  {isConnected
                    ? "Conectado"
                    : isConnecting
                    ? "Aguardando Leitura"
                    : "Desconectado"}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {instance.phone_connected
                  ? maskPhone(instance.phone_connected)
                  : instance.whatsapp_number
                  ? maskPhone(instance.whatsapp_number)
                  : "Número não sincronizado"}
              </p>
            </div>
          </div>

          {/* BOTÕES SUPERIORES DE CONEXÃO E TESTE */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fetchInstance()}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
              title="Sincronizar Status"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
            </button>

            {!isConnected ? (
              <button
                type="button"
                onClick={() => handleOpenQrModal(false)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-slate-950" />
                <span>Conectar via QR Code</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTestModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50 font-bold text-xs transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-indigo-400" />
                <span>Enviar Teste</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 CARDS: ID DA INSTÂNCIA, MENSAGENS CICLO/LIMITE, MENSAGENS HOJE/LIMITE, GRUPOS/LIMITE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. ID DA INSTÂNCIA */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              ID da Instância
            </span>
            <p className="text-xs font-mono text-slate-200 font-bold truncate">
              {instance.name}
            </p>
            <div className="pt-2 text-[10px] text-slate-500 truncate">
              {instance.last_activity_at
                ? `Último envio: ${new Date(instance.last_activity_at).toLocaleTimeString("pt-BR")}`
                : "Sem disparos hoje"}
            </div>
          </div>

          {/* 2. TOTAL DE MENSAGENS ENVIADAS DO CICLO / LIMITE */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Mensagens no Ciclo
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400">
                {cyclePercent}%
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-400">
                {(metrics?.messagesCycle.sent || 0).toLocaleString("pt-BR")}
              </span>
              <span className="text-xs font-medium text-slate-500">
                / {metrics?.messagesCycle.unlimited ? "∞" : (metrics?.messagesCycle.limit || 0).toLocaleString("pt-BR")}
              </span>
            </div>

            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${cyclePercent}%` }}
              />
            </div>
          </div>

          {/* 3. TOTAL DE MENSAGENS ENVIADAS HOJE / LIMITE */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Mensagens Hoje
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-400">
                {todayPercent}%
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-indigo-400">
                {(metrics?.messagesToday.sent || 0).toLocaleString("pt-BR")}
              </span>
              <span className="text-xs font-medium text-slate-500">
                / {metrics?.messagesToday.unlimited ? "∞" : (metrics?.messagesToday.limit || 0).toLocaleString("pt-BR")}
              </span>
            </div>

            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${todayPercent}%` }}
              />
            </div>
          </div>

          {/* 4. TOTAL DE GRUPOS / LIMITE */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users2 className="w-3.5 h-3.5 text-purple-400" />
                Grupos WhatsApp
              </span>
              <span className="text-[10px] font-mono font-bold text-purple-400">
                {groupsPercent}%
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-purple-400">
                {(metrics?.groups.total || 0).toLocaleString("pt-BR")}
              </span>
              <span className="text-xs font-medium text-slate-500">
                / {metrics?.groups.unlimited ? "∞" : (metrics?.groups.limit || 0).toLocaleString("pt-BR")}
              </span>
            </div>

            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${groupsPercent}%` }}
              />
            </div>
          </div>

        </div>

        {/* RODAPÉ DO CARD COM AÇÕES PERMITIDAS */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRestartModalOpen(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reiniciar Sessão</span>
            </button>

            {isConnected && (
              <button
                type="button"
                onClick={() => setDisconnectModalOpen(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
              >
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Desconectar WhatsApp</span>
              </button>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>Gerenciamento de instâncias provisionado pelo Administrador SaaS</span>
          </div>
        </div>

      </div>

      {/* MODAL DE QR CODE */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0b1222] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black">Conectar ao WhatsApp</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseQrModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ÁREA DO QR CODE */}
            <div className="relative p-6 rounded-2xl bg-white flex flex-col items-center justify-center shadow-inner mx-auto max-w-[240px] aspect-square">
              {qrLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-800">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                  <span className="text-xs font-bold">Gerando...</span>
                </div>
              ) : qrBase64 ? (
                <img
                  src={qrBase64}
                  alt="QR Code WhatsApp"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-slate-800 text-xs font-semibold">QR Indisponível</div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                {qrStatusText}
              </p>
              <ol className="text-[11px] text-slate-400 text-left space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 list-decimal list-inside">
                <li>Abra o WhatsApp no smartphone com o chip da empresa</li>
                <li>Toque em Dispositivos Conectados</li>
                <li>Toque em Conectar um aparelho e escaneie a imagem</li>
              </ol>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleOpenQrModal(true)}
                disabled={qrLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${qrLoading ? "animate-spin" : ""}`} />
                <span>Atualizar QR Code</span>
              </button>

              <button
                type="button"
                onClick={handleCloseQrModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DISPARO DE TESTE */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0b1222] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white">
                <Send className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black">Disparo de Teste</h3>
              </div>
              <button
                type="button"
                onClick={() => setTestModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Número de WhatsApp (com DDD)
                </label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={testPhone}
                  onChange={(e) => setTestPhone(maskPhone(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Texto da Mensagem
                </label>
                <textarea
                  rows={3}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTestModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendTestMessage}
                disabled={sendingTest || !testPhone}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {sendingTest ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Enviar Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE REINÍCIO */}
      {restartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <RotateCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reiniciar Sessão</h3>
                <p className="text-xs text-slate-400">Deseja reiniciar a conexão com a Evolution API?</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Isso recarregará o processo da instância. Se o chip já estiver pareado, a conexão retornará automaticamente em alguns segundos.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestartModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleAction("restart")}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
              >
                Confirmar Reinício
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE DESCONEXÃO */}
      {disconnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <WifiOff className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Desconectar WhatsApp</h3>
                <p className="text-xs text-slate-400">Deseja desconectar este número de telefone?</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              O aparelho será desconectado e os disparos automáticos ficarão pausados até que um novo QR Code seja lido.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDisconnectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleAction("disconnect")}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Desconectar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
