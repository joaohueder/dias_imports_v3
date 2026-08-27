"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Package } from "lucide-react";
import { Modelo1Template } from "@/components/landing-templates/Modelo1Template";
import { Modelo2DirectSale } from "@/components/landing-templates/Modelo2DirectSale";
import { Modelo3HighConversion } from "@/components/landing-templates/Modelo3HighConversion";

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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/produtos/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.product) {
          setProduct(data.product);
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

    if (product.target_whatsapp) {
      const msg = encodeURIComponent(`Olá! Tenho interesse no produto *${product.name}* que vi na promoção especial.`);
      window.open(`https://wa.me/${product.target_whatsapp}?text=${msg}`, "_blank");
    } else if (product.external_link) {
      window.open(product.external_link, "_blank");
    }
  };

  if (product.layout_template === "model_2") {
    return (
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
    );
  }

  if (product.layout_template === "model_3") {
    return (
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
    );
  }

  return (
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
  );
}
