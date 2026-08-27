"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Flame,
  Clock,
  ShieldCheck,
  Truck,
  Eye,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
  Zap,
} from "lucide-react";
import { TemplateProductProps } from "./Modelo1Template";
import { OfferBox } from "./OfferBox";
import { getCtaIconComponent, getCtaAnimationClass } from "./ctaOptions";
import { getFontFamilyCss, getFontTitleFamilyCss } from "./fontOptions";

const DEFAULT_FAQ = [
  {
    q: "Como garanto o preço promocional?",
    a: "Basta clicar no botão e iniciar a conversa no WhatsApp oficial da loja. O desconto desta página fica reservado automaticamente para o seu atendimento.",
  },
  {
    q: "O produto é original e possui garantia?",
    a: "Sim! Trabalhamos exclusivamente com produtos novos, conferidos rigorosamente antes do envio e com garantia total de satisfação.",
  },
  {
    q: "Como funciona a entrega e o rastreio?",
    a: "Despachamos com código de rastreamento enviado diretamente no seu WhatsApp para você acompanhar cada etapa até sua casa.",
  },
  {
    q: "Posso tirar dúvidas sobre tamanhos e modelos antes de pagar?",
    a: "Com certeza! Nosso time está online no WhatsApp pronto para mandar fotos reais, tirar dúvidas de medidas e ajudar na sua escolha.",
  },
];

export const Modelo2DirectSale: React.FC<TemplateProductProps> = ({
  name,
  description,
  price,
  promo_price,
  images = [],
  cover_image,
  layout_color = "#e11d48",
  layout_theme = "light",
  layout_font = "outlet_promo",
  cta_text = "Quero Garantir Com Desconto",
  cta_icon = "flame",
  cta_animation = "pulse",
  benefits,
  benefits_icon = "check",
  offer_box_style = "model_1",
  company_name = "Dias Imports",
  company_city = "Barretos",
  company_state = "SP",
  onBuyClick,
  isInsideMockup = false,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Contador regressivo psicológico para gatilho de escassez (14 min 59s)
  const [timeLeft, setTimeLeft] = useState({ min: 14, sec: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.sec > 0) {
          return { ...prev, sec: prev.sec - 1 };
        } else if (prev.min > 0) {
          return { min: prev.min - 1, sec: 59 };
        }
        return { min: 14, sec: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [isAnyCtaVisible, setIsAnyCtaVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ctaCard1Ref = useRef<HTMLDivElement | null>(null);
  const ctaCard2Ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scrollContainer = isInsideMockup ? containerRef.current?.parentElement : null;

    const observer = new IntersectionObserver(
      (entries) => {
        const anyVisible = entries.some((entry) => entry.isIntersecting);
        setIsAnyCtaVisible(anyVisible);
      },
      {
        root: scrollContainer || null,
        threshold: 0.05,
      }
    );

    if (ctaCard1Ref.current) observer.observe(ctaCard1Ref.current);
    if (ctaCard2Ref.current) observer.observe(ctaCard2Ref.current);

    return () => {
      observer.disconnect();
    };
  }, [isInsideMockup]);

  const gallery = images.length > 0 ? images : cover_image ? [cover_image] : [];

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    if (distance > 45) {
      handleNextImage();
    } else if (distance < -45) {
      handlePrevImage();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const hasDiscount = Boolean(promo_price && price > promo_price);
  const discountAmount = hasDiscount && promo_price ? price - promo_price : 0;
  const discountPercentage = hasDiscount && promo_price ? Math.round(((price - promo_price) / price) * 100) : null;
  const currentFinalPrice = hasDiscount && promo_price ? promo_price : price;

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const defaultBenefitsList = [
    "Atendimento VIP direto no WhatsApp",
    "Estoque reservado por 15 minutos",
    "Garantia blindada de recebimento",
    "Envio rápido com código de rastreio",
  ];

  const displayBenefits = benefits && benefits.length > 0 ? benefits : defaultBenefitsList;

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const mainColor = layout_color || "#e11d48";
  const isDark = layout_theme === "dark";
  const fontFamilyStyle = { fontFamily: getFontFamilyCss(layout_font) };
  const titleFontStyle = { fontFamily: getFontTitleFamilyCss(layout_font) };

  const CtaIcon = getCtaIconComponent(cta_icon || "flame");
  const animationClass = getCtaAnimationClass(cta_animation || "pulse");

  return (
    <div
      ref={containerRef}
      style={fontFamilyStyle}
      className={`w-full antialiased transition-colors duration-200 ${
        isDark ? "bg-[#0b0f19] text-slate-100 selection:bg-rose-950" : "bg-[#f8fafc] text-slate-900 selection:bg-rose-100"
      } ${isInsideMockup ? "text-[13px]" : "min-h-screen"}`}
    >
      {/* 1. BARRA SUPERIOR DE URGÊNCIA & CRONÔMETRO */}
      <div
        className="w-full py-2 px-3 text-white text-center flex items-center justify-center gap-2 shadow-sm font-bold text-xs sticky top-0 z-30 tracking-tight"
        style={{ backgroundColor: mainColor }}
      >
        <span className="flex items-center gap-1.5 animate-pulse uppercase tracking-wider text-[11px]">
          <Flame className="w-3.5 h-3.5 fill-current" />
          Oferta Relâmpago
        </span>
        <span className="text-white/60">•</span>
        <span className="flex items-center gap-1 text-[11px] font-mono bg-black/25 px-2 py-0.5 rounded-full border border-white/20">
          <Clock className="w-3 h-3" />
          Expira em {String(timeLeft.min).padStart(2, "0")}:{String(timeLeft.sec).padStart(2, "0")}
        </span>
      </div>

      {/* Container Central Estreito */}
      <div className={`w-full ${isInsideMockup ? "px-3 pt-3 pb-2" : "max-w-[440px] mx-auto px-4 pt-4 pb-16"} flex flex-col items-center`}>
        
        {/* Prova Social de Visualização Ao Vivo */}
        <div className="w-full flex items-center justify-between px-1 mb-2 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            18 pessoas vendo agora
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            Loja Verificada
          </span>
        </div>

        {/* 2. HEADLINE DE ALTO IMPACTO (TÍTULO DO PRODUTO) */}
        <div className="w-full text-left mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider text-white"
              style={{ backgroundColor: mainColor }}
            >
              {discountPercentage ? `${discountPercentage}% OFF` : "DESTAQUE"}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">
              Restam poucas unidades
            </span>
          </div>
          <h1
            style={titleFontStyle}
            className={`font-black tracking-tight ${isInsideMockup ? "text-[20px]" : "text-[24px] sm:text-[26px]"} ${isDark ? "text-white" : "text-slate-950"} leading-tight`}
          >
            {name || "Produto Sem Nome"}
          </h1>
        </div>

        {/* 3. GALERIA COM BADGE FLUTUANTE DE DESCONTO */}
        <div className="w-full relative mb-3">
          <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className={`w-full aspect-square rounded-2xl overflow-hidden relative shadow-md select-none cursor-grab active:cursor-grabbing border ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            {gallery.length > 0 ? (
              <div
                className="w-full h-full flex transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(-${activeImageIndex * 100}%)`,
                }}
              >
                {gallery.map((img, idx) => (
                  <div key={idx} className="w-full h-full shrink-0 relative bg-slate-950/5">
                    <img
                      src={img}
                      alt={`${name} - Foto ${idx + 1}`}
                      draggable={false}
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400">
                <span className="text-xs font-medium">Sem foto cadastrada</span>
              </div>
            )}

            {/* Selo Flutuante de Queima de Estoque */}
            <div className="absolute top-3 right-3 z-10">
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-white shadow-lg flex items-center gap-1"
                style={{ backgroundColor: mainColor }}
              >
                <Sparkles className="w-3 h-3" />
                Super Promoção
              </span>
            </div>

            {/* Setas de Navegação */}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all active:scale-90 cursor-pointer z-10 backdrop-blur-xs border ${
                    isDark ? "bg-slate-900/85 hover:bg-slate-900 text-slate-200 border-slate-700/60" : "bg-white/85 hover:bg-white text-slate-800 border-slate-200/60"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 -ml-0.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all active:scale-90 cursor-pointer z-10 backdrop-blur-xs border ${
                    isDark ? "bg-slate-900/85 hover:bg-slate-900 text-slate-200 border-slate-700/60" : "bg-white/85 hover:bg-white text-slate-800 border-slate-200/60"
                  }`}
                >
                  <ChevronRight className="w-4 h-4 -mr-0.5" />
                </button>
              </>
            )}
          </div>

          {/* Miniaturas com visual moderno */}
          {gallery.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-2.5 overflow-x-auto pb-1">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    activeImageIndex === idx
                      ? "ring-2 ring-offset-1 scale-105"
                      : "opacity-60 hover:opacity-100 border-transparent"
                  }`}
                  style={{
                    borderColor: activeImageIndex === idx ? mainColor : "transparent",
                  }}
                >
                  <img src={img} alt="Miniatura" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. PRIMEIRA CAIXA DE OFERTA / CTA */}
        <div ref={ctaCard1Ref} className="w-full my-2">
          <OfferBox
            modelId={offer_box_style || "model_1"}
            price={price}
            promo_price={promo_price}
            hasDiscount={hasDiscount}
            discountAmount={discountAmount}
            discountPercentage={discountPercentage}
            currentFinalPrice={currentFinalPrice}
            formatBRL={formatBRL}
            mainColor={mainColor}
            isDark={isDark}
            cta_text={cta_text}
            cta_icon={cta_icon}
            cta_animation={cta_animation}
            company_name={company_name}
            onBuyClick={onBuyClick}
          />
        </div>

        {/* 5. GATILHOS DE SEGURANÇA E CONFIANÇA */}
        <div className={`w-full p-3.5 rounded-2xl border my-2 grid grid-cols-2 gap-2.5 ${
          isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-[11px] font-bold block leading-none">Envio Rápido</span>
              <span className="text-[10px] text-slate-400">Rastreio WhatsApp</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-[11px] font-bold block leading-none">Garantia Total</span>
              <span className="text-[10px] text-slate-400">Compra 100% Segura</span>
            </div>
          </div>
        </div>

        {/* 6. DESCRIÇÃO DO PRODUTO & DETALHES */}
        {description && (
          <div className={`w-full p-4 rounded-2xl border my-2 text-left ${
            isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
          }`}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Por que escolher este produto?
            </h3>
            <p className={`text-[12px] leading-relaxed whitespace-pre-line ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              {description}
            </p>
          </div>
        )}

        {/* 7. LISTA DE VANTAGENS / BENEFÍCIOS */}
        <div className={`w-full p-4 rounded-2xl border my-2 text-left ${
          isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
        }`}>
          <h3 className="text-xs font-black uppercase tracking-wider mb-3 text-slate-400">
            Destaques e Vantagens
          </h3>
          <div className="space-y-2.5">
            {displayBenefits.map((b, i) => {
              const text = typeof b === "string" ? b : b.text;
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${mainColor}20`, color: mainColor }}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <span className={`text-[12px] font-semibold leading-tight ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 8. SEGUNDA CAIXA DE OFERTA / REFORÇO DE CONVERSÃO */}
        <div ref={ctaCard2Ref} className="w-full my-3">
          <OfferBox
            modelId={offer_box_style || "model_1"}
            price={price}
            promo_price={promo_price}
            hasDiscount={hasDiscount}
            discountAmount={discountAmount}
            discountPercentage={discountPercentage}
            currentFinalPrice={currentFinalPrice}
            formatBRL={formatBRL}
            mainColor={mainColor}
            isDark={isDark}
            cta_text={cta_text}
            cta_icon={cta_icon}
            cta_animation={cta_animation}
            company_name={company_name}
            onBuyClick={onBuyClick}
          />
        </div>

        {/* 9. FAQ COM DROPDOWNS INTERATIVOS */}
        <div className="w-full my-2 space-y-2 text-left">
          <h3 className="text-xs font-black uppercase tracking-wider px-1 text-slate-400">
            Dúvidas Frequentes
          </h3>
          {DEFAULT_FAQ.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-xl border transition-colors overflow-hidden ${
                  isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200/80"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-3.5 text-left flex items-center justify-between gap-2 font-bold text-xs cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-400 shrink-0">{isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}</span>
                </button>
                {isOpen && (
                  <div className={`px-3.5 pb-3.5 text-[11px] leading-relaxed border-t pt-2.5 ${
                    isDark ? "border-slate-800/80 text-slate-400" : "border-slate-100 text-slate-600"
                  }`}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 10. RODAPÉ DE SEGURANÇA E EMPRESA */}
        <div className="w-full pt-6 pb-4 text-center border-t border-slate-800/20 mt-4 text-slate-500 text-[10px] space-y-1">
          <p className="font-bold">{company_name} • {company_city} - {company_state}</p>
          <p className="flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Atendimento Oficial e Seguro via WhatsApp
          </p>
        </div>
      </div>

      {/* 11. BARRA FIXA INFERIOR STICKY CTA */}
      <div
        className={`${
          isInsideMockup ? "sticky bottom-0" : "fixed bottom-0"
        } left-0 right-0 z-40 p-3 backdrop-blur-md border-t shadow-2xl flex items-center justify-center transition-all duration-300 transform ${
          isDark ? "bg-[#0b0f19]/95 border-slate-800" : "bg-white/95 border-slate-200"
        } ${
          isAnyCtaVisible
            ? "translate-y-full opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100 pointer-events-auto"
        }`}
      >
        <div className={`w-full ${isInsideMockup ? "max-w-full" : "max-w-[430px]"} flex items-center justify-between gap-3`}>
          <div className="text-left leading-tight shrink-0">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">
              Preço Promocional
            </span>
            <span className="text-base font-black tracking-tight text-emerald-500">
              R$ {(Number(promo_price && Number(promo_price) > 0 ? promo_price : price) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <button
            type="button"
            onClick={onBuyClick}
            className={`flex-1 py-3 px-4 rounded-xl text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer hover:brightness-110 whitespace-nowrap ${animationClass}`}
            style={{ backgroundColor: mainColor }}
          >
            <CtaIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">{cta_text}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
