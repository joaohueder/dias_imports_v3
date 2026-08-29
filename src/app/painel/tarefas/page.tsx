"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Layers,
  RotateCw,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Activity,
  Timer,
  Eye,
  Search,
  Filter,
  X,
} from "lucide-react";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { Pagination } from "@/components/ui/Pagination";
import { useLayout } from "@/context/LayoutContext";

interface JobItem {
  id: string;
  queue: string;
  name: string;
  data: Record<string, unknown>;
  status: "completed" | "active" | "failed" | "delayed" | "waiting";
  attempts: number;
  max_attempts: number;
  failedReason?: string;
  processedOn?: string;
  finishedOn?: string | null;
  duration_ms?: number | null;
  createdAt: string;
}

interface JobStats {
  totalQueues: number;
  totalWaiting: number;
  totalActive: number;
  totalCompleted: number;
  totalFailed: number;
  totalDelayed: number;
}

function getFriendlyJobName(name: string, data?: Record<string, unknown>): string {
  if (!name) return "Tarefa Geral";

  if (name.startsWith("Disparo Produto:")) {
    return name.replace("Disparo Produto:", "Envio de Produto:").replace("->", "→");
  }

  if (name.startsWith("sync_group_")) {
    const groupName = typeof data?.group_name === "string" ? ` (${data.group_name})` : "";
    return `Sincronização de Grupo${groupName}`;
  }

  if (name === "sync_instance_groups" || name === "sync_all_groups") {
    return "Sincronização de Grupos WhatsApp";
  }

  if (name === "batch_import_groups" || name === "batch_add_groups") {
    return "Importação de Grupos em Lote";
  }

  if (name === "verify_subscriptions" || name === "cron_subscriptions") {
    return "Verificação de Assinatura";
  }

  if (name === "dispatch-test-message" || name === "test_message") {
    return "Envio de Mensagem de Teste";
  }

  if (name.includes("_") || name.includes("-")) {
    return name
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return name;
}

function getFriendlyQueueName(queue: string): string {
  switch (queue) {
    case "whatsapp-messages-default":
      return "Mensagens WhatsApp";
    case "whatsapp-groups-sync":
      return "Sincronização de Grupos";
    case "cron-subscriptions":
      return "Rotina do Sistema";
    default:
      return queue.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export default function PainelTarefasPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedJobDetails, setSelectedJobDetails] = useState<JobItem | null>(null);

  // Filtros de busca na lista de execuções
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { showError } = useFeedbackModal();
  const { containerMaxWidthStyle } = useLayout();

  const fetchJobsData = useCallback(async () => {
    try {
      const res = await fetch("/api/painel/tarefas");
      if (!res.ok) {
        if (res.status === 401) return;
        throw new Error("Falha ao carregar dados das tarefas");
      }
      const data = await res.json();
      setJobs(data.recentJobs || []);
      setStats(data.stats || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao consultar tarefas";
      showError(msg, "Falha de Carregamento");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchJobsData();
  }, [fetchJobsData]);

  // Polling a cada 5 segundos se autoRefresh estiver ativado
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchJobsData();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchJobsData]);

  const filteredJobs = jobs.filter((job) => {
    const friendlyName = getFriendlyJobName(job.name, job.data);
    const friendlyQueue = getFriendlyQueueName(job.queue);
    const matchSearch =
      job.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      friendlyName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      friendlyQueue.toLowerCase().includes(searchFilter.toLowerCase()) ||
      job.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      job.queue.toLowerCase().includes(searchFilter.toLowerCase());
    const matchStatus =
      statusFilter === "all" ? true : job.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginatedJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="w-full min-h-screen pb-16 flex flex-col items-center">
      <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6 pt-6" style={containerMaxWidthStyle}>
        {/* 1. CABEÇALHO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                <Layers className="w-6 h-6 text-indigo-400" />
                Tarefas & Disparos
              </h1>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Acompanhe o processamento de envios, disparos de mensagens e tarefas assíncronas da sua empresa.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={fetchJobsData}
              disabled={loading}
              title="Recarregar lista"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-all focus:outline-none disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 shrink-0 ${loading ? "animate-spin text-indigo-400" : ""}`} />
              <span className="whitespace-nowrap">Atualizar Lista</span>
            </button>

            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                autoRefresh
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  : "bg-slate-900 text-slate-400 border-slate-800"
              }`}
            >
              <Activity className={`w-3.5 h-3.5 shrink-0 ${autoRefresh ? "animate-pulse text-emerald-400" : ""}`} />
              <span className="whitespace-nowrap">{autoRefresh ? "Auto Sync (5s)" : "Sync Pausado"}</span>
            </button>
          </div>
        </div>

        {/* 2. CARDS DE TELEMETRIA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tarefas em Execução */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Em Execução
              </p>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {stats ? stats.totalActive : "--"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Play className="w-5 h-5" />
            </div>
          </div>

          {/* Fila / Aguardando */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Aguardando Fila
              </p>
              <p className="text-2xl font-black text-amber-400 mt-1">
                {stats ? stats.totalWaiting : "--"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Sucessos Concluídos */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Concluídas com Sucesso
              </p>
              <p className="text-2xl font-black text-indigo-400 mt-1">
                {stats ? stats.totalCompleted.toLocaleString("pt-BR") : "--"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Falhas */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Falhas / Incompletas
              </p>
              <p className="text-2xl font-black text-rose-400 mt-1">
                {stats ? stats.totalFailed : "--"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 3. TABELA DE EXECUÇÕES RECENTES */}
        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 shadow-2xl shadow-black/30 overflow-hidden">
          {/* Cabeçalho */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0b1222]/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <RotateCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  Histórico de Tarefas & Disparos
                </h3>
                <p className="text-xs text-slate-400">
                  Log estruturado de envios e processamentos assíncronos da empresa.
                </p>
              </div>
            </div>

            {/* Filtros e Busca */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar tarefa ou ID..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer w-full"
                >
                  <option value="all" className="bg-slate-900 text-slate-200">Todas as Tarefas</option>
                  <option value="completed" className="bg-slate-900 text-slate-200">Concluídas</option>
                  <option value="active" className="bg-slate-900 text-slate-200">Em Execução</option>
                  <option value="waiting" className="bg-slate-900 text-slate-200">Aguardando</option>
                  <option value="failed" className="bg-slate-900 text-slate-200">Falhas</option>
                </select>
              </div>

              <span className="text-xs font-mono font-bold text-slate-300 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                {filteredJobs.length} jobs
              </span>
            </div>
          </div>

          {/* Tabela de Tarefas */}
          {jobs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Layers className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">Nenhuma tarefa registrada para sua empresa no momento.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs table-fixed min-w-[650px]">
                <thead className="bg-[#0b1222] border-b border-slate-800/90 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="pl-6 pr-3 py-3.5 w-[45%]">Tarefa & Fila</th>
                    <th className="px-3 py-3.5 w-[25%]">Execução</th>
                    <th className="px-3 py-3.5 text-center w-[12%]">Tentativas</th>
                    <th className="pl-3 pr-6 py-3.5 text-right w-[18%]">Status & Duração</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedJobs.map((job) => {
                    const isCompleted = job.status === "completed";
                    const isActive = job.status === "active";
                    const isFailed = job.status === "failed";
                    const isWaiting = job.status === "waiting";
                    const friendlyJobName = getFriendlyJobName(job.name, job.data);
                    const friendlyQueueName = getFriendlyQueueName(job.queue);

                    const formatDateTime = (dateStr?: string | null) => {
                      if (!dateStr) return "--";
                      try {
                        const d = new Date(dateStr);
                        if (isNaN(d.getTime())) return "--";
                        return d.toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        });
                      } catch {
                        return "--";
                      }
                    };

                    const formatWaitingTime = (createdAtStr?: string | null) => {
                      if (!createdAtStr) return "--";
                      try {
                        const created = new Date(createdAtStr).getTime();
                        const now = Date.now();
                        const diffSec = Math.max(0, Math.floor((now - created) / 1000));
                        if (diffSec < 60) return `Aguardando há ${diffSec}s`;
                        const diffMin = Math.floor(diffSec / 60);
                        if (diffMin < 60) return `Aguardando há ${diffMin}m`;
                        const diffH = Math.floor(diffMin / 60);
                        return `Aguardando há ${diffH}h`;
                      } catch {
                        return "--";
                      }
                    };

                    return (
                      <tr
                        key={job.id}
                        className="hover:bg-slate-900/60 transition-colors group cursor-pointer"
                        onClick={() => setSelectedJobDetails(job)}
                      >
                        <td className="pl-6 pr-3 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-white group-hover:text-indigo-400 transition-colors truncate text-sm">
                              {friendlyJobName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300">
                                {friendlyQueueName}
                              </span>
                              <span className="text-slate-600">|</span>
                              <span className="text-slate-500 truncate" title={job.id}>
                                #{job.id.substring(0, 12)}...
                              </span>
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex flex-col text-[11px]">
                            {isWaiting ? (
                              <>
                                <span className="text-amber-400 font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3 animate-pulse" />
                                  {formatWaitingTime(job.createdAt)}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Criado: {formatDateTime(job.createdAt)}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-slate-300 font-mono">
                                  {job.processedOn ? formatDateTime(job.processedOn) : formatDateTime(job.createdAt)}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Fim: {formatDateTime(job.finishedOn)}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                              job.attempts > 1
                                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                : "bg-slate-900 text-slate-400 border border-slate-800"
                            }`}
                          >
                            {job.attempts} / {job.max_attempts}
                          </span>
                        </td>

                        <td className="pl-3 pr-6 py-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isCompleted
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : isActive
                                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse"
                                  : isWaiting
                                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                              {isActive && <Play className="w-3 h-3" />}
                              {isWaiting && <Clock className="w-3 h-3" />}
                              {isFailed && <XCircle className="w-3 h-3" />}
                              {job.status === "completed"
                                ? "Concluído"
                                : job.status === "active"
                                ? "Executando"
                                : job.status === "waiting"
                                ? "Aguardando"
                                : "Falhou"}
                            </span>

                            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                              <Timer className="w-3 h-3 text-slate-500" />
                              <span>{job.duration_ms !== null && job.duration_ms !== undefined ? `${job.duration_ms}ms` : "--"}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalItems={filteredJobs.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* MODAL: DETALHES COMPLETOS DA TAREFA */}
      {selectedJobDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Detalhes da Tarefa</h3>
                  <p className="text-[11px] text-slate-400 font-mono">ID: {selectedJobDetails.id}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedJobDetails(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-[11px] text-slate-400">Tipo da Tarefa:</span>
                  <p className="font-semibold text-white text-[12px]">{getFriendlyJobName(selectedJobDetails.name, selectedJobDetails.data)}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Fila:</span>
                  <p className="font-semibold text-indigo-400 text-[12px]">{getFriendlyQueueName(selectedJobDetails.queue)}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Status Atual:</span>
                  <p className="font-semibold text-white uppercase">{selectedJobDetails.status}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Duração / Latência:</span>
                  <p className="font-semibold text-emerald-400 font-mono">
                    {selectedJobDetails.duration_ms !== null && selectedJobDetails.duration_ms !== undefined
                      ? `${selectedJobDetails.duration_ms}ms`
                      : "Em processamento ou aguardando"}
                  </p>
                </div>
              </div>

              {selectedJobDetails.failedReason && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Motivo da Falha / Exceção:
                  </span>
                  <p className="font-mono text-rose-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                    {selectedJobDetails.failedReason}
                  </p>
                </div>
              )}

              {/* Informações detalhadas se for disparo de produto */}
              {selectedJobDetails.data && typeof selectedJobDetails.data === "object" && (
                <div className="space-y-3">
                  <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                    <span className="text-slate-300 font-semibold block text-[11px]">Resumo da Operação:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {typeof selectedJobDetails.data.product_name === "string" && (
                        <div>
                          <span className="text-slate-500">Produto:</span>{" "}
                          <span className="text-slate-200 font-medium">{selectedJobDetails.data.product_name}</span>
                        </div>
                      )}
                      {typeof selectedJobDetails.data.group_name === "string" && (
                        <div>
                          <span className="text-slate-500">Grupo Destino:</span>{" "}
                          <span className="text-slate-200 font-medium">{selectedJobDetails.data.group_name}</span>
                        </div>
                      )}
                      {typeof selectedJobDetails.data.template_title === "string" && (
                        <div>
                          <span className="text-slate-500">Template Utilizado:</span>{" "}
                          <span className="text-slate-200 font-medium">{selectedJobDetails.data.template_title}</span>
                        </div>
                      )}
                      {typeof selectedJobDetails.data.number === "string" && (
                        <div>
                          <span className="text-slate-500">Identificador WhatsApp:</span>{" "}
                          <span className="text-slate-200 font-mono">{selectedJobDetails.data.number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <span className="text-slate-400 font-medium block mb-1.5 text-[11px]">Identificador do Job:</span>
                <p className="font-mono text-[11px] text-slate-500 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 select-all">
                  {selectedJobDetails.id}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedJobDetails(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
