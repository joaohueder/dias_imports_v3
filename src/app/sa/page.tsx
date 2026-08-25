"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  Building2,
  CreditCard,
  Layers,
  Activity,
  ArrowUpRight,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  RefreshCw,
  Cpu,
  HardDrive,
  Server,
  DollarSign,
  UserCheck,
} from "lucide-react";
import { formatCurrencyBRL } from "@/lib/formatters";
import { formatDocumentWithLabel } from "@/lib/validators";

interface DashboardData {
  stats: {
    companies: {
      total: number;
      active: number;
      inactive: number;
    };
    plans: {
      total: number;
      active: number;
    };
    subscriptions: {
      total: number;
      active: number;
      past_due: number;
      canceled: number;
      expired: number;
      mrr: number;
    };
  };
  recentCompanies: Array<{
    id: number;
    name: string;
    document: string;
    email: string;
    admin_whatsapp?: string;
    status: "active" | "inactive";
    created_at: string;
    plan_name: string | null;
    subscription_status: string | null;
    current_period_end: string | null;
  }>;
  plansDistribution: Array<{
    id: number;
    name: string;
    price: number | string;
    billing_cycle: string;
    total_subscriptions: number;
    active_subscriptions: number;
  }>;
}

export default function SuperAdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sa/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch {
      // Falha silenciosa ou reconexão
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Shield className="w-6 h-6 text-indigo-400" />
              Governança Central & Infraestrutura
            </h1>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitore em tempo real as empresas cadastradas, assinaturas, MRR recorrente, planos ativos e integridade do ecossistema.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboardData()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all focus:outline-none disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? "animate-spin" : ""}`} />
            <span className="whitespace-nowrap">Atualizar</span>
          </button>

          <Link
            href="/sa/companies/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Nova Empresa</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Empresas Ativas */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Empresas Ativas
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white">
              {stats?.companies.active || 0}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs font-medium">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {stats?.companies.active === 1 ? "1 empresa ativa" : `${stats?.companies.active || 0} empresas ativas`}
            </span>
          </div>
        </div>

        {/* Assinaturas Ativas */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Assinaturas Ativas
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white">
              {stats?.subscriptions.active || 0}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs font-medium">
            <span className="text-emerald-400 font-medium">
              {stats?.subscriptions.active === 1 ? "1 assinatura ativa" : `${stats?.subscriptions.active || 0} assinaturas ativas`}
            </span>
            {Number(stats?.subscriptions.past_due) > 0 && (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                • {stats?.subscriptions.past_due} atrasadas
              </span>
            )}
          </div>
        </div>

        {/* MRR Estimado */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              MRR Recorrente (Mês)
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-white">
            {formatCurrencyBRL(stats?.subscriptions.mrr || 0)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400 font-medium">
            <span>Receita mensal estimada</span>
          </div>
        </div>

        {/* Total de Planos Ativos */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-violet-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total de Planos Ativos
            </span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white">
              {stats?.plans.active || 0}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-violet-400 font-medium">
            <span>{stats?.plans.active === 1 ? "1 plano ativo" : `${stats?.plans.active || 0} planos ativos`}</span>
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Companies List */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Últimas Empresas Cadastradas
              </h2>
              <p className="text-xs text-slate-400">Tenants recentes e seus respectivos planos</p>
            </div>
            <Link
              href="/sa/companies"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {(!data?.recentCompanies || data.recentCompanies.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Nenhuma empresa cadastrada no momento.
              </div>
            ) : (
              data.recentCompanies.map((c) => (
                <div key={c.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-300 text-xs shrink-0">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/sa/companies/${c.id}`}
                        className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors block truncate"
                      >
                        {c.name}
                      </Link>
                      <p className="text-xs text-slate-400 truncate">
                        {formatDocumentWithLabel(c.document)} • {c.plan_name ? `Plano ${c.plan_name}` : "Sem plano"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        c.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {c.status === "active" ? "Ativa" : "Inativa"}
                    </span>
                    <Link
                      href={`/sa/companies/${c.id}?tab=subscription`}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Gerenciar Assinatura"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Plan Distribution & System Status */}
        <div className="space-y-6">
          {/* Plan Distribution */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-400" />
                Assinaturas por Plano
              </h2>
              <Link
                href="/sa/plans"
                className="text-xs text-violet-400 hover:text-violet-300 font-semibold"
              >
                Gerenciar
              </Link>
            </div>

            <div className="space-y-3">
              {(!data?.plansDistribution || data.plansDistribution.length === 0) ? (
                <p className="text-xs text-slate-500 py-2 text-center">Nenhum plano cadastrado.</p>
              ) : (
                data.plansDistribution.map((p) => {
                  const percent =
                    stats?.subscriptions.total && stats.subscriptions.total > 0
                      ? Math.round((p.total_subscriptions / stats.subscriptions.total) * 100)
                      : 0;

                  return (
                    <div key={p.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{p.name}</span>
                        <span className="text-slate-400 font-medium">
                          {p.active_subscriptions} ativa(s) • {formatCurrencyBRL(p.price)}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Health Status */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Saúde dos Serviços
              </h2>
              <Link
                href="/sa/health"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Ver Métricas
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center gap-2 text-slate-300">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Banco de Dados MySQL</span>
                </div>
                <span className="text-emerald-400 font-bold">Operacional</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center gap-2 text-slate-300">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Next.js Turbopack App</span>
                </div>
                <span className="text-indigo-400 font-bold">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

