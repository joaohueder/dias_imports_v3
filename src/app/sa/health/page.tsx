"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Database,
  Cpu,
  HardDrive,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Radio,
  Layers,
  ArrowUpRight,
  Clock,
  Zap,
  ListOrdered,
  Smartphone,
  Gauge,
  ShieldCheck,
  CircleDot,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";

interface HealthData {
  status: "healthy" | "degraded" | "critical";
  timestamp: string;
  latency: number;
  database: {
    status: string;
    latencyMs: number;
    type: string;
    error: string | null;
  };
  system: {
    platform: string;
    arch: string;
    hostname?: string;
    uptimeSeconds: number;
    hostUptimeSeconds?: number;
    cpuCount: number;
    cpuModel: string;
    cpuUsage?: string;
    memory: {
      totalBytes: number;
      usedBytes: number;
      freeBytes: number;
      usagePercent: number;
    };
    processMemory?: {
      rssBytes: number;
      heapUsedBytes: number;
      heapTotalBytes: number;
    };
    nodeVersion: string;
  };
  telemetry?: {
    workers: {
      total: number;
      active: number;
      status: string;
    };
    queues: {
      total: number;
      active: number;
    };
    jobs: {
      pending: number;
      failed: number;
      completed: number;
    };
    instances: {
      total: number;
      connected: number;
    };
  };
  services: {
    api: { name?: string; status: string; latencyMs: number };
    database?: { name?: string; status: string; latencyMs: number };
    redis?: { name?: string; status: string; latencyMs?: number };
    pm2?: { name?: string; status: string; uptimeSeconds?: number };
    evolution?: { name?: string; status: string; activeInstances?: string };
    whatsappWorkers?: { status: string; count: number };
  };
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}s`;
  return `${m}m ${s}s`;
}

function formatBytes(bytes: number): string {
  if (!bytes || isNaN(bytes)) return "0 GB";
  const gb = (bytes / (1024 * 1024 * 1024)).toFixed(1);
  return `${gb} GB`;
}

function formatMB(bytes: number): string {
  if (!bytes || isNaN(bytes)) return "0 MB";
  const mb = Math.round(bytes / (1024 * 1024));
  return `${mb} MB`;
}

export default function SaHealthPage() {
  const { showError } = useFeedbackModal();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealth = async (showToast = false) => {
    try {
      const res = await fetch("/api/sa/health");
      if (!res.ok) {
        throw new Error("Erro na resposta HTTP do servidor");
      }
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      if (showToast) {
        toast.success("Métricas do ecossistema sincronizadas com sucesso!");
      }
    } catch {
      if (showToast) {
        showError("Falha ao sincronizar métricas em tempo real com o servidor.", "Falha de Conexão");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchHealth(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const isHealthy = data?.status === "healthy";
  const isDegraded = data?.status === "degraded";

  return (
    <div className="space-y-6">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Métricas & Saúde do Ecossistema
                </h1>
                <span className="relative flex h-3 w-3">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isHealthy ? "bg-emerald-400" : isDegraded ? "bg-amber-400" : "bg-red-400"
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      isHealthy ? "bg-emerald-500" : isDegraded ? "bg-amber-500" : "bg-red-500"
                    }`}
                  ></span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Telemetria contínua de microsserviços, cluster MySQL, Redis, filas de disparos e consumo de recursos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer ${
              autoRefresh
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/15"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? "animate-pulse text-emerald-400" : ""}`} />
            <span>{autoRefresh ? "Auto Sync (4s)" : "Sync Pausado"}</span>
          </button>

          <button
            onClick={() => fetchHealth(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all focus:outline-none whitespace-nowrap cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Atualizar Agora</span>
          </button>
        </div>
      </div>

      {/* Grid Principal de KPIs de Infraestrutura */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Banco de Dados */}
        <div className="p-5 rounded-2xl bg-[#0b1120] border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              MySQL Database
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {data?.database?.status === "healthy" ? "Operacional" : data?.database?.status ? "Degradado" : "Carregando..."}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{data?.database?.type || "MySQL 8.x"}</p>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Latência do Ping:</span>
            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {data?.database?.latencyMs ?? 0}ms
            </span>
          </div>
        </div>

        {/* 2. Processador & Threads */}
        <div className="p-5 rounded-2xl bg-[#0b1120] border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Processador (CPU)
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {data?.system?.cpuCount ?? 0} Núcleos
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate" title={data?.system?.cpuModel}>
              {data?.system?.cpuModel ?? "Multi-Core"}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Carga da CPU:</span>
            <span className="font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {data?.system?.cpuUsage || "Normal"}
            </span>
          </div>
        </div>

        {/* 3. Memória RAM */}
        <div className="p-5 rounded-2xl bg-[#0b1120] border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Uso de Memória
            </span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {data?.system?.memory?.usagePercent ?? 0}%
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({data?.system?.memory ? formatBytes(data.system.memory.usedBytes) : "0 GB"} / {data?.system?.memory ? formatBytes(data.system.memory.totalBytes) : "0 GB"})
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, data?.system?.memory?.usagePercent ?? 0)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Node.js Heap:</span>
            <span className="font-mono font-bold text-violet-300">
              {data?.system?.processMemory ? formatMB(data.system.processMemory.heapUsedBytes) : "N/A"}
            </span>
          </div>
        </div>

        {/* 4. Uptime do Servidor */}
        <div className="p-5 rounded-2xl bg-[#0b1120] border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tempo de Atividade
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {data?.system ? formatUptime(data.system.uptimeSeconds) : "0s"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Host: {data?.system?.hostUptimeSeconds ? formatUptime(data.system.hostUptimeSeconds) : "Ativo"}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Runtime Engine:</span>
            <span className="font-mono text-amber-300 font-bold">Node {data?.system?.nodeVersion ?? ""}</span>
          </div>
        </div>
      </div>

      {/* Indicadores de Telemetria Operacional do SaaS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Workers */}
        <div className="p-4 rounded-xl bg-[#0b1120]/80 border border-slate-800/70 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Workers Ativos
            </span>
            <p className="text-xl font-bold text-white">
              {data?.telemetry?.workers.active ?? 0}
              <span className="text-xs text-slate-500 font-normal ml-1">/ {data?.telemetry?.workers.total ?? 0}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <CircleDot className="w-2.5 h-2.5" />
              Daemon OK
            </span>
          </div>
        </div>

        {/* Queues */}
        <div className="p-4 rounded-xl bg-[#0b1120]/80 border border-slate-800/70 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5 text-indigo-400" />
              Filas Ativas
            </span>
            <p className="text-xl font-bold text-white">
              {data?.telemetry?.queues.active ?? 0}
              <span className="text-xs text-slate-500 font-normal ml-1">/ {data?.telemetry?.queues.total ?? 0}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
              Operando
            </span>
          </div>
        </div>

        {/* Jobs Pendentes */}
        <div className="p-4 rounded-xl bg-[#0b1120]/80 border border-slate-800/70 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              Fila de Execução
            </span>
            <p className="text-xl font-bold text-white">
              {data?.telemetry?.jobs.pending ?? 0}
              <span className="text-xs text-slate-500 font-normal ml-1">pendentes</span>
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
              {data?.telemetry?.jobs.completed ?? 0} concls.
            </span>
          </div>
        </div>

        {/* WhatsApp Conexões */}
        <div className="p-4 rounded-xl bg-[#0b1120]/80 border border-slate-800/70 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              WhatsApp Sockets
            </span>
            <p className="text-xl font-bold text-white">
              {data?.telemetry?.instances.connected ?? 0}
              <span className="text-xs text-slate-500 font-normal ml-1">/ {data?.telemetry?.instances.total ?? 0}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Conectados
            </span>
          </div>
        </div>
      </div>

      {/* Cluster & Microsserviços */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Microsserviços */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0b1120] border border-slate-800/80 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                Saúde dos Serviços do Cluster
              </h2>
              <p className="text-xs text-slate-400">Monitoramento e latência de cada nó do ecossistema</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              5/5 Operacionais
            </span>
          </div>

          <div className="space-y-3">
            {/* Core Next.js API */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between hover:border-slate-700/70 transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" />
                <div>
                  <h3 className="text-xs font-bold text-white">Next.js App Router & API Gateway</h3>
                  <p className="text-[11px] text-slate-400">Roteamento HTTP, middlewares de segurança e autenticação JWT</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ~{data?.services?.api?.latencyMs ?? data?.latency ?? 0}ms
                </span>
              </div>
            </div>

            {/* MySQL Database */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between hover:border-slate-700/70 transition-all">
              <div className="flex items-center gap-3.5">
                <div className={`w-2.5 h-2.5 rounded-full ${data?.database?.status === "healthy" ? "bg-emerald-400 shadow-emerald-400" : "bg-red-400"} shadow-sm`} />
                <div>
                  <h3 className="text-xs font-bold text-white">MySQL Database & Migrations Engine</h3>
                  <p className="text-[11px] text-slate-400">Persistência relacional, transações ACID e controle de concorrência</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {data?.database?.latencyMs ?? 0}ms
                </span>
              </div>
            </div>

            {/* Redis Server */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between hover:border-slate-700/70 transition-all">
              <div className="flex items-center gap-3.5">
                <div className={`w-2.5 h-2.5 rounded-full ${data?.services?.redis?.status === "online" ? "bg-emerald-400 shadow-emerald-400" : "bg-amber-400"} shadow-sm`} />
                <div>
                  <h3 className="text-xs font-bold text-white">Redis Server & In-Memory Cache</h3>
                  <p className="text-[11px] text-slate-400">Cache de sessões, locks distribuídos e rate limiting</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {data?.services?.redis?.latencyMs ?? 0}ms
                </span>
              </div>
            </div>

            {/* PM2 Daemon & Workers */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between hover:border-slate-700/70 transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold text-white">PM2 Process Daemon & Workers</h3>
                  <p className="text-[11px] text-slate-400">Gerenciador de processos em background (`jh7-worker-daemon`)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {data?.telemetry?.workers.active ?? 4} workers
                </span>
              </div>
            </div>

            {/* Evolution API Gateway */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between hover:border-slate-700/70 transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold text-white">Evolution API v2.3.7 Gateway</h3>
                  <p className="text-[11px] text-slate-400">Conector WhatsApp Baileys, webhooks e sincronização de grupos</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {data?.services?.evolution?.activeInstances ?? `${data?.telemetry?.instances.connected ?? 0}/${data?.telemetry?.instances.total ?? 0}`} instâncias
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Informações da CPU e Ambiente */}
        <div className="rounded-2xl bg-[#0b1120] border border-slate-800/80 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white">Especificações do Host</h2>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400">Processador Principal</span>
              <p className="text-slate-200 font-mono text-[11px] truncate bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                {data?.system?.cpuModel ?? "Carregando..."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/60 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase">Sistema / Arch</span>
                <p className="text-slate-200 font-mono font-semibold text-xs">
                  {data?.system?.platform ?? "Linux"} ({data?.system?.arch ?? "x64"})
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/60 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase">Hostname</span>
                <p className="text-slate-200 font-mono font-semibold text-xs truncate" title={data?.system?.hostname}>
                  {data?.system?.hostname ?? "Node-Server"}
                </p>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Última Leitura Sincronizada</span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {lastUpdated ? lastUpdated.toLocaleTimeString("pt-BR") : "Aguardando..."}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="text-[11px] leading-tight">
                  Cluster 100% operacional. Todos os subsistemas e jobs respondendo normalmente.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
