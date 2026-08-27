"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Hammer,
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
} from "lucide-react";
import { PainelLayoutClient } from "@/components/painel/PainelLayoutClient";

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
  };
}

export default function CompanyDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch("/api/painel/dashboard");
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
        <span className="text-sm font-medium">Carregando painel da empresa...</span>
      </div>
    );
  }

  const upcomingModules = [
    {
      title: "Grupos WhatsApp",
      description: "Disparo inteligente, monitoramento de engajamento e aquecimento automatizado de grupos.",
      icon: Users2,
      badge: "Próxima Etapa",
      color: "emerald",
    },
    {
      title: "Produtos & Ofertas",
      description: "Catálogo de produtos, links de afiliados e esteiras de ofertas com geração de copy por IA.",
      icon: Package,
      badge: "Disponível",
      color: "blue",
    },
    {
      title: "Gestão de Leads",
      description: "Captura de leads, segmentação por tags de interesse e histórico de conversões em tempo real.",
      icon: UserCheck,
      badge: "Em Breve",
      color: "purple",
    },
    {
      title: "Configurações & Instâncias",
      description: "Conexão de instâncias da Evolution API, chaves de webhook e parâmetros da empresa.",
      icon: Settings,
      badge: "Configurações",
      color: "amber",
    },
  ];

  return (
    <PainelLayoutClient user={data?.user} company={data?.company}>
      <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* CABEÇALHO PADRÃO DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-white tracking-tight">Visão Geral</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Em Construção
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Métricas consolidadas, performance de campanhas e inteligência de vendas.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchDashboardData()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${refreshing ? "animate-spin" : ""}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* HERO CARD DE EM CONSTRUÇÃO */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/90 bg-gradient-to-b from-[#0e1628] via-[#0a101f] to-[#070b14] p-8 md:p-12 text-center shadow-2xl shadow-black/60">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 via-emerald-500/15 to-indigo-500/20 border border-amber-500/30 text-amber-400 shadow-xl shadow-amber-500/5 mx-auto">
              <Hammer className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Módulo em Desenvolvimento
              </h2>
              <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal">
                Estamos preparando um painel analítico completo para a sua empresa acompanhar em tempo real o envio de mensagens, engajamento nos grupos, cliques em ofertas e conversão de leads.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Cluster de WhatsApp Ativo
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Segurança Multi-Tenant
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Arquitetura de Alta Performance
              </span>
            </div>
          </div>
        </div>

        {/* PRÓXIMAS FUNCIONALIDADES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 tracking-wide uppercase">
              Próximos Recursos Disponíveis
            </h3>
            <span className="text-xs text-slate-500">Navegação ativa na barra superior</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingModules.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl bg-[#090e1c]/80 border border-slate-800/80 p-5 space-y-3 hover:border-slate-700 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-300 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/60">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </PainelLayoutClient>
  );
}
