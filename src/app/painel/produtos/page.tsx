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
} from "lucide-react";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { useLayout } from "@/context/LayoutContext";
import { PainelLayoutClient } from "@/components/painel/PainelLayoutClient";
import { Pagination } from "@/components/ui/Pagination";

interface ProductItem {
  id: number;
  company_id: number;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  promo_price?: number | null;
  status: "active" | "inactive";
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
  created_at?: string;
  updated_at?: string;
}

interface Metrics {
  total_products: number;
  total_sends: number;
  total_views: number;
  total_clicks: number;
}

export default function ProdutosPage() {
  const { showSuccess, showError, showConfirm } = useFeedbackModal();
  const { containerMaxWidthStyle } = useLayout();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    total_products: 0,
    total_sends: 0,
    total_views: 0,
    total_clicks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Carregar produtos
  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus !== "all") params.set("status", filterStatus);

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
  }, [search, filterStatus]);

  const handleClearFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(search || filterStatus !== "all");

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

  const handleDeleteProduct = (product: ProductItem) => {
    showConfirm({
      title: "Excluir Produto",
      message: `Tem certeza que deseja excluir o produto "${product.name}"? Esta ação é irreversível.`,
      destructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/painel/produtos/${product.id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.success) {
            showSuccess(data.message, "Produto Excluído");
            loadProducts();
          } else {
            showError(data.message, "Erro ao Excluir");
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              onClick={() => loadProducts()}
              disabled={loading}
              title="Recarregar lista de produtos"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-all focus:outline-none disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? "animate-spin text-indigo-400" : ""}`} />
              <span className="whitespace-nowrap">Atualizar Lista</span>
            </button>

            <Link
              href="/painel/produtos/novo"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Novo Produto</span>
            </Link>
          </div>
        </div>

        {/* 2. CARDS DE MÉTRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total de Produtos</p>
              <p className="text-2xl font-black text-white mt-1">{metrics.total_products}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total de Envios</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{metrics.total_sends}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Send className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total de Visualizações</p>
              <p className="text-2xl font-black text-cyan-400 mt-1">{metrics.total_views}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
              <Eye className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total de Cliques</p>
              <p className="text-2xl font-black text-blue-400 mt-1">{metrics.total_clicks}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
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

        {/* 4. LISTA / TABELA DE PRODUTOS */}
        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-[#0b1222] border-b border-slate-800/90 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="px-5 py-3.5 w-[38%]">Produto</th>
                  <th className="px-4 py-3.5 w-[18%]">Preço & Oferta</th>
                  <th className="px-4 py-3.5 w-[16%]">WhatsApp Destino</th>
                  <th className="px-4 py-3.5 w-[12%] text-center">Status</th>
                  <th className="px-4 py-3.5 w-[16%] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                      Carregando produtos...
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
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
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((p) => {
                    const cover = p.cover_image || (p.images && p.images[0]) || null;
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors group">
                        {/* Identificador e Nome */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {cover ? (
                              <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700 shrink-0 bg-slate-900">
                                <img
                                  src={cover}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold shrink-0">
                                <Package className="w-5 h-5" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/painel/produtos/${p.id}`}
                                className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors block truncate"
                              >
                                {p.name}
                              </Link>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                {p.headline || p.description || "Sem descrição curta"}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                                <span>slug: /{p.slug}</span>
                                <span>•</span>
                                <span>{p.images?.length || 0} fotos</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Preço e Oferta */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            {p.promo_price ? (
                              <>
                                <div className="font-bold text-emerald-400 text-xs">
                                  {formatBRL(p.promo_price)}
                                </div>
                                <div className="text-[10px] text-slate-500 line-through">
                                  De: {formatBRL(p.price)}
                                </div>
                              </>
                            ) : (
                              <div className="font-bold text-white text-xs">
                                {formatBRL(p.price)}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Destino WhatsApp */}
                        <td className="px-4 py-3.5">
                          <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">
                              {p.whatsapp_destination === "default"
                                ? "WhatsApp Padrão"
                                : p.whatsapp_destination}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 text-center">
                          {p.status === "active" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                              Inativo
                            </span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleCopyLink(p)}
                              title="Copiar Link da Página"
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                              {copiedId === p.id ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Share2 className="w-4 h-4" />
                              )}
                            </button>

                            <Link
                              href={`/painel/produtos/${p.id}`}
                              title="Editar Produto"
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 text-slate-400 hover:text-indigo-400 hover:bg-slate-800"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => handleToggleStatus(p)}
                              title={p.status === "active" ? "Inativar Produto" : "Ativar Produto"}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 ${
                                p.status === "active"
                                  ? "text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                                  : "text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                              }`}
                            >
                              {p.status === "active" ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(p)}
                              title="Excluir Produto"
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação Padrão */}
          {!loading && products.length > 0 && (
            <div className="p-4 border-t border-slate-800/80 bg-[#090f1d]">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>
      </div>
    </PainelLayoutClient>
  );
}
