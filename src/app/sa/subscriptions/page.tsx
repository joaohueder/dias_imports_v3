"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Zap,
  Search,
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
} from "lucide-react";
import { toast } from "sonner";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { formatCurrencyBRL } from "@/lib/formatters";
import { formatDocumentWithLabel } from "@/lib/validators";

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
  max_instances: number;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
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

        <div className="flex items-center gap-3">
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
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por empresa, CNPJ/CPF ou nome do plano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
          />
        </div>

        {/* Abas Rápidas / Seletor de Status */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl w-full sm:w-auto overflow-x-auto">
          {[
            { id: "active", label: "Ativas" },
            { id: "past_due", label: "Inadimplentes" },
            { id: "canceled", label: "Canceladas" },
            { id: "expired", label: "Expiradas" },
            { id: "all", label: "Todas" },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
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
              {statusFilter === "active"
                ? "Não há nenhuma assinatura ativa no momento ou o termo de busca não retornou dados."
                : "Nenhum contrato encontrado para os filtros selecionados."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-[28%]">Empresa / Tenant</th>
                  <th className="py-3.5 px-4 w-[24%]">Plano & Cotas</th>
                  <th className="py-3.5 px-4 w-[14%]">Valor</th>
                  <th className="py-3.5 px-4 w-[12%]">Status</th>
                  <th className="py-3.5 px-4 w-[14%]">Vigência</th>
                  <th className="py-3.5 px-4 w-[8%] text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSubscriptions.map((sub) => {
                  const statusConfig = subStatusLabels[sub.status] || subStatusLabels.active;
                  const StatusIcon = statusConfig.icon;
                  const daysRemaining = getDaysRemaining(sub.current_period_end);
                  const isEndingSoon = sub.status === "active" && daysRemaining <= 7 && daysRemaining >= 0;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors group">
                      {/* Empresa */}
                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-slate-800/80 text-violet-400 border border-slate-700/60 shrink-0 shadow-sm">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white text-sm leading-snug group-hover:text-violet-300 transition-colors truncate">
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

                      {/* Plano & Cotas */}
                      <td className="py-4 px-4 align-middle">
                        <div className="space-y-1.5">
                          <div className="font-bold text-indigo-300 text-sm flex items-center gap-2">
                            <span>{sub.plan_name}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800/90 text-[10px] text-slate-300 border border-slate-700/60 font-medium">
                              Grupos: <strong className="text-white ml-1">{sub.max_groups === 0 ? "∞" : sub.max_groups}</strong>
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800/90 text-[10px] text-slate-300 border border-slate-700/60 font-medium">
                              Produtos: <strong className="text-white ml-1">{sub.max_products === 0 ? "∞" : sub.max_products}</strong>
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800/90 text-[10px] text-slate-300 border border-slate-700/60 font-medium">
                              Envios: <strong className="text-white ml-1">{sub.max_messages_day?.toLocaleString("pt-BR")}/dia</strong>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Valor & Método */}
                      <td className="py-4 px-4 align-middle">
                        <div className="font-black text-white text-sm tracking-tight">
                          {formatCurrencyBRL(sub.price_at_subscription)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                          {sub.payment_method || "PIX"}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap shadow-sm ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusConfig.label}
                        </span>
                      </td>

                      {/* Período / Vigência */}
                      <td className="py-4 px-4 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-300 whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            <span className="text-[11px] text-slate-400">Início:</span>
                            <span className="text-[11px] text-white font-semibold">{formatDate(sub.current_period_start)}</span>
                          </div>

                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Clock className={`w-3.5 h-3.5 shrink-0 ${isEndingSoon ? "text-amber-400" : "text-slate-400"}`} />
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
                      <td className="py-4 px-4 align-middle text-right">
                        <Link
                          href={`/sa/companies/${sub.company_id}?tab=subscription`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/90 hover:bg-violet-600 text-slate-300 hover:text-white border border-slate-700/60 hover:border-violet-500 transition-all shadow-sm"
                        >
                          <span>Gerenciar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
