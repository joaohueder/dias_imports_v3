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
  Settings2,
  Clock,
  Zap,
  Square,
  Terminal,
} from "lucide-react";
import { SaPageHeader } from "@/components/sa/SaPageHeader";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { useSaAuth } from "@/context/SaAuthContext";

interface WorkerItem {
  id: string;
  name: string;
  description?: string;
  type: string;
  queue: string;
  concurrency: number;
  min_delay_seconds: number;
  max_delay_seconds: number;
  batch_size: number;
  batch_pause_seconds: number;
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
  cpuUsage?: string;
  totalMemoryMB: number;
  usedMemoryMB: number;
  freeMemoryMB: number;
  processMemoryMB?: number;
  systemUptime: number;
  redisHost: string;
  redisStatus: string;
  daemonRunning?: boolean;
  lastHeartbeatTime?: string | null;
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  pausedWorkers: number;
  totalProcessed: number;
  totalFailed: number;
}

interface Pm2Process {
  name: string;
  pm_id: number;
  status: string;
  cpu: number;
  memory: number;
  uptime: number;
  restarts: number;
}

interface Pm2State {
  available: boolean;
  daemonRunning: boolean;
  processes: Pm2Process[];
  loading: boolean;
}

export default function SaWorkersPage() {
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [pm2State, setPm2State] = useState<Pm2State>({
    available: false,
    daemonRunning: false,
    processes: [],
    loading: true,
  });
  const [pm2ActionLoading, setPm2ActionLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal de confirmação de ação
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerItem | null>(null);
  const [selectedAction, setSelectedAction] = useState<"start" | "pause" | "restart">("restart");

  // Modal de Configuração de Delays / Lotes
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configWorker, setConfigWorker] = useState<WorkerItem | null>(null);
  const [configForm, setConfigForm] = useState({
    concurrency: 5,
    min_delay_seconds: 3,
    max_delay_seconds: 15,
    batch_size: 10,
    batch_pause_seconds: 30,
  });
  const [savingConfig, setSavingConfig] = useState(false);

  const { showError, showSuccess } = useFeedbackModal();
  const { can } = useSaAuth();

  const fetchPm2Status = useCallback(async () => {
    try {
      const res = await fetch("/api/sa/workers/pm2");
      if (res.ok) {
        const data = await res.json();
        setPm2State({
          available: !!data.available,
          daemonRunning: !!data.daemonRunning,
          processes: data.processes || [],
          loading: false,
        });
      }
    } catch {
      setPm2State((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const handlePm2Action = async (action: "start" | "restart" | "stop" | "start-daemon") => {
    if (!can("workers", "edit")) {
      showError("Permissão negada para gerenciar processos do PM2.", "Acesso Restrito");
      return;
    }
    setPm2ActionLoading(action);
    try {
      const res = await fetch("/api/sa/workers/pm2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao executar comando do PM2");
      }
      showSuccess(`Comando PM2 [${action.toUpperCase()}] executado com sucesso!`, "PM2 Gerenciador");
      await fetchPm2Status();
      await fetchWorkers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na operação PM2";
      showError(msg, "Falha PM2");
    } finally {
      setPm2ActionLoading(null);
    }
  };

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
    fetchPm2Status();
  }, [fetchWorkers, fetchPm2Status]);

  // Polling a cada 5 segundos se autoRefresh estiver ativado
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchWorkers();
      fetchPm2Status();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchWorkers, fetchPm2Status]);

  const handleOpenAction = (worker: WorkerItem, action: "start" | "pause" | "restart") => {
    setSelectedWorker(worker);
    setSelectedAction(action);
    setConfirmModalOpen(true);
  };

  const handleOpenConfig = (worker: WorkerItem) => {
    setConfigWorker(worker);
    setConfigForm({
      concurrency: worker.concurrency,
      min_delay_seconds: worker.min_delay_seconds,
      max_delay_seconds: worker.max_delay_seconds,
      batch_size: worker.batch_size,
      batch_pause_seconds: worker.batch_pause_seconds,
    });
    setConfigModalOpen(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configWorker) return;
    setSavingConfig(true);
    try {
      const res = await fetch(`/api/sa/workers/${configWorker.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configForm),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao salvar configurações do worker");
      }
      showSuccess(data.message || "Configurações atualizadas com sucesso.", "Worker Configurado");
      setConfigModalOpen(false);
      setConfigWorker(null);
      await fetchWorkers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      showError(msg, "Falha de Configuração");
    } finally {
      setSavingConfig(false);
    }
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

  const handleProcessNow = async () => {
    setActionLoading("process_all");
    try {
      const res = await fetch("/api/sa/workers/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queue_name: "whatsapp-messages-default", limit: 10 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao processar ciclo");
      showSuccess(
        `Ciclo executado! ${data.processedCount || 0} tarefa(s) processada(s).`,
        "Processamento Concluído"
      );
      await fetchWorkers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na operação";
      showError(msg, "Falha no Processamento");
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
          <div className="flex items-center gap-2">
            {can("workers", "edit") && (
              <button
                type="button"
                onClick={handleProcessNow}
                disabled={actionLoading === "process_all"}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                title="Executar ciclo de consumo e envio das filas agora"
              >
                <Zap className={`w-3.5 h-3.5 shrink-0 ${actionLoading === "process_all" ? "animate-spin" : ""}`} />
                <span className="whitespace-nowrap">Processar Agora</span>
              </button>
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

      {/* 2. CONTROLE DO PM2 (PROCESS MANAGER) */}
      <div className="p-4 rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 shadow-xl shadow-black/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            pm2State.daemonRunning
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-slate-800 border-slate-700/80 text-slate-400"
          }`}>
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white tracking-wide">PM2 Process Manager</h4>
              {pm2State.loading ? (
                <span className="text-[10px] text-slate-500 animate-pulse">verificando...</span>
              ) : pm2State.daemonRunning ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {pm2State.processes.filter((p) => p.status === "online").length} Processo(s) Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  Parado / Standby
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gerenciamento contínuo dos daemons de filas, auto-restart e balanceamento de background.
            </p>
          </div>
        </div>

        {/* Botões de Ação do PM2 */}
        {can("workers", "edit") && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {!pm2State.daemonRunning ? (
              <>
                <button
                  type="button"
                  onClick={() => handlePm2Action("start-daemon")}
                  disabled={pm2ActionLoading !== null}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
                  title="Iniciar apenas o worker daemon em background"
                >
                  <Play className={`w-3.5 h-3.5 shrink-0 ${pm2ActionLoading === "start-daemon" ? "animate-spin" : ""}`} />
                  <span className="whitespace-nowrap">Iniciar Daemon</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePm2Action("start")}
                  disabled={pm2ActionLoading !== null}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
                  title="Iniciar todos os processos do ecosystem.config.js"
                >
                  <Server className={`w-3.5 h-3.5 shrink-0 ${pm2ActionLoading === "start" ? "animate-spin" : ""}`} />
                  <span className="whitespace-nowrap">Start Ecossistema</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handlePm2Action("restart")}
                  disabled={pm2ActionLoading !== null}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
                  title="Reiniciar todos os processos ativos no PM2"
                >
                  <RotateCw className={`w-3.5 h-3.5 shrink-0 ${pm2ActionLoading === "restart" ? "animate-spin" : ""}`} />
                  <span className="whitespace-nowrap">Reiniciar PM2</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePm2Action("stop")}
                  disabled={pm2ActionLoading !== null}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
                  title="Parar processos em execução no PM2"
                >
                  <Square className={`w-3.5 h-3.5 shrink-0 ${pm2ActionLoading === "stop" ? "animate-spin" : ""}`} />
                  <span className="whitespace-nowrap">Parar PM2</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. CARDS DE TELEMETRIA E HARDWARE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Status do Motor de Processamento */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Status do Motor
            </span>
            <div
              className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                stats?.daemonRunning
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-400"
              }`}
            >
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {stats?.daemonRunning ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Ativo & Rodando
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
                Pausado / Standby
              </span>
            )}
          </div>
        </div>

        {/* Workers Ativos */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Workers Ativos
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tracking-tight">
              {stats ? stats.activeWorkers : "--"}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              / {stats ? stats.totalWorkers : "--"} total
            </span>
          </div>
        </div>

        {/* Tarefas Processadas */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Processadas
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-indigo-300 tracking-tight font-mono">
              {stats ? stats.totalProcessed.toLocaleString("pt-BR") : "--"}
            </span>
            {stats && stats.totalFailed > 0 && (
              <span className="text-[11px] font-bold text-rose-400">
                ({stats.totalFailed} falhas)
              </span>
            )}
          </div>
        </div>

        {/* Consumo de CPU Host Real */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Uso de CPU
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-cyan-300 tracking-tight font-mono">
              {stats ? stats.cpuUsage || "0.0%" : "--"}
            </span>
            <span className="text-xs text-slate-500 font-semibold" title={stats?.cpuModel}>
              ({stats ? `${stats.cpuCount} Cores` : "--"})
            </span>
          </div>
        </div>

        {/* Consumo de Memória RAM Host & Node */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Memória RAM
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tracking-tight font-mono">
              {stats ? (stats.usedMemoryMB > 1024 ? `${(stats.usedMemoryMB / 1024).toFixed(1)} GB` : `${stats.usedMemoryMB} MB`) : "--"}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              / {stats ? `${(stats.totalMemoryMB / 1024).toFixed(0)} GB` : "--"}
            </span>
          </div>
        </div>

        {/* Servidor Redis */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Fila Redis
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs font-bold text-emerald-300 truncate font-mono flex items-center gap-1.5" title={stats ? stats.redisHost : "Conectado"}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              {stats ? stats.redisHost : "127.0.0.1:6379"}
            </p>
          </div>
        </div>
      </div>

      {/* 4. LISTA DE WORKERS EM CARDS MODERNOS (SEM SCROLL HORIZONTAL E SEM SOBREPOSIÇÕES) */}
      <div className="space-y-4">
        {loading && workers.length === 0 ? (
          <div className="py-20 rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 flex flex-col items-center justify-center text-slate-400 space-y-3 shadow-2xl">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-xs font-medium">Carregando instâncias de workers...</p>
          </div>
        ) : workers.length === 0 ? (
          <div className="py-20 rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 flex flex-col items-center justify-center text-center px-4 space-y-3 shadow-2xl">
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
          workers.map((w) => {
            const isActive = w.status === "active";
            const isIdle = w.status === "idle";
            const isPaused = w.status === "paused";

            return (
              <div
                key={w.id}
                className="p-5 rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 hover:border-slate-700/80 shadow-xl shadow-black/20 transition-all space-y-4 group"
              >
                {/* Linha Superior: Ícone, Identificação, Status & Ações */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Identificação do Worker */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl border flex items-center justify-center font-bold text-xs shrink-0 ${
                        isActive
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10"
                          : isIdle
                          ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                          : "bg-slate-800 border-slate-700 text-slate-400"
                      }`}
                    >
                      <Cpu className="w-5 h-5 shrink-0" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {w.name}
                        </h3>

                        {/* Status Badge */}
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            Ativo
                          </span>
                        ) : isIdle ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            Standby
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                            Pausado
                          </span>
                        )}

                        {/* Queue Badge */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 font-mono text-[11px] text-indigo-300 whitespace-nowrap">
                          <Server className="w-3 h-3 text-indigo-400 shrink-0" />
                          {w.queue}
                        </span>

                        <span className="text-[11px] font-mono text-slate-500">
                          {w.id}
                        </span>
                      </div>

                      {w.description && (
                        <p className="text-xs text-slate-400 leading-snug">
                          {w.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ações Rápidas */}
                  {can("workers", "edit") && (
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => handleOpenConfig(w)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
                        title="Configurar Parâmetros de Execução e Anti-Ban"
                      >
                        <Settings2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Configurar</span>
                      </button>

                      {isPaused ? (
                        <button
                          type="button"
                          onClick={() => handleOpenAction(w, "start")}
                          disabled={actionLoading === w.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-sm disabled:opacity-50"
                          title="Iniciar Worker"
                        >
                          <Play className="w-3.5 h-3.5 shrink-0" />
                          <span>Iniciar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenAction(w, "pause")}
                          disabled={actionLoading === w.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-sm disabled:opacity-50"
                          title="Pausar Worker"
                        >
                          <Pause className="w-3.5 h-3.5 shrink-0" />
                          <span>Pausar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenAction(w, "restart")}
                        disabled={actionLoading === w.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-sm disabled:opacity-50"
                        title="Reiniciar Processo"
                      >
                        <RotateCw className={`w-3.5 h-3.5 shrink-0 ${actionLoading === w.id ? "animate-spin" : ""}`} />
                        <span>Reiniciar</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Linha Inferior: Grid de Métricas, Anti-Ban & Telemetria */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {/* Concorrência */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 space-y-1">
                    <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-slate-400" />
                      Concorrência
                    </p>
                    <p className="text-xs font-bold text-slate-200 font-mono">
                      {w.concurrency} {w.concurrency === 1 ? "thread" : "threads"}
                    </p>
                  </div>

                  {/* Delay Anti-Ban Jitter */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 space-y-1">
                    <p className="text-[10px] uppercase font-semibold text-amber-500/80 tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Anti-Ban Jitter
                    </p>
                    <p className="text-xs font-bold text-amber-300 font-mono">
                      {w.min_delay_seconds}s a {w.max_delay_seconds}s
                    </p>
                  </div>

                  {/* Lotes & Pausas */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 space-y-1">
                    <p className="text-[10px] uppercase font-semibold text-indigo-400/80 tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-indigo-400" />
                      Lote / Pausa
                    </p>
                    <p className="text-xs font-bold text-slate-200 font-mono">
                      {w.batch_size} msgs <span className="text-slate-500 font-normal">/</span> {w.batch_pause_seconds}s
                    </p>
                  </div>

                  {/* Volume e Vazão Processada */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 space-y-1">
                    <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-emerald-400" />
                        Volume de Execução
                      </span>
                      <span className="text-emerald-400 font-mono lowercase">{w.processed} ok</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-200">{w.processed + w.failed} total</span>
                      {w.failed > 0 && (
                        <span className="text-[11px] font-bold text-rose-400">{w.failed} erros</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
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

      {/* 5. MODAL DE CONFIGURAÇÃO DE DELAY / JITTER / BATCH */}
      {configModalOpen && configWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Settings2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate">
                  Configurar Worker
                </h3>
                <p className="text-xs text-indigo-300 truncate mt-0.5">
                  {configWorker.name} ({configWorker.id})
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              {/* Concorrência (Threads) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Concorrência (Threads Paralelas)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={configForm.concurrency}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, concurrency: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Quantidade de tarefas processadas simultaneamente por este worker (1 a 50).
                </p>
              </div>

              {/* Intervalo Randomizado (Anti-Ban Jitter) */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Intervalo Anti-Ban (Jitter Randomizado)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Mínimo (segundos)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={300}
                      value={configForm.min_delay_seconds}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          min_delay_seconds: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Máximo (segundos)
                    </label>
                    <input
                      type="number"
                      min={configForm.min_delay_seconds}
                      max={600}
                      value={configForm.max_delay_seconds}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          max_delay_seconds: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  A cada disparo, o worker fará uma pausa aleatória entre{" "}
                  <strong className="text-amber-300">{configForm.min_delay_seconds}s</strong> e{" "}
                  <strong className="text-amber-300">{configForm.max_delay_seconds}s</strong> para simular comportamento humano.
                </p>
              </div>

              {/* Lotes e Pausa Periódica */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Tamanho do Lote (msgs)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={configForm.batch_size}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, batch_size: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Disparos antes da pausa</p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Pausa do Lote (segundos)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={600}
                    value={configForm.batch_pause_seconds}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        batch_pause_seconds: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Descanso entre lotes</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setConfigModalOpen(false);
                    setConfigWorker(null);
                  }}
                  disabled={savingConfig}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingConfig}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  {savingConfig ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span className="whitespace-nowrap">Salvando...</span>
                    </>
                  ) : (
                    <span className="whitespace-nowrap">Salvar Configurações</span>
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
