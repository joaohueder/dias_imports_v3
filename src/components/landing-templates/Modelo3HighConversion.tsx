"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Truck,
  Sparkles,
  Zap,
  Flame,
  Clock,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Star,
  ShoppingBag,
  Award,
  ThumbsUp,
  CreditCard,
  MessageCircle,
} from "lucide-react";
import { TemplateProductProps } from "./Modelo1Template";
import { OfferBox } from "./OfferBox";
import { getBenefitIconComponent } from "./benefitIcons";
import { getCtaIconComponent, getCtaAnimationClass } from "./ctaOptions";
import { getFontFamilyCss, getFontTitleFamilyCss } from "./fontOptions";

const DEFAULT_FAQ = [
  {
    q: "O produto acompanha garantia e nota?",
    a: "Sim! Todos os nossos produtos possuem garantia de recebimento e satisfação. Enviamos com todo o cuidado e suporte pós-venda.",
  },
  {
    q: "Como garanto as condições desta página?",
    a: "Ao tocar no botão de compra, seu atendimento é direcionado ao consultor oficial da loja com o cupom e lote promocional pré-reservados.",
  },
  {
    q: "Quais são as formas de pagamento disponíveis?",
    a: "Aceitamos PIX com confirmação imediata e cartões de crédito em até 12x. Todas as condições são combinadas de forma 100% segura no WhatsApp.",
  },
  {
    q: "Como funciona o envio e o rastreio?",
    a: "Após a confirmação, seu pedido é embalado com proteção reforçada e o código de rastreamento é enviado direto no seu WhatsApp para acompanhamento.",
  },
];

export const Modelo3HighConversion: React.FC<TemplateProductProps> = ({
  name,
  description,
  price,
  promo_price,
  images = [],
  cover_image,
  layout_color = "#4f46e5",
  layout_theme = "light",
  layout_font = "sans_modern",
  cta_text = "Garantir Oferta Exclusiva",
  cta_icon = "zap",
  cta_animation = "pulse",
  headline,
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

  // Gatilho de urgência: lote do dia
  const [unitsLeft] = useState(4);

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
    `Estoque disponível e testado para pronta-entrega`,
    `Envio com seguro de carga e rastreamento WhatsApp`,
    `Atendimento direto com consultor em ${company_city || "sua região"}`,
    `Garantia blindada incondicional de satisfação`,
  ];

  const displayBenefits = benefits && benefits.length > 0 ? benefits : defaultBenefitsList;

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const mainColor = layout_color || "#4f46e5";
  const isDark = layout_theme === "dark";
  const fontFamilyStyle = { fontFamily: getFontFamilyCss(layout_font) };
  const titleFontStyle = { fontFamily: getFontTitleFamilyCss(layout_font) };

  const CtaIcon = getCtaIconComponent(cta_icon || "zap");
  const animationClass = getCtaAnimationClass(cta_animation || "pulse");

  return (
    <div
      ref={containerRef}
      style={fontFamilyStyle}
      className={`w-full antialiased transition-colors duration-200 ${
        isDark ? "bg-[#080b12] text-slate-100 selection:bg-indigo-950" : "bg-[#f4f6fb] text-slate-900 selection:bg-indigo-100"
      } ${isInsideMockup ? "text-[13px]" : "min-h-screen"}`}
    >
      {/* 1. BARRA SUPERIOR PREMIUM COM PROVA DE AUTORIDADE */}
      <div className="w-full bg-[#04060a] text-slate-200 py-2 px-3 text-center border-b border-slate-800/80 sticky top-0 z-30 shadow-md">
        <div className="max-w-[450px] mx-auto flex items-center justify-between text-[11px] font-semibold">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span>Produto Selecionado VIP</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10.5px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Apenas {unitsLeft} no estoque</span>
          </div>
        </div>
      </div>

      {/* Container Central com Foco em Alta Conversão */}
      <div className={`w-full ${isInsideMockup ? "px-3 pt-3 pb-2" : "max-w-[450px] mx-auto px-4 pt-4 pb-20"} flex flex-col items-center`}>
        
        {/* Selo de Avaliação de Alta Confiança (5 Estrelas) */}
        <div className="w-full flex items-center justify-between mb-2.5 px-0.5">
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full text-amber-500">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
            </div>
            <span className="text-[11px] font-extrabold ml-1">4.9/5</span>
            <span className="text-[10px] text-slate-400 font-medium">(184 avaliações)</span>
          </div>

          <span className="text-[10.5px] font-bold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            Compra 100% Segura
          </span>
        </div>

        {/* 2. TÍTULO DO PRODUTO */}
        <div className="w-full text-left mb-3">
          <h1
            style={titleFontStyle}
            className={`font-bold tracking-tight ${isInsideMockup ? "text-[20px]" : "text-[24px] sm:text-[26px]"} ${isDark ? "text-white" : "text-slate-950"} leading-tight`}
          >
            {name || "Produto Premium Selecionado"}
          </h1>
          
          {/* HEADLINE / PROMESSA PRINCIPAL */}
          {headline ? (
            <div
              className={`mt-2 p-2.5 rounded-xl border flex items-center gap-2 ${
                isDark ? "bg-indigo-950/40 border-indigo-500/30 text-indigo-200" : "bg-indigo-50/80 border-indigo-200 text-indigo-950"
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-indigo-500" />
              <p className="text-xs sm:text-[13px] font-semibold leading-snug">
                {headline}
              </p>
            </div>
          ) : null}

          <p className="text-[11.5px] text-slate-400 font-medium mt-2">
            Por <strong className={isDark ? "text-slate-200" : "text-slate-700"}>{company_name}</strong> • Envio oficial para {company_city || "sua cidade"}
          </p>
        </div>

        {/* 3. GALERIA DE FOTOS COM OVERLAY DE QUALIDADE */}
        <div className="w-full relative mb-3">
          <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className={`w-full aspect-square rounded-2xl overflow-hidden relative shadow-lg select-none cursor-grab active:cursor-grabbing border ${
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
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-900">
                <ShoppingBag className="w-12 h-12 stroke-1 text-slate-400 mb-2" />
                <span className="text-xs font-semibold">Sem fotos cadastradas</span>
              </div>
            )}

            {/* Badges Flutuantes sobre a Imagem */}
            {discountPercentage && (
              <div className="absolute top-3 left-3 bg-gradient-to-r from-rose-600 to-red-600 text-white text-[11px] font-black px-3 py-1 rounded-xl shadow-md uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" />
                -{discountPercentage}% DE DESCONTO
              </div>
            )}

            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Original
            </div>

            {/* Setas de navegação */}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Miniaturas de rolagem */}
          {gallery.length > 1 && (
            <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1 no-scrollbar justify-center">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeImageIndex === idx ? "scale-105 shadow-md" : "opacity-60 hover:opacity-100"
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

        {/* 4. PRIMEIRA CAIXA DE OFERTA PRINCIPAL */}
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

        {/* 5. GATILHOS DE CONFIANÇA EXPRESSOS EM 3 COLUNAS */}
        <div className={`w-full p-3.5 rounded-2xl border my-2 grid grid-cols-3 gap-2 text-center ${
          isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200/90 shadow-2xs"
        }`}>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-1">
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-[10.5px] font-bold block leading-tight">Envio Rápido</span>
            <span className="text-[9px] text-slate-400">Com Rastreio</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-1">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[10.5px] font-bold block leading-tight">Garantia Total</span>
            <span className="text-[9px] text-slate-400">Satisfação 100%</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-[10.5px] font-bold block leading-tight">PIX ou Cartão</span>
            <span className="text-[9px] text-slate-400">Sem Burocracia</span>
          </div>
        </div>

        {/* 6. BENEFÍCIOS EXCLUSIVOS DO PRODUTO */}
        <div className={`w-full p-4 rounded-2xl border my-2 text-left ${
          isDark ? "bg-slate-900/70 border-slate-800" : "bg-white border-slate-200/90 shadow-2xs"
        }`}>
          <h3 className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5 text-slate-400">
            <Sparkles className="w-3.5 h-3.5" style={{ color: mainColor }} />
            Por que escolher este produto:
          </h3>
          <div className="space-y-2.5">
            {displayBenefits.map((item, idx) => {
              const text = typeof item === "string" ? item : item.text;
              const iconKey = typeof item === "object" && item.icon ? item.icon : benefits_icon || "check";
              const IconComp = getBenefitIconComponent(iconKey);

              return (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${mainColor}18`, color: mainColor }}
                  >
                    <IconComp className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className={`font-semibold leading-relaxed ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7. DESCRIÇÃO DO PRODUTO */}
        {description && description.trim() && (
          <div className={`w-full p-4 rounded-2xl border my-2 text-left ${
            isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200/90 shadow-2xs"
          }`}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-2 text-slate-400">
              Detalhes do Produto
            </h3>
            <div className={`text-[12.5px] leading-relaxed whitespace-pre-line ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              {description}
            </div>
          </div>
        )}

        {/* 8. SEGUNDA CAIXA DE OFERTA / REFORÇO FINAL */}
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

        {/* 10. FAQ DINÂMICO COM EXPANSÃO */}
        <div className="w-full my-2 space-y-2 text-left">
          <h3 className="text-xs font-black uppercase tracking-wider px-1 text-slate-400">
            Perguntas Frequentes
          </h3>
          {DEFAULT_FAQ.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-xl border transition-colors overflow-hidden ${
                  isDark ? "bg-slate-900/70 border-slate-800" : "bg-white border-slate-200/90 shadow-2xs"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full py-3 px-3.5 flex items-center justify-between text-left gap-2 cursor-pointer font-bold text-xs"
                >
                  <span className={isDark ? "text-slate-200" : "text-slate-900"}>{faq.q}</span>
                  <span className="text-slate-400 shrink-0">
                    {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </span>
                </button>
                {isOpen && (
                  <div className={`px-3.5 pb-3 text-xs leading-relaxed border-t pt-2 ${
                    isDark ? "text-slate-400 border-slate-800/80" : "text-slate-600 border-slate-100"
                  }`}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Rodapé institucional com segurança */}
        <div className="w-full text-center mt-6 pt-4 border-t border-slate-800/60 text-[11px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-400">{company_name}</p>
          <p>Atendimento oficial de vendas e suporte via WhatsApp.</p>
          <div className="flex items-center justify-center gap-2 pt-1 text-[10px] text-emerald-500">
            <Lock className="w-3 h-3" />
            <span>Ambiente 100% Protegido & Verificado</span>
          </div>
        </div>
      </div>

      {/* 11. BARRA FLUTUANTE INFERIOR QUANDO NENHUM CTA ESTIVER VISÍVEL NA TELA */}
      <div
        className={`${
          isInsideMockup ? "sticky bottom-0" : "fixed bottom-0"
        } left-0 right-0 z-40 p-3 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-2xl transition-all duration-300 transform ${
          isAnyCtaVisible
            ? "translate-y-full opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100 pointer-events-auto"
        }`}
      >
        <div className={`w-full ${isInsideMockup ? "max-w-full" : "max-w-[450px]"} mx-auto flex items-center justify-between gap-3`}>
          <div className="text-left shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">
              Por Apenas
            </span>
            <span className="text-[19px] font-black leading-tight" style={{ color: mainColor }}>
              {formatBRL(currentFinalPrice)}
            </span>
          </div>

          <button
            type="button"
            onClick={onBuyClick}
            className={`flex-1 py-3 px-4 rounded-xl text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap ${animationClass}`}
            style={{ backgroundColor: mainColor }}
          >
            <span className="truncate">{cta_text || "Comprar no WhatsApp"}</span>
            <CtaIcon className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
