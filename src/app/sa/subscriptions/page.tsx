"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Zap,
  Plus,
  Search,
  Filter,
  CreditCard,
  Building2,
  Layers,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

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
  status: "active" | "trialing" | "past_due" | "canceled" | "expired";
  current_period_start: string;
  current_period_end: string;
  payment_method: string;
  price_at_subscription: number | string;
  created_at: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
        toast.error(data.error || "Erro ao carregar assinaturas");
      }
    } catch {
      toast.error("Erro de conexão ao buscar assinaturas");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

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
    { label: string; bg: string; text: string; border: string }
  > = {
    active: {
      label: "Ativa",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
    },
    trialing: {
      label: "Degustação",
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/30",
    },
    past_due: {
      label: "Inadimplente",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/30",
    },
    canceled: {
      label: "Cancelada",
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      border: "border-rose-500/30",
    },
    expired: {
      label: "Expirada",
      bg: "bg-slate-500/10",
      text: "text-slate-400",
      border: "border-slate-500/30",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Assinaturas</h1>
            <p className="text-sm text-slate-400">
              Controle de adesão, vigência de contratos, recorrência e histórico de pagamentos dos tenants.
            </p>
          </div>
        </div>

        <button
          onClick={fetchSubscriptions}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por empresa, CNPJ ou plano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-violet-500/50"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativas</option>
            <option value="trialing">Degustação</option>
            <option value="past_due">Inadimplentes</option>
            <option value="canceled">Canceladas</option>
            <option value="expired">Expiradas</option>
          </select>
        </div>
      </div>

      {/* Tabela de Assinaturas */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Contratos & Assinaturas Ativas</h3>
            <p className="text-xs text-slate-400">Total de {filteredSubscriptions.length} registro(s) encontrado(s)</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Carregando assinaturas...</span>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">Nenhuma assinatura encontrada</p>
            <p className="text-xs text-slate-500 mt-1">
              As assinaturas são criadas vinculando as empresas aos planos ativos do catálogo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Empresa</th>
                  <th className="py-3 px-4">Plano Contratado</th>
                  <th className="py-3 px-4">Limites Operacionais</th>
                  <th className="py-3 px-4">Valor Mensal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Vigência Atual</th>
                  <th className="py-3 px-4">Método</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSubscriptions.map((sub) => {
                  const statusConfig = subStatusLabels[sub.status] || subStatusLabels.active;
                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">
                          {sub.company_trade_name || sub.company_name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{sub.company_name}</span>
                          {sub.company_document && <span>• {sub.company_document}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-indigo-300 text-sm">{sub.plan_name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="space-y-0.5 text-[11px]">
                          <div>Grupos: <strong className="text-white">{sub.max_groups === 0 ? "Ilimitado" : sub.max_groups}</strong></div>
                          <div>Produtos: <strong className="text-white">{sub.max_products === 0 ? "Ilimitado" : sub.max_products}</strong></div>
                          <div>Envios/dia: <strong className="text-white">{sub.max_messages_day?.toLocaleString("pt-BR")}</strong></div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-black text-white text-sm">
                        R$ {Number(sub.price_at_subscription).toFixed(2).replace(".", ",")}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="flex items-center gap-1 text-slate-300 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Até {new Date(sub.current_period_end).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 uppercase font-bold text-[11px]">
                        {sub.payment_method}
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
