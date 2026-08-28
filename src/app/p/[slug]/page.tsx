"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Package, Sparkles, MessageCircle, RefreshCw, ShoppingBag, ArrowRight } from "lucide-react";
import { Modelo1Template } from "@/components/landing-templates/Modelo1Template";
import { Modelo2DirectSale } from "@/components/landing-templates/Modelo2DirectSale";
import { Modelo3HighConversion } from "@/components/landing-templates/Modelo3HighConversion";
import { MetaPixel, trackMetaLead } from "@/components/MetaPixel";

interface PublicProduct {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  promo_price?: number | null;
  images: string[];
  cover_image?: string;
  layout_template?: string;
  layout_color: string;
  layout_theme: string;
  layout_font?: string;
  cta_text: string;
  cta_icon?: string;
  cta_animation?: string;
  headline?: string;
  guarantee_text?: string;
  benefits: string[];
  benefits_icon?: string;
  offer_box_style?: string;
  external_link?: string;
  company_name: string;
  company_city?: string;
  company_state?: string;
  target_whatsapp: string;
  meta_pixel_id?: string | null;
  meta_pixel_active?: boolean;
}

const FAQ_ITEMS = [
  {
    q: "Como eu compro?",
    a: "Basta clicar em 'Quero aproveitar agora' para abrir uma conversa direta no WhatsApp da nossa loja. O produto e as condições promocionais já estarão pré-preenchidos.",
  },
  {
    q: "O preço desta página é o que eu pago?",
    a: "Sim! O valor exibido nesta página com o desconto especial é exatamente o valor final combinado para o seu pedido.",
  },
  {
    q: "Com quem eu estou falando?",
    a: "Você será atendido diretamente por um especialista da nossa equipe oficial da Dias Imports, com suporte humano e dedicado.",
  },
  {
    q: "E se eu ficar com dúvida antes de decidir?",
    a: "Fique tranquilo! Ao clicar para chamar no WhatsApp, você pode tirar dúvidas de tamanho, fotos adicionais, formas de envio e pagamento antes de concluir qualquer compra.",
  },
];

export default function PublicProductLandingPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";

  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isLimitedView, setIsLimitedView] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<{ name?: string; whatsapp?: string }>({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/produtos/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.product) {
          setProduct(data.product);
        } else if (data.limited_view || data.error_code === "LIMITED_VIEW") {
          setIsLimitedView(true);
          setCompanyInfo({
            name: data.company_name,
            whatsapp: data.target_whatsapp,
          });
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium">Carregando produto...</p>
      </div>
    );
  }

  // Tela Amigável e Animada para LIMITED_VIEW
  if (isLimitedView) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4 relative overflow-hidden text-center selection:bg-pink-500 selection:text-white">
        {/* Glows de Fundo Animados */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-500/15 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none animate-pulse" />

        <div className="relative z-10 max-w-md w-full bg-[#0c1222]/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center">
          {/* Ícone Animado com Efeito Flutuante e Pulso */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-pink-500/25 animate-bounce">
              <ShoppingBag className="w-10 h-10 stroke-[2.2]" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-[#0c1222] flex items-center justify-center text-slate-950 animate-spin">
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
            Atualização de Estoque
          </span>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug mb-2">
            No momento esse produto não está disponível
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs mb-6">
            Estamos atualizando nosso catálogo e condições especiais para você. Consulte nosso atendimento para conferir disponibilidade ou opções similares.
          </p>

          {/* Botão de Contato com Atendimento WhatsApp */}
          {companyInfo.whatsapp && (
            <a
              href={`https://wa.me/${companyInfo.whatsapp}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre as novidades e disponibilidade dos produtos.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer mb-5"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Falar com Atendimento</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          )}

          {/* Código de Erro Discreto no Rodapé */}
          <div className="pt-4 border-t border-slate-800/80 w-full flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>{companyInfo.name || "Dias Imports"}</span>
            <span className="bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-slate-400 font-bold">
              LIMITED_VIEW
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 p-4 text-center">
        <Package className="w-12 h-12 text-slate-600 mb-3" />
        <h1 className="text-xl font-bold text-white mb-1">Produto Indisponível</h1>
        <p className="text-xs text-slate-500 max-w-sm">
          Este produto não foi encontrado ou está temporariamente inativo no catálogo.
        </p>
      </div>
    );
  }

  const isDark = product.layout_theme !== "light";
  const mainColor = product.layout_color || "#991b53"; // Rosa/Vinho premium
  const gallery = product.images.length > 0 ? product.images : product.cover_image ? [product.cover_image] : [];
  const currentImage = gallery[activeImageIndex] || product.cover_image;

  const discountAmount =
    product.promo_price && product.price > product.promo_price
      ? product.price - product.promo_price
      : 0;

  const discountPercentage =
    product.promo_price && product.price > product.promo_price
      ? Math.round((discountAmount / product.price) * 100)
      : null;

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const handleBuyClick = () => {
    fetch(`/api/public/produtos/${product.id}/click`, { method: "POST" }).catch(() => {});

    // Dispara evento Lead no Meta Ads
    if (product.meta_pixel_active && product.meta_pixel_id) {
      const effPrice = product.promo_price || product.price;
      trackMetaLead(product.id, product.name, effPrice);
    }

    if (product.target_whatsapp) {
      const pageUrl = typeof window !== "undefined" ? window.location.href : "";
      const textMessage = pageUrl
        ? `Olá! Tenho interesse no produto *${product.name}* que vi na página:\n${pageUrl}`
        : `Olá! Tenho interesse no produto *${product.name}* que vi na promoção especial.`;
      const msg = encodeURIComponent(textMessage);
      window.open(`https://wa.me/${product.target_whatsapp}?text=${msg}`, "_blank");
    } else if (product.external_link) {
      window.open(product.external_link, "_blank");
    }
  };

  if (product.layout_template === "model_2") {
    return (
      <>
        <MetaPixel
          pixelId={product.meta_pixel_id}
          isActive={product.meta_pixel_active}
          productId={product.id}
          productName={product.name}
          price={product.promo_price || product.price}
        />
        <Modelo2DirectSale
          name={product.name}
          description={product.description}
          price={product.price}
          promo_price={product.promo_price}
          images={product.images}
          cover_image={product.cover_image}
          layout_color={product.layout_color}
          layout_theme={product.layout_theme}
          layout_font={product.layout_font || "outlet_promo"}
          cta_text={product.cta_text}
          cta_icon={product.cta_icon}
          cta_animation={product.cta_animation}
          headline={product.headline}
          guarantee_text={product.guarantee_text}
          benefits={product.benefits}
          benefits_icon={product.benefits_icon || "check"}
          offer_box_style={product.offer_box_style || "model_1"}
          external_link={product.external_link}
          company_name={product.company_name}
          company_city={product.company_city}
          company_state={product.company_state}
          target_whatsapp={product.target_whatsapp}
          onBuyClick={handleBuyClick}
        />
      </>
    );
  }

  if (product.layout_template === "model_3") {
    return (
      <>
        <MetaPixel
          pixelId={product.meta_pixel_id}
          isActive={product.meta_pixel_active}
          productId={product.id}
          productName={product.name}
          price={product.promo_price || product.price}
        />
        <Modelo3HighConversion
          name={product.name}
          description={product.description}
          price={product.price}
          promo_price={product.promo_price}
          images={product.images}
          cover_image={product.cover_image}
          layout_color={product.layout_color}
          layout_theme={product.layout_theme}
          layout_font={product.layout_font || "sans_modern"}
          cta_text={product.cta_text}
          cta_icon={product.cta_icon}
          cta_animation={product.cta_animation}
          headline={product.headline}
          guarantee_text={product.guarantee_text}
          benefits={product.benefits}
          benefits_icon={product.benefits_icon || "check"}
          offer_box_style={product.offer_box_style || "model_1"}
          external_link={product.external_link}
          company_name={product.company_name}
          company_city={product.company_city}
          company_state={product.company_state}
          target_whatsapp={product.target_whatsapp}
          onBuyClick={handleBuyClick}
        />
      </>
    );
  }

  return (
    <>
      <MetaPixel
        pixelId={product.meta_pixel_id}
        isActive={product.meta_pixel_active}
        productId={product.id}
        productName={product.name}
        price={product.promo_price || product.price}
      />
      <Modelo1Template
        name={product.name}
        description={product.description}
        price={product.price}
        promo_price={product.promo_price}
        images={product.images}
        cover_image={product.cover_image}
        layout_color={product.layout_color}
        layout_theme={product.layout_theme}
        layout_font={product.layout_font || "sans_modern"}
        cta_text={product.cta_text}
        cta_icon={product.cta_icon}
        cta_animation={product.cta_animation}
        headline={product.headline}
        guarantee_text={product.guarantee_text}
        benefits={product.benefits}
        benefits_icon={product.benefits_icon || "check"}
        offer_box_style={product.offer_box_style || "model_1"}
        external_link={product.external_link}
        company_name={product.company_name}
        company_city={product.company_city}
        company_state={product.company_state}
        target_whatsapp={product.target_whatsapp}
        onBuyClick={handleBuyClick}
      />
    </>
  );
}
