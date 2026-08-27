"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  FileCode2, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Shield, 
  Activity,
  Eye,
  Trash2,
  X,
  Layers,
  Calendar,
  Globe,
  RefreshCw,
  Clock,
  User
} from "lucide-react";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { useSaAuth } from "@/context/SaAuthContext";
import { Pagination } from "@/components/ui/Pagination";

interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
  company_id: number | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  status: "success" | "failed";
  created_at: string;
}

// Mapeamento amigável de ações em português
const ACTION_LABELS: Record<string, string> = {
  AUTH_LOGIN_SUCCESS: "Login realizado com sucesso",
  AUTH_LOGIN_FAILED: "Falha de login (senha incorreta)",
  AUTH_LOGIN_BLOCKED: "Tentativa de login em conta bloqueada",
  AUTH_LOGOUT: "Encerramento de sessão (Logout)",
  AUTH_OTP_VERIFIED: "Validação de código OTP",
  AUTH_OTP_FAILED: "Falha na validação de código OTP",
  COMPANY_CREATE: "Criação de empresa",
  COMPANY_UPDATE: "Alteração de dados da empresa",
  COMPANY_DELETE: "Exclusão de empresa",
  USER_CREATE: "Criação de usuário",
  USER_UPDATE: "Alteração de dados de usuário",
  USER_DELETE: "Exclusão de usuário",
  USER_PASSWORD_CHANGE: "Alteração de senha de usuário",
  PLAN_CREATE: "Criação de plano",
  PLAN_UPDATE: "Alteração de plano",
  PLAN_DELETE: "Exclusão de plano",
  INSTANCE_CREATE: "Criação de instância WhatsApp",
  INSTANCE_UPDATE: "Alteração de instância WhatsApp",
  INSTANCE_DELETE: "Exclusão de instância WhatsApp",
  SETTINGS_UPDATE: "Atualização de configurações do sistema",
  SUBSCRIPTION_CREATE: "Criação de assinatura",
  SUBSCRIPTION_UPDATE: "Alteração de assinatura",
  SUBSCRIPTION_EXPIRE: "Expiração de assinatura",
  MIGRATION_RUN: "Execução de migração de banco",
  WORKER_START: "Inicialização de worker",
  WORKER_STOP: "Interrupção de worker",
};

// Mapeamento amigável de módulos em português
const ENTITY_LABELS: Record<string, { label: string; badgeColor: string }> = {
  auth: { label: "Autenticação", badgeColor: "bg-slate-800/90 text-slate-300 border-slate-700/80" },
  companies: { label: "Empresas", badgeColor: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" },
  users: { label: "Usuários", badgeColor: "bg-sky-500/10 text-sky-300 border-sky-500/20" },
  instances: { label: "Instâncias WhatsApp", badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  plans: { label: "Planos", badgeColor: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
  subscriptions: { label: "Assinaturas", badgeColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" },
  settings: { label: "Configurações", badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  workers: { label: "Workers / Filas", badgeColor: "bg-orange-500/10 text-orange-300 border-orange-500/20" },
  jobs: { label: "Tarefas", badgeColor: "bg-teal-500/10 text-teal-300 border-teal-500/20" },
  migrations: { label: "Migrações", badgeColor: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20" },
  system: { label: "Sistema Geral", badgeColor: "bg-slate-800 text-slate-400 border-slate-700" },
};

// Mapeamento amigável de campos comuns do banco de dados
const FIELD_LABELS: Record<string, string> = {
  id: "Identificador (ID)",
  name: "Nome",
  trade_name: "Nome Fantasia",
  corporate_name: "Razão Social",
  document: "CNPJ / CPF",
  email: "E-mail",
  phone: "Telefone",
  admin_whatsapp: "WhatsApp do Administrador",
  status: "Status",
  system_role: "Perfil de Acesso",
  plan_id: "Plano Vinculado",
  company_id: "Empresa Vinculada",
  cep: "CEP",
  address: "Endereço (Logradouro)",
  street: "Rua / Avenida",
  number: "Número",
  complement: "Complemento",
  neighborhood: "Bairro",
  city: "Cidade",
  state: "Estado (UF)",
  max_instances: "Limite de Instâncias",
  max_users: "Limite de Usuários",
  max_groups: "Limite de Grupos",
  max_contacts: "Limite de Contatos",
  price: "Valor / Preço",
  is_active: "Ativo",
  is_default: "Padrão / Principal",
  created_at: "Data de Criação",
  updated_at: "Data de Alteração",
  password_hash: "Senha (Hash Criptográfico)",
  apikey: "Chave de API",
};

function formatActionName(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatEntityMeta(entity: string): { label: string; badgeColor: string } {
  if (ENTITY_LABELS[entity]) return ENTITY_LABELS[entity];
  return {
    label: entity.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
    badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
  };
}

function formatFieldName(fieldName: string): string {
  if (FIELD_LABELS[fieldName]) return FIELD_LABELS[fieldName];
  return fieldName
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function parseJsonValue(val: any): any {
  if (!val) return null;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

function renderValue(val: any): string {
  if (val === null || val === undefined || val === "") return "— (Vazio)";
  if (typeof val === "boolean") return val ? "Sim (Ativo)" : "Não (Inativo)";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

export default function SaLogsPage() {
  const { showModal, showConfirm } = useFeedbackModal();
  const { can } = useSaAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filterEntity !== "all") params.append("entityType", filterEntity);
      if (filterStatus !== "all") params.append("status", filterStatus);
      params.append("limit", "500");

      const res = await fetch(`/api/sa/logs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setCurrentPage(1);
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterEntity, filterStatus]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLogs();
    setIsRefreshing(false);
  };

  const handlePurgeLogs = () => {
    showConfirm({
      title: "Expurgar Logs Antigos",
      message: "Tem certeza que deseja excluir permanentemente todos os registros de auditoria com mais de 90 dias? Esta ação não pode ser desfeita.",
      confirmLabel: "Sim, Expurgar Logs",
      cancelLabel: "Cancelar",
      destructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/sa/logs", { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            showModal({
              type: "success",
              title: "Logs Expurgados",
              message: data.message || "Logs com mais de 90 dias foram removidos com sucesso.",
            });
            await fetchLogs();
          } else {
            showModal({
              type: "error",
              title: "Erro ao Limpar Logs",
              message: data.error || "Não foi possível realizar a limpeza.",
            });
          }
        } catch {
          showModal({
            type: "error",
            title: "Erro na Requisição",
            message: "Falha de comunicação com o servidor ao tentar expurgar logs.",
          });
        }
      },
    });
  };

  const getStatusBadge = (status: AuditLog["status"]) => {
    if (status === "success") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap shadow-sm shadow-emerald-950/40">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Sucesso</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap shadow-sm shadow-rose-950/40">
        <XCircle className="w-3.5 h-3.5" />
        <span>Falha</span>
      </span>
    );
  };

  // Comparação detalhada de campos para a modal (exibindo apenas o que mudou)
  const fieldChanges = useMemo(() => {
    if (!selectedLog) return [];
    const oldObj = parseJsonValue(selectedLog.old_values);
    const newObj = parseJsonValue(selectedLog.new_values);

    // Se ambos não forem objetos JSON (ex: dados simples ou auth), trata como resumo
    if ((!oldObj || typeof oldObj !== "object") && (!newObj || typeof newObj !== "object")) {
      const rows: Array<{ field: string; rawField: string; before: any; after: any; isChanged: boolean }> = [];
      if (oldObj !== null && oldObj !== undefined) {
        rows.push({ field: "Dados Registrados Antes", rawField: "old_values", before: oldObj, after: "—", isChanged: false });
      }
      if (newObj !== null && newObj !== undefined) {
        rows.push({ field: "Detalhes do Evento / Novos Dados", rawField: "new_values", before: "—", after: newObj, isChanged: true });
      }
      return rows;
    }

    // Ignorar campos de controle interno e datas de atualização na comparação
    const ignoredKeys = new Set(["created_at", "updated_at", "last_login_at"]);

    const allKeys = Array.from(new Set([
      ...(oldObj && typeof oldObj === "object" ? Object.keys(oldObj) : []),
      ...(newObj && typeof newObj === "object" ? Object.keys(newObj) : [])
    ])).filter((k) => !ignoredKeys.has(k));

    // Normalizador de valores para comparação justa (trata undefined, null e string vazia equivalentemente)
    const normalizeVal = (val: unknown) => {
      if (val === undefined || val === null || val === "") return null;
      if (typeof val === "number" || typeof val === "boolean") return val;
      if (val instanceof Date) return val.toISOString();
      return String(val).trim();
    };

    // Filtra para exibir estritamente os campos cujo valor foi modificado de fato
    return allKeys
      .map((key) => {
        const hasBefore = oldObj && Object.prototype.hasOwnProperty.call(oldObj, key);
        const hasAfter = newObj && Object.prototype.hasOwnProperty.call(newObj, key);
        
        // Se uma das pontas não possui a chave (ex: payload parcial), só considera alterado se ambas estiverem presentes ou for create/delete
        if (oldObj && newObj && (!hasBefore || !hasAfter)) {
          return {
            field: formatFieldName(key),
            rawField: key,
            before: oldObj ? oldObj[key] : undefined,
            after: newObj ? newObj[key] : undefined,
            isChanged: false,
          };
        }

        const beforeVal = oldObj ? oldObj[key] : undefined;
        const afterVal = newObj ? newObj[key] : undefined;
        const isChanged = JSON.stringify(normalizeVal(beforeVal)) !== JSON.stringify(normalizeVal(afterVal));
        return {
          field: formatFieldName(key),
          rawField: key,
          before: beforeVal,
          after: afterVal,
          isChanged,
        };
      })
      .filter((item) => item.isChanged);
  }, [selectedLog]);

  // Estatísticas Rápidas de Auditoria
  const totalLogs = logs.length;
  const totalSuccess = logs.filter((l) => l.status === "success").length;
  const totalFailed = logs.filter((l) => l.status === "failed").length;

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * 10;
    return logs.slice(start, start + 10);
  }, [logs, currentPage]);

  return (
    <div className="space-y-6">
      {/* 1. CABEÇALHO PADRÃO DO SISTEMA */}
      <div className="flex flex-col gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <FileCode2 className="w-6 h-6 text-indigo-400" />
              Logs de Auditoria & Segurança
            </h1>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Rastreamento em tempo real de autenticações, ações administrativas e alterações de dados do ecossistema.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 w-full pt-1">
          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all focus:outline-none disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? "animate-spin" : ""}`} />
            <span className="whitespace-nowrap">Atualizar</span>
          </button>

          {can("logs", "delete") && (
            <button
              type="button"
              onClick={handlePurgeLogs}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-md shadow-rose-950/20 transition-all focus:outline-none shrink-0"
              title="Excluir logs com mais de 90 dias"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="whitespace-nowrap">Limpar &gt; 90 dias</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total de Eventos</p>
            <p className="text-2xl font-black text-white mt-1">{totalLogs}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ações com Sucesso</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{totalSuccess}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Falhas / Bloqueios</p>
            <p className="text-2xl font-black text-rose-400 mt-1">{totalFailed}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. FILTROS E BARRA DE PESQUISA */}
      <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuário, ação, módulo ou IP..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer w-full"
            >
              <option value="all" className="bg-slate-900 text-slate-200">Todos os Módulos</option>
              <option value="auth" className="bg-slate-900 text-slate-200">Autenticação</option>
              <option value="companies" className="bg-slate-900 text-slate-200">Empresas</option>
              <option value="users" className="bg-slate-900 text-slate-200">Usuários</option>
              <option value="instances" className="bg-slate-900 text-slate-200">Instâncias WhatsApp</option>
              <option value="plans" className="bg-slate-900 text-slate-200">Planos</option>
              <option value="subscriptions" className="bg-slate-900 text-slate-200">Assinaturas</option>
              <option value="settings" className="bg-slate-900 text-slate-200">Configurações</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer w-full"
            >
              <option value="all" className="bg-slate-900 text-slate-200">Todos os Status</option>
              <option value="success" className="bg-slate-900 text-slate-200">Apenas Sucesso</option>
              <option value="failed" className="bg-slate-900 text-slate-200">Apenas Falhas / Bloqueios</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. TABELA PREMIUM DE LOGS */}
      <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 overflow-hidden shadow-2xl shadow-black/30">
        <div className="w-full">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0b1222] border-b border-slate-800/90 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Evento / Módulo</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Usuário / Ator</th>
                <th className="px-5 py-3.5 min-w-[130px] text-right whitespace-nowrap">Data & Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-5 py-14 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Activity className="w-6 h-6 text-indigo-400 animate-spin" />
                      <span className="text-xs font-medium text-slate-400">Carregando trilha de auditoria...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-14 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileCode2 className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-semibold text-slate-400">Nenhum registro de log encontrado</p>
                      <p className="text-xs text-slate-600">Altere os filtros de pesquisa para visualizar outros eventos.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const entityMeta = formatEntityMeta(log.entity_type);
                  const logDate = new Date(log.created_at);
                  return (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition-colors group">
                      {/* Evento Realizado e Módulo Embutido */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div 
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              log.status === "success" 
                                ? "bg-emerald-400 ring-4 ring-emerald-500/20 shadow-sm shadow-emerald-500/50" 
                                : "bg-rose-400 ring-4 ring-rose-500/20 shadow-sm shadow-rose-500/50"
                            }`} 
                            title={log.status === "success" ? "Operação realizada com sucesso" : "Operação com falha ou bloqueio"}
                          />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setSelectedLog(log)}
                              className="font-bold text-white hover:text-indigo-300 transition-colors text-sm text-left truncate block max-w-[340px] sm:max-w-none group/btn cursor-pointer"
                              title="Clique para inspecionar os detalhes deste evento"
                            >
                              <span className="truncate">{formatActionName(log.action)}</span>
                            </button>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold border whitespace-nowrap ${entityMeta.badgeColor}`}>
                                {entityMeta.label}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono truncate">{log.action}</span>
                              {log.entity_id && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-indigo-400 border border-slate-800 font-semibold text-[10px] shrink-0 font-mono">
                                  #{log.entity_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Usuário / Ator */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
                            {log.user_name ? log.user_name.slice(0, 2).toUpperCase() : "SY"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white text-sm truncate">
                              {log.user_name || "Sistema / Daemon"}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              {log.user_email || "system.internal"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Data & Hora */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="font-mono text-xs font-semibold text-slate-200">
                          {logDate.toLocaleDateString("pt-BR")}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                          {logDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Paginação Padrão de 10 Itens */}
          {!loading && logs.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={logs.length}
              pageSize={10}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </div>
      </div>

      {/* 5. MODAL DE INSPEÇÃO COM LISTA: NOME DO CAMPO, VALOR ANTES, VALOR DEPOIS */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl bg-[#090f1d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Header da Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                  <FileCode2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {formatActionName(selectedLog.action)}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="font-semibold text-indigo-400">Módulo: {formatEntityMeta(selectedLog.entity_type).label}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-slate-500">Identificador técnico: {selectedLog.action}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações Gerais do Registro */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Usuário Responsável</span>
                  <p className="font-semibold text-slate-200 truncate mt-0.5">{selectedLog.user_name || selectedLog.user_email || "Sistema / Automático"}</p>
                </div>
              </div>
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Data & Horário</span>
                  <p className="font-semibold text-slate-200 font-mono truncate mt-0.5">{new Date(selectedLog.created_at).toLocaleString("pt-BR")}</p>
                </div>
              </div>
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                <Globe className="w-5 h-5 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Endereço IP</span>
                  <p className="font-semibold text-slate-200 font-mono truncate mt-0.5">{selectedLog.ip_address || "127.0.0.1"}</p>
                </div>
              </div>
            </div>

            {/* Lista Comparativa: Nome do Campo, Valor Antes, Valor Depois */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Campos Modificados
                </span>
                <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                  {fieldChanges.length} {fieldChanges.length === 1 ? "campo alterado" : "campos alterados"}
                </span>
              </div>

              <div className="rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden max-h-[42vh] overflow-y-auto shadow-inner">
                <table className="w-full text-left text-xs table-fixed">
                  <thead className="bg-[#050811] border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-semibold sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="px-5 py-3 w-[32%]">Campo Alterado</th>
                      <th className="px-5 py-3 w-[34%]">Valor Antes</th>
                      <th className="px-5 py-3 w-[34%]">Valor Depois</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {fieldChanges.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-10 text-center text-slate-500">
                          Nenhum campo com alteração de valor identificado nesta operação.
                        </td>
                      </tr>
                    ) : (
                      fieldChanges.map((change, idx) => (
                        <tr 
                          key={idx} 
                          className="hover:bg-slate-900/50 transition-colors"
                        >
                          {/* Nome do Campo */}
                          <td className="px-5 py-3.5 align-top">
                            <div className="font-semibold text-slate-200 break-words">
                              {change.field}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                              {change.rawField}
                            </div>
                          </td>

                          {/* Valor Antes */}
                          <td className="px-5 py-3.5 align-top">
                            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-[11px] break-all whitespace-pre-wrap max-h-32 overflow-y-auto">
                              {renderValue(change.before)}
                            </div>
                          </td>

                          {/* Valor Depois */}
                          <td className="px-5 py-3.5 align-top">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-[11px] break-all whitespace-pre-wrap max-h-32 overflow-y-auto">
                              {renderValue(change.after)}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rodapé da Modal */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all whitespace-nowrap"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
