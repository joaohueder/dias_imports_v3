"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Server,
  Smartphone,
  QrCode,
  Power,
  RotateCw,
  Trash2,
  Plus,
  Send,
  Check,
  AlertCircle,
  Clock,
  Radio,
  Copy,
  Sparkles,
  Shield,
  RefreshCw,
  X,
  Bot,
  Zap,
  WifiOff,
} from "lucide-react";
import { SaPageHeader } from "@/components/sa/SaPageHeader";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { useSaAuth } from "@/context/SaAuthContext";
import { maskPhone } from "@/lib/validators";

interface InstanceData {
  id: number;
  company_id: number;
  name: string;
  whatsapp_number: string | null;
  server_url: string | null;
  api_key: string | null;
  instance_key: string;
  status: "connected" | "connecting" | "disconnected" | "banned" | "qrcode";
  qrcode_base64: string | null;
  phone_connected: string | null;
  profile_name: string | null;
  profile_picture_url: string | null;
  battery_level: number | null;
  is_charging: boolean | null;
  is_default?: boolean;
  total_messages_sent: number;
  total_messages_received: number;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function SaDefaultInstancePage() {
  const { can } = useSaAuth();
  const { showSuccess, showError, showWarning } = useFeedbackModal();

  // Estados da Instância Padrão
  const [defaultInstance, setDefaultInstance] = useState<InstanceData | null>(null);
  const [loadingInstance, setLoadingInstance] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Modais da Instância Padrão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [restartModalOpen, setRestartModalOpen] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);

  // QR Code Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrStatusText, setQrStatusText] = useState("Carregando QR Code...");
  const [copiedQr, setCopiedQr] = useState(false);
  const qrPollingRef = useRef<NodeJS.Timeout | null>(null);

  // Test Message Modal State
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState(
    "Olá! Esta é uma mensagem de teste enviada pela Instância Padrão do ecossistema SaaS."
  );
  const [sendingTest, setSendingTest] = useState(false);

  // Carregar Instância Padrão
  const fetchDefaultInstance = useCallback(async () => {
    try {
      setLoadingInstance(true);
      const res = await fetch("/api/sa/settings/default-instance");
      const data = await res.json();
      if (res.ok && data.hasInstance && data.instance) {
        setDefaultInstance(data.instance);
      } else {
        setDefaultInstance(null);
      }
    } catch (err: any) {
      console.error("Erro ao buscar instância padrão:", err);
    } finally {
      setLoadingInstance(false);
    }
  }, []);

  useEffect(() => {
    fetchDefaultInstance();
  }, [fetchDefaultInstance]);

  // Criar Instância Padrão Direto ao Clicar
  const handleCreateInstanceDirect = async () => {
    try {
      setActionLoading(true);
      const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
      const instanceName = `Instancia_Padrao_${randomCode}`;

      const res = await fetch("/api/sa/settings/default-instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: instanceName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao criar instância padrão");
      }
      showSuccess("Sucesso!", data.message || "Instância padrão criada com sucesso na plataforma!");
      await fetchDefaultInstance();
    } catch (err: any) {
      showError("Erro na Criação", err.message || "Não foi possível criar a instância.");
    } finally {
      setActionLoading(false);
    }
  };

  // Excluir Instância Padrão
  const handleDeleteInstance = async () => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/sa/settings/default-instance", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao excluir instância padrão");
      }
      showSuccess("Excluída!", "Instância padrão removida do sistema com sucesso.");
      setDeleteModalOpen(false);
      setDefaultInstance(null);
    } catch (err: any) {
      showError("Erro na Exclusão", err.message || "Não foi possível excluir a instância.");
    } finally {
      setActionLoading(false);
    }
  };

  // Ações Rápidas (Restart / Disconnect)
  const handleInstanceAction = async (action: "restart" | "disconnect") => {
    if (!defaultInstance) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/sa/instances/${defaultInstance.id}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Falha ao executar ação ${action}`);
      }
      showSuccess("Sucesso", data.message || `Ação executada com sucesso!`);
      if (action === "restart") {
        setRestartModalOpen(false);
      }
      if (action === "disconnect") {
        setDisconnectModalOpen(false);
      }
      await fetchDefaultInstance();
    } catch (err: any) {
      showError("Erro na Ação", err.message || "Erro ao comunicar com a Evolution API");
    } finally {
      setActionLoading(false);
    }
  };

  // Abrir Modal de QR Code
  const handleOpenQrModal = async () => {
    if (!defaultInstance) return;
    setQrModalOpen(true);
    setQrLoading(true);
    setQrBase64(null);
    setQrStatusText("Conectando à Evolution API...");

    try {
      const res = await fetch(`/api/sa/instances/${defaultInstance.id}/qrcode?restart=true`);
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.connected) {
          setQrModalOpen(false);
          showSuccess("Conectado!", "WhatsApp conectado com sucesso!");
          fetchDefaultInstance();
          return;
        }
        if (data.qrcode_base64 || data.qrcode) {
          setQrBase64(data.qrcode_base64 || data.qrcode);
          setQrStatusText("Aponte a câmera do WhatsApp para conectar:");
        }
      } else {
        setQrStatusText(data.message || data.error || "Aguardando geração do QR Code...");
      }
    } catch (err: any) {
      setQrStatusText("Erro ao obter QR Code da Evolution API.");
    } finally {
      setQrLoading(false);
    }

    // Iniciar polling acelerado para detecção instantânea de conexão e atualização do QR Code
    if (qrPollingRef.current) clearInterval(qrPollingRef.current);
    qrPollingRef.current = setInterval(async () => {
      try {
        // 1. Checar status da conexão via rota dedicada de status em tempo real
        const statusRes = await fetch(`/api/sa/instances/${defaultInstance.id}/status`);
        const statusData = await statusRes.json();
        if (statusData.success && (statusData.connected || statusData.status === "connected")) {
          if (qrPollingRef.current) {
            clearInterval(qrPollingRef.current);
            qrPollingRef.current = null;
          }
          setQrModalOpen(false);
          showSuccess("WhatsApp Conectado!", "A Instância Padrão foi autenticada e conectada com sucesso!");
          await fetchDefaultInstance();
          return;
        }

        // 2. Se ainda não conectou, renovar QR Code se disponível
        const res = await fetch(`/api/sa/instances/${defaultInstance.id}/qrcode`);
        const data = await res.json();
        if (data.status === "connected" || data.connected) {
          if (qrPollingRef.current) {
            clearInterval(qrPollingRef.current);
            qrPollingRef.current = null;
          }
          setQrModalOpen(false);
          showSuccess("WhatsApp Conectado!", "A Instância Padrão foi autenticada e conectada com sucesso!");
          await fetchDefaultInstance();
        } else if (data.qrcode_base64 || data.qrcode) {
          setQrBase64(data.qrcode_base64 || data.qrcode);
        }
      } catch {
        // Silencioso no loop
      }
    }, 2500);
  };

  // Fechar Modal QR Code
  const handleCloseQrModal = () => {
    setQrModalOpen(false);
    if (qrPollingRef.current) {
      clearInterval(qrPollingRef.current);
      qrPollingRef.current = null;
    }
  };

  // Enviar Mensagem de Teste
  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defaultInstance) return;
    try {
      setSendingTest(true);
      const res = await fetch(`/api/sa/instances/${defaultInstance.id}/send-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: testPhone,
          phone: testPhone,
          message: testMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao enviar mensagem de teste");
      }
      showSuccess("Enviado com Sucesso!", "Mensagem de teste disparada pelo WhatsApp padrão.");
      setTestModalOpen(false);
      setTestPhone("");
      await fetchDefaultInstance();
    } catch (err: any) {
      showError("Erro no Envio", err.message || "Não foi possível enviar a mensagem.");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Padronizado */}
      <SaPageHeader
        title="Instância Padrão do Sistema"
        subtitle="Gerenciamento da conexão WhatsApp matriz utilizada em disparos do sistema, notificações e alertas globais."
        icon={Server}
        onRefresh={fetchDefaultInstance}
        isRefreshing={loadingInstance}
      />

      {/* CONTEÚDO DA PÁGINA */}
      <div className="space-y-6">
        {loadingInstance && !defaultInstance ? (
          <div className="rounded-2xl bg-[#0b1120] border border-slate-800/80 p-12 text-center">
            <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-400">Consultando status da Instância Padrão...</p>
          </div>
        ) : !defaultInstance ? (
          /* CARD QUANDO NÃO EXISTE INSTÂNCIA PADRÃO */
          <div className="rounded-2xl bg-[#0b1120] border border-dashed border-slate-800 p-8 sm:p-12 text-center space-y-6 shadow-xl shadow-black/40">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto shadow-inner shadow-indigo-500/20">
              <Server className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-bold text-white">Nenhuma Instância Padrão Configurada</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A instância padrão funciona como a conexão WhatsApp matriz do sistema, sendo responsável pelo envio automático de mensagens de cobrança, confirmações de login OTP, avisos de sistema e notificações institucionais.
              </p>
            </div>

            <div className="pt-2">
              {can("default_instance", "create") ? (
                <button
                  type="button"
                  onClick={handleCreateInstanceDirect}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{actionLoading ? "Criando Instância..." : "Criar Instância Padrão do Sistema"}</span>
                </button>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Você não possui permissão para criar a instância padrão do sistema.
                </p>
              )}
            </div>
          </div>
        ) : (
          /* CARD DE DETALHES DA INSTÂNCIA PADRÃO ATIVA */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card Principal no Padrão do Cadastro da Empresa */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg shadow-black/20">
              <div>
                {/* Topo do Card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">
                          {defaultInstance.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                          Matriz Sistema
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {defaultInstance.instance_key}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {defaultInstance.status === "connected" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Conectada
                    </span>
                  ) : defaultInstance.status === "connecting" || defaultInstance.status === "qrcode" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <RotateCw className="w-3 h-3 animate-spin" />
                      Aguardando
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      Desconectada
                    </span>
                  )}
                </div>

                {/* Informações de Perfil WhatsApp Conectado ou Mensagem NÃO CONECTADO */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs">
                  {defaultInstance.status === "connected" ? (
                    <div className="flex items-center gap-3">
                      {defaultInstance.profile_picture_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={defaultInstance.profile_picture_url}
                          alt={defaultInstance.profile_name || "WhatsApp Perfil"}
                          className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/50 shrink-0 shadow-md shadow-emerald-950/40"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0 shadow-inner">
                          {defaultInstance.profile_name
                            ? defaultInstance.profile_name.slice(0, 2).toUpperCase()
                            : <Smartphone className="w-6 h-6" />}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-white text-sm block truncate">
                          {defaultInstance.profile_name || "WhatsApp Conectado"}
                        </span>
                        <span className="font-mono text-xs text-emerald-400 font-medium block mt-0.5">
                          {maskPhone(defaultInstance.phone_connected || defaultInstance.whatsapp_number || "") || "Número ativo"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 px-4 rounded-xl bg-slate-900/50 border border-dashed border-rose-500/20 text-center space-y-3">
                      {/* Robozinho dormindo/esperando animado */}
                      <div className="relative flex items-center justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/40 animate-bounce">
                          <Bot className="w-7 h-7" />
                        </div>
                        {/* Zzz flutuantes animados */}
                        <div className="absolute -top-2 -right-3 flex items-center gap-0.5 select-none pointer-events-none">
                          <span className="text-[10px] font-black text-rose-400 animate-pulse delay-75">z</span>
                          <span className="text-xs font-black text-amber-400 animate-pulse delay-150">Z</span>
                          <span className="text-sm font-black text-indigo-400 animate-pulse delay-300">Z</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-xs tracking-wider text-rose-400 inline-flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                          WHATSAPP NÃO CONECTADO
                        </span>
                        <p className="text-[11px] text-slate-400 max-w-xs">
                          O robô do sistema está tirando um cochilo aguardando a leitura do QR Code! 😴💤
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ações da Instância - Padronizadas com a Tela de Empresas */}
              <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-800/60">
                <div className="flex items-center gap-2 flex-wrap">
                  {can("default_instance", "edit") && (
                    <>
                      {defaultInstance.status === "connected" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setTestModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-all cursor-pointer whitespace-nowrap"
                            title="Testar Envio de Mensagem no WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5 shrink-0" />
                            <span>Testar Envio</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDisconnectModalOpen(true)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer whitespace-nowrap"
                            title="Desconectar WhatsApp"
                          >
                            <Power className="w-3.5 h-3.5 shrink-0" />
                            <span>Desconectar</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={handleOpenQrModal}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer whitespace-nowrap"
                          title="Gerar QR Code para Leitura"
                        >
                          <QrCode className="w-3.5 h-3.5 shrink-0" />
                          <span>Gerar QRCode</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setRestartModalOpen(true)}
                        disabled={actionLoading}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors cursor-pointer"
                        title="Reiniciar Instância"
                      >
                        <RotateCw className={`w-3.5 h-3.5 shrink-0 ${actionLoading ? "animate-spin text-indigo-400" : ""}`} />
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {can("default_instance", "delete") && (
                    <button
                      type="button"
                      onClick={() => setDeleteModalOpen(true)}
                      disabled={actionLoading}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                      title="Excluir Instância"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Informações Técnicas e de Integração */}
            <div className="rounded-2xl bg-[#0b1120] border border-slate-800/80 p-6 space-y-4 shadow-xl shadow-black/40">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Diretrizes do Sistema</span>
              </h4>

              <div className="space-y-3 text-xs text-slate-400">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <span className="font-semibold text-slate-200 block">Finalidade Exclusiva</span>
                  <p className="text-[11px] leading-relaxed">
                    Esta conexão não é vinculada a nenhuma empresa (Tenant) e serve unicamente para operações globais do Super Admin.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <span className="font-semibold text-slate-200 block">Motor Evolution API v2.3.7</span>
                  <p className="text-[11px] leading-relaxed">
                    Gerenciada nativamente pelo WebSocket da Evolution API com persistência local no banco de dados do SaaS.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <span className="font-semibold text-slate-200 block">Nome da Instância</span>
                  <p className="font-mono text-[11px] text-indigo-300 truncate">
                    {defaultInstance.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: EXCLUIR INSTÂNCIA PADRÃO */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0b1120] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Excluir Instância Padrão?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tem certeza que deseja excluir a instância matriz do sistema? Os envios automatizados globais ficarão suspensos até que uma nova instância seja criada.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-colors whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteInstance}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Excluir Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR REINICIALIZAÇÃO */}
      {restartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0b1120] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <RotateCw className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Reiniciar Instância?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Esta ação reiniciará o socket da conexão com a Evolution API para restabelecer a comunicação com o WhatsApp. A sessão continuará salva.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRestartModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleInstanceAction("restart")}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                <span>Confirmar Reinicialização</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR DESCONEXÃO */}
      {disconnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0b1120] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Power className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Desconectar WhatsApp?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tem certeza que deseja desconectar o WhatsApp da instância <strong className="text-white font-bold">{defaultInstance?.name}</strong>? Para reconectar, será necessário ler um novo QR Code.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDisconnectModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleInstanceAction("disconnect")}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                <span>Confirmar Desconexão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QR CODE PAREAMENTO */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#0b1120] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-center animate-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">Conectar WhatsApp</h3>
              <p className="text-xs text-slate-400">{qrStatusText}</p>
            </div>

            <div className="flex justify-center p-4 bg-white rounded-2xl border border-slate-200 max-w-[240px] mx-auto shadow-lg">
              {qrLoading ? (
                <div className="w-48 h-48 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                </div>
              ) : qrBase64 ? (
                <img
                  src={qrBase64.startsWith("data:") ? qrBase64 : `data:image/png;base64,${qrBase64}`}
                  alt="QR Code WhatsApp"
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-500 p-2">
                  Gerando código de conexão...
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCloseQrModal}
                className="w-full py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 font-bold text-xs transition-colors whitespace-nowrap"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ENVIAR MENSAGEM TESTE */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0b1120] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Disparar Mensagem de Teste</h3>
                <p className="text-[11px] text-slate-400">Valide a entrega de mensagens pelo WhatsApp matriz</p>
              </div>
            </div>

            <form onSubmit={handleSendTestMessage} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Número de Destino com DDD</label>
                <input
                  type="text"
                  required
                  value={testPhone}
                  onChange={(e) => setTestPhone(maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Mensagem de Texto</label>
                <textarea
                  rows={3}
                  required
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-colors whitespace-nowrap"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sendingTest || !testPhone.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 whitespace-nowrap"
                >
                  {sendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Enviar Agora</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
