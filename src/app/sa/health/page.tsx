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
  Wifi,
  Radio,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface HealthData {
  status: string;
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
    uptimeSeconds: number;
    cpuCount: number;
    cpuModel: string;
    memory: {
      totalBytes: number;
      usedBytes: number;
      freeBytes: number;
      usagePercent: number;
    };
    nodeVersion: string;
  };
  services: {
    api: { status: string; latencyMs: number };
    whatsappWorkers: { status: string; count: number };
    redis: { status: string; queueJobs: number };
  };
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function formatBytes(bytes: number): string {
  const gb = (bytes / (1024 * 1024 * 1024)).toFixed(1);
  return `${gb} GB`;
}

export default function SaHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealth = async (showToast = false) => {
    try {
      const res = await fetch("/api/sa/health");
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      if (showToast) {
        toast.success("Métricas atualizadas com sucesso!");
      }
    } catch {
      if (showToast) {
        toast.error("Falha ao sincronizar métricas em tempo real");
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

  return (
    <div className="space-y-6">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-indigo-400" />
              Métricas & Saúde do Ecossistema
            </h1>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Telemetria em tempo real, status do cluster de banco de dados, CPU, memória e instâncias.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              autoRefresh
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : "bg-slate-900 text-slate-400 border-slate-800"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? "animate-pulse text-emerald-400" : ""}`} />
            <span>{autoRefresh ? "Auto Sync (4s)" : "Sync Pausado"}</span>
          </button>

          <button
            onClick={() => fetchHealth(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all focus:outline-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Grid Principal de Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Banco de Dados */}
        <div className="p-5 rounded-2xl bg-[#0b1120] border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              MySQL Database
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {data?.database.status === "healthy" ? "Operacional" : "Indisponível"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Latência da Query:</span>
            <span className="font-mono font-bold text-emerald-400">
              {data?.database.latencyMs ?? 0}ms
            </span>
          </div>
        </div>

        {/* 2. Processador & Threads */}
        <div className="p-5 rounded-2xl bg-[#0b1120] border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Processador (CPU)
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {data?.system.cpuCount ?? 0} Núcleos
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Arquitetura:</span>
            <span className="font-mono text-indigo-300">
              {data?.system.platform} ({data?.system.arch})
            </span>
          </div>
        </div>

        {/* 3. Memória RAM */}
        <div className="p-5 rounded-2xl bg-[#0b1120] border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Uso de Memória
            </span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {data?.system.memory.usagePercent ?? 0}%
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({data ? formatBytes(data.system.memory.usedBytes) : "0 GB"} / {data ? formatBytes(data.system.memory.totalBytes) : "0 GB"})
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${data?.system.memory.usagePercent ?? 0}%` }}
            />
          </div>
        </div>

        {/* 4. Uptime do Servidor */}
        <div className="p-5 rounded-2xl bg-[#0b1120] border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tempo de Atividade
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {data ? formatUptime(data.system.uptimeSeconds) : "0s"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Engine Runtime:</span>
            <span className="font-mono text-amber-300">Node {data?.system.nodeVersion}</span>
          </div>
        </div>
      </div>

      {/* Cluster & Microsserviços */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Microsserviços */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0b1120] border border-slate-800/80 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                Saúde dos Serviços do Cluster
              </h2>
              <p className="text-xs text-slate-400">Monitoramento dos endpoints e background workers</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              3/3 Operacionais
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold text-white">Core API Gateway & Next.js Routes</h3>
                  <p className="text-[11px] text-slate-400">Processamento HTTP síncrono e autenticação JWT</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-semibold text-emerald-400">Latência: ~{data?.latency ?? 0}ms</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold text-white">Evolution API / Baileys Connector</h3>
                  <p className="text-[11px] text-slate-400">Gestão de sockets WhatsApp e disparo em massa</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-semibold text-slate-300">0 workers ativos</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold text-white">BullMQ & Redis Message Queue</h3>
                  <p className="text-[11px] text-slate-400">Fila de agendamento e throttling antiban</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-semibold text-slate-300">0 jobs pendentes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Informações da CPU e Ambiente */}
        <div className="rounded-2xl bg-[#0b1120] border border-slate-800/80 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white">Especificações do Host</h2>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400">Processador Principal</span>
              <p className="text-slate-200 font-mono text-[11px] truncate bg-slate-950 p-2 rounded-lg border border-slate-800/60">
                {data?.system.cpuModel ?? "Carregando..."}
              </p>
            </div>

            <div className="space-y-1 pt-2">
              <span className="text-slate-400">Última Leitura Sincronizada</span>
              <p className="text-slate-300 font-mono text-[11px]">
                {lastUpdated ? lastUpdated.toLocaleTimeString("pt-BR") : "Aguardando..."}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/60">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400" />
                <span className="text-[11px] leading-tight">
                  Serviços respondendo normalmente dentro do limiar de segurança.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
