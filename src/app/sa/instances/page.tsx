"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Server,
  Search,
  Filter,
  RefreshCw,
  Smartphone,
  Building2,
  Send,
  Power,
  RotateCw,
  X,
  AlertTriangle,
} from "lucide-react";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { maskPhone } from "@/lib/validators";
import { Pagination } from "@/components/ui/Pagination";

interface Instance {
  id: number;
  company_id: number;
  company_name: string;
  company_trade_name?: string | null;
  name: string;
  whatsapp_number: string | null;
  server_url: string | null;
  instance_key: string;
  status: "connected" | "connecting" | "disconnected" | "banned" | "qrcode";
  phone_connected: string | null;
  profile_name: string | null;
  profile_picture_url: string | null;
  battery_level: number | null;
  is_charging: boolean | null;
  total_messages_sent: number;
  total_messages_received: number;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CompanyOption {
  id: number;
  name: string;
  trade_name: string | null;
}

export default function InstancesPage() {
  const { showError, showSuccess } = useFeedbackModal();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal de Confirmação de Ação (Desconectar)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [instanceToDisconnect, setInstanceToDisconnect] = useState<Instance | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  // Modal de Teste de Envio
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testInstance, setTestInstance] = useState<Instance | null>(null);
  const [testNumber, setTestNumber] = useState("");
  const [testMessage, setTestMessage] = useState(
    "Olá! Esta é uma mensagem de teste enviada pela plataforma do Super Admin."
  );
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Carregar dados de instâncias e empresas
  const fetchInstances = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (companyFilter !== "all") params.append("company_id", companyFilter);

      const [instRes, compRes] = await Promise.all([
        fetch(`/api/sa/instances?${params.toString()}`),
        fetch("/api/sa/companies"),
      ]);

      const instJson = await instRes.json();
      const compJson = await compRes.json();

      if (instJson.success) {
        setInstances(instJson.instances || []);
      } else {
        showError(
          "Erro ao carregar instâncias",
          instJson.error || "Não foi possível buscar as instâncias."
        );
      }

      if (compJson.success) {
        setCompanies(compJson.companies || []);
      }
    } catch {
      showError("Falha de Comunicação", "Erro ao conectar com a API de instâncias.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, companyFilter, showError]);

  useEffect(() => {
    setCurrentPage(1);
    fetchInstances();
  }, [fetchInstances]);

  const paginatedInstances = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return instances.slice(startIndex, startIndex + pageSize);
  }, [instances, currentPage, pageSize]);

  // Polling em tempo real a cada 4 segundos
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        if (statusFilter !== "all") params.append("status", statusFilter);
        if (companyFilter !== "all") params.append("company_id", companyFilter);

        const res = await fetch(`/api/sa/instances?${params.toString()}`);
        const data = await res.json();
        if (data.success && data.instances) {
          setInstances(data.instances);
        }
      } catch (err) {
        console.warn("Polling de instâncias em tempo real:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [searchTerm, statusFilter, companyFilter]);

  // Abrir Modal de Confirmação para Desconectar
  const handleOpenDisconnectModal = (inst: Instance) => {
    setInstanceToDisconnect(inst);
    setConfirmModalOpen(true);
  };

  // Confirmar Desconexão da Instância
  const handleConfirmDisconnect = async () => {
    if (!instanceToDisconnect) return;

    try {
      setIsExecutingAction(true);
      const res = await fetch(`/api/sa/instances/${instanceToDisconnect.id}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      const data = await res.json();

      if (data.success) {
        setConfirmModalOpen(false);
        setInstanceToDisconnect(null);
        showSuccess("Instância Desconectada", data.message || "A sessão do WhatsApp foi encerrada com sucesso.");
        fetchInstances();
      } else {
        showError(data.error || "Não foi possível desconectar a instância.", "Falha na Ação");
      }
    } catch {
      showError("Erro de comunicação ao tentar desconectar a instância.", "Erro");
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Abrir Modal de Teste de Envio
  const handleOpenTestModal = (inst: Instance) => {
    setTestInstance(inst);
    setTestNumber("");
    setTestMessage("Olá! Esta é uma mensagem de teste enviada pela plataforma do Super Admin.");
    setTestModalOpen(true);
  };

  // Enviar Mensagem de Teste
  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInstance) return;

    const rawNum = testNumber.replace(/\D/g, "");
    if (rawNum.length < 10) {
      showError("Por favor informe um número de telefone válido.", "Número Inválido");
      return;
    }

    try {
      setIsSendingTest(true);
      const res = await fetch(`/api/sa/instances/${testInstance.id}/send-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: rawNum,
          message: testMessage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestModalOpen(false);
        showSuccess(
          "Mensagem Enviada",
          "A mensagem de teste foi enviada com sucesso para o WhatsApp informado!"
        );
        fetchInstances();
      } else {
        showError(data.error || "Não foi possível enviar a mensagem de teste.", "Erro no Envio");
      }
    } catch {
      showError("Erro de comunicação ao tentar enviar o teste.", "Erro");
    } finally {
      setIsSendingTest(false);
    }
  };

  // Métricas do Topo
  const totalInstances = instances.length;
  const connectedCount = instances.filter((i) => i.status === "connected").length;
  const connectingCount = instances.filter(
    (i) => i.status === "connecting" || i.status === "qrcode"
  );
  const disconnectedCount = instances.filter(
    (i) => i.status === "disconnected" || i.status === "banned"
  ).length;

  return (
    <div className="space-y-6">
      {/* 1. CABEÇALHO PADRÃO DO SISTEMA */}
      <div className="flex flex-col gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Server className="w-6 h-6 text-indigo-400" />
              Instâncias WhatsApp
            </h1>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitore servidores de conexão, status de sockets, QR Codes e telemetria de mensagens do WhatsApp por empresa.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 w-full pt-1">
          <button
            onClick={() => fetchInstances()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all focus:outline-none disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? "animate-spin" : ""}`} />
            <span className="whitespace-nowrap">Atualizar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total de Instâncias
            </p>
            <p className="text-2xl font-black text-white mt-1">{totalInstances}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Conectadas / Online
            </p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{connectedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Em Conexão / Aguardando
            </p>
            <p className="text-2xl font-black text-amber-400 mt-1">{connectingCount.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <RotateCw className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Desconectadas
            </p>
            <p className="text-2xl font-black text-slate-400 mt-1">{disconnectedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
            <Power className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome, chave, whatsapp ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Filtro por Empresa */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl w-full sm:w-auto">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer w-full"
            >
              <option value="all" className="bg-slate-900 text-slate-200">Todas as Empresas</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                  {c.trade_name || c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Status */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer w-full"
            >
              <option value="all" className="bg-slate-900 text-slate-200">Todos os Status</option>
              <option value="connected" className="bg-slate-900 text-slate-200">Conectadas</option>
              <option value="connecting" className="bg-slate-900 text-slate-200">Conectando</option>
              <option value="qrcode" className="bg-slate-900 text-slate-200">Aguardando QR</option>
              <option value="disconnected" className="bg-slate-900 text-slate-200">Desconectadas</option>
              <option value="banned" className="bg-slate-900 text-slate-200">Banidas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela / Lista de Instâncias */}
      <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 shadow-2xl shadow-black/30 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-xs font-medium">Carregando instâncias do ecossistema...</p>
          </div>
        ) : instances.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-center text-slate-400">
              <Server className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nenhuma instância encontrada</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                As instâncias do WhatsApp são criadas e vinculadas exclusivamente através do cadastro da empresa.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left text-xs table-fixed">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[24%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead className="bg-[#0b1222] border-b border-slate-800/90 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Empresa / WhatsApp</th>
                  <th className="px-3 py-3 whitespace-nowrap">Perfil</th>
                  <th className="px-3 py-3 whitespace-nowrap">Número</th>
                  <th className="px-3 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedInstances.map((inst) => {
                  const isConnected = inst.status === "connected";
                  const isConnecting = inst.status === "connecting" || inst.status === "qrcode";

                  return (
                    <tr
                      key={inst.id}
                      className="hover:bg-slate-900/40 transition-colors group"
                    >
                      {/* Empresa / WhatsApp */}
                      <td className="px-4 py-3 min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
                            <Smartphone className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-white flex items-center gap-1 leading-tight truncate">
                              <span className="font-semibold truncate">{inst.company_trade_name || inst.company_name}</span>
                              <span className="text-slate-500 font-normal shrink-0">/</span>
                              <span className="text-indigo-300 font-medium truncate">{inst.name}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 truncate">
                              <Building2 className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                              <span className="truncate">{inst.company_name}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Perfil do WhatsApp */}
                      <td className="px-3 py-3 min-w-0">
                        {isConnected ? (
                          <div className="flex items-center gap-2 min-w-0">
                            {inst.profile_picture_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={inst.profile_picture_url}
                                alt={inst.profile_name || "WhatsApp"}
                                className="w-6 h-6 rounded-full object-cover border border-emerald-500/40 shrink-0 shadow-sm shadow-emerald-950/40"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-[9px] shrink-0 shadow-inner">
                                {inst.profile_name
                                  ? inst.profile_name.slice(0, 2).toUpperCase()
                                  : <Smartphone className="w-3 h-3" />}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-white text-xs leading-tight truncate">
                                {inst.profile_name || "WhatsApp Conectado"}
                              </p>
                              <p className="text-[10px] text-emerald-400 font-medium">Autenticado</p>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/60 border border-slate-800 text-slate-400 text-[10px] whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80 shrink-0" />
                            <span className="font-medium">Não Conectado</span>
                          </div>
                        )}
                      </td>

                      {/* Número Conectado */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {isConnected ? (
                          <div className="font-mono text-xs font-medium text-emerald-400">
                            {maskPhone(inst.phone_connected || inst.whatsapp_number || "") || "Número Ativo"}
                          </div>
                        ) : inst.whatsapp_number ? (
                          <div className="font-mono text-xs text-slate-400">
                            {maskPhone(inst.whatsapp_number)}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {isConnected ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            Conectada
                          </span>
                        ) : isConnecting ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <RotateCw className="w-3 h-3 animate-spin shrink-0" />
                            Aguardando
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                            Desconectada
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isConnected ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenTestModal(inst)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/40 hover:border-indigo-500/70 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                                title="Testar Envio de Mensagem no WhatsApp"
                                aria-label="Testar Envio de Mensagem no WhatsApp"
                              >
                                <Send className="w-4 h-4 shrink-0" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDisconnectModal(inst)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 hover:border-rose-500/60 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                                title="Desconectar WhatsApp"
                                aria-label="Desconectar WhatsApp"
                              >
                                <Power className="w-4 h-4 shrink-0" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic whitespace-nowrap">
                              Conectar na Empresa
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && instances.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={instances.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Modal de Confirmação de Ação: Desconectar */}
      {confirmModalOpen && instanceToDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Desconectar WhatsApp</h3>
              <p className="text-xs text-slate-400 mt-1">
                Deseja realmente desconectar a instância{" "}
                <strong className="text-white">{instanceToDisconnect.name}</strong> da empresa{" "}
                <strong className="text-indigo-300">
                  {instanceToDisconnect.company_trade_name || instanceToDisconnect.company_name}
                </strong>
                ? O WhatsApp deixará de enviar e receber mensagens até ser reconectado no cadastro da empresa.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setConfirmModalOpen(false);
                  setInstanceToDisconnect(null);
                }}
                disabled={isExecutingAction}
                className="w-full py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDisconnect}
                disabled={isExecutingAction}
                className="w-full py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isExecutingAction ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Power className="w-3.5 h-3.5" />
                )}
                <span>Desconectar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Teste de Envio de Mensagem WhatsApp */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Testar Envio de Mensagem</h3>
                  <p className="text-xs text-slate-400">
                    Instância: <strong className="text-white">{testInstance?.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTestModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendTestMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Número do WhatsApp de Destino: <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-9999"
                    value={testNumber}
                    onChange={(e) => setTestNumber(maskPhone(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Informe o DDD e o número completo para onde o teste será enviado.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Mensagem de Teste:
                </label>
                <textarea
                  rows={3}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  disabled={isSendingTest}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSendingTest ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando Mensagem...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Teste</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
