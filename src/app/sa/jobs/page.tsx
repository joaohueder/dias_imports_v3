"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Layers,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Server,
  Activity,
  Plus,
  Trash2,
  Send,
  Timer,
  Eye,
  Search,
  Filter,
} from "lucide-react";
import { SaPageHeader } from "@/components/sa/SaPageHeader";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { useSaAuth } from "@/context/SaAuthContext";
import { maskPhone } from "@/lib/validators";
import { Pagination } from "@/components/ui/Pagination";

interface QueueItem {
  id: string;
  name: string;
  description: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

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

export default function SaJobsPage() {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal para enfileirar nova tarefa de teste/produção
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedJobDetails, setSelectedJobDetails] = useState<JobItem | null>(null);
  const [availableInstances, setAvailableInstances] = useState<Array<{ id: number; name: string; whatsapp_number: string; is_default: boolean; status: string }>>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [selectedInstanceName, setSelectedInstanceName] = useState("");
  const [selectedQueue, setSelectedQueue] = useState("whatsapp-messages-high");
  const [jobName, setJobName] = useState("dispatch-test-message");
  const [recipientNumber, setRecipientNumber] = useState("(11) 99999-9999");
  const [messageText, setMessageText] = useState("Teste de envio via fila");
  const [customPayloadJson, setCustomPayloadJson] = useState("");
  const [useCustomJson, setUseCustomJson] = useState(false);

  // Filtros de busca na lista de execuções
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredJobs = jobs.filter((job) => {
    const matchSearch =
      job.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      job.id.toLowerCase().includes(searchFilter.toLowerCase());
    const matchStatus =
      statusFilter === "all" ? true : job.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginatedJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const { showError, showSuccess } = useFeedbackModal();
  const { can } = useSaAuth();

  const fetchJobsData = useCallback(async () => {
    try {
      const res = await fetch("/api/sa/jobs");
      if (!res.ok) {
        if (res.status === 403) {
          showError("Você não possui permissão para visualizar a Central de Tarefas.", "Acesso Restrito");
          return;
        }
        throw new Error("Falha ao carregar dados das tarefas");
      }
      const data = await res.json();
      setQueues(data.queues || []);
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

  // Busca instâncias cadastradas para seleção obrigatória no disparo/teste (com padrão no topo)
  const fetchInstances = useCallback(async () => {
    setLoadingInstances(true);
    try {
      const res = await fetch("/api/sa/instances");
      if (res.ok) {
        const data = await res.json();
        const list: Array<{ id: number; name: string; whatsapp_number: string; phone_connected?: string; is_default: boolean; status: string }> = data.instances || [];
        
        // Ordena garantindo a instância padrão (is_default === true) sempre em primeiro lugar
        const sortedList = [...list].sort((a, b) => {
          const aDefault = Boolean(a.is_default);
          const bDefault = Boolean(b.is_default);
          if (aDefault && !bDefault) return -1;
          if (!aDefault && bDefault) return 1;
          return a.name.localeCompare(b.name);
        });

        setAvailableInstances(sortedList);
        if (sortedList.length > 0) {
          // Pré-seleciona a primeira (que será a padrão se existir)
          setSelectedInstanceName(sortedList[0].name);
        }
      }
    } catch {
      // Silencioso
    } finally {
      setLoadingInstances(false);
    }
  }, []);

  const openCreateModal = () => {
    fetchInstances();
    setIsCreateModalOpen(true);
  };

  // Polling a cada 5 segundos se autoRefresh estiver ativado
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchJobsData();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchJobsData]);

  const handleRetryJob = async (jobId: string) => {
    setActionLoading(jobId);
    try {
      const res = await fetch("/api/sa/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry", jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao retentar tarefa");
      showSuccess(data.message || "Tarefa reenfileirada com sucesso!", "Job Reenfileirado");
      await fetchJobsData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na operação";
      showError(msg, "Falha ao Retentar");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePurgeCompleted = async () => {
    setActionLoading("purge");
    try {
      const res = await fetch("/api/sa/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "purge_completed" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao limpar histórico");
      showSuccess(data.message || "Histórico limpo com sucesso!", "Tarefas Limpas");
      await fetchJobsData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na operação";
      showError(msg, "Falha ao Limpar");
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcessQueueNow = async () => {
    setActionLoading("process");
    try {
      const res = await fetch("/api/sa/workers/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queue_name: selectedQueue, limit: 10 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao processar fila");
      showSuccess(
        `Ciclo executado! ${data.processedCount || 0} tarefa(s) processada(s).`,
        "Fila Processada"
      );
      await fetchJobsData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro no processamento";
      showError(msg, "Falha ao Processar Fila");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInstanceName) {
      showError("É obrigatório selecionar uma instância cadastrada para o disparo.", "Instância Obrigatória");
      return;
    }

    setActionLoading("create");
    try {
      let finalPayload: Record<string, unknown> = {};

      if (useCustomJson) {
        if (!customPayloadJson.trim()) {
          throw new Error("O Payload customizado não pode estar vazio.");
        }
        try {
          finalPayload = JSON.parse(customPayloadJson);
        } catch {
          throw new Error("O Payload customizado fornecido não é um JSON válido.");
        }
        // Garante a instância selecionada no payload customizado
        finalPayload.instanceName = selectedInstanceName;
      } else {
        const digitsOnly = recipientNumber.replace(/\D/g, "");
        if (digitsOnly.length < 10) {
          throw new Error("Informe um número de telefone com DDD válido.");
        }
        // Se nacional (10 ou 11 dígitos), garante o código do Brasil DDI 55
        const finalNumber = (digitsOnly.length === 10 || digitsOnly.length === 11) && !digitsOnly.startsWith("55")
          ? `55${digitsOnly}`
          : digitsOnly;

        if (!messageText.trim()) {
          throw new Error("Informe o texto da mensagem a ser disparada.");
        }
        finalPayload = {
          instanceName: selectedInstanceName,
          recipient: finalNumber,
          message: messageText.trim(),
        };
      }

      const res = await fetch("/api/sa/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          queueName: selectedQueue,
          jobName,
          payload: finalPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enfileirar tarefa");
      showSuccess(data.message || "Tarefa criada com sucesso!", "Nova Tarefa Enfileirada");
      setIsCreateModalOpen(false);
      await fetchJobsData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na criação";
      showError(msg, "Falha ao Criar Tarefa");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      {/* 1. CABEÇALHO PADRONIZADO */}
      <SaPageHeader
        title="Central de Tarefas"
        subtitle="Gerenciamento e rastreabilidade de filas assíncronas, disparos em massa, retries e histórico de execução."
        statusBadge="Filas & Background Jobs"
        onRefresh={fetchJobsData}
        isRefreshing={loading}
        refreshLabel="Atualizar Tarefas"
        extraActions={
          <div className="flex items-center gap-2">
            {can("jobs", "create") && (
              <>
                <button
                  type="button"
                  onClick={handleProcessQueueNow}
                  disabled={actionLoading === "process"}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                  title="Executar ciclo de envio e processamento da fila agora"
                >
                  <Play className={`w-3.5 h-3.5 shrink-0 ${actionLoading === "process" ? "animate-spin" : ""}`} />
                  <span className="whitespace-nowrap">Processar Fila Agora</span>
                </button>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Nova Tarefa</span>
                </button>

                <button
                  type="button"
                  onClick={handlePurgeCompleted}
                  disabled={actionLoading === "purge"}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                  title="Limpar tarefas com status concluído"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="whitespace-nowrap">Limpar Concluídas</span>
                </button>
              </>
            )}

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
        }
      />

      {/* 2. CARDS DE TELEMETRIA DAS FILAS */}
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

        {/* Falhas / Retries */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Falhas / Exceções
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

      {/* 3. FILAS REGISTRADAS */}
      <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 shadow-2xl shadow-black/30 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Filas do Ecossistema (Persistência & BullMQ)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tópicos de processamento assíncrono sincronizados no banco de dados e gerenciados pelos Workers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queues.map((q) => (
            <div
              key={q.id}
              className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    {q.name}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {q.description}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  Operacional
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800/60 text-center font-mono text-[11px]">
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="block text-slate-500 text-[9px] uppercase">Ativas</span>
                  <span className="font-bold text-emerald-400">{q.active}</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="block text-slate-500 text-[9px] uppercase">Fila</span>
                  <span className="font-bold text-amber-400">{q.waiting}</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="block text-slate-500 text-[9px] uppercase">Concluídas</span>
                  <span className="font-bold text-indigo-300">{q.completed}</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="block text-slate-500 text-[9px] uppercase">Falhas</span>
                  <span className="font-bold text-rose-400">{q.failed}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. TABELA DE EXECUÇÕES RECENTES & HISTÓRICO PERSISTIDO */}
      <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 shadow-2xl shadow-black/30 overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0b1222]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <RotateCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Execuções Recentes & Histórico Persistido
              </h3>
              <p className="text-xs text-slate-400">
                Log estruturado com telemetria de latência, payload e status de conclusão.
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
                <option value="failed" className="bg-slate-900 text-slate-200">Falhas</option>
              </select>
            </div>

            <span className="text-xs font-mono font-bold text-slate-300 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
              {
                jobs.filter((j) => {
                  const matchSearch =
                    j.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                    j.id.toLowerCase().includes(searchFilter.toLowerCase());
                  const matchStatus =
                    statusFilter === "all" ? true : j.status === statusFilter;
                  return matchSearch && matchStatus;
                }).length
              }{" "}
              jobs
            </span>
          </div>
        </div>

        {/* Tabela de Tarefas */}
        {jobs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">Nenhuma tarefa registrada no histórico no momento.</p>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left text-xs table-fixed">
              <thead className="bg-[#0b1222] border-b border-slate-800/90 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="pl-6 pr-3 py-3.5 w-[30%]">Tarefa & Fila</th>
                  <th className="px-3 py-3.5 w-[25%]">Payload / Dados</th>
                  <th className="px-3 py-3.5 w-[20%]">Execução</th>
                  <th className="px-3 py-3.5 text-center w-[10%]">Tentativas</th>
                  <th className="pl-3 pr-6 py-3.5 text-right w-[15%]">Status & Duração</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedJobs.map((job) => {
                    const isCompleted = job.status === "completed";
                    const isActive = job.status === "active";
                    const isFailed = job.status === "failed";
                    const isWaiting = job.status === "waiting";

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
                        if (diffMin < 60) return `Aguardando há ${diffMin}m ${diffSec % 60}s`;
                        const diffHours = Math.floor(diffMin / 60);
                        return `Aguardando há ${diffHours}h ${diffMin % 60}m`;
                      } catch {
                        return "--";
                      }
                    };

                    return (
                      <tr
                        key={job.id}
                        className="hover:bg-slate-900/40 transition-colors group"
                      >
                        {/* Coluna 1: Tarefa, Fila & ID */}
                        <td className="pl-6 pr-3 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${
                                isCompleted
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                  : isActive
                                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                                  : isFailed
                                  ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                                  : "bg-blue-500/15 border-blue-500/30 text-blue-400"
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 shrink-0" />
                              ) : isActive ? (
                                <RotateCw className="w-5 h-5 animate-spin shrink-0" />
                              ) : isFailed ? (
                                <XCircle className="w-5 h-5 shrink-0" />
                              ) : (
                                <Clock className="w-5 h-5 shrink-0" />
                              )}
                            </div>

                            <div className="min-w-0 space-y-1">
                              <div className="font-bold text-white text-sm leading-tight truncate group-hover:text-indigo-300 transition-colors" title={job.name}>
                                {job.name}
                              </div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 font-mono text-[10px] text-indigo-300 whitespace-nowrap shrink-0">
                                  <Server className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                                  {job.queue}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 truncate" title={job.id}>
                                  #{job.id}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Coluna 2: Payload Preview com Modal */}
                        <td className="px-3 py-3.5 align-middle">
                          <button
                            type="button"
                            onClick={() => setSelectedJobDetails(job)}
                            className="w-full p-2 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 flex items-center justify-between gap-2 cursor-pointer transition-all text-left"
                            title="Clique para ver o JSON completo"
                          >
                            <div className="flex items-center gap-1.5 min-w-0 font-mono text-[11px] text-slate-400">
                              <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">
                                {JSON.stringify(job.data)}
                              </span>
                            </div>
                            <span className="text-[9px] uppercase font-bold text-indigo-400/90 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 whitespace-nowrap shrink-0">
                              JSON
                            </span>
                          </button>
                        </td>

                        {/* Coluna 3: Data/Hora de Envio e Execução */}
                        <td className="px-3 py-3.5 align-middle">
                          <div className="space-y-0.5 font-mono text-[11px]">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <span className="text-[10px] text-slate-500 font-semibold w-12 shrink-0">Envio:</span>
                              <span className="text-slate-300">{formatDateTime(job.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <span className="text-[10px] text-slate-500 font-semibold w-12 shrink-0">Proc:</span>
                              {isWaiting ? (
                                <span className="text-amber-400 font-semibold flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 animate-pulse shrink-0" />
                                  {formatWaitingTime(job.createdAt)}
                                </span>
                              ) : (
                                <span className={job.processedOn || job.finishedOn ? "text-indigo-300 font-semibold" : "text-slate-500 italic"}>
                                  {formatDateTime(job.processedOn || job.finishedOn)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Coluna 4: Tentativas */}
                        <td className="px-3 py-3.5 text-center align-middle">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-[11px] font-bold text-white whitespace-nowrap">
                            {job.attempts}
                            <span className="text-slate-500 font-normal ml-0.5">
                              /{job.max_attempts || 3}
                            </span>
                          </span>
                        </td>

                        {/* Coluna 5: Status, Duração & Retry */}
                        <td className="pl-3 pr-6 py-3.5 text-right align-middle">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center justify-end gap-1.5">
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                                  Concluído
                                </span>
                              ) : isActive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                                  <RotateCw className="w-3 h-3 animate-spin shrink-0" />
                                  Executando
                                </span>
                              ) : isFailed ? (
                                <div className="flex items-center gap-1">
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 whitespace-nowrap"
                                    title={job.failedReason}
                                  >
                                    <XCircle className="w-3 h-3 shrink-0" />
                                    Falhou
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRetryJob(job.id)}
                                    disabled={actionLoading === job.id}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                                    title="Retentar tarefa"
                                  >
                                    <RotateCw
                                      className={`w-2.5 h-2.5 shrink-0 ${
                                        actionLoading === job.id ? "animate-spin" : ""
                                      }`}
                                    />
                                    <span>Retentar</span>
                                  </button>
                                </div>
                              ) : isWaiting ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 whitespace-nowrap">
                                  <Clock className="w-3 h-3 shrink-0" />
                                  Aguardando
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30 whitespace-nowrap">
                                  Pendente
                                </span>
                              )}
                            </div>

                            {/* Duração */}
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                              <Timer className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                              {job.duration_ms ? `${job.duration_ms}ms` : "--"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {jobs.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredJobs.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* MODAL DE DETALHES E PAYLOAD DO JOB */}
      {selectedJobDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    {selectedJobDetails.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">
                    #{selectedJobDetails.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobDetails(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Fila</span>
                  <span className="text-indigo-300 font-bold">{selectedJobDetails.queue}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Duração</span>
                  <span className="text-slate-200 font-bold">{selectedJobDetails.duration_ms ? `${selectedJobDetails.duration_ms} ms` : "--"}</span>
                </div>
              </div>

              {selectedJobDetails.failedReason && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  <span className="text-[10px] font-bold uppercase tracking-wider block text-rose-400 mb-1">Motivo da Falha</span>
                  <p className="text-xs font-mono leading-relaxed">{selectedJobDetails.failedReason}</p>
                </div>
              )}

              <div>
                <span className="text-[11px] font-bold text-slate-300 block mb-1.5">
                  Payload de Parâmetros (JSON)
                </span>
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-56 overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedJobDetails.data, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedJobDetails(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL DE CRIAÇÃO MANUAL DE TAREFA COM ESCOLHA OBRIGATÓRIA DE INSTÂNCIA */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" />
                Enfileirar Nova Tarefa de Disparo
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
              {/* Instância WhatsApp Obrigatória */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-200 font-semibold">
                    Instância WhatsApp do Disparo <span className="text-rose-400">*</span>
                  </label>
                  {loadingInstances && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Carregando...
                    </span>
                  )}
                </div>
                <select
                  value={selectedInstanceName}
                  onChange={(e) => setSelectedInstanceName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs cursor-pointer"
                >
                  <option value="" disabled>
                    -- Selecione a instância conectada --
                  </option>
                  {availableInstances.map((inst) => (
                    <option key={inst.id} value={inst.name}>
                      {Boolean(inst.is_default) ? "★ [PADRÃO MATRIZ] " : ""}{inst.name} {inst.whatsapp_number ? `(${maskPhone(inst.whatsapp_number)})` : ""} - {inst.status === "connected" ? "🟢 Conectada" : "⚪ " + inst.status}
                    </option>
                  ))}
                </select>
                {availableInstances.length === 0 && !loadingInstances && (
                  <p className="text-[11px] text-amber-400/90 mt-1">
                    Nenhuma instância cadastrada encontrada. Cadastre uma instância em &quot;Instâncias WhatsApp&quot;.
                  </p>
                )}
              </div>

              {/* Fila & Nome do Job */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Fila de Destino
                  </label>
                  <select
                    value={selectedQueue}
                    onChange={(e) => setSelectedQueue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs cursor-pointer"
                  >
                    {queues.map((q) => (
                      <option key={q.id} value={q.name}>
                        {q.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Identificador / Nome do Job
                  </label>
                  <input
                    type="text"
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    required
                    placeholder="Ex: dispatch-test-message"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Alternar entre Formulário Guiado e JSON Puro */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-300 font-semibold">Parâmetros da Mensagem</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!useCustomJson) {
                      setCustomPayloadJson(
                        JSON.stringify(
                          {
                            instanceName: selectedInstanceName,
                            recipient: recipientNumber,
                            message: messageText,
                          },
                          null,
                          2
                        )
                      );
                    }
                    setUseCustomJson(!useCustomJson);
                  }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                >
                  {useCustomJson ? "Preencher em Campos" : "Editar JSON Bruto"}
                </button>
              </div>

              {!useCustomJson ? (
                <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <label className="block text-slate-400 text-[11px] font-medium mb-1">
                      WhatsApp Destinatário (com DDD)
                    </label>
                    <input
                      type="text"
                      value={recipientNumber}
                      onChange={(e) => setRecipientNumber(maskPhone(e.target.value))}
                      required
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] font-medium mb-1">
                      Mensagem de Texto
                    </label>
                    <textarea
                      rows={3}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      required
                      placeholder="Digite a mensagem para disparo..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <textarea
                    rows={5}
                    value={customPayloadJson}
                    onChange={(e) => setCustomPayloadJson(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                    placeholder='{\n  "instanceName": "minha-instancia",\n  "recipient": "5511999999999",\n  "message": "Texto"\n}'
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={actionLoading !== null}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={actionLoading !== null || !selectedInstanceName}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  {actionLoading === "create" ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span className="whitespace-nowrap">Enfileirando...</span>
                    </>
                  ) : (
                    <span className="whitespace-nowrap">Adicionar à Fila</span>
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
