"use client";

import React, { useState } from "react";
import { SaPageHeader } from "@/components/sa/SaPageHeader";
import { 
  FileCode2, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Shield, 
  Terminal,
  Activity
} from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  module: string;
  level: "info" | "warning" | "error" | "success";
  details: string;
  ip: string;
}

const INITIAL_LOGS: AuditLog[] = [
  {
    id: "log_1",
    timestamp: new Date().toISOString(),
    actor: "João Hueder (SUPER_ADMIN)",
    action: "AUTH_LOGIN_SUCCESS",
    module: "Autenticação",
    level: "success",
    details: "Sessão de Super Admin iniciada com sucesso via credenciais.",
    ip: "127.0.0.1",
  },
  {
    id: "log_2",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    actor: "Sistema / Health Monitor",
    action: "DB_HEALTH_CHECK",
    module: "Infraestrutura",
    level: "info",
    details: "Ping de banco de dados MySQL e Redis executado com 0ms de latência.",
    ip: "127.0.0.1",
  },
  {
    id: "log_3",
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    actor: "João Hueder (SUPER_ADMIN)",
    action: "SETTINGS_UPDATE",
    module: "Configurações",
    level: "info",
    details: "Instância de contingência WhatsApp e parâmetros globais sincronizados.",
    ip: "127.0.0.1",
  },
];

export default function SaLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_LOGS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((res) => setTimeout(res, 400));
    setIsRefreshing(false);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === "all" || log.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const getLevelBadge = (level: AuditLog["level"]) => {
    switch (level) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Sucesso
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> Aviso
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Erro
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Info className="w-3 h-3" /> Info
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <SaPageHeader
        title="Logs de Auditoria do SaaS"
        subtitle="Rastreamento em tempo real de eventos administrativos, segurança e infraestrutura"
        icon={FileCode2}
        badge="Auditoria Ativa"
        badgeVariant="emerald"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Filtros e Barra de Ações */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ator, ação, módulo ou IP..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="all">Todos os Níveis</option>
              <option value="success">Sucesso</option>
              <option value="info">Informativo</option>
              <option value="warning">Avisos</option>
              <option value="error">Erros</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setLogs(INITIAL_LOGS)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-all whitespace-nowrap"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Últimas 24h</span>
          </button>
        </div>
      </div>

      {/* Tabela de Logs */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Nível / Módulo</th>
                <th className="px-5 py-3.5">Evento / Ação</th>
                <th className="px-5 py-3.5">Ator</th>
                <th className="px-5 py-3.5">Detalhes</th>
                <th className="px-5 py-3.5 text-right">Data & Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    Nenhum registro de log encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {getLevelBadge(log.level)}
                        <div className="text-[11px] text-slate-400 font-mono">{log.module}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-mono font-semibold text-slate-200">
                      {log.action}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="font-medium text-slate-200">{log.actor}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">IP: {log.ip}</span>
                    </td>
                    <td className="px-5 py-4 max-w-md text-slate-300 text-xs">
                      {log.details}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-slate-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
