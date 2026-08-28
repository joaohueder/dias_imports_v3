"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  UserCheck,
  Search,
  Download,
  Trash2,
  Phone,
  Calendar,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Users,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  Crown,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PainelLayoutClient } from "@/components/painel/PainelLayoutClient";

interface Lead {
  id: number;
  name: string;
  whatsapp: string;
  origin_slug: string | null;
  landing_title: string | null;
  ip_address: string | null;
  created_at: string;
  status: string;
}

interface Stats {
  total_leads: number;
  max_leads: number;
  unique_leads: number;
  today_leads: number;
  yesterday_leads: number;
  week_leads: number;
  total_views: number;
}

interface ChartItem {
  date: string;
  label: string;
  leads: number;
  views: number;
}

export default function GestaoLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_leads: 0,
    max_leads: 0,
    unique_leads: 0,
    today_leads: 0,
    yesterday_leads: 0,
    week_leads: 0,
    total_views: 0,
  });
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchLeads = useCallback(async (search = "") => {
    try {
      setLoading(true);
      const url = search.trim()
        ? `/api/painel/leads?search=${encodeURIComponent(search.trim())}`
        : "/api/painel/leads";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.chart_data) {
          setChartData(data.chart_data);
        }
      } else {
        toast.error(data.message || "Erro ao carregar leads.");
      }
    } catch {
      toast.error("Erro de conexão ao buscar leads.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca automática com debounce ao digitar no campo de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchLeads]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads(searchTerm);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este lead da base?")) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/painel/leads?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Lead excluído com sucesso.");
        setLeads((prev) => prev.filter((l) => l.id !== id));
        setStats((prev) => ({
          ...prev,
          total_leads: Math.max(0, prev.total_leads - 1),
        }));
      } else {
        toast.error(data.message || "Erro ao excluir lead.");
      }
    } catch {
      toast.error("Erro de conexão ao excluir lead.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    if (!leads.length) {
      toast.error("Não há leads para exportar.");
      return;
    }

    const headers = ["ID", "Nome", "WhatsApp", "Página/Origem", "Data de Cadastro", "Status"];
    const csvRows = [
      headers.join(";"),
      ...leads.map((l) =>
        [
          l.id,
          `"${(l.name || "").replace(/"/g, '""')}"`,
          `"${l.whatsapp}"`,
          `"${l.landing_title || l.origin_slug || "Grupo VIP"}"`,
          `"${new Date(l.created_at).toLocaleString("pt-BR")}"`,
          `"${l.status || "converted"}"`,
        ].join(";")
      ),
    ];

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Arquivo CSV exportado com sucesso!");
  };

  const formatPhoneNumber = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (clean.length === 11) {
      return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`;
    }
    if (clean.length === 10) {
      return `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6)}`;
    }
    return val;
  };

  const openWhatsAppChat = (phone: string, name: string) => {
    const clean = phone.replace(/\D/g, "");
    const ddi = clean.startsWith("55") ? clean : `55${clean}`;
    const msg = encodeURIComponent(`Olá ${name}! Tudo bem?`);
    window.open(`https://wa.me/${ddi}?text=${msg}`, "_blank");
  };

  const isQuotaExceeded = stats.max_leads > 0 && stats.total_leads >= stats.max_leads;

  return (
    <PainelLayoutClient>
      <div className="w-full space-y-6 pb-12">
        {/* BANNER DE UPGRADE SE O LIMITE DE LEADS FOI ATINGIDO/VENCIDO */}
        {isQuotaExceeded && (
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
                      Limite de Leads Atingido
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      {stats.total_leads} de {stats.max_leads} contatos capturados
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white mt-1">
                    Sua base de contatos atingiu o limite da assinatura!
                  </h2>
                  <p className="text-xs text-amber-200/80 mt-0.5 leading-relaxed">
                    Você atingiu a cota máxima de leads do seu plano atual. Faça um upgrade para capturar leads ilimitados nas suas Landing Pages VIP e continuar expandindo sua lista sem interrupções.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                <Link
                  href="/painel/configuracoes/assinatura?tab=upgrade"
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95 text-center cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Fazer Upgrade de Plano</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* CABEÇALHO PADRÃO DO SISTEMA */}
        <div className="flex flex-col gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                <UserCheck className="w-6 h-6 text-indigo-400" />
                Gestão de Leads & Audiência
              </h1>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Acompanhe em tempo real todos os contatos que entraram pelas suas Landing Pages dos Grupos VIP.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 w-full pt-1">
            <button
              onClick={() => fetchLeads(searchTerm)}
              disabled={loading}
              title="Atualizar lista de leads"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all focus:outline-none disabled:opacity-50 shrink-0 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? "animate-spin" : ""}`} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={loading || leads.length === 0}
              title="Exportar base de contatos em formato CSV"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all focus:outline-none disabled:opacity-50 shrink-0 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* GRID DE CARDS DE ESTATÍSTICAS E EVOLUÇÃO DE LEADS */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3.5">
          {/* COLUNA 1: Linha 1 (Total/Limite) e Linha 2 (Hoje/Ontem) */}
          <div className="flex flex-col gap-3.5 lg:col-span-1">
            {/* Linha 1, Coluna 1: Total de Leads / Limite da Assinatura */}
            <div className={`bg-[#0c1222]/90 border rounded-2xl p-4 sm:p-5 relative overflow-hidden flex-1 flex flex-col justify-between transition-colors ${
              isQuotaExceeded ? "border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]" : "border-slate-800/80"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Total de Leads</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isQuotaExceeded ? "bg-amber-500/20 text-amber-400" : "bg-indigo-500/10 text-indigo-400"
                }`}>
                  {isQuotaExceeded ? <AlertTriangle className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className={`text-2xl sm:text-3xl font-black ${isQuotaExceeded ? "text-amber-400" : "text-white"}`}>
                  {stats.total_leads}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  / {stats.max_leads > 0 ? `${stats.max_leads} limite` : "Ilimitado"}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-1 text-[11px]">
                <span className={isQuotaExceeded ? "text-amber-300 font-semibold" : "text-slate-500"}>
                  {stats.max_leads > 0
                    ? isQuotaExceeded
                      ? "Limite da franquia atingido"
                      : `${Math.min(100, Math.round((stats.total_leads / stats.max_leads) * 100))}% utilizado`
                    : "Cadastros acumulados"}
                </span>
                {isQuotaExceeded && (
                  <Link
                    href="/painel/configuracoes/assinatura?tab=upgrade"
                    className="text-amber-400 hover:text-amber-300 font-bold underline text-[10px] whitespace-nowrap"
                  >
                    Fazer Upgrade &rarr;
                  </Link>
                )}
              </div>
            </div>

            {/* Linha 2, Coluna 1: Hoje / Ontem */}
            <div className="bg-[#0c1222]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Hoje vs Ontem</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-400">{stats.today_leads}</span>
                <span className="text-xs text-slate-400 font-medium">hoje</span>
                <span className="text-slate-600 font-bold">/</span>
                <span className="text-lg sm:text-xl font-bold text-slate-300">{stats.yesterday_leads}</span>
                <span className="text-xs text-slate-500 font-medium">ontem</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                {stats.today_leads >= stats.yesterday_leads ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    +{stats.today_leads - stats.yesterday_leads} vs ontem
                  </span>
                ) : (
                  <span className="text-rose-400 font-semibold flex items-center gap-0.5">
                    -{stats.yesterday_leads - stats.today_leads} vs ontem
                  </span>
                )}
                <span className="text-slate-500">&bull; {stats.unique_leads} únicos</span>
              </div>
            </div>
          </div>

          {/* COLUNA 2, 3 E 4 (Linhas 1 e 2): EVOLUÇÃO DOS LEADS (Views em Linha / Leads em Colunas) */}
          <div className="lg:col-span-3 bg-[#0c1222]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs sm:text-sm font-bold text-white">Evolução dos Leads & Tráfego</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Visualizações da Landing Page (Linha) vs Leads Convertidos (Colunas) nos últimos 7 dias
                </p>
              </div>

              {/* Legenda do Gráfico */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                  <span className="text-slate-300 text-[11px]">Leads (Colunas)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  <span className="text-slate-300 text-[11px]">Views (Linha)</span>
                </div>
              </div>
            </div>

            {/* Gráfico Visual Composto SVG / Barras Responsivas */}
            <div className="pt-4 pb-2">
              {(() => {
                const maxVal = Math.max(
                  1,
                  ...chartData.map((d) => Math.max(d.leads, d.views))
                );

                const chartWidth = 700;
                const chartHeight = 130;
                const stepX = chartData.length > 1 ? chartWidth / (chartData.length - 1) : chartWidth;

                // Pontos para a linha de Views (Linha SVG)
                const linePoints = chartData
                  .map((d, idx) => {
                    const x = idx * stepX;
                    const y = chartHeight - (d.views / maxVal) * (chartHeight - 20) - 10;
                    return `${x},${y}`;
                  })
                  .join(" ");

                return (
                  <div className="space-y-3">
                    {/* Área do Gráfico */}
                    <div className="relative h-36 w-full flex items-end">
                      {/* Linhas de Grade de Fundo */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                        <div className="border-b border-dashed border-slate-700 w-full" />
                        <div className="border-b border-dashed border-slate-700 w-full" />
                        <div className="border-b border-dashed border-slate-700 w-full" />
                      </div>

                      {/* Linha SVG das Views */}
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10"
                        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                        preserveAspectRatio="none"
                      >
                        <polyline
                          fill="none"
                          stroke="#34d399"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={linePoints}
                          className="drop-shadow-[0_2px_8px_rgba(52,211,153,0.5)]"
                        />
                        {chartData.map((d, idx) => {
                          const cx = idx * stepX;
                          const cy = chartHeight - (d.views / maxVal) * (chartHeight - 20) - 10;
                          return (
                            <circle
                              key={`dot-${idx}`}
                              cx={cx}
                              cy={cy}
                              r="3.5"
                              fill="#090f1d"
                              stroke="#34d399"
                              strokeWidth="2"
                            />
                          );
                        })}
                      </svg>

                      {/* Colunas de Leads (Barras) */}
                      <div className="relative w-full h-full flex items-end justify-between gap-2 z-0 px-2">
                        {chartData.map((item, idx) => {
                          const leadHeightPct = Math.max(8, Math.round((item.leads / maxVal) * 100));
                          return (
                            <div
                              key={idx}
                              className="flex-1 flex flex-col items-center justify-end h-full group relative"
                            >
                              {/* Tooltip Hover */}
                              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-[10px] text-white py-1 px-2 rounded-lg whitespace-nowrap z-20 pointer-events-none shadow-xl">
                                <div className="font-bold text-indigo-300">{item.label}</div>
                                <div>Leads: <strong className="text-white">{item.leads}</strong> &bull; Views: <strong className="text-emerald-400">{item.views}</strong></div>
                              </div>

                              {/* Barra de Lead */}
                              <div
                                style={{ height: `${leadHeightPct}%` }}
                                className="w-full max-w-[32px] sm:max-w-[42px] bg-gradient-to-t from-indigo-600/90 to-indigo-400 rounded-t-lg transition-all group-hover:from-indigo-500 group-hover:to-indigo-300 shadow-md shadow-indigo-600/20 relative"
                              >
                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-indigo-200">
                                  {item.leads}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Eixo X com Labels das Datas */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-2 pt-1 border-t border-slate-800/80">
                      {chartData.map((item, idx) => (
                        <div key={idx} className="flex-1 text-center truncate">
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Rodapé Resumo do Gráfico */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/40 text-[11px] text-slate-400">
              <span>
                Crescimento nos últimos 7 dias: <strong className="text-emerald-400">+{stats.week_leads} leads</strong>
              </span>
              <span>
                Taxa Média de Conversão:{" "}
                <strong className="text-indigo-300">
                  {stats.total_views > 0
                    ? `${(((stats.total_leads || 0) / stats.total_views) * 100).toFixed(1)}%`
                    : "0.0%"}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTRO / BUSCA */}
        <div className="bg-[#0c1222]/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome ou WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Limpar filtro"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          <span className="text-xs text-slate-400 font-medium self-end sm:self-center">
            Exibindo <strong className="text-white">{leads.length}</strong> contatos
          </span>
        </div>

        {/* TABELA DE LEADS */}
        <div className="bg-[#0c1222]/90 border border-slate-800/80 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
              <span className="text-xs font-medium">Carregando contatos...</span>
            </div>
          ) : leads.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Nenhum lead encontrado</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchTerm
                  ? "Nenhum resultado corresponde à sua busca."
                  : "Assim que os visitantes preencherem o formulário da sua Landing Page VIP, os contatos aparecerão aqui automaticamente."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Lead</th>
                    <th className="py-3 px-4">WhatsApp</th>
                    <th className="py-3 px-4">Origem / Landing Page</th>
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{lead.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID #{lead.id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-300 font-medium">
                            {formatPhoneNumber(lead.whatsapp)}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(lead.whatsapp);
                              toast.success("WhatsApp copiado!");
                            }}
                            className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                            title="Copiar número"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-medium">
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>{lead.landing_title || lead.origin_slug || "Grupo VIP"}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(lead.created_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openWhatsAppChat(lead.whatsapp, lead.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold transition-colors cursor-pointer"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Chamar</span>
                          </button>

                          <button
                            onClick={() => handleDelete(lead.id)}
                            disabled={deletingId === lead.id}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer disabled:opacity-50"
                            title="Excluir lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PainelLayoutClient>
  );
}
