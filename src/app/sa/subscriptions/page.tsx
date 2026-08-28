"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Zap,
  Search,
  Filter,
  CreditCard,
  Building2,
  Calendar,
  RefreshCw,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock3,
  Flame,
  ArrowRight,
  Users,
  Package,
  MessageSquare,
  Eye,
  UserCheck,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { formatCurrencyBRL } from "@/lib/formatters";
import { formatDocumentWithLabel } from "@/lib/validators";
import { Pagination } from "@/components/ui/Pagination";

interface Subscription {
  id: number;
  company_id: number;
  company_name: string;
  company_trade_name: string | null;
  company_document: string | null;
  plan_id: number;
  plan_name: string;
  max_groups: number;
  max_products: number;
  max_messages_day: number;
  max_views?: number;
  max_leads?: number;
  max_instances: number;
  current_groups_count?: number;
  current_products_count?: number;
  current_views_count?: number;
  current_leads_count?: number;
  current_instances_count?: number;
  current_messages_today?: number;
  status: "active" | "past_due" | "canceled" | "expired";
  current_period_start: string;
  current_period_end: string;
  payment_method: string;
  price_at_subscription: number | string;
  created_at: string;
}

export default function SubscriptionsPage() {
  const { showError } = useFeedbackModal();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const hasActiveFilters = searchTerm.trim().length > 0 || statusFilter !== "active";

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("active");
    setCurrentPage(1);
  };

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/sa/subscriptions?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setSubscriptions(data.subscriptions || []);
      } else {
        showError(data.error || "Erro ao carregar assinaturas", "Falha ao Carregar");
      }
    } catch {
      showError("Erro de conexão ao buscar assinaturas", "Erro de Conexão");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showError]);

  useEffect(() => {
    setCurrentPage(1);
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      sub.company_name?.toLowerCase().includes(term) ||
      sub.company_trade_name?.toLowerCase().includes(term) ||
      sub.plan_name?.toLowerCase().includes(term) ||
      sub.company_document?.includes(term)
    );
  });

  const paginatedSubscriptions = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSubscriptions.slice(startIndex, startIndex + pageSize);
  }, [filteredSubscriptions, currentPage, pageSize]);

  const subStatusLabels: Record<
    string,
    { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    active: {
      label: "Ativa",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      icon: CheckCircle2,
    },
    past_due: {
      label: "Inadimplente",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/30",
      icon: AlertCircle,
    },
    canceled: {
      label: "Cancelada",
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      border: "border-rose-500/30",
      icon: XCircle,
    },
    expired: {
      label: "Expirada",
      bg: "bg-slate-500/10",
      text: "text-slate-400",
      border: "border-slate-500/30",
      icon: Clock3,
    },
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR");
  };

  const getDaysRemaining = (endStr: string) => {
    const end = new Date(endStr);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Zap className="w-6 h-6 text-indigo-400" />
              Assinaturas & Contratos
            </h1>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Controle de vigência de contratos, ciclo de faturamento e limites operacionais dos tenants.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 w-full pt-1">
          <button
            onClick={fetchSubscriptions}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all focus:outline-none disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? "animate-spin" : ""}`} />
            <span className="whitespace-nowrap">Atualizar</span>
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por empresa, CNPJ/CPF ou plano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer w-full"
            >
              <option value="all" className="bg-slate-900 text-slate-200">Todos os Status</option>
              <option value="active" className="bg-slate-900 text-slate-200">Ativas</option>
              <option value="past_due" className="bg-slate-900 text-slate-200">Inadimplentes</option>
              <option value="canceled" className="bg-slate-900 text-slate-200">Canceladas</option>
              <option value="expired" className="bg-slate-900 text-slate-200">Expiradas</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer shrink-0"
              title="Limpar todos os filtros"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Assinaturas */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">
              {statusFilter === "active"
                ? "Assinaturas Ativas"
                : statusFilter === "all"
                ? "Todas as Assinaturas"
                : `Assinaturas (${subStatusLabels[statusFilter]?.label || statusFilter})`}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {filteredSubscriptions.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-sm font-medium text-slate-400">Carregando assinaturas...</span>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-3 text-slate-500 border border-slate-800">
              <CreditCard className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">Nenhuma assinatura encontrada</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? "Nenhuma assinatura corresponde aos filtros de busca aplicados."
                : "Não há nenhuma assinatura cadastrada no momento."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all cursor-pointer shadow-md"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1222] border-b border-slate-800/90 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5 w-[32%]">Empresa / Tenant</th>
                  <th className="px-5 py-3.5 w-[22%]">Plano</th>
                  <th className="px-5 py-3.5 w-[16%]">Valor</th>
                  <th className="px-5 py-3.5 w-[12%]">Status</th>
                  <th className="px-5 py-3.5 w-[12%]">Vigência</th>
                  <th className="px-5 py-3.5 w-[6%] text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedSubscriptions.map((sub) => {
                  const statusConfig = subStatusLabels[sub.status] || subStatusLabels.active;
                  const StatusIcon = statusConfig.icon;
                  const daysRemaining = getDaysRemaining(sub.current_period_end);
                  const isEndingSoon = sub.status === "active" && daysRemaining <= 7 && daysRemaining >= 0;

                  return (
                    <React.Fragment key={sub.id}>
                      <tr className="hover:bg-slate-900/40 transition-colors group">
                        {/* Empresa */}
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
                              {sub.company_name?.slice(0, 2).toUpperCase() || "EP"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white text-sm leading-snug group-hover:text-indigo-300 transition-colors truncate">
                                {sub.company_trade_name || sub.company_name}
                              </div>
                              {sub.company_trade_name && (
                                <div className="text-[11px] text-slate-400 truncate">
                                  {sub.company_name}
                                </div>
                              )}
                              {sub.company_document && (
                                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                  {formatDocumentWithLabel(sub.company_document)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Plano */}
                        <td className="px-5 py-4 align-middle">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold text-xs">
                            <Layers className="w-3.5 h-3.5 shrink-0" />
                            <span>{sub.plan_name}</span>
                          </span>
                        </td>

                        {/* Valor & Método */}
                        <td className="px-5 py-4 align-middle">
                          <div className="font-black text-white text-sm tracking-tight">
                            {formatCurrencyBRL(sub.price_at_subscription)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                            {sub.payment_method || "PIX"}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 align-middle">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap shadow-sm ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </td>

                        {/* Período / Vigência */}
                        <td className="px-5 py-4 align-middle">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-300 whitespace-nowrap">
                              <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span className="text-[11px] text-slate-400">Início:</span>
                              <span className="text-[11px] text-white font-semibold">{formatDate(sub.current_period_start)}</span>
                            </div>

                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <Clock className={`w-3 h-3 shrink-0 ${isEndingSoon ? "text-amber-400" : "text-slate-400"}`} />
                              <span className="text-[11px] text-slate-400">
                                {sub.status === "active" ? "Término:" : "Encerrou:"}
                              </span>
                              <span className={`text-[11px] font-semibold ${isEndingSoon ? "text-amber-300" : "text-white"}`}>
                                {formatDate(sub.current_period_end)}
                              </span>
                            </div>

                            {/* Badge de dias restantes / vencimento */}
                            {sub.status === "active" && (
                              <div className="pt-0.5">
                                {daysRemaining < 0 ? (
                                  <span className="inline-block text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                    Vencida há {Math.abs(daysRemaining)} dia(s)
                                  </span>
                                ) : daysRemaining === 0 ? (
                                  <span className="inline-block text-[10px] font-semibold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                    Vence hoje
                                  </span>
                                ) : (
                                  <span className={`inline-block text-[10px] font-medium ${isEndingSoon ? "text-amber-300" : "text-slate-400"}`}>
                                    {daysRemaining} dia(s) restante(s)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Ação */}
                        <td className="px-5 py-4 align-middle text-right">
                          <Link
                            href={`/sa/companies/${sub.company_id}?tab=subscription`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/90 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700/60 hover:border-indigo-500 transition-all shadow-sm active:scale-95"
                            title="Gerenciar Assinatura"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>

                      {/* Linha Dedicada: Limites da Assinatura no Formato Linha Contendo Uso/Limite */}
                      <tr className="bg-[#080d1a]/70 border-b border-slate-800/80">
                        <td colSpan={6} className="px-5 py-2.5">
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
                              Limites:
                            </span>

                            <div className="flex items-center gap-1.5 whitespace-nowrap" title={`Grupos de WhatsApp: ${sub.current_groups_count ?? 0} utilizados de ${sub.max_groups === 0 ? "Ilimitado" : sub.max_groups}`}>
                              <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span>
                                Grupos: <strong className="text-white font-semibold">{sub.current_groups_count ?? 0}</strong>/{sub.max_groups === 0 ? "∞" : sub.max_groups}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 whitespace-nowrap" title={`Produtos no Catálogo: ${sub.current_products_count ?? 0} cadastrados de ${sub.max_products === 0 ? "Ilimitado" : sub.max_products}`}>
                              <Package className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                              <span>
                                Produtos: <strong className="text-white font-semibold">{sub.current_products_count ?? 0}</strong>/{sub.max_products === 0 ? "∞" : sub.max_products}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 whitespace-nowrap" title={`Disparos Hoje: ${sub.current_messages_today ?? 0} enviados de ${(sub.max_messages_day ?? 0) === 0 ? "Ilimitado" : (sub.max_messages_day ?? 0).toLocaleString("pt-BR")}`}>
                              <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>
                                Envios/dia: <strong className="text-white font-semibold">{sub.current_messages_today ?? 0}</strong>/{(sub.max_messages_day ?? 0) === 0 ? "∞" : (sub.max_messages_day ?? 0).toLocaleString("pt-BR")}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 whitespace-nowrap" title={`Visualizações de Catálogo: ${(sub.current_views_count ?? 0).toLocaleString("pt-BR")} visualizações de ${(sub.max_views ?? 0) === 0 ? "Ilimitado" : (sub.max_views ?? 0).toLocaleString("pt-BR")}`}>
                              <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              <span>
                                Visualizações: <strong className="text-white font-semibold">{(sub.current_views_count ?? 0).toLocaleString("pt-BR")}</strong>/{(sub.max_views ?? 0) === 0 ? "∞" : (sub.max_views ?? 0).toLocaleString("pt-BR")}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 whitespace-nowrap" title={`Leads Capturados: ${(sub.current_leads_count ?? 0).toLocaleString("pt-BR")} leads de ${(sub.max_leads ?? 0) === 0 ? "Ilimitado" : (sub.max_leads ?? 0).toLocaleString("pt-BR")}`}>
                              <UserCheck className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                              <span>
                                Leads: <strong className="text-white font-semibold">{(sub.current_leads_count ?? 0).toLocaleString("pt-BR")}</strong>/{(sub.max_leads ?? 0) === 0 ? "∞" : (sub.max_leads ?? 0).toLocaleString("pt-BR")}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredSubscriptions.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredSubscriptions.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
