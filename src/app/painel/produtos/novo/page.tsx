"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, Reorder } from "framer-motion";
import {
  ChevronLeft,
  ChevronDown,
  ArrowRight,
  Package,
  Sparkles,
  Upload,
  Trash2,
  Plus,
  Check,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ExternalLink,
  Layers,
  HelpCircle,
  Eye,
  Info,
  BarChart3,
  MousePointerClick,
  Send,
  Image as ImageIcon,
  Palette,
  FileText,
  Lock,
  Move,
  GripVertical,
  Sun,
  Moon,
  Pipette,
  CheckCheck,
  Flame,
  Zap,
  Type,
  Crown,
  LockKeyhole,
  TrendingUp,
  Clock,
  Radio,
  Calendar,
  RefreshCw,
  Users2,
  History as HistoryIcon,
} from "lucide-react";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { Modelo1Template } from "@/components/landing-templates/Modelo1Template";
import { Modelo2DirectSale } from "@/components/landing-templates/Modelo2DirectSale";
import { Modelo3HighConversion } from "@/components/landing-templates/Modelo3HighConversion";
import { BenefitIconPickerModal } from "@/components/landing-templates/BenefitIconPickerModal";
import { getBenefitIconComponent, BENEFIT_ICONS } from "@/components/landing-templates/benefitIcons";
import { CtaIconPickerModal } from "@/components/landing-templates/CtaIconPickerModal";
import { getCtaIconComponent, CTA_ANIMATIONS } from "@/components/landing-templates/ctaOptions";
import { FONT_OPTIONS } from "@/components/landing-templates/fontOptions";
import { SendProductModal } from "@/components/painel/SendProductModal";
import { HeadlinePickerModal } from "@/components/landing-templates/HeadlinePickerModal";
import { useLayout } from "@/context/LayoutContext";
import { PainelLayoutClient } from "@/components/painel/PainelLayoutClient";
import { FloatingActionBar } from "@/components/ui/FloatingActionBar";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import { OFFER_BOX_MODELS } from "@/components/landing-templates/OfferBox";

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  promo_price: string;
  status: "active" | "inactive";
  images: string[];
  cover_image: string;
  whatsapp_destination: string;
  layout_template?: string;
  layout_color: string;
  layout_theme: string;
  layout_font?: string;
  benefits_icon?: string;
  offer_box_style?: string;
  cta_text: string;
  cta_icon?: string;
  cta_animation?: string;
  headline: string;
  guarantee_text: string;
  benefits: string[];
  external_link: string;
  slug?: string;
  sends_count?: number;
  views_count?: number;
  clicks_count?: number;
}

const TEMPLATES = [
  { id: "default", name: "Fashion Clean (Conversão)", desc: "Estilo catálogo premium e minimalista, com galeria deslizante com gestos, ofertas dinâmicas, FAQ e CTA inteligente.", badge: "Padrão" },
  { id: "model_2", name: "Oferta Direta & Escassez", desc: "Focado em conversão agressiva, barra de urgência com cronômetro, prova social ao vivo, selos de segurança e CTA de alto impacto.", badge: "Alta Conversão" },
  { id: "model_3", name: "Alta Autoridade & Prova Social", desc: "Selo VIP de produto selecionado, reviews e avaliações 5 estrelas reais, 3 pilares de confiança e reforço duplo de CTA.", badge: "Top Conversão" },
];

const COLOR_PALETTES = [
  { id: "magenta", name: "Vinho Magenta", hex: "#991b53", desc: "Premium & Vendas", border: "border-pink-500/40" },
  { id: "indigo", name: "Índigo Tech", hex: "#4f46e5", desc: "Moderno & Confiança", border: "border-indigo-500/40" },
  { id: "emerald", name: "Esmeralda", hex: "#059669", desc: "Sucesso & Crescimento", border: "border-emerald-500/40" },
  { id: "amber", name: "Ouro Âmbar", hex: "#d97706", desc: "Energia & Destaque", border: "border-amber-500/40" },
  { id: "rose", name: "Vermelho Rubi", hex: "#e11d48", desc: "Urgência & Impacto", border: "border-rose-500/40" },
  { id: "violet", name: "Roxo Real", hex: "#7c3aed", desc: "Luxo & Sofisticação", border: "border-purple-500/40" },
];

const TABS = [
  { id: 1, label: "Dados do produto", desc: "Informações essenciais, preços, WhatsApp de atendimento e chamadas.", icon: FileText },
  { id: 2, label: "Imagens", desc: "Galeria de fotos do produto e definição da capa de destaque.", icon: ImageIcon },
  { id: 3, label: "Layout", desc: "Personalização de cores, tema, benefícios e textos da landing page.", icon: Palette },
  { id: 4, label: "Estatísticas", desc: "Métricas de envios para grupos, visualizações de página e cliques no WhatsApp.", icon: BarChart3 },
];

function formatCurrencyInput(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return "";
  const num = (parseInt(digitsOnly, 10) / 100).toFixed(2);
  const parts = num.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.join(",");
}

function parseCurrencyToNumber(value: string): string {
  if (!value) return "";
  return value.replace(/\./g, "").replace(",", ".");
}

function formatInitialCurrency(value: string | number | undefined | null): string {
  if (!value) return "";
  const num = Number(value);
  if (isNaN(num) || num === 0) return "";
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function NovoProdutoPage({ productId }: { productId?: string }) {
  const router = useRouter();
  const { showSuccess, showError } = useFeedbackModal();
  const { containerMaxWidthStyle } = useLayout();

  const isEditing = Boolean(productId);
  const [activeTab, setActiveTab] = useState(1);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [newBenefit, setNewBenefit] = useState("");
  const [croppingImageSrc, setCroppingImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isCtaIconPickerOpen, setIsCtaIconPickerOpen] = useState(false);
  const [isHeadlinePickerOpen, setIsHeadlinePickerOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  // Verificação de limites de plano para novos produtos
  const [limitReached, setLimitReached] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ current: number; max: number } | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    promo_price: "",
    status: "active",
    images: [],
    cover_image: "",
    whatsapp_destination: "default",
    layout_template: "default",
    layout_color: "#6366f1",
    layout_theme: "dark",
    layout_font: "plusjakarta_inter",
    benefits_icon: "check",
    offer_box_style: "model_1",
    cta_text: "Comprar no WhatsApp",
    cta_icon: "arrow-right",
    cta_animation: "none",
    headline: "",
    guarantee_text: "7 dias de garantia incondicional",
    benefits: [
      "Entrega rápida e rastreada",
      "Suporte dedicado via WhatsApp",
      "Garantia total de satisfação",
    ],
    external_link: "",
  });

  const [detailedStats, setDetailedStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchDetailedStats = async () => {
    if (!productId) return;
    try {
      setLoadingStats(true);
      const res = await fetch(`/api/painel/produtos/${productId}/estatisticas`);
      const data = await res.json();
      if (data.success) {
        setDetailedStats(data);
      }
    } catch (err) {
      console.error("Erro ao carregar estatísticas detalhadas:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Buscar estatísticas detalhadas ao trocar para a aba de estatísticas
  useEffect(() => {
    if (activeTab === 4 && productId) {
      fetchDetailedStats();
    }
  }, [activeTab, productId]);

  // Carregar métricas de limite de produtos se for novo cadastro
  useEffect(() => {
    if (isEditing) return;
    const checkProductLimit = async () => {
      try {
        const res = await fetch("/api/painel/produtos");
        const data = await res.json();
        if (data.success && data.metrics) {
          const { total_products, limit_products } = data.metrics;
          if (limit_products > 0 && total_products >= limit_products) {
            setLimitReached(true);
            setLimitInfo({ current: total_products, max: limit_products });
          }
        }
      } catch (err) {
        console.error("Erro ao verificar limite de produtos:", err);
      }
    };
    checkProductLimit();
  }, [isEditing]);

  // Carregar dados se for edição
  useEffect(() => {
    if (!productId) return;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/painel/produtos/${productId}`);
        const data = await res.json();
        if (data.success && data.product) {
          const p = data.product;
          setFormData({
            name: p.name || "",
            description: p.description || "",
            price: formatInitialCurrency(p.price),
            promo_price: formatInitialCurrency(p.promo_price),
            status: p.status || "active",
            images: Array.isArray(p.images) ? p.images : [],
            cover_image: p.cover_image || (p.images && p.images[0]) || "",
            layout_template: p.layout_template || "default",
            whatsapp_destination: p.whatsapp_destination || "default",
            layout_color: p.layout_color || "#6366f1",
            layout_theme: p.layout_theme || "dark",
            layout_font: p.layout_font || "sans_modern",
            benefits_icon: p.benefits_icon || "check",
            offer_box_style: p.offer_box_style || "model_1",
            cta_text: p.cta_text || "Comprar no WhatsApp",
            cta_icon: p.cta_icon || "arrow-right",
            cta_animation: p.cta_animation || "none",
            headline: p.headline || "",
            guarantee_text: p.guarantee_text || "",
            benefits: Array.isArray(p.benefits) && p.benefits.length > 0
              ? p.benefits
              : [
                  "Entrega rápida e rastreada",
                  "Suporte dedicado via WhatsApp",
                  "Garantia total de satisfação",
                ],
            external_link: p.external_link || "",
            slug: p.slug || "",
            sends_count: Number(p.sends_count) || 0,
            views_count: Number(p.views_count) || 0,
            clicks_count: Number(p.clicks_count) || 0,
          });
          fetchDetailedStats();
        } else {
          showError(data.message || "Erro ao carregar produto.", "Produto não encontrado");
          router.push("/painel/produtos");
        }
      } catch {
        showError("Falha na comunicação com o servidor.", "Erro");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCroppingImageSrc(reader.result);
        setIsCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCroppedUpload = async (blob: Blob) => {
    const data = new FormData();
    data.append("file", blob, "image.webp");

    try {
      const res = await fetch("/api/painel/produtos/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (json.success && json.url) {
        setFormData((prev) => {
          const nextImages = [...prev.images, json.url];
          return {
            ...prev,
            images: nextImages,
            cover_image: prev.cover_image || json.url,
          };
        });
        setIsDirty(true);
        showSuccess("Imagem otimizada e salva com sucesso!", "Upload Concluído");
      } else {
        showError(json.message || "Falha ao enviar imagem.", "Erro no Upload");
      }
    } catch {
      showError("Erro ao enviar imagem para o servidor.", "Falha de Rede");
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => {
      const nextImages = prev.images.filter((_, idx) => idx !== index);
      const nextCover =
        prev.cover_image === prev.images[index]
          ? nextImages[0] || ""
          : prev.cover_image;
      return {
        ...prev,
        images: nextImages,
        cover_image: nextCover,
      };
    });
    setIsDirty(true);
  };

  // Drag and Drop para reordenar a galeria de imagens
  const handleReorderImages = (reorderedImages: string[]) => {
    setFormData((prev) => ({
      ...prev,
      images: reorderedImages,
    }));
    setIsDirty(true);
  };

  const handleAddBenefit = () => {
    if (!newBenefit.trim()) return;
    setFormData((prev) => ({
      ...prev,
      benefits: [...prev.benefits, newBenefit.trim()],
    }));
    setNewBenefit("");
    setIsDirty(true);
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, idx) => idx !== index),
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!isEditing && limitReached) {
      showError(
        "Você atingiu o limite de produtos do seu plano. Faça um upgrade para cadastrar novos itens.",
        "Limite de Produtos Atingido"
      );
      return;
    }

    const rawPrice = parseCurrencyToNumber(formData.price);
    const rawPromoPrice = parseCurrencyToNumber(formData.promo_price);

    if (!formData.name.trim()) {
      showError("Por favor, informe o nome do produto.", "Campo Obrigatório");
      setActiveTab(1);
      return;
    }

    if (!rawPrice || parseFloat(rawPrice) <= 0) {
      showError("Informe um preço válido maior que zero.", "Preço Inválido");
      setActiveTab(1);
      return;
    }

    try {
      setSaving(true);
      const url = isEditing
        ? `/api/painel/produtos/${productId}`
        : `/api/painel/produtos`;
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        ...formData,
        price: rawPrice,
        promo_price: rawPromoPrice || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        showSuccess(
          data.message || (isEditing ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!"),
          isEditing ? "Atualizado" : "Sucesso"
        );
        setIsDirty(false);
        if (!isEditing && data.productId) {
          router.replace(`/painel/produtos/${data.productId}`);
        }
      } else {
        showError(data.message || "Não foi possível salvar o produto.", "Erro ao Salvar");
      }
    } catch {
      showError("Erro na comunicação com o servidor.", "Falha de Conexão");
    } finally {
      setSaving(false);
    }
  };

  const parsedPriceNumber = parseFloat(parseCurrencyToNumber(formData.price));
  const isFormValid = Boolean(
    !limitReached &&
    formData.name.trim() &&
    !isNaN(parsedPriceNumber) &&
    parsedPriceNumber > 0
  );

  return (
    <PainelLayoutClient>
      <div className="w-full space-y-6">
        {/* Banner Piscante e Estratégico de Limite Atingido */}
        {!isEditing && limitReached && (
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
                      Limite Atingido
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      {limitInfo?.current} de {limitInfo?.max} produtos cadastrados
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white mt-1">
                    Sua empresa está crescendo! Desbloqueie todo o potencial do seu catálogo.
                  </h2>
                  <p className="text-xs text-amber-200/80 mt-0.5 leading-relaxed">
                    Você atingiu o limite de produtos do seu plano atual. Faça o upgrade agora para cadastrar produtos ilimitados, aumentar suas visualizações e multiplicar suas vendas no WhatsApp.
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

        {/* Top Header com Botão Voltar */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <Link
              href="/painel/produtos"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Produtos
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {isEditing ? "Editar Produto" : "Novo Produto"}
            </h1>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={() => setIsSendModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all cursor-pointer shadow-md shadow-emerald-950/40"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar Oferta
            </button>
          )}
        </div>

        {/* Stepper / Tabs Bar (Apenas exibido quando em edição ou com múltiplas abas ativas) */}
        {isEditing && (
          <div className="bg-[#090f1d]/90 border border-slate-800/80 rounded-2xl p-1.5 sm:p-2 shadow-md grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                  }`}
                >
                  <TabIcon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Explicação da Aba Atual */}
        <p className="text-xs text-slate-400">
          {TABS.find((t) => t.id === activeTab)?.desc}
        </p>

        {/* Grid Principal: Formulário + Mockup Flutuante Fixo (Aba 3) ou Layout Padrão */}
        {activeTab === 3 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
            {/* Coluna da Esquerda: Configurações do Layout */}
            <div className="lg:col-span-7 space-y-6 bg-[#090f1d]/90 border border-slate-800/80 p-5 sm:p-6 rounded-2xl shadow-xl">
              {/* GRUPO 1: MODELO DA LANDING PAGE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      Modelo da Landing Page
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Selecione o modelo estrutural de conversão para este produto.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                  {TEMPLATES.map((tmpl) => {
                    const isSelected = (formData.layout_template || "default") === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => handleChange("layout_template", tmpl.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between text-left overflow-hidden ${
                          isSelected
                            ? "bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md shadow-indigo-950/50"
                            : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="space-y-2">
                          {/* Linha superior: Badge e Status */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                isSelected
                                  ? "bg-indigo-500/25 text-indigo-300 border border-indigo-500/40"
                                  : "bg-slate-800/90 text-slate-400 border border-slate-700/60"
                              }`}
                            >
                              {tmpl.badge}
                            </span>
                            {isSelected && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400">
                                <Check className="w-3 h-3 text-indigo-400" />
                              </span>
                            )}
                          </div>

                          {/* Título do modelo */}
                          <div>
                            <h4 className="text-xs font-bold text-white leading-tight">
                              {tmpl.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 leading-snug mt-1">
                              {tmpl.desc}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                          <span className={isSelected ? "text-indigo-300 font-semibold" : "text-slate-500"}>
                            {isSelected ? "Em uso" : "Clique para usar"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GRUPO 2: TIPOGRAFIA E FONTES */}
              <div className="border-t border-slate-800/80 pt-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Type className="w-4 h-4 text-indigo-400" />
                      Tipografia & Estilo de Fonte
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Selecione o estilo tipográfico ideal para o nicho e tom da sua oferta.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {FONT_OPTIONS.map((fnt) => {
                    const isSelected = (formData.layout_font || "plusjakarta_inter") === fnt.id || (formData.layout_font === "sans_modern" && fnt.id === "plusjakarta_inter");
                    return (
                      <div
                        key={fnt.id}
                        onClick={() => handleChange("layout_font", fnt.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between text-left overflow-hidden group ${
                          isSelected
                            ? "bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md shadow-indigo-950/50"
                            : "bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="space-y-2">
                          {/* Linha superior: Badge e Check */}
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider truncate max-w-[130px] ${
                                isSelected
                                  ? "bg-indigo-500/25 text-indigo-300 border border-indigo-500/40"
                                  : "bg-slate-800/90 text-slate-400 border border-slate-700/60"
                              }`}
                            >
                              {fnt.badge}
                            </span>
                            {isSelected && (
                              <span className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-400 shrink-0">
                                <Check className="w-3.5 h-3.5 text-indigo-400" />
                              </span>
                            )}
                          </div>

                          {/* Preview visual compacto da fonte */}
                          <div className="px-2.5 py-2 rounded-lg bg-slate-950/70 border border-slate-800/60 text-slate-200 text-center select-none flex flex-col items-center justify-center gap-1 min-h-[48px]">
                            <span
                              className="text-xs font-bold tracking-tight leading-tight block truncate w-full"
                              style={{ fontFamily: fnt.titleFont }}
                            >
                              {fnt.sampleText}
                            </span>
                            <span
                              className="text-[9px] text-indigo-300/90 font-medium tracking-wide block truncate w-full"
                              style={{ fontFamily: fnt.bodyFont }}
                            >
                              {fnt.name}
                            </span>
                          </div>

                          {/* Nome e Categoria rápida */}
                          <p className="text-[10.5px] text-slate-400 leading-tight truncate">
                            {fnt.category}
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[9.5px]">
                          <span className={isSelected ? "text-indigo-300 font-semibold" : "text-slate-500 group-hover:text-slate-400"}>
                            {isSelected ? "Selecionada" : "Selecionar"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GRUPO 3: PALETA DE CORES E TEMA */}
              <div className="border-t border-slate-800/80 pt-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-400" />
                    Paleta de Cores & Esquema Visual
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Selecione uma paleta pronta, defina uma cor customizada e alterne entre o tema Claro e Escuro.
                  </p>
                </div>

                {/* Grid de Paletas Prontas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {COLOR_PALETTES.map((pal) => {
                    const isSelected = (formData.layout_color || "#991b53").toLowerCase() === pal.hex.toLowerCase();
                    return (
                      <div
                        key={pal.id}
                        onClick={() => handleChange("layout_color", pal.hex)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between text-left overflow-hidden ${
                          isSelected
                            ? "bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md shadow-indigo-950/50"
                            : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg shadow-sm shrink-0 flex items-center justify-center border border-white/20"
                            style={{ backgroundColor: pal.hex }}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate">
                              {pal.name}
                            </h4>
                            <p className="text-[10px] font-mono text-slate-400">
                              {pal.hex}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cor Personalizada e Esquema Light / Dark */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Card de Cor Personalizada */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Pipette className="w-4 h-4 text-indigo-400 shrink-0" />
                        Cor Personalizada
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">Hexadecimal</span>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-950/90 px-3 py-2 rounded-xl border border-slate-800 focus-within:border-indigo-500/70 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
                      <div className="relative shrink-0 flex items-center justify-center w-7 h-7">
                        <input
                          type="color"
                          value={formData.layout_color || "#991b53"}
                          onChange={(e) => handleChange("layout_color", e.target.value)}
                          className="w-full h-full rounded-lg border-0 bg-transparent cursor-pointer p-0 opacity-0 absolute inset-0 z-10"
                          title="Clique para escolher no seletor de cores"
                        />
                        <div
                          className="w-full h-full rounded-lg shadow-inner border border-white/20 transition-transform active:scale-95 pointer-events-none"
                          style={{ backgroundColor: formData.layout_color || "#991b53" }}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.layout_color || "#991b53"}
                        onChange={(e) => handleChange("layout_color", e.target.value)}
                        placeholder="#991B53"
                        className="w-full bg-transparent text-xs font-mono font-bold text-slate-100 uppercase tracking-wider focus:outline-none placeholder-slate-600"
                      />
                    </div>

                    <p className="text-[10px] text-slate-500 leading-tight">
                      Aplica em botões, badges, tags e destaques da página.
                    </p>
                  </div>

                  {/* Card de Esquema Light / Dark */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-indigo-400 shrink-0" />
                        Tema da Página
                      </label>
                      <span className="text-[10px] text-slate-500">Contraste</span>
                    </div>

                    {/* Botões Lado a Lado com Espaço Garantido */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleChange("layout_theme", "light")}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap min-w-0 ${
                          (formData.layout_theme || "light") === "light"
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/50 shadow-sm"
                            : "bg-slate-950/60 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        <Sun className={`w-3.5 h-3.5 shrink-0 ${(formData.layout_theme || "light") === "light" ? "text-amber-400" : "text-slate-500"}`} />
                        <span className="truncate">Light Clean</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleChange("layout_theme", "dark")}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap min-w-0 ${
                          formData.layout_theme === "dark"
                            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-sm"
                            : "bg-slate-950/60 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        <Moon className={`w-3.5 h-3.5 shrink-0 ${formData.layout_theme === "dark" ? "text-indigo-400" : "text-slate-500"}`} />
                        <span className="truncate">Dark Premium</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-tight">
                      Define a tonalidade de fundo e elementos de leitura.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-5 space-y-5">
              {/* GRUPO 3: BENEFÍCIOS DO PRODUTO */}
              <div className="border-t border-slate-800/80 pt-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CheckCheck className="w-4 h-4 text-emerald-400" />
                      Benefícios & Diferenciais
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure os 3 diferenciais que aparecem em destaque na landing page e personalize o ícone visual da lista.
                    </p>
                  </div>

                  {/* Botão para Abrir Modal de Ícones */}
                  <button
                    type="button"
                    onClick={() => setIsIconPickerOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer shadow-xs shrink-0 self-start sm:self-auto group"
                  >
                    {(() => {
                      const IconC = getBenefitIconComponent(formData.benefits_icon || "check");
                      const iconData = BENEFIT_ICONS.find((i) => i.id === (formData.benefits_icon || "check"));
                      return (
                        <>
                          <div className="w-5 h-5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <IconC className="w-3 h-3 stroke-[2.5]" />
                          </div>
                          <span>Ícone: <strong className="text-white font-medium">{iconData?.name || "Check Clássico"}</strong></span>
                        </>
                      );
                    })()}
                  </button>
                </div>

                {/* Campos dos 3 Benefícios Principais */}
                <div className="space-y-3 pt-1">
                  {[0, 1, 2].map((index) => {
                    const IconC = getBenefitIconComponent(formData.benefits_icon || "check");
                    const benefitVal = formData.benefits[index] || "";
                    const placeholders = [
                      "Ex.: Entrega rápida e rastreada",
                      "Ex.: Suporte dedicado via WhatsApp",
                      "Ex.: Garantia total de satisfação",
                    ];

                    return (
                      <div key={index} className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-300 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400 flex items-center justify-center">
                              {index + 1}
                            </span>
                            Benefício {index + 1}
                          </span>
                          <span className="text-[10px] font-normal text-slate-500">
                            {index === 0 ? "Topo do bloco" : index === 1 ? "Meio do bloco" : "Base do bloco"}
                          </span>
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute left-3 w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 pointer-events-none">
                            <IconC className="w-3 h-3 stroke-[2.5]" />
                          </div>
                          <input
                            type="text"
                            placeholder={placeholders[index]}
                            value={benefitVal}
                            onChange={(e) => {
                              const newArr = [...formData.benefits];
                              // Garante que o array tenha até 3 posições
                              while (newArr.length < 3) newArr.push("");
                              newArr[index] = e.target.value;
                              handleChange("benefits", newArr);
                            }}
                            className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GRUPO 4: QUADRO DE OFERTAS (6 MODELOS VISUAIS) */}
              <div className="border-t border-slate-800/80 pt-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-400" />
                    Quadro de Ofertas
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Escolha entre os 6 modelos de design para a área principal de preço, desconto e conversão.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {OFFER_BOX_MODELS.map((model) => {
                    const isSelected = (formData.offer_box_style || "model_1") === model.id;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => handleChange("offer_box_style", model.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative group ${
                          isSelected
                            ? "bg-slate-900 border-indigo-500 shadow-sm ring-1 ring-indigo-500/50"
                            : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {model.tag}
                            </span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20"></span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-white leading-tight">
                            {model.name}
                          </h4>
                          <p className="text-[10.5px] text-slate-400 leading-relaxed mt-1">
                            {model.desc}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                          <span className={isSelected ? "text-indigo-300 font-semibold" : "text-slate-500"}>
                            {isSelected ? "Selecionado" : "Clique para usar"}
                          </span>
                          <span className="font-mono text-slate-600">#{model.id}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GRUPO 5: CONFIGURAÇÃO DO BOTÃO DE AÇÃO (CTA) */}
              <div className="border-t border-slate-800/80 pt-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    Configuração do Botão de Ação (CTA)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Personalize o texto, ícone e efeito de animação do botão de compra/chamada no WhatsApp.
                  </p>
                </div>

                {/* Texto do CTA */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Texto do Botão de Compra (CTA)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: Comprar no WhatsApp"
                    value={formData.cta_text}
                    onChange={(e) => handleChange("cta_text", e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                {/* Seletor de Ícone do Botão */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Ícone do Botão de Ação</span>
                    <button
                      type="button"
                      onClick={() => setIsCtaIconPickerOpen(true)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline font-medium cursor-pointer"
                    >
                      Trocar ícone
                    </button>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsCtaIconPickerOpen(true)}
                    className="w-full p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {React.createElement(getCtaIconComponent(formData.cta_icon), {
                          className: "w-4 h-4 stroke-[2.5]",
                        })}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">
                          Ícone selecionado: <span className="font-mono text-indigo-300">#{formData.cta_icon || "arrow-right"}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          Clique para escolher entre 15 ícones de alta conversão
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-indigo-400 font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                      Alterar
                    </span>
                  </button>
                </div>

                {/* Seletor de Animação do Botão */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Efeito de Animação no Botão
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CTA_ANIMATIONS.map((anim) => {
                      const isSelected = (formData.cta_animation || "none") === anim.id;
                      return (
                        <button
                          key={anim.id}
                          type="button"
                          onClick={() => handleChange("cta_animation", anim.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/30 text-white"
                              : "bg-slate-900/80 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:bg-slate-850"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold">{anim.name}</span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-xs"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">
                            {anim.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* Coluna da Direita: Mockup iPhone 15 Pro Max Flutuante Fixo (Sticky com offset do Header de 64px) */}
            <div className="lg:col-span-5 flex flex-col items-center lg:sticky lg:top-20 z-20 self-start">
              <div className="flex items-center justify-between w-full max-w-[340px] mb-3 px-1">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                  Preview iPhone 15 Pro Max
                </span>
                <div className="flex items-center gap-2">
                  {formData.slug ? (
                    <a
                      href={`/p/${formData.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 px-2 py-0.5 rounded-full transition-all cursor-pointer shadow-xs whitespace-nowrap"
                      title="Abrir landing page pública em nova aba"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Abrir página</span>
                    </a>
                  ) : (
                    <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                      Tempo Real
                    </span>
                  )}
                </div>
              </div>

              {/* iPhone 15 Pro Max Frame */}
              <div className="relative w-[320px] sm:w-[340px] h-[670px] max-h-[calc(100vh-120px)] rounded-[50px] bg-[#1e2330] p-[10px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(99,102,241,0.25)] border-4 border-slate-700/80 ring-1 ring-white/10 select-none">
                {/* Dynamic Island */}
                <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-40 flex items-center justify-between px-2.5 shadow-md pointer-events-none">
                  <div className="w-3 h-3 rounded-full bg-[#111] border border-slate-800/80 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0a192f]"></div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0d1117]"></div>
                </div>

                {/* Speaker Grill */}
                <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-800/90 rounded-full z-40 pointer-events-none"></div>

                {/* Screen Content */}
                <div className="w-full h-full rounded-[40px] overflow-hidden bg-[#FDF8FC] text-slate-900 transition-colors font-sans antialiased relative flex flex-col">
                  {/* Status Bar */}
                  <div className={`pt-8 px-6 pb-2 flex items-center justify-between text-[11px] font-semibold shrink-0 z-30 transition-colors ${
                    formData.layout_theme === "dark" ? "bg-[#0c0d12] text-slate-400" : "bg-[#FDF8FC] text-slate-500"
                  }`}>
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-2 border border-current rounded-sm flex items-center p-0.5">
                        <div className="w-full h-full bg-current rounded-2xs"></div>
                      </div>
                    </div>
                  </div>

                  {/* Body Preview - Template Dinâmico */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700/40 relative">
                    {formData.layout_template === "model_2" ? (
                      <Modelo2DirectSale
                        name={formData.name || "Combo Camisa + Boné"}
                        description={formData.description || "Camisa Polo Ralph Lauren Manga Curta + Boné Ralph Lauren. O combo perfeito para quem busca estilo e presença."}
                        price={Number(parseCurrencyToNumber(formData.price)) || 299.9}
                        promo_price={formData.promo_price ? Number(parseCurrencyToNumber(formData.promo_price)) : 249.9}
                        images={formData.images && formData.images.length > 0 ? formData.images : []}
                        cover_image={formData.cover_image || (formData.images && formData.images[0]) || ""}
                        layout_color={formData.layout_color || "#e11d48"}
                        layout_theme={formData.layout_theme || "light"}
                        layout_font={formData.layout_font || "outlet_promo"}
                        cta_text={formData.cta_text || "Quero Garantir Com Desconto"}
                        cta_icon={formData.cta_icon || "flame"}
                        cta_animation={formData.cta_animation || "pulse"}
                        headline={formData.headline}
                        benefits={formData.benefits}
                        benefits_icon={formData.benefits_icon || "check"}
                        offer_box_style={formData.offer_box_style || "model_1"}
                        company_name="Dias Imports"
                        company_city="Barretos"
                        company_state="SP"
                        isInsideMockup={true}
                      />
                    ) : formData.layout_template === "model_3" ? (
                      <Modelo3HighConversion
                        name={formData.name || "Combo Camisa + Boné"}
                        description={formData.description || "Camisa Polo Ralph Lauren Manga Curta + Boné Ralph Lauren. O combo perfeito para quem busca estilo e presença."}
                        price={Number(parseCurrencyToNumber(formData.price)) || 299.9}
                        promo_price={formData.promo_price ? Number(parseCurrencyToNumber(formData.promo_price)) : 249.9}
                        images={formData.images && formData.images.length > 0 ? formData.images : []}
                        cover_image={formData.cover_image || (formData.images && formData.images[0]) || ""}
                        layout_color={formData.layout_color || "#4f46e5"}
                        layout_theme={formData.layout_theme || "light"}
                        layout_font={formData.layout_font || "sans_modern"}
                        cta_text={formData.cta_text || "Garantir Oferta Exclusiva"}
                        cta_icon={formData.cta_icon || "zap"}
                        cta_animation={formData.cta_animation || "pulse"}
                        headline={formData.headline}
                        benefits={formData.benefits}
                        benefits_icon={formData.benefits_icon || "check"}
                        offer_box_style={formData.offer_box_style || "model_1"}
                        company_name="Dias Imports"
                        company_city="Barretos"
                        company_state="SP"
                        isInsideMockup={true}
                      />
                    ) : (
                      <Modelo1Template
                        name={formData.name || "Combo Camisa + Boné"}
                        description={formData.description || "Camisa Polo Ralph Lauren Manga Curta + Boné Ralph Lauren. O combo perfeito para quem busca estilo e presença."}
                        price={Number(parseCurrencyToNumber(formData.price)) || 299.9}
                        promo_price={formData.promo_price ? Number(parseCurrencyToNumber(formData.promo_price)) : 249.9}
                        images={formData.images && formData.images.length > 0 ? formData.images : []}
                        cover_image={formData.cover_image || (formData.images && formData.images[0]) || ""}
                        layout_color={formData.layout_color || "#991b53"}
                        layout_theme={formData.layout_theme || "light"}
                        layout_font={formData.layout_font || "sans_modern"}
                        cta_text={formData.cta_text || "Quero aproveitar agora"}
                        cta_icon={formData.cta_icon || "arrow-right"}
                        cta_animation={formData.cta_animation || "none"}
                        headline={formData.headline}
                        benefits={formData.benefits}
                        benefits_icon={formData.benefits_icon || "check"}
                        offer_box_style={formData.offer_box_style || "model_1"}
                        company_name="Dias Imports"
                        company_city="Barretos"
                        company_state="SP"
                        isInsideMockup={true}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#090f1d]/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
            {/* ABA 1: DADOS DO PRODUTO */}
            {activeTab === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: Fone Bluetooth XZ-900"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Descrição Completa *
                  </label>
                  <textarea
                    rows={8}
                    placeholder="O que o cliente precisa saber sobre este produto..."
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Preço (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
                        R$
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0,00"
                        value={formData.price}
                        onChange={(e) => handleChange("price", formatCurrencyInput(e.target.value))}
                        className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Preço promocional com desconto (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
                        R$
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0,00"
                        value={formData.promo_price}
                        onChange={(e) => handleChange("promo_price", formatCurrencyInput(e.target.value))}
                        className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* BLOCO DE HEADLINE / CHAMADA DE ALTA CONVERSÃO */}
                <div className="border-t border-slate-800/80 pt-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Headline / Chamada Principal (Opcional)
                      </label>
                      <p className="text-[11px] text-slate-400">
                        Utilizada na landing page e na variável <code className="text-amber-400 font-mono text-[10px] bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20">{"{headline}"}</code> dos disparos de WhatsApp.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsHeadlinePickerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 self-start sm:self-auto shrink-0 whitespace-nowrap"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>50 Modelos de Alta Conversão</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: ⚡ OFERTA RELÂMPAGO: Válida somente enquanto durarem os estoques!"
                      value={formData.headline}
                      onChange={(e) => handleChange("headline", e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                    />
                    {formData.headline && (
                      <button
                        type="button"
                        onClick={() => handleChange("headline", "")}
                        title="Limpar headline"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: IMAGENS */}
            {activeTab === 2 && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Galeria de imagens do produto *
                    </label>
                    {formData.images.length > 1 && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Move className="w-3 h-3 text-indigo-400" />
                        Arraste os cards para reordenar a ordem de exibição
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    <Reorder.Group
                      axis="x"
                      values={formData.images}
                      onReorder={handleReorderImages}
                      className="contents"
                    >
                      {formData.images.map((img, idx) => {
                        const isCover = formData.cover_image === img;

                        return (
                          <Reorder.Item
                            key={img}
                            value={img}
                            whileDrag={{
                              scale: 1.05,
                              zIndex: 99,
                              cursor: "grabbing",
                              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 0 15px rgba(99, 102, 241, 0.4)",
                            }}
                            layout
                            transition={{
                              type: "spring",
                              damping: 30,
                              stiffness: 400,
                            }}
                            className={`relative group aspect-square rounded-2xl overflow-hidden border-2 bg-slate-900 cursor-grab active:cursor-grabbing select-none list-none shadow-md ${
                              isCover ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover pointer-events-none" />
                            
                            {/* Indicador de Ordem / Posição */}
                            <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md text-slate-200 text-xs font-bold px-2 py-0.5 rounded-md border border-slate-700/50 pointer-events-none">
                              #{idx + 1}
                            </div>

                            {/* Handle visual de arraste */}
                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-slate-300 p-1.5 rounded-lg border border-slate-700/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
                              <GripVertical className="w-4 h-4 text-indigo-400" />
                            </div>

                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 z-10 backdrop-blur-[2px]">
                              {!isCover && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleChange("cover_image", img);
                                  }}
                                  className="w-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl cursor-pointer shadow transition-all active:scale-95"
                                >
                                  Definir Capa
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage(idx);
                                }}
                                className="w-full text-xs font-semibold bg-rose-600/90 hover:bg-rose-500 text-white px-3 py-1.5 rounded-xl cursor-pointer shadow transition-all active:scale-95 flex items-center justify-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remover
                              </button>
                            </div>

                            {isCover && (
                              <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow pointer-events-none z-10 flex items-center gap-1 uppercase tracking-wide">
                                <Sparkles className="w-3 h-3" />
                                Capa
                              </div>
                            )}
                          </Reorder.Item>
                        );
                      })}
                    </Reorder.Group>

                    <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-700/80 hover:border-indigo-500/60 hover:bg-slate-800/40 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-slate-400 hover:text-indigo-300 group">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-indigo-500/10 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold">Adicionar foto</span>
                      <span className="text-[10px] text-slate-500">Até 20 MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelected}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                    JPG, PNG, WebP ou AVIF, até 20 MB cada. Ao enviar, você poderá dar zoom, rotacionar, recortar e a imagem será comprimida automaticamente (máximo 300 KB) com altíssima nitidez.
                  </p>
                </div>
              </div>
            )}

            {/* ABA 4: ESTATÍSTICAS COMPLETAS DO PRODUTO */}
            {activeTab === 4 && (
              <div className="space-y-6">
                {/* Header das Estatísticas com Botão de Atualizar e Link do Produto */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-400" />
                      Desempenho & Métricas de Conversão
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Acompanhe em tempo real os disparos nos grupos, visualizações na página e cliques de venda no WhatsApp.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchDetailedStats}
                      disabled={loadingStats}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? "animate-spin" : ""}`} />
                      <span>Atualizar</span>
                    </button>
                    {formData.slug && (
                      <a
                        href={`/p/${formData.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir Landing Page</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Grid com Cards Principais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900/90 border border-slate-800/90 p-4 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Envios</span>
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Send className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-white mt-2">
                      {detailedStats?.stats?.total_dispatches ?? (formData.sends_count ?? 0)}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Disparos enviados para grupos
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800/90 p-4 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Visualizações</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-white mt-2">
                      {formData.views_count ?? 0}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Acessos na landing page pública
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800/90 p-4 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cliques no WhatsApp</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <MousePointerClick className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-white mt-2">
                      {formData.clicks_count ?? 0}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Cliques de conversão no botão
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800/90 p-4 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Taxa de Conversão</span>
                      <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-violet-300 mt-2">
                      {formData.views_count && formData.views_count > 0
                        ? `${(((formData.clicks_count || 0) / formData.views_count) * 100).toFixed(1)}%`
                        : "0.0%"}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Visitantes convertidos em lead
                    </span>
                  </div>
                </div>

                {/* Painel do Funil de Conversão */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/30 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Funil de Vendas do Produto
                    </h4>
                    <span className="text-[11px] text-slate-400">Fluxo da Oferta no WhatsApp</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {/* Etapa 1: Disparo */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-semibold">1. Disparos Realizados</span>
                        <span className="font-mono text-indigo-400 font-bold">100%</span>
                      </div>
                      <div className="text-lg font-black text-white">
                        {detailedStats?.stats?.total_dispatches ?? (formData.sends_count ?? 0)}
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full w-full" />
                      </div>
                    </div>

                    {/* Etapa 2: Acesso */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-semibold">2. Acessos na Oferta</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {detailedStats?.stats?.total_dispatches && detailedStats.stats.total_dispatches > 0
                            ? `${(((formData.views_count || 0) / detailedStats.stats.total_dispatches) * 100).toFixed(0)}%`
                            : "-"}
                        </span>
                      </div>
                      <div className="text-lg font-black text-white">{formData.views_count ?? 0}</div>
                      <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              detailedStats?.stats?.total_dispatches && detailedStats.stats.total_dispatches > 0
                                ? ((formData.views_count || 0) / detailedStats.stats.total_dispatches) * 100
                                : 0
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Etapa 3: Conversão */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-semibold">3. Cliques WhatsApp</span>
                        <span className="font-mono text-amber-400 font-bold">
                          {formData.views_count && formData.views_count > 0
                            ? `${(((formData.clicks_count || 0) / formData.views_count) * 100).toFixed(1)}%`
                            : "0.0%"}
                        </span>
                      </div>
                      <div className="text-lg font-black text-white">{formData.clicks_count ?? 0}</div>
                      <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              formData.views_count && formData.views_count > 0
                                ? ((formData.clicks_count || 0) / formData.views_count) * 100
                                : 0
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Histórico Recente de Disparos deste Produto */}
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <HistoryIcon className="w-4 h-4 text-teal-400" />
                        Histórico Recente de Envios para Grupos
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Últimos disparos enfileirados e processados para este produto.
                      </p>
                    </div>
                    {detailedStats?.stats && (
                      <div className="flex items-center gap-2 text-[11px] font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {detailedStats.stats.completed_dispatches} Entregues
                        </span>
                        {detailedStats.stats.failed_dispatches > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {detailedStats.stats.failed_dispatches} Falhas
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Grupo de Destino</th>
                          <th className="py-3 px-4">Modelo Utilizado</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Tentativas</th>
                          <th className="py-3 px-4">Data do Envio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {!detailedStats?.recentJobs || detailedStats.recentJobs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-500">
                              Nenhum envio recente registrado para este produto.
                            </td>
                          </tr>
                        ) : (
                          detailedStats.recentJobs.map((job: any) => (
                            <tr key={job.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-4 font-bold text-white">
                                <div className="flex items-center gap-2">
                                  <Users2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                  <span className="truncate max-w-[200px]">{job.group_name || "Grupo WhatsApp"}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {job.template_title || "Modelo Padrão"}
                              </td>
                              <td className="py-3 px-4">
                                {job.status === "completed" ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    Enviado
                                  </span>
                                ) : job.status === "failed" ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30" title={job.error_message}>
                                    Falhou
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                    Na Fila
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-300">
                                {job.attempts || 1}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-400">
                                {new Date(job.created_at).toLocaleString("pt-BR")}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Barra Flutuante de Ação quando houver alterações */}
        <FloatingActionBar
          isVisible={isDirty}
          onSave={handleSave}
          onCancel={() => router.push("/painel/produtos")}
          isSaving={saving}
          isValid={isFormValid}
        />

        {/* Modal de Corte e Compressão de Imagens */}
        {isCropperOpen && croppingImageSrc && (
          <ImageCropperModal
            isOpen={isCropperOpen}
            imageSrc={croppingImageSrc}
            onClose={() => {
              setIsCropperOpen(false);
              setCroppingImageSrc(null);
            }}
            onCropComplete={handleCroppedUpload}
          />
        )}

        {/* Modal Seletor de Ícones de Benefícios */}
        <BenefitIconPickerModal
          isOpen={isIconPickerOpen}
          onClose={() => setIsIconPickerOpen(false)}
          selectedIconId={formData.benefits_icon || "check"}
          onSelectIcon={(newIconId) => {
            handleChange("benefits_icon", newIconId);
          }}
        />

        {/* Modal Seletor de Ícones de Botão CTA */}
        <CtaIconPickerModal
          isOpen={isCtaIconPickerOpen}
          onClose={() => setIsCtaIconPickerOpen(false)}
          selectedIconId={formData.cta_icon || "arrow-right"}
          onSelectIcon={(newIconId) => {
            handleChange("cta_icon", newIconId);
          }}
        />

        {/* Modal Seletor de Headline de Alta Conversão */}
        <HeadlinePickerModal
          isOpen={isHeadlinePickerOpen}
          onClose={() => setIsHeadlinePickerOpen(false)}
          selectedHeadlineText={formData.headline || ""}
          onSelectHeadline={(headlineText) => {
            handleChange("headline", headlineText);
          }}
        />

        {/* Modal de Disparo de Campanha com Escolha de Modelos e Grupos */}
        {isEditing && productId && (
          <SendProductModal
            isOpen={isSendModalOpen}
            product={{
              id: productId,
              name: formData.name,
              slug: formData.slug,
              price: formData.price,
              promo_price: formData.promo_price,
              description: formData.description,
              headline: formData.headline,
              cover_image: formData.cover_image,
            }}
            onClose={() => setIsSendModalOpen(false)}
            onSuccess={() => {
              setFormData((prev) => ({
                ...prev,
                sends_count: (prev.sends_count ?? 0) + 1,
              }));
            }}
          />
        )}
      </div>
    </PainelLayoutClient>
  );
}
