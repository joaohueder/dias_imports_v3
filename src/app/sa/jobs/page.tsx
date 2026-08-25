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
} from "lucide-react";
import { SaPageHeader } from "@/components/sa/SaPageHeader";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";

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
  failedReason?: string;
  processedOn?: string;
  finishedOn?: string | null;
  duration_ms?: number | null;
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

  const { showError } = useFeedbackModal();

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

  // Polling a cada 5 segundos se autoRefresh estiver ativado
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchJobsData();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchJobsData]);

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
              Filas do Ecossistema
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tópicos de processamento assíncrono gerenciados pelo Redis e BullMQ.
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

      {/* 4. HISTÓRICO DE JOBS RECENTES */}
      <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 shadow-2xl shadow-black/30 overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-indigo-400" />
            Execuções Recentes & Histórico
          </h3>
        </div>

        <div className="w-full overflow-hidden">
          <table className="w-full text-left text-xs table-auto">
            <thead className="bg-[#0b1222] border-b border-slate-800/90 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="pl-6 pr-4 py-3.5 whitespace-nowrap">ID / Tarefa</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Fila</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Payload / Parâmetros</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Tentativas</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Duração</th>
                <th className="pl-4 pr-6 py-3.5 text-right whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {jobs.map((job) => {
                const isCompleted = job.status === "completed";
                const isActive = job.status === "active";
                const isFailed = job.status === "failed";

                return (
                  <tr key={job.id} className="hover:bg-slate-900/40 transition-colors">
                    {/* ID / Tarefa */}
                    <td className="pl-6 pr-4 py-3.5">
                      <div className="font-mono text-xs font-bold text-white leading-tight">
                        {job.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        #{job.id}
                      </div>
                    </td>

                    {/* Fila */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 font-mono text-[10px] text-indigo-300 whitespace-nowrap">
                        {job.queue}
                      </span>
                    </td>

                    {/* Payload */}
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400 max-w-[220px] truncate">
                      {JSON.stringify(job.data)}
                    </td>

                    {/* Tentativas */}
                    <td className="px-4 py-3.5 font-mono text-xs text-white">
                      {job.attempts}x
                    </td>

                    {/* Duração */}
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-300">
                      {job.duration_ms ? `${job.duration_ms} ms` : "--"}
                    </td>

                    {/* Status */}
                    <td className="pl-4 pr-6 py-3.5 text-right whitespace-nowrap">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          Concluído
                        </span>
                      ) : isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                          <RotateCw className="w-3 h-3 animate-spin shrink-0" />
                          Processando
                        </span>
                      ) : isFailed ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 whitespace-nowrap" title={job.failedReason}>
                          <XCircle className="w-3 h-3 shrink-0" />
                          Falhou
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30 whitespace-nowrap">
                          Pendente
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
