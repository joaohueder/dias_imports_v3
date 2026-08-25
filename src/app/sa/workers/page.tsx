"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Cpu,
  RefreshCw,
  Play,
  Pause,
  RotateCw,
  Server,
  Activity,
  Layers,
  AlertTriangle,
  HardDrive,
  Database,
} from "lucide-react";
import { SaPageHeader } from "@/components/sa/SaPageHeader";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";

interface WorkerItem {
  id: string;
  name: string;
  description?: string;
  type: string;
  queue: string;
  concurrency: number;
  status: "active" | "idle" | "paused";
  processed: number;
  failed: number;
  delayed: number;
  cpu_usage: string;
  memory_usage: string;
  uptime_seconds: number;
  last_heartbeat: string;
}

interface SystemStats {
  cpuCount: number;
  cpuModel: string;
  totalMemoryMB: number;
  usedMemoryMB: number;
  freeMemoryMB: number;
  systemUptime: number;
  redisHost: string;
  redisStatus: string;
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  pausedWorkers: number;
  totalProcessed: number;
  totalFailed: number;
}

export default function SaWorkersPage() {
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal de confirmação
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerItem | null>(null);
  const [selectedAction, setSelectedAction] = useState<"start" | "pause" | "restart">("restart");

  const { showError, showSuccess } = useFeedbackModal();

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch("/api/sa/workers");
      if (!res.ok) {
        if (res.status === 403) {
          showError("Você não possui permissão para visualizar os Workers.", "Acesso Restrito");
          return;
        }
        throw new Error("Falha ao carregar dados dos workers");
      }
      const data = await res.json();
      setWorkers(data.workers || []);
      setStats(data.systemStats || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao consultar workers";
      showError(msg, "Falha de Carregamento");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  // Polling a cada 5 segundos se autoRefresh estiver ativado
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchWorkers();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchWorkers]);

  const handleOpenAction = (worker: WorkerItem, action: "start" | "pause" | "restart") => {
    setSelectedWorker(worker);
    setSelectedAction(action);
    setConfirmModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!selectedWorker) return;
    setActionLoading(selectedWorker.id);
    try {
      const res = await fetch(`/api/sa/workers/${selectedWorker.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: selectedAction }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao executar ação no worker");
      }
      showSuccess(data.message || "Ação concluída com sucesso.", "Worker Atualizado");
      setConfirmModalOpen(false);
      setSelectedWorker(null);
      await fetchWorkers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na operação";
      showError(msg, "Falha na Execução");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      {/* 1. CABEÇALHO PADRONIZADO */}
      <SaPageHeader
        title="Gerenciamento de Workers"
        subtitle="Monitoramento de processos em background, threads de execução, concorrência e instâncias de processamento do ecossistema."
        statusBadge="Threads & Concorrência"
        onRefresh={fetchWorkers}
        isRefreshing={loading}
        refreshLabel="Atualizar Workers"
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

      {/* 2. CARDS DE TELEMETRIA E HARDWARE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Workers Ativos */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Workers Ativos
            </p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {stats ? `${stats.activeWorkers} / ${stats.totalWorkers}` : "--"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        {/* Tarefas Processadas */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Tarefas Processadas
            </p>
            <p className="text-2xl font-black text-indigo-400 mt-1">
              {stats ? stats.totalProcessed.toLocaleString("pt-BR") : "--"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Consumo de Memória */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Memória do Sistema
            </p>
            <p className="text-2xl font-black text-white mt-1">
              {stats ? `${stats.usedMemoryMB} MB` : "--"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>

        {/* Servidor Redis */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Conexão Redis
            </p>
            <p className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              {stats ? stats.redisHost : "127.0.0.1:6379"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. TABELA / LISTA DE WORKERS */}
      <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 shadow-2xl shadow-black/30 overflow-hidden">
        {loading && workers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-xs font-medium">Carregando instâncias de workers...</p>
          </div>
        ) : workers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-center text-slate-400">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nenhum worker ativo encontrado</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Os processos em background são inicializados automaticamente junto aos serviços do ecossistema.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <table className="w-full text-left text-xs table-auto">
              <thead className="bg-[#0b1222] border-b border-slate-800/90 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="pl-6 pr-4 py-3.5 whitespace-nowrap">Worker / Identificador</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Fila Atribuída</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Concorrência</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Telemetria (CPU / RAM)</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Sucessos / Falhas</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                  <th className="pl-4 pr-6 py-3.5 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {workers.map((w) => {
                  const isActive = w.status === "active";
                  const isIdle = w.status === "idle";
                  const isPaused = w.status === "paused";

                  return (
                    <tr
                      key={w.id}
                      className="hover:bg-slate-900/40 transition-colors group"
                    >
                      {/* Worker / Identificador */}
                      <td className="pl-6 pr-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 ${
                              isActive
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                : isIdle
                                ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                                : "bg-slate-800 border-slate-700 text-slate-400"
                            }`}
                            title={w.description || w.name}
                          >
                            <Cpu className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 max-w-[280px]">
                            <div className="text-xs text-white font-semibold truncate leading-tight">
                              {w.name}
                            </div>
                            {w.description && (
                              <div
                                className="text-[11px] text-slate-400 truncate mt-0.5"
                                title={w.description}
                              >
                                {w.description}
                              </div>
                            )}
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                              ID: {w.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Fila Atribuída */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-indigo-300 whitespace-nowrap">
                          <Server className="w-3 h-3 text-indigo-400 shrink-0" />
                          {w.queue}
                        </span>
                      </td>

                      {/* Concorrência */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-semibold text-white">
                          {w.concurrency} {w.concurrency === 1 ? "thread" : "threads"}
                        </span>
                      </td>

                      {/* Telemetria (CPU / RAM) */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 font-mono text-xs text-slate-300 whitespace-nowrap">
                          <span>{w.cpu_usage} CPU</span>
                          <span className="text-slate-600">/</span>
                          <span>{w.memory_usage}</span>
                        </div>
                      </td>

                      {/* Sucessos / Falhas */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 text-xs font-mono whitespace-nowrap">
                          <span className="text-emerald-400 font-semibold">{w.processed} ok</span>
                          <span className="text-slate-600">/</span>
                          <span className={w.failed > 0 ? "text-rose-400 font-bold" : "text-slate-500"}>
                            {w.failed} falhas
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            Em Execução
                          </span>
                        ) : isIdle ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            Ocioso / Standby
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                            Pausado
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="pl-4 pr-6 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {isPaused ? (
                            <button
                              type="button"
                              onClick={() => handleOpenAction(w, "start")}
                              disabled={actionLoading === w.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-sm disabled:opacity-50"
                              title="Iniciar Worker"
                            >
                              <Play className="w-3.5 h-3.5 shrink-0" />
                              <span className="whitespace-nowrap">Iniciar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenAction(w, "pause")}
                              disabled={actionLoading === w.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-sm disabled:opacity-50"
                              title="Pausar Worker"
                            >
                              <Pause className="w-3.5 h-3.5 shrink-0" />
                              <span className="whitespace-nowrap">Pausar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenAction(w, "restart")}
                            disabled={actionLoading === w.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-sm disabled:opacity-50"
                            title="Reiniciar Processo"
                          >
                            <RotateCw className={`w-3.5 h-3.5 shrink-0 ${actionLoading === w.id ? "animate-spin" : ""}`} />
                            <span className="whitespace-nowrap">Reiniciar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODAL DE CONFIRMAÇÃO DE AÇÃO DO WORKER */}
      {confirmModalOpen && selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 text-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
              selectedAction === "restart"
                ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                : selectedAction === "pause"
                ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
            }`}>
              {selectedAction === "restart" ? (
                <RotateCw className="w-6 h-6" />
              ) : selectedAction === "pause" ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                {selectedAction === "restart"
                  ? "Reiniciar Worker"
                  : selectedAction === "pause"
                  ? "Pausar Worker"
                  : "Iniciar Worker"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Deseja confirmar a ação no worker{" "}
                <strong className="text-indigo-300">{selectedWorker.name}</strong>?
                {selectedAction === "pause" && " Novas mensagens e rotinas da fila aguardarão a retomada."}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setConfirmModalOpen(false);
                  setSelectedWorker(null);
                }}
                disabled={actionLoading !== null}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={actionLoading !== null}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 ${
                  selectedAction === "restart"
                    ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
                    : selectedAction === "pause"
                    ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                }`}
              >
                {actionLoading === selectedWorker.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span className="whitespace-nowrap">Executando...</span>
                  </>
                ) : (
                  <span className="whitespace-nowrap">Confirmar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
