"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Archive,
  CheckCircle2,
  XCircle,
  Eye,
  MousePointerClick,
  ExternalLink,
  Edit,
  Tag,
  Sparkles,
  Share2,
  Copy,
  Check,
  Smartphone,
  Layers,
  ArrowRight,
  TrendingUp,
  Send,
  Clock,
  Percent,
  Power,
  BarChart3,
  Crown,
} from "lucide-react";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { useLayout } from "@/context/LayoutContext";
import { PainelLayoutClient } from "@/components/painel/PainelLayoutClient";
import { Pagination } from "@/components/ui/Pagination";
import { formatTimeAgo } from "@/lib/timeAgo";
import { SendProductModal } from "@/components/painel/SendProductModal";

interface ProductItem {
  id: number;
  company_id: number;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  promo_price?: number | null;
  status: "active" | "inactive";
  is_archived?: boolean;
  images?: string[];
  cover_image?: string | null;
  whatsapp_destination?: string;
  meta_ads_active: boolean;
  layout_color?: string;
  layout_theme?: string;
  cta_text?: string;
  headline?: string;
  guarantee_text?: string;
  benefits?: string[];
  external_link?: string;
  sends_count?: number;
  views_count: number;
  clicks_count: number;
  last_accessed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Metrics {
  total_products: number;
  active_products: number;
  limit_products: number;
  sends_today: number;
  limit_daily: number;
  sends_subscription: number;
  limit_subscription: number;
  total_views: number;
  limit_views: number;
  total_clicks: number;
}

export default function ProdutosPage() {
  const { showSuccess, showError, showConfirm } = useFeedbackModal();
  const { containerMaxWidthStyle } = useLayout();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    total_products: 0,
    active_products: 0,
    limit_products: 0,
    sends_today: 0,
    limit_daily: 0,
    sends_subscription: 0,
    limit_subscription: 0,
    total_views: 0,
    limit_views: 0,
    total_clicks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterArchived, setFilterArchived] = useState<"exclude" | "only" | "all">("exclude");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Modal de envio de oferta para grupos
  const [sendModalProduct, setSendModalProduct] = useState<ProductItem | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  // Carregar produtos
  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterArchived) params.set("archived", filterArchived);

      const res = await fetch(`/api/painel/produtos?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.products || []);
        if (data.metrics) setMetrics(data.metrics);
      } else {
        showError(data.message || "Não foi possível carregar a lista de produtos.", "Erro ao Carregar Produtos");
      }
    } catch {
      showError("Ocorreu um erro ao comunicar com o servidor.", "Falha de Conexão");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(handler);
  }, [search, filterStatus, filterArchived]);

  const handleClearFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setFilterArchived("exclude");
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(search || filterStatus !== "all" || filterArchived !== "exclude");

  const handleCopyLink = (product: ProductItem) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/p/${product.slug || product.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(product.id);
    showSuccess("Link do produto copiado para a área de transferência!", "Link Copiado");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = (product: ProductItem) => {
    const newStatus = product.status === "active" ? "inactive" : "active";
    const actionLabel = newStatus === "active" ? "Ativar" : "Inativar";

    showConfirm({
      title: `${actionLabel} Produto`,
      message: `Deseja realmente ${actionLabel.toLowerCase()} o produto "${product.name}"?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/painel/produtos/${product.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
          const data = await res.json();
          if (data.success) {
            showSuccess(data.message, `Produto ${newStatus === "active" ? "Ativado" : "Inativado"}`);
            loadProducts();
          } else {
            showError(data.message, "Erro ao Alterar Status");
          }
        } catch {
          showError("Falha na comunicação com o servidor.", "Erro");
        }
      },
    });
  };

  const handleSendProduct = (product: ProductItem) => {
    setSendModalProduct(product);
    setIsSendModalOpen(true);
  };

  const handleDeleteProduct = (product: ProductItem) => {
    const isArchived = Boolean(product.is_archived);
    const hasSends = Number(product.sends_count || 0) > 0;

    // Se já estiver arquivado, permite desarquivar ou excluir
    if (isArchived) {
      showConfirm({
        title: "Desarquivar Produto",
        message: `Deseja desarquivar o produto "${product.name}" para que volte a ficar visível no catálogo?`,
        onConfirm: async () => {
          try {
            const res = await fetch(`/api/painel/produtos/${product.id}/status`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ is_archived: false }),
            });
            const data = await res.json();
            if (data.success) {
              showSuccess(data.message || "Produto desarquivado com sucesso!", "Produto Desarquivado");
              loadProducts();
            } else {
              showError(data.message, "Erro ao Desarquivar");
            }
          } catch {
            showError("Falha na comunicação com o servidor.", "Erro");
          }
        },
      });
      return;
    }

    const actionTitle = hasSends ? "Arquivar Produto" : "Excluir Produto";
    const actionMessage = hasSends
      ? `O produto "${product.name}" possui histórico de envios e será arquivado e inativado para manter as métricas seguras.`
      : `Tem certeza que deseja excluir o produto "${product.name}"? Esta ação é irreversível.`;

    showConfirm({
      title: actionTitle,
      message: actionMessage,
      destructive: !hasSends,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/painel/produtos/${product.id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.success) {
            showSuccess(data.message, hasSends ? "Produto Arquivado" : "Produto Excluído");
            loadProducts();
          } else {
            showError(data.message, "Erro ao Processar");
          }
        } catch {
          showError("Falha ao comunicar com o servidor.", "Erro");
        }
      },
    });
  };

  // Paginação
  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedProducts = products.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  return (
    <PainelLayoutClient>
      <div className="w-full space-y-6">
        {/* 1. CABEÇALHO PADRÃO DA PÁGINA */}
        {/* Banner de Upgrade Estratégico se limite foi atingido */}
        {metrics.limit_products > 0 && metrics.total_products >= metrics.limit_products && (
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
                      Limite de Produtos Atingido
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      {metrics.total_products} de {metrics.limit_products} cadastrados
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white mt-1">
                    Seu catálogo atingiu a capacidade máxima! Escale suas vendas hoje.
                  </h2>
                  <p className="text-xs text-amber-200/80 mt-0.5 leading-relaxed">
                    Novos cadastros de produtos estão pausados temporariamente. Faça um upgrade de plano para cadastrar novos produtos ilimitados e receber mais tráfego qualificado no WhatsApp.
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
                <Package className="w-6 h-6 text-indigo-400" />
                Produtos & Catálogo
              </h1>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre e gerencie seu catálogo de produtos, landing pages personalizadas e integração direta com grupos e números de WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 w-full pt-1">
            <button
              onClick={() => loadProducts()}
              disabled={loading}
              title="Recarregar lista de produtos"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-all focus:outline-none disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? "animate-spin text-indigo-400" : ""}`} />
              <span className="whitespace-nowrap">Atualizar Lista</span>
            </button>

            {metrics.limit_products > 0 && metrics.total_products >= metrics.limit_products ? (
              <button
                disabled
                title="Limite de produtos cadastrados atingido pelo seu plano"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-75 shrink-0"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Limite Atingido</span>
              </button>
            ) : (
              <Link
                href="/painel/produtos/novo"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Novo Produto</span>
              </Link>
            )}
          </div>
        </div>

        {/* 2. CARDS DE MÉTRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total de produtos cadastrados / limite da assinatura */}
          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total de Produtos</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-white">{metrics.total_products}</span>
                <span className="text-sm font-semibold text-slate-400">
                  / {metrics.limit_products > 0 ? `${metrics.limit_products} limite` : "Ilimitado"}
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
              <Package className="w-5 h-5" />
            </div>
          </div>

          {/* 2. Total de envios hoje / limite hoje */}
          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Envios Hoje</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-emerald-400">{metrics.sends_today}</span>
                <span className="text-sm font-semibold text-slate-400">
                  / {metrics.limit_daily > 0 ? metrics.limit_daily : "Ilimitado"}
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
              <Send className="w-5 h-5" />
            </div>
          </div>

          {/* 3. Total de visualizações / limite da assinatura */}
          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Visualizações</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-cyan-400">{metrics.total_views}</span>
                <span className="text-sm font-semibold text-slate-400">
                  / {metrics.limit_views > 0 ? `${metrics.limit_views} limite` : "Ilimitado"}
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
          </div>

          {/* 4. Total de cliques / % de conversão */}
          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cliques & Conversão</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-blue-400">{metrics.total_clicks}</span>
                <span className="text-sm font-semibold text-slate-400">
                  / {metrics.total_views > 0 ? `${((metrics.total_clicks / metrics.total_views) * 100).toFixed(1)}%` : "0.0%"}
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
              <MousePointerClick className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 3. FILTROS E BUSCA */}
        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nome, descrição ou headline..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                title="Limpar pesquisa"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filtro de Status */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-200 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer w-full"
              >
                <option value="all" className="bg-[#0b1222]">Todos os Status</option>
                <option value="active" className="bg-[#0b1222]">Ativos</option>
                <option value="inactive" className="bg-[#0b1222]">Inativos</option>
              </select>
            </div>

            {/* Filtro de Arquivados */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-200 w-full sm:w-auto">
              <Archive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={filterArchived}
                onChange={(e) => {
                  setFilterArchived(e.target.value as "exclude" | "only" | "all");
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer w-full"
              >
                <option value="exclude" className="bg-[#0b1222]">Ocultar Arquivados</option>
                <option value="only" className="bg-[#0b1222]">Somente Arquivados</option>
                <option value="all" className="bg-[#0b1222]">Todos (com Arquivados)</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer"
                title="Limpar todos os filtros"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. LISTA DE PRODUTOS FORMATO GRID DE CARDS PREMIUM */}
        <div>
          {loading ? (
            <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-12 text-center text-slate-500 shadow-xl">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
              Carregando produtos...
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-12 text-center text-slate-500 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-3">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Nenhum produto encontrado</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {hasActiveFilters
                  ? "Nenhum produto corresponde aos filtros aplicados."
                  : "Cadastre seu primeiro produto para começar a criar ofertas de conversão no WhatsApp."}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={handleClearFilters}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  Limpar Filtros
                </button>
              ) : (
                <Link
                  href="/painel/produtos/novo"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Criar Produto
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedProducts.map((p) => {
                const cover = p.cover_image || (p.images && p.images[0]) || null;
                const sends = Number(p.sends_count) || 0;
                const views = Number(p.views_count) || 0;
                const clicks = Number(p.clicks_count) || 0;
                const conversionRate = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0.0";
                const lastAccessText = formatTimeAgo(p.last_accessed_at);
                const hasSends = sends > 0;

                return (
                  <div
                    key={p.id}
                    className="group rounded-2xl bg-[#090f1d] hover:bg-[#0c1426] border border-slate-800/80 hover:border-indigo-500/40 overflow-hidden transition-all duration-200 shadow-xl shadow-black/30 flex flex-col justify-between"
                  >
                    {/* TOPO: Imagem de Capa com Badges Sobrepostos */}
                    <div className="relative h-48 w-full bg-slate-900 overflow-hidden border-b border-slate-800/80">
                      {cover ? (
                        <img
                          src={cover}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 flex flex-col items-center justify-center text-slate-600">
                          <Package className="w-12 h-12 text-indigo-400/40 mb-1" />
                          <span className="text-[11px] font-medium text-slate-500">Sem foto de capa</span>
                        </div>
                      )}

                      {/* Gradiente de proteção para badges */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#090f1d] via-transparent to-black/60 pointer-events-none" />

                      {/* Badges Superiores */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {p.status === "active" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-lg">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 text-slate-400 border border-slate-700 backdrop-blur-md shadow-lg">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                              Inativo
                            </span>
                          )}

                          {Boolean(p.is_archived) && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-lg">
                              <Archive className="w-3 h-3" />
                              Arquivado
                            </span>
                          )}
                        </div>

                        {/* Botão Rápido Copiar Link */}
                        <button
                          onClick={() => handleCopyLink(p)}
                          title="Copiar link da página"
                          className="w-8 h-8 rounded-xl bg-slate-950/80 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700/80 hover:border-indigo-500 backdrop-blur-md flex items-center justify-center transition-all shadow-lg active:scale-90 cursor-pointer"
                        >
                          {copiedId === p.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Badges Inferiores: Quantidade de Envios (acima) + Último Acesso */}
                      <div className="absolute bottom-2.5 left-3 flex flex-col items-start gap-1">
                        <span
                          title={`Total de Envios: ${sends}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-950/85 text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-md"
                        >
                          <Send className="w-3 h-3 text-emerald-400" />
                          <span className="text-slate-400 text-[10px] font-normal">Envios:</span> {sends}
                        </span>

                        <span
                          title={`Último Acesso: ${lastAccessText}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-950/85 text-amber-300 border border-amber-500/30 backdrop-blur-md shadow-md"
                        >
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span className="text-slate-400 text-[10px] font-normal">Acesso:</span> {lastAccessText}
                        </span>
                      </div>
                    </div>

                    {/* CORPO DO CARD */}
                    <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        {/* Nome do Produto */}
                        <Link
                          href={`/painel/produtos/${p.id}`}
                          className="font-bold text-white text-base hover:text-indigo-400 transition-colors line-clamp-2 leading-snug block"
                          title={p.name}
                        >
                          {p.name}
                        </Link>

                        {/* Preço De (com % abaixo) antes do Preço Por (ocupando as duas linhas) */}
                        <div className="pt-1">
                          {p.promo_price ? (
                            <div className="flex items-center gap-3">
                              {/* Coluna Esquerda: Preço "De" em cima + Desconto % embaixo */}
                              <div className="flex flex-col items-start leading-tight">
                                <span className="text-[11px] text-slate-400 line-through decoration-rose-500/60 font-medium">
                                  {formatBRL(p.price)}
                                </span>
                                {p.price > p.promo_price && (
                                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mt-0.5">
                                    -{Math.round(((p.price - p.promo_price) / p.price) * 100)}%
                                  </span>
                                )}
                              </div>

                              {/* Coluna Direita: Preço "Por" ocupando a altura alinhado */}
                              <div className="flex items-center">
                                <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight leading-none">
                                  {formatBRL(p.promo_price)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
                                {formatBRL(p.price)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Métricas de Desempenho Minimalistas (Ícone em cima, Número menor em baixo com Hint) */}
                      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 shadow-inner">
                        {/* Acessos / Views */}
                        <div
                          title={`Acessos: ${views}`}
                          className="flex flex-col items-center justify-center py-1 px-1 rounded-lg bg-cyan-500/5 border border-cyan-500/15 text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-help"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                          <span className="text-[11px] font-bold text-cyan-300 tracking-tight mt-0.5">
                            {views}
                          </span>
                        </div>

                        {/* Cliques */}
                        <div
                          title={`Cliques no Link: ${clicks}`}
                          className="flex flex-col items-center justify-center py-1 px-1 rounded-lg bg-blue-500/5 border border-blue-500/15 text-blue-400 hover:bg-blue-500/10 transition-colors cursor-help"
                        >
                          <MousePointerClick className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                          <span className="text-[11px] font-bold text-blue-300 tracking-tight mt-0.5">
                            {clicks}
                          </span>
                        </div>

                        {/* Conversão */}
                        <div
                          title={`Taxa de Conversão: ${conversionRate}%`}
                          className="flex flex-col items-center justify-center py-1 px-1 rounded-lg bg-indigo-500/5 border border-indigo-500/15 text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-help"
                        >
                          <TrendingUp className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                          <span className="text-[11px] font-bold text-indigo-300 tracking-tight mt-0.5">
                            {conversionRate}%
                          </span>
                        </div>
                      </div>

                      {/* BOTÕES DE AÇÃO NO RODAPÉ DO CARD */}
                      <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-4 gap-1.5">
                        {/* Editar */}
                        <Link
                          href={`/painel/produtos/${p.id}`}
                          title="Editar Produto"
                          className="h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-indigo-300 bg-slate-800/80 hover:bg-indigo-500/15 border border-slate-700/80 hover:border-indigo-500/30 transition-all active:scale-95 shadow-sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {/* Enviar Disparo */}
                        <button
                          onClick={() => handleSendProduct(p)}
                          title="Enviar Oferta para os Grupos"
                          className="h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-emerald-300 bg-slate-800/80 hover:bg-emerald-500/15 border border-slate-700/80 hover:border-emerald-500/30 transition-all active:scale-95 shadow-sm cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>

                        {/* Ativar / Inativar */}
                        <button
                          onClick={() => handleToggleStatus(p)}
                          title={p.status === "active" ? "Inativar Produto" : "Ativar Produto"}
                          className={`h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer border border-slate-700/80 ${
                            p.status === "active"
                              ? "text-slate-300 hover:text-amber-300 bg-slate-800/80 hover:bg-amber-500/15 hover:border-amber-500/30"
                              : "text-slate-300 hover:text-emerald-300 bg-slate-800/80 hover:bg-emerald-500/15 hover:border-emerald-500/30"
                          }`}
                        >
                          {p.status === "active" ? (
                            <Power className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </button>

                        {/* Excluir / Arquivar */}
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          title={hasSends ? "Arquivar Produto" : "Excluir Produto"}
                          className={`h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer border border-slate-700/80 ${
                            hasSends
                              ? "text-slate-300 hover:text-amber-300 bg-slate-800/80 hover:bg-amber-500/15 hover:border-amber-500/30"
                              : "text-slate-300 hover:text-rose-300 bg-slate-800/80 hover:bg-rose-500/15 hover:border-rose-500/30"
                          }`}
                        >
                          {hasSends ? (
                            <Archive className="w-4 h-4" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginação Padrão */}
          {!loading && products.length > pageSize && (
            <div className="p-4 rounded-2xl border border-slate-800/80 bg-[#090f1d]/90 shadow-xl mt-4">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>

        {/* Modal de Disparo com Escolha de Modelos e Grupos */}
        <SendProductModal
          isOpen={isSendModalOpen}
          product={sendModalProduct}
          onClose={() => {
            setIsSendModalOpen(false);
            setSendModalProduct(null);
          }}
          onSuccess={() => {
            loadProducts();
          }}
        />
      </div>
    </PainelLayoutClient>
  );
}
