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
  Server,
  Zap,
  Sparkles,
  Users,
  FileCode2,
  Lock,
  Compass,
} from "lucide-react";
import { formatCurrencyBRL } from "@/lib/formatters";
import { formatDocumentWithLabel } from "@/lib/validators";
import { hasUserPermission } from "@/lib/permissions";
import { LockedCard } from "@/components/sa/LockedCard";

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

  // Usuário logado e permissões
  const [userData, setUserData] = useState<{
    role: string;
    permissions: Record<string, any> | null;
  }>({
    role: "SUPER_ADMIN",
    permissions: null,
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/sa/profile");
        const json = await res.json();
        if (json.success && json.user) {
          setUserData({
            role: json.user.role || "SUPER_ADMIN",
            permissions: json.user.permissions || null,
          });
        }
      } catch {
        // Fallback silencioso
      }
    }
    loadProfile();
  }, []);

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

  // Permissões granulares de cada módulo
  const canViewCompanies = hasUserPermission(userData.role, userData.permissions, "companies", "view");
  const canCreateCompany = hasUserPermission(userData.role, userData.permissions, "companies", "create");
  const canViewSubscriptions = hasUserPermission(userData.role, userData.permissions, "subscriptions", "view");
  const canViewPlans = hasUserPermission(userData.role, userData.permissions, "plans", "view");
  const canViewHealth = hasUserPermission(userData.role, userData.permissions, "health", "view");

  const stats = data?.stats;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. CABEÇALHO UNIFICADO DO SISTEMA */}
      <div className="flex flex-col gap-4 pb-4 border-b border-slate-800/80">
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
            Monitore em tempo real as empresas cadastradas, assinaturas, faturamento MRR, planos e integridade dos serviços.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 w-full pt-1">
          <button
            onClick={() => fetchDashboardData()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all focus:outline-none disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? "animate-spin" : ""}`} />
            <span className="whitespace-nowrap">Atualizar</span>
          </button>

          {canCreateCompany && (
            <Link
              href="/sa/companies/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Nova Empresa</span>
            </Link>
          )}
        </div>
      </div>

      {/* 2. GRID DE KPIS COM CONTROLE DE PERMISSÃO / LOCKED CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Empresas Ativas */}
        {canViewCompanies ? (
          <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 hover:border-indigo-500/40 shadow-xl shadow-black/20 transition-all group hover:scale-[1.02]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Empresas Ativas
              </span>
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:rotate-6 transition-transform">
                <Building2 className="w-5 h-5" />
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
        ) : (
          <LockedCard title="Empresas Ativas" description="Módulo de empresas restrito" iconVariant="ghost" />
        )}

        {/* KPI 2: Assinaturas Ativas */}
        {canViewSubscriptions ? (
          <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 hover:border-emerald-500/40 shadow-xl shadow-black/20 transition-all group hover:scale-[1.02]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Assinaturas Ativas
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:rotate-6 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white">
                {stats?.subscriptions.active || 0}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium">
              <span className="text-emerald-400 font-medium">
                {stats?.subscriptions.active === 1 ? "1 assinatura ativa" : `${stats?.subscriptions.active || 0} ativas`}
              </span>
              {Number(stats?.subscriptions.past_due) > 0 && (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  • {stats?.subscriptions.past_due} pendentes
                </span>
              )}
            </div>
          </div>
        ) : (
          <LockedCard title="Assinaturas Ativas" description="Módulo de assinaturas restrito" iconVariant="smile" />
        )}

        {/* KPI 3: MRR Estimado */}
        {canViewSubscriptions ? (
          <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 hover:border-amber-500/40 shadow-xl shadow-black/20 transition-all group hover:scale-[1.02]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                MRR Recorrente (Mês)
              </span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:rotate-6 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-white">
              {formatCurrencyBRL(stats?.subscriptions.mrr || 0)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400 font-medium">
              <span>Receita mensal estimada</span>
            </div>
          </div>
        ) : (
          <LockedCard title="MRR Recorrente" description="Métricas de faturamento bloqueadas" iconVariant="ghost" />
        )}

        {/* KPI 4: Planos Ativos */}
        {canViewPlans ? (
          <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 hover:border-violet-500/40 shadow-xl shadow-black/20 transition-all group hover:scale-[1.02]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-violet-500/20 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total de Planos
              </span>
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 group-hover:rotate-6 transition-transform">
                <Layers className="w-5 h-5" />
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
        ) : (
          <LockedCard title="Total de Planos" description="Módulo de planos restrito" iconVariant="smile" />
        )}
      </div>

      {/* 3. SECTIONS PRINCIPAIS (EMPRESAS RECENTES + DISTRIBUIÇÃO DE PLANOS / HEALTH) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bloco Esquerda: Empresas Recentes */}
        <div className="lg:col-span-2">
          {canViewCompanies ? (
            <div className="rounded-3xl bg-[#090f1d]/90 border border-slate-800/80 p-6 shadow-2xl shadow-black/30 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Últimas Empresas Cadastradas</h2>
                    <p className="text-xs text-slate-400">Tenants recentes e seus respectivos planos contratados</p>
                  </div>
                </div>
                <Link
                  href="/sa/companies"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-800/60"
                >
                  <span>Ver todas</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-800/60">
                {(!data?.recentCompanies || data.recentCompanies.length === 0) ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    Nenhuma empresa cadastrada no momento.
                  </div>
                ) : (
                  data.recentCompanies.map((c) => (
                    <div key={c.id} className="py-4 flex items-center justify-between gap-4 group hover:bg-slate-800/20 px-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-xs shrink-0 group-hover:scale-105 transition-transform">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/sa/companies/${c.id}`}
                            className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors block truncate"
                          >
                            {c.name}
                          </Link>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {formatDocumentWithLabel(c.document)} • <span className="text-slate-300">{c.plan_name ? `Plano ${c.plan_name}` : "Sem plano"}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${
                            c.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-950/50"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {c.status === "active" ? "Ativa" : "Inativa"}
                        </span>
                        <Link
                          href={`/sa/companies/${c.id}?tab=subscription`}
                          className="p-2 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-xl transition-colors"
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
          ) : (
            <LockedCard
              title="Lista de Empresas Cadastradas"
              description="Você não possui privilégios para visualizar os dados de tenants da plataforma."
              className="h-full min-h-[320px]"
              iconVariant="ghost"
            />
          )}
        </div>

        {/* Bloco Direita: Planos & Saúde do Sistema */}
        <div className="space-y-6">
          {/* Planos */}
          {canViewPlans ? (
            <div className="rounded-3xl bg-[#090f1d]/90 border border-slate-800/80 p-6 shadow-2xl shadow-black/30 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-white">Assinaturas por Plano</h2>
                </div>
                <Link
                  href="/sa/plans"
                  className="text-xs text-violet-400 hover:text-violet-300 font-semibold"
                >
                  Gerenciar
                </Link>
              </div>

              <div className="space-y-3.5">
                {(!data?.plansDistribution || data.plansDistribution.length === 0) ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Nenhum plano cadastrado.</p>
                ) : (
                  data.plansDistribution.map((p) => {
                    const percent =
                      stats?.subscriptions.total && stats.subscriptions.total > 0
                        ? Math.round((p.total_subscriptions / stats.subscriptions.total) * 100)
                        : 0;

                    return (
                      <div key={p.id} className="space-y-1.5 p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">{p.name}</span>
                          <span className="text-slate-400 font-medium">
                            {p.active_subscriptions} ativa(s) • <span className="text-emerald-400">{formatCurrencyBRL(p.price)}</span>
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <LockedCard
              title="Assinaturas por Plano"
              description="Módulo de planos bloqueado para sua conta."
              iconVariant="smile"
            />
          )}

          {/* Telemetria e Saúde */}
          {canViewHealth ? (
            <div className="rounded-3xl bg-[#090f1d]/90 border border-slate-800/80 p-6 shadow-2xl shadow-black/30 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-white">Saúde dos Serviços</h2>
                </div>
                <Link
                  href="/sa/health"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Ver Detalhes
                </Link>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">Banco de Dados MySQL</span>
                  </div>
                  <span className="text-emerald-400 font-bold text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">Operacional</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-semibold">Servidor Next.js (Turbopack)</span>
                  </div>
                  <span className="text-indigo-400 font-bold text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">Online</span>
                </div>
              </div>
            </div>
          ) : (
            <LockedCard
              title="Saúde dos Serviços"
              description="Acesso a métricas de telemetria restrito."
              iconVariant="ghost"
            />
          )}
        </div>
      </div>
    </div>
  );
}

