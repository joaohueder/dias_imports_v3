"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Radio,
  Tag,
  Copy,
  Check,
  CheckSquare,
  Square,
  Smartphone,
  Info,
  ChevronRight,
  Archive,
  PlayCircle,
  PauseCircle,
  Crown,
  Sparkles,
  Lock,
} from "lucide-react";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { useLayout } from "@/context/LayoutContext";
import { Pagination } from "@/components/ui/Pagination";

interface GroupItem {
  id: number;
  company_id: number;
  whatsapp_group_id?: string | null;
  name: string;
  description?: string | null;
  group_type: string;
  can_send_messages: "all" | "admin_only";
  participants_count: number;
  max_capacity: number;
  invite_link?: string | null;
  avatar_url?: string | null;
  tags?: string[] | null;
  is_admin: boolean | number;
  instance_id?: string | null;
  status: "active" | "paused";
  created_at?: string;
  updated_at?: string;
}

interface InstanceGroupItem {
  id: string;
  jid: string;
  name: string;
  subject: string;
  description?: string;
  participants_count: number;
  picture_url?: string | null;
  is_admin: boolean;
  announce: boolean;
  restrict: boolean;
  is_already_added: boolean;
}

interface Metrics {
  total_groups: number;
  total_participants: number;
  active_groups: number;
  closed_groups: number;
  limit_groups?: number;
}

export default function GruposPage() {
  const { showSuccess, showError, showWarning, showConfirm } = useFeedbackModal();
  const { containerMaxWidthStyle } = useLayout();

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    total_groups: 0,
    total_participants: 0,
    active_groups: 0,
    closed_groups: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal de Seleção de Grupos da Instância
  const [instanceModalOpen, setInstanceModalOpen] = useState(false);
  const [instanceGroups, setInstanceGroups] = useState<InstanceGroupItem[]>([]);
  const [loadingInstanceGroups, setLoadingInstanceGroups] = useState(false);
  const [instanceSearch, setInstanceSearch] = useState("");
  const [instanceFilterCadastrado, setInstanceFilterCadastrado] = useState<"not_added" | "added" | "all">("not_added");
  const [selectedGroupJids, setSelectedGroupJids] = useState<Set<string>>(new Set());
  const [savingBatch, setSavingBatch] = useState(false);
  const [instanceInfo, setInstanceInfo] = useState<{ id?: number; name?: string; status?: string } | null>(null);

  // Modal de Alteração Rápida de Status
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTargetGroup, setStatusTargetGroup] = useState<GroupItem | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<"active" | "paused">("active");
  const [savingStatusChange, setSavingStatusChange] = useState(false);

  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Limpar todos os filtros
  const handleClearFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setFilterType("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(search || filterStatus !== "all" || filterType !== "all");

  // Carregar grupos cadastrados
  const loadGroups = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterType !== "all") params.set("group_type", filterType);

      const res = await fetch(`/api/painel/grupos?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setGroups(data.groups || []);
        if (data.metrics) setMetrics(data.metrics);
      } else {
        showError(data.message || "Não foi possível carregar a lista de grupos.", "Erro ao Carregar Grupos");
      }
    } catch {
      showError("Ocorreu um erro ao comunicar com o servidor.", "Falha de Conexão");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadGroups();
    }, 300);

    return () => clearTimeout(handler);
  }, [search, filterStatus, filterType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadGroups();
  };

  // Sincronizar grupos cadastrados com o WhatsApp (Enviando para Fila de Tarefas / Background Jobs)
  const handleSyncWithEvolution = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/painel/grupos/sync", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        showSuccess(data.message || "Tarefa de sincronização enviada para a fila com sucesso.", "Fila de Tarefas");
        loadGroups();
      } else {
        showError(data.message || "Não foi possível enviar a sincronização para a fila.", "Erro na Fila");
      }
    } catch {
      showError("Falha ao comunicar com o servidor de filas.", "Erro de Conexão");
    } finally {
      setSyncing(false);
    }
  };

  // Abrir Modal de Seleção de Grupos da Instância (carrega 1 vez se já tiver dados ou recarrega se forceRefresh=true)
  const handleOpenInstanceGroupsModal = async (forceRefresh: boolean = false) => {
    setInstanceModalOpen(true);
    setSelectedGroupJids(new Set());
    setInstanceSearch("");
    setInstanceFilterCadastrado("not_added");

    // Se já carregou os grupos antes e não é refresh explícito, não faz nova requisição
    if (!forceRefresh && instanceGroups.length > 0) {
      return;
    }

    setLoadingInstanceGroups(true);
    try {
      const res = await fetch("/api/painel/grupos/fetch-instance-groups");
      const data = await res.json();

      if (data.instance) {
        setInstanceInfo(data.instance);
      }

      if (data.success) {
        setInstanceGroups(data.groups || []);
      } else {
        setInstanceGroups([]);
        showWarning(data.message || "Não foi possível buscar os grupos da instância.", "Instância WhatsApp");
      }
    } catch {
      showError("Falha ao conectar com o serviço de WhatsApp.", "Erro de Comunicação");
    } finally {
      setLoadingInstanceGroups(false);
    }
  };

  // Toggle Seleção de Grupo
  const toggleSelectGroup = (jid: string) => {
    const next = new Set(selectedGroupJids);
    if (next.has(jid)) {
      next.delete(jid);
    } else {
      next.add(jid);
    }
    setSelectedGroupJids(next);
  };

  // Selecionar Todos / Desmarcar Todos
  const toggleSelectAll = (availableGroups: InstanceGroupItem[]) => {
    const selectable = availableGroups.filter((g) => !g.is_already_added);
    if (selectedGroupJids.size === selectable.length && selectable.length > 0) {
      setSelectedGroupJids(new Set());
    } else {
      setSelectedGroupJids(new Set(selectable.map((g) => g.jid)));
    }
  };

  // Salvar em lote os grupos selecionados
  const handleSaveBatchGroups = async () => {
    if (selectedGroupJids.size === 0) {
      showWarning("Por favor, selecione ao menos um grupo da lista para adicionar.", "Nenhum Grupo Selecionado");
      return;
    }

    const groupsToAdd = instanceGroups.filter((g) => selectedGroupJids.has(g.jid));

    setSavingBatch(true);
    try {
      const res = await fetch("/api/painel/grupos/batch-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groups: groupsToAdd,
          instance_id: instanceInfo?.id || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showSuccess(data.message || `${groupsToAdd.length} grupos foram cadastrados com sucesso!`, "Grupos Adicionados!");
        setInstanceModalOpen(false);
        loadGroups();
      } else {
        showError(data.message || "Não foi possível salvar os grupos selecionados.", "Erro ao Adicionar");
      }
    } catch {
      showError("Falha de rede ao salvar os grupos.", "Erro Inesperado");
    } finally {
      setSavingBatch(false);
    }
  };

  // Abrir Modal de Alteração de Status
  const handleOpenStatusModal = (group: GroupItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setStatusTargetGroup(group);
    setSelectedNewStatus(group.status);
    setStatusModalOpen(true);
  };

  // Salvar Alteração de Status
  const handleSaveStatusChange = async () => {
    if (!statusTargetGroup) return;

    if (selectedNewStatus === statusTargetGroup.status) {
      setStatusModalOpen(false);
      return;
    }

    setSavingStatusChange(true);
    try {
      const res = await fetch(`/api/painel/grupos/${statusTargetGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: statusTargetGroup.name,
          status: selectedNewStatus,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showSuccess("Status do grupo atualizado com sucesso!", "Status Atualizado");
        setStatusModalOpen(false);
        loadGroups();
      } else {
        showError(data.message || "Não foi possível alterar o status do grupo.", "Erro ao Alterar Status");
      }
    } catch {
      showError("Falha ao comunicar com o servidor.", "Erro Inesperado");
    } finally {
      setSavingStatusChange(false);
    }
  };

  // Excluir Grupo
  const handleDeleteGroup = (group: GroupItem) => {
    showConfirm({
      title: "Excluir Grupo?",
      message: `Tem certeza que deseja remover o grupo "${group.name}"? Esta ação removerá o registro do sistema.`,
      confirmLabel: "Sim, Excluir",
      cancelLabel: "Cancelar",
      destructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/painel/grupos/${group.id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.success) {
            showSuccess("O grupo foi excluído com sucesso.", "Grupo Removido");
            loadGroups();
          } else {
            showError(data.message || "Não foi possível excluir o grupo.", "Erro ao Excluir");
          }
        } catch {
          showError("Falha ao tentar excluir o grupo.", "Erro de Conexão");
        }
      },
    });
  };

  // Copiar link de convite
  const handleCopyLink = (group: GroupItem) => {
    if (!group.invite_link) return;
    navigator.clipboard.writeText(group.invite_link);
    setCopiedId(group.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper de Tipo e Permissão de Envio
  const getGroupTypeBadge = (group: GroupItem) => {
    const isClosed =
      group.group_type === "closed" ||
      group.can_send_messages === "admin_only" ||
      group.can_send_messages === ("admin" as any);

    if (isClosed) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap shadow-sm shadow-rose-500/5">
          <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
          <span>Fechado | Só Admin envia</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap shadow-sm shadow-emerald-500/5">
        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
        <span>Aberto | Todos envia</span>
      </span>
    );
  };

  // Helper de Status
  const getStatusBadge = (status: string, interactiveGroup?: GroupItem) => {
    let badgeContent = null;
    switch (status) {
      case "active":
        badgeContent = (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap shadow-sm shadow-emerald-500/5 hover:bg-emerald-500/20 transition-colors">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Ativo</span>
          </span>
        );
        break;
      case "paused":
        badgeContent = (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap hover:bg-amber-500/20 transition-colors">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Pausado</span>
          </span>
        );
        break;
      default:
        badgeContent = (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap shadow-sm shadow-emerald-500/5 hover:bg-emerald-500/20 transition-colors">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Ativo</span>
          </span>
        );
        break;
    }

    if (interactiveGroup) {
      return (
        <button
          type="button"
          onClick={(e) => handleOpenStatusModal(interactiveGroup, e)}
          className="focus:outline-none transition-transform hover:scale-105 active:scale-95 group/statusbtn"
          title="Clique para alterar o status do grupo"
        >
          {badgeContent}
        </button>
      );
    }

    return badgeContent;
  };

  // Grupos filtrados no modal de instância
  const filteredInstanceGroups = instanceGroups.filter((g) => {
    if (instanceSearch) {
      const term = instanceSearch.toLowerCase();
      const matchSearch =
        (g.name && g.name.toLowerCase().includes(term)) ||
        (g.subject && g.subject.toLowerCase().includes(term)) ||
        (g.jid && g.jid.toLowerCase().includes(term));
      if (!matchSearch) return false;
    }

    if (instanceFilterCadastrado === "not_added") {
      return !g.is_already_added;
    }
    if (instanceFilterCadastrado === "added") {
      return g.is_already_added;
    }

    return true;
  });

  const selectableCount = filteredInstanceGroups.filter((g) => !g.is_already_added).length;
  const isAllSelected = selectableCount > 0 && selectedGroupJids.size === selectableCount;

  const paginatedGroups = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return groups.slice(startIndex, startIndex + pageSize);
  }, [groups, currentPage, pageSize]);

  return (
    <div className="w-full space-y-6">
        {/* 1. CABEÇALHO PADRÃO DA PÁGINA */}
        {/* Banner de Upgrade Estratégico se limite de grupos foi atingido */}
        {metrics.limit_groups !== undefined && metrics.limit_groups > 0 && metrics.total_groups >= metrics.limit_groups && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/90 via-rose-950/90 to-purple-950/90 border-2 border-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-pulse p-4 sm:p-5">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 shrink-0">
                  <Crown className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                      Limite de Grupos Atingido
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      {metrics.total_groups} de {metrics.limit_groups} grupos cadastrados
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white mt-1">
                    Sua audiência não para de crescer! Alcance novos públicos no WhatsApp.
                  </h2>
                  <p className="text-xs text-amber-200/80 mt-0.5 leading-relaxed">
                    Você atingiu a cota máxima de grupos do seu plano atual. Faça um upgrade para sincronizar grupos ilimitados, engajar milhares de novos clientes e potencializar seus disparos.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                <Link
                  href="/painel/configuracoes/assinatura?tab=upgrade"
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95 text-center cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Fazer Upgrade de Plano</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                <Users2 className="w-6 h-6 text-indigo-400" />
                Grupos WhatsApp
              </h1>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre, monitore e defina grupos de divulgação, ofertas e suporte da sua empresa.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 w-full pt-1">
            <button
              onClick={handleSyncWithEvolution}
              disabled={syncing || loading}
              title="Sincronizar dados e status dos grupos diretamente com o WhatsApp"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 shadow-sm transition-all focus:outline-none disabled:opacity-50 shrink-0 hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 text-emerald-400 ${syncing ? "animate-spin" : ""}`} />
              <span className="whitespace-nowrap">{syncing ? "Sincronizando..." : "Sincronizar WhatsApp"}</span>
            </button>

            <button
              onClick={loadGroups}
              disabled={loading}
              title="Recarregar lista"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-all focus:outline-none disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? "animate-spin text-indigo-400" : ""}`} />
              <span className="whitespace-nowrap">Atualizar Lista</span>
            </button>

            <button
              onClick={() => handleOpenInstanceGroupsModal()}
              disabled={metrics.limit_groups !== undefined && metrics.limit_groups > 0 && metrics.total_groups >= metrics.limit_groups}
              title={metrics.limit_groups !== undefined && metrics.limit_groups > 0 && metrics.total_groups >= metrics.limit_groups ? "Limite de grupos atingido" : "Adicionar novos grupos"}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {metrics.limit_groups !== undefined && metrics.limit_groups > 0 && metrics.total_groups >= metrics.limit_groups ? (
                <>
                  <Lock className="w-4 h-4 shrink-0 text-amber-300" />
                  <span className="whitespace-nowrap">Limite Atingido</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Novo Grupo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total de Grupos</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-black text-white">{metrics.total_groups}</p>
                {metrics.limit_groups !== undefined && (
                  <span className={`text-xs font-bold ${metrics.limit_groups > 0 && metrics.total_groups >= metrics.limit_groups ? "text-rose-400" : "text-slate-400"}`}>
                    / {metrics.limit_groups > 0 ? metrics.limit_groups : "Ilimitado"}
                  </span>
                )}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
              <Users2 className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total de Membros</p>
              <p className="text-2xl font-black text-white mt-1">{metrics.total_participants.toLocaleString("pt-BR")}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Grupos Ativos</p>
              <p className="text-2xl font-black text-white mt-1">{metrics.active_groups}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Radio className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fechados</p>
              <p className="text-2xl font-black text-white mt-1">{metrics.closed_groups}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 3. FILTROS E BUSCA */}
        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nome, descrição ou JID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                title="Limpar pesquisa"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer w-full"
              >
                <option value="all" className="bg-slate-900 text-slate-200">Todos os Status</option>
                <option value="active" className="bg-slate-900 text-slate-200">Ativos</option>
                <option value="paused" className="bg-slate-900 text-slate-200">Pausados</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer w-full"
              >
                <option value="all" className="bg-slate-900 text-slate-200">Todos os Tipos</option>
                <option value="open" className="bg-slate-900 text-slate-200">Aberto (Todos enviam)</option>
                <option value="closed" className="bg-slate-900 text-slate-200">Fechado (Só Admin)</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all whitespace-nowrap active:scale-95"
                title="Limpar todos os filtros"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. LISTA DE GRUPOS */}
        {loading ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Carregando grupos do WhatsApp...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Nenhum grupo cadastrado</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
                {hasActiveFilters
                  ? "Nenhum grupo corresponde aos filtros selecionados."
                  : "Clique em 'Novo Grupo' para listar os grupos da sua instância do WhatsApp e importá-los com facilidade."}
              </p>
            </div>
            {hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all shadow-md active:scale-95 whitespace-nowrap"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                Limpar Filtros
              </button>
            ) : (
              <button
                onClick={() => handleOpenInstanceGroupsModal()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Buscar Grupos da Instância
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedGroups.map((group) => {
              const occupancy = Math.min(100, Math.round((group.participants_count / (group.max_capacity || 1024)) * 100));

              let tagsArray: string[] = [];
              if (group.tags) {
                if (Array.isArray(group.tags)) tagsArray = group.tags;
                else if (typeof group.tags === "string") {
                  try {
                    const parsed = JSON.parse(group.tags);
                    if (Array.isArray(parsed)) tagsArray = parsed;
                  } catch {
                    tagsArray = [group.tags];
                  }
                }
              }

              return (
                <div
                  key={group.id}
                  className="relative group bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-800/80 hover:border-indigo-500/30 rounded-2xl p-5 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between shadow-lg shadow-black/40 hover:shadow-indigo-500/5 hover:-translate-y-0.5"
                >
                  <div className="space-y-4">
                    {/* Top Bar do Card: Avatar + Badge de Status */}
                    <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-800/40">
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold overflow-hidden shadow-inner flex-shrink-0 group-hover:border-indigo-500/40 transition-colors">
                        {group.avatar_url ? (
                          <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
                        ) : (
                          <Users2 className="w-6 h-6 text-indigo-400" />
                        )}
                      </div>

                      <div className="flex-shrink-0">{getStatusBadge(group.status, group)}</div>
                    </div>

                    {/* Nome do Grupo e JID com espaço total (sem truncar espremido) */}
                    <div className="space-y-1">
                      <h3
                        className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug break-words"
                        title={group.name}
                      >
                        {group.name}
                      </h3>
                      {group.whatsapp_group_id ? (
                        <p className="text-[11px] text-slate-500 font-mono break-all" title={group.whatsapp_group_id}>
                          {group.whatsapp_group_id}
                        </p>
                      ) : (
                        <p className="text-[11px] italic text-slate-600">Sem JID vinculado</p>
                      )}
                    </div>

                    {/* Descrição */}
                    {group.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed bg-slate-950/30 px-2.5 py-1.5 rounded-lg border border-slate-800/40">
                        {group.description}
                      </p>
                    )}

                    {/* Badge de Permissão de Envio / Tipo de Grupo */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {getGroupTypeBadge(group)}
                    </div>

                    {/* Barra de Membros e Ocupação */}
                    <div className="space-y-2 pt-3 border-t border-slate-800/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Membros</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold text-[13px]">{group.participants_count}</span>
                          <span className="text-slate-500 font-medium text-[11px]">/ {group.max_capacity}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                            {occupancy}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800/80">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            occupancy > 90
                              ? "bg-rose-500 shadow-sm shadow-rose-500/50"
                              : occupancy > 70
                              ? "bg-amber-500 shadow-sm shadow-amber-500/50"
                              : "bg-indigo-500 shadow-sm shadow-indigo-500/50"
                          }`}
                          style={{ width: `${Math.max(occupancy, 2)}%` }}
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    {tagsArray.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {tagsArray.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-950/60 text-slate-400 border border-slate-800"
                          >
                            <Tag className="w-2.5 h-2.5 text-indigo-400/70" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ações do Card */}
                  <div className="mt-5 pt-3.5 border-t border-slate-800/60 flex items-center justify-between gap-2">
                    <div>
                      {group.invite_link ? (
                        <button
                          onClick={() => handleCopyLink(group)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800 hover:border-slate-700 transition-all whitespace-nowrap shadow-sm active:scale-95"
                          title="Copiar link de convite"
                        >
                          {copiedId === group.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Convite</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Sem convite</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeleteGroup(group)}
                        className="p-2 rounded-xl bg-slate-950/60 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-all active:scale-95"
                        title="Excluir grupo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={groups.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}

      {/* MODAL 1: SELEÇÃO E IMPORTAÇÃO DE GRUPOS DA INSTÂNCIA */}
      {instanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="p-5 md:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Users2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">Adicionar Grupos da Instância</h3>
                    {instanceInfo?.name && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                        <Smartphone className="w-3 h-3" />
                        {instanceInfo.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Listando apenas grupos abertos (onde todos podem enviar mensagens). Selecione para importar.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInstanceModalOpen(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Pesquisa, Filtro de Permissão e Selecionar Todos */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou ID do grupo..."
                  value={instanceSearch}
                  onChange={(e) => setInstanceSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Filtro: Já cadastrado / Não cadastrado */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400 whitespace-nowrap">Mostrar:</span>
                <select
                  value={instanceFilterCadastrado}
                  onChange={(e) => {
                    setInstanceFilterCadastrado(e.target.value as any);
                    setSelectedGroupJids(new Set());
                  }}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium text-xs"
                >
                  <option value="not_added" className="bg-slate-900">Não cadastrado (Padrão)</option>
                  <option value="added" className="bg-slate-900">Já cadastrado</option>
                  <option value="all" className="bg-slate-900">Todos</option>
                </select>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleSelectAll(filteredInstanceGroups)}
                  disabled={loadingInstanceGroups || selectableCount === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700/60 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {isAllSelected ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Desmarcar Todos</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                      <span>Selecionar Todos ({selectableCount})</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenInstanceGroupsModal(true)}
                  disabled={loadingInstanceGroups}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all disabled:opacity-50"
                  title="Recarregar da Evolution API"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingInstanceGroups ? "animate-spin text-indigo-400" : ""}`} />
                </button>
              </div>
            </div>

            {/* Lista de Grupos da Instância */}
            <div className="p-4 md:p-6 overflow-y-auto max-h-[50vh] space-y-2.5 flex-1">
              {loadingInstanceGroups ? (
                <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-slate-400 text-sm font-medium">Buscando grupos da sua instância de WhatsApp...</p>
                </div>
              ) : filteredInstanceGroups.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center space-y-3 bg-slate-950/30 rounded-xl border border-slate-800/60 p-6">
                  <Info className="w-8 h-8 text-slate-500" />
                  <p className="text-slate-300 text-sm font-semibold">Nenhum grupo encontrado na instância</p>
                  <p className="text-xs text-slate-500 max-w-md">
                    {instanceSearch
                      ? "Nenhum resultado para a busca digitada."
                      : "Verifique se a sua instância de WhatsApp está conectada no menu Configurações & Instâncias."}
                  </p>
                </div>
              ) : (
                filteredInstanceGroups.map((g) => {
                  const isSelected = selectedGroupJids.has(g.jid);
                  const isAlreadyAdded = g.is_already_added;

                  return (
                    <div
                      key={g.jid}
                      onClick={() => !isAlreadyAdded && toggleSelectGroup(g.jid)}
                      className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isAlreadyAdded
                          ? "bg-slate-950/40 border-slate-800/40 opacity-60 cursor-not-allowed"
                          : isSelected
                          ? "bg-indigo-950/30 border-indigo-500/60 shadow-md shadow-indigo-950/40"
                          : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* Checkbox */}
                        <div className="flex-shrink-0">
                          {isAlreadyAdded ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500/60" />
                          ) : isSelected ? (
                            <CheckSquare className="w-5 h-5 text-indigo-400" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-500" />
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold overflow-hidden flex-shrink-0">
                          {g.picture_url ? (
                            <img src={g.picture_url} alt={g.name} className="w-full h-full object-cover" />
                          ) : (
                            <Users2 className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        {/* Informações */}
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white truncate">{g.name || g.subject}</h4>
                            {isAlreadyAdded && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                                Já cadastrado
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                            <span className="font-mono text-[11px] truncate max-w-[180px]">{g.jid}</span>
                            <span>•</span>
                            <span>{g.participants_count} participantes</span>
                          </div>
                        </div>
                      </div>

                      {/* Badges de Permissão */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {g.is_admin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 whitespace-nowrap">
                            <ShieldCheck className="w-3 h-3 text-indigo-400" />
                            Sou Admin
                          </span>
                        )}
                        {g.announce ? (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                            Fechado
                          </span>
                        ) : (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                            Aberto
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 md:p-5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                <span className="font-bold text-white">{selectedGroupJids.size}</span> grupos selecionados
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInstanceModalOpen(false)}
                  disabled={savingBatch}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveBatchGroups}
                  disabled={savingBatch || selectedGroupJids.size === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                >
                  {savingBatch ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Selecionados ({selectedGroupJids.size})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MODAL DEDICADO PARA ESCOLHER STATUS DO GRUPO */}
      {statusModalOpen && statusTargetGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Alterar Status do Grupo</h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[240px]">
                    {statusTargetGroup.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Opções de Status */}
            <div className="p-5 space-y-2.5">
              <p className="text-xs font-semibold text-slate-400 mb-3">
                Escolha o novo status para este grupo:
              </p>

              {/* Opção: Ativo */}
              <label
                onClick={() => setSelectedNewStatus("active")}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedNewStatus === "active"
                    ? "bg-emerald-950/30 border-emerald-500/60 shadow-md shadow-emerald-950/40"
                    : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="group_status"
                  value="active"
                  checked={selectedNewStatus === "active"}
                  onChange={() => setSelectedNewStatus("active")}
                  className="mt-1 text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-sm font-bold text-emerald-400">Ativo</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Grupo pronto para receber envios de campanhas, monitoramento e métricas.
                  </p>
                </div>
              </label>

              {/* Opção: Pausado */}
              <label
                onClick={() => setSelectedNewStatus("paused")}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedNewStatus === "paused"
                    ? "bg-amber-950/30 border-amber-500/60 shadow-md shadow-amber-950/40"
                    : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="group_status"
                  value="paused"
                  checked={selectedNewStatus === "paused"}
                  onChange={() => setSelectedNewStatus("paused")}
                  className="mt-1 text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-sm font-bold text-amber-400">Pausado</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pausa temporariamente o disparo de campanhas e ações automáticas para o grupo.
                  </p>
                </div>
              </label>
            </div>

            {/* Footer */}
            <div className="p-4 md:p-5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                disabled={savingStatusChange}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveStatusChange}
                disabled={savingStatusChange}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
              >
                {savingStatusChange ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Confirmar Alteração
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
