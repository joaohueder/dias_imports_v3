"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Sparkles,
  Users2,
  Package,
  UserCheck,
  Settings,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Zap,
  TrendingUp,
  ArrowUpRight,
  Eye,
  MousePointerClick,
  Send,
  MessageSquare,
  Smartphone,
  Crown,
  AlertTriangle,
  Flame,
  Activity,
  Layers,
  BarChart3,
  ExternalLink,
  ChevronRight,
  ListChecks,
} from "lucide-react";
import { formatCurrencyBRL } from "@/lib/formatters";

interface DashboardData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    company_id?: number | null;
  };
  company: {
    id: number;
    name: string;
    trade_name?: string;
    document?: string;
    email?: string;
    phone?: string;
    admin_whatsapp?: string;
    plan: string;
    status: string;
    max_instances: number;
    max_messages_day: number;
    onboarding_completed?: boolean;
    onboarding_current_step?: number;
    onboarding_completed_steps?: number[];
  };
  stats: {
    totalInstances: number;
    connectedInstances: number;
    maxInstances: number;
    maxMessagesDay: number;
    totalMessagesSent: number;
    totalMessagesReceived: number;
    totalParticipants: number;
    totalCampaigns: number;
    activeGroups: number;
    teamMembersCount: number;
    sendsToday: number;
  };
  quotas: {
    groups: { current: number; limit: number };
    products: { current: number; limit: number };
    messages_day: { current: number; limit: number; totalSent?: number };
    views: { current: number; limit: number };
    leads: { current: number; limit: number };
  };
  last7DaysChart?: Array<{
    date: string;
    label: string;
    sends: number;
    leads: number;
    views: number;
  }>;
  topProducts?: Array<{
    id: number;
    name: string;
    slug: string;
    price: number | string;
    promo_price?: number | string | null;
    cover_image?: string | null;
    sends_count: number;
    clicks_count: number;
    views_count: number;
    status: string;
    created_at: string;
  }>;
  topGroups?: Array<{
    id: number;
    name: string;
    whatsapp_group_id: string;
    participants_count: number;
    group_type: string;
    status: string;
    can_send_messages: string;
    updated_at: string;
  }>;
  recentLeads?: Array<{
    id: number;
    name: string;
    whatsapp: string;
    origin_slug?: string;
    status: string;
    created_at: string;
    landing_title?: string;
  }>;
  instances?: Array<{
    id: number;
    name: string;
    whatsapp_number?: string;
    status: string;
    phone_connected?: string;
    profile_name?: string;
    profile_picture_url?: string;
    battery_level?: number;
    is_charging?: boolean;
    is_default?: boolean;
  }>;
}

export default function CompanyDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeChartMetric, setActiveChartMetric] = useState<"sends" | "leads" | "views">("sends");

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch("/api/painel/dashboard");
      if (res.status === 401) {
        window.location.href = "/painel/login";
        return;
      }
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar painel:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 gap-4">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <span className="text-sm font-medium">Carregando métricas da empresa...</span>
      </div>
    );
  }

  // Cálculos de Quotas & Percentuais
  const quotaGroups = data?.quotas?.groups || { current: 0, limit: 0 };
  const quotaProducts = data?.quotas?.products || { current: 0, limit: 0 };
  const quotaMessages = data?.quotas?.messages_day || { current: 0, limit: 0 };
  const quotaViews = data?.quotas?.views || { current: 0, limit: 0 };
  const quotaLeads = data?.quotas?.leads || { current: 0, limit: 0 };

  const getPercent = (curr: number, lim: number) => {
    if (!lim || lim <= 0) return 0;
    return Math.min(100, Math.round((curr / lim) * 100));
  };

  const pctGroups = getPercent(quotaGroups.current, quotaGroups.limit);
  const pctProducts = getPercent(quotaProducts.current, quotaProducts.limit);
  const pctMessages = getPercent(quotaMessages.current, quotaMessages.limit);
  const pctViews = getPercent(quotaViews.current, quotaViews.limit);
  const pctLeads = getPercent(quotaLeads.current, quotaLeads.limit);

  // Gráfico - valores máximos para normalização de altura
  const chartData = data?.last7DaysChart || [];
  const maxValInChart = Math.max(
    ...chartData.map((d) => (activeChartMetric === "sends" ? d.sends : activeChartMetric === "leads" ? d.leads : d.views)),
    10
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
        
        {/* 1. CABEÇALHO PADRÃO DA PÁGINA */}
        <div className="flex flex-col gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-black text-white tracking-tight">Visão Geral</h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Tempo Real
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  Central de comando, telemetria de disparos, engajamento e métricas de conversão.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 w-full pt-1">
            <button
              type="button"
              onClick={() => fetchDashboardData()}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${refreshing ? "animate-spin" : ""}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* 2. GRADE PRINCIPAL DE CARDS DE INDICADORES (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* KPI 1: Disparos Hoje */}
          <div className="relative overflow-hidden rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-5 shadow-lg shadow-black/20 hover:border-emerald-500/30 transition-all group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Disparos Hoje
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {quotaMessages.current.toLocaleString("pt-BR")}
              </span>
              {quotaMessages.limit > 0 && (
                <span className="text-xs text-slate-500 font-medium">
                  / {quotaMessages.limit.toLocaleString("pt-BR")}
                </span>
              )}
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Limite Diário Utilizado</span>
                <span className={`font-bold ${pctMessages >= 90 ? "text-rose-400" : "text-emerald-400"}`}>
                  {pctMessages}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    pctMessages >= 90 ? "bg-rose-500" : pctMessages >= 70 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${pctMessages}%` }}
                />
              </div>
            </div>
          </div>

          {/* KPI 2: Grupos & Membros */}
          <div className="relative overflow-hidden rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-5 shadow-lg shadow-black/20 hover:border-indigo-500/30 transition-all group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Grupos Monitorados
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Users2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {quotaGroups.current}
              </span>
              {quotaGroups.limit > 0 && (
                <span className="text-xs text-slate-500 font-medium">
                  / {quotaGroups.limit} grupos
                </span>
              )}
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Alcance em Membros</span>
                <span className="font-bold text-indigo-300">
                  {(data?.stats?.totalParticipants || 0).toLocaleString("pt-BR")} pessoas
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    pctGroups >= 90 ? "bg-rose-500" : "bg-indigo-500"
                  }`}
                  style={{ width: `${pctGroups}%` }}
                />
              </div>
            </div>
          </div>

          {/* KPI 3: Catálogo & Cliques */}
          <div className="relative overflow-hidden rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-5 shadow-lg shadow-black/20 hover:border-cyan-500/30 transition-all group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Produtos & Ofertas
              </span>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {quotaProducts.current}
              </span>
              {quotaProducts.limit > 0 && (
                <span className="text-xs text-slate-500 font-medium">
                  / {quotaProducts.limit} cadastrados
                </span>
              )}
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Visualizações Totais</span>
                <span className="font-bold text-cyan-300">
                  {quotaViews.current.toLocaleString("pt-BR")} views
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    pctProducts >= 90 ? "bg-rose-500" : "bg-cyan-500"
                  }`}
                  style={{ width: `${pctProducts}%` }}
                />
              </div>
            </div>
          </div>

          {/* KPI 4: Leads Capturados */}
          <div className="relative overflow-hidden rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-5 shadow-lg shadow-black/20 hover:border-purple-500/30 transition-all group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Leads Capturados
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {quotaLeads.current.toLocaleString("pt-BR")}
              </span>
              {quotaLeads.limit > 0 && (
                <span className="text-xs text-slate-500 font-medium">
                  / {quotaLeads.limit.toLocaleString("pt-BR")}
                </span>
              )}
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Limite da Assinatura</span>
                <span className={`font-bold ${pctLeads >= 90 ? "text-rose-400" : "text-purple-400"}`}>
                  {pctLeads}% utilizado
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    pctLeads >= 90 ? "bg-rose-500" : "bg-purple-500"
                  }`}
                  style={{ width: `${pctLeads}%` }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* 3. BLOCO: GRÁFICO DE EVOLUÇÃO (7 DIAS) EM LARGURA TOTAL */}
        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-5 shadow-lg shadow-black/20 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Atividade dos Últimos 7 Dias
                </h2>
              </div>
              <p className="text-[11px] text-slate-400">
                Acompanhe a cadência de mensagens enviadas, novos leads capturados e visualizações de ofertas.
              </p>
            </div>

            {/* Seletor de métrica */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveChartMetric("sends")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeChartMetric === "sends"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Disparos
              </button>
              <button
                type="button"
                onClick={() => setActiveChartMetric("leads")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeChartMetric === "leads"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Leads
              </button>
              <button
                type="button"
                onClick={() => setActiveChartMetric("views")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeChartMetric === "views"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Visualizações
              </button>
            </div>
          </div>

          {/* BARRAS DO GRÁFICO */}
          <div className="pt-4 pb-2">
            <div className="grid grid-cols-7 gap-2 sm:gap-6 items-end h-44 sm:h-52 px-2">
              {chartData.map((day) => {
                const val = activeChartMetric === "sends" ? day.sends : activeChartMetric === "leads" ? day.leads : day.views;
                const heightPct = Math.max(8, Math.round((val / maxValInChart) * 100));
                
                return (
                  <div key={day.date} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100 transform -translate-y-1">
                      {val}
                    </div>
                    
                    <div className="w-full max-w-[48px] bg-slate-900/80 rounded-xl overflow-hidden flex flex-col justify-end p-0.5 border border-slate-800/80 group-hover:border-slate-700 transition-all h-full">
                      <div
                        className={`w-full rounded-lg transition-all duration-500 shadow-sm ${
                          activeChartMetric === "sends"
                            ? "bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300"
                            : activeChartMetric === "leads"
                            ? "bg-gradient-to-t from-purple-600 to-pink-400 group-hover:from-purple-500 group-hover:to-pink-300"
                            : "bg-gradient-to-t from-cyan-600 to-blue-400 group-hover:from-cyan-500 group-hover:to-blue-300"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium text-center truncate w-full">
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LEGENDA / TOTAL DO PERÍODO */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs">
            <div className="flex items-center gap-5 text-slate-400 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Disparos: <strong className="text-slate-200">{chartData.reduce((acc, d) => acc + (Number(d.sends) || 0), 0)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Leads: <strong className="text-slate-200">{chartData.reduce((acc, d) => acc + (Number(d.leads) || 0), 0)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <span>Visualizações: <strong className="text-slate-200">{chartData.reduce((acc, d) => acc + (Number(d.views) || 0), 0)}</strong></span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500 font-mono">
                Média: ~{chartData.length > 0 ? Math.round(chartData.reduce((acc, d) => acc + (activeChartMetric === "sends" ? (Number(d.sends) || 0) : activeChartMetric === "leads" ? (Number(d.leads) || 0) : (Number(d.views) || 0)), 0) / chartData.length) || 0 : 0} / dia
              </span>
              <div className="h-3 w-px bg-slate-800" />
              <Link
                href="/painel/configuracoes/assinatura"
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Plano {data?.company?.plan}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4. SEÇÃO EM GRADE: TOP PRODUTOS, GRUPOS COM MAIS ALCANCE E ÚLTIMOS LEADS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* TABELA 1: PRODUTOS MAIS ACESSADOS */}
          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-5 shadow-lg shadow-black/20 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Top Produtos & Ofertas
                </h3>
              </div>
              <Link
                href="/painel/produtos"
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
              >
                <span>Ver Todos</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {(!data?.topProducts || data.topProducts.length === 0) ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Nenhum produto cadastrado ainda.
                </div>
              ) : (
                data.topProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/painel/produtos/${p.id}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-slate-700 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                        {p.cover_image ? (
                          <img src={p.cover_image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-emerald-400 font-semibold">
                          {formatCurrencyBRL(Number(p.promo_price || p.price || 0))}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
                        <Eye className="w-3 h-3 text-cyan-400" />
                        <span>{p.views_count}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <MousePointerClick className="w-2.5 h-2.5 text-slate-400" />
                        <span>{p.clicks_count} cliques</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* TABELA 2: GRUPOS COM MAIOR ALCANCE */}
          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-5 shadow-lg shadow-black/20 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <Users2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Grupos com Mais Membros
                </h3>
              </div>
              <Link
                href="/painel/grupos"
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
              >
                <span>Ver Todos</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {(!data?.topGroups || data.topGroups.length === 0) ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Nenhum grupo sincronizado ainda.
                </div>
              ) : (
                data.topGroups.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                        <Users2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {g.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate font-mono">
                          {g.whatsapp_group_id.split("@")[0]}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        {g.participants_count} membros
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TABELA 3: LEADS RECENTEMENTE CAPTURADOS */}
          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-5 shadow-lg shadow-black/20 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Leads Recentes
                </h3>
              </div>
              <Link
                href="/painel/leads"
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
              >
                <span>Ver Todos</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {(!data?.recentLeads || data.recentLeads.length === 0) ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Nenhum lead capturado ainda.
                </div>
              ) : (
                data.recentLeads.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 font-bold text-xs">
                        {l.name ? l.name.slice(0, 2).toUpperCase() : "LD"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {l.name || "Lead Anônimo"}
                        </p>
                        <p className="text-[10px] text-purple-300 font-mono">
                          {l.whatsapp}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span className="text-[10px] text-slate-500">
                        {new Date(l.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
  );
}
