"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Check,
  Plus,
  Minus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Info,
  User,
  CreditCard,
  DollarSign,
  Flame,
} from "lucide-react";
import { getBenefitIconComponent } from "./benefitIcons";
import { OfferBox } from "./OfferBox";
import { getCtaIconComponent, getCtaAnimationClass } from "./ctaOptions";
import { getFontFamilyCss, getFontTitleFamilyCss } from "./fontOptions";

export interface BenefitItem {
  text: string;
  icon?: string;
}

export interface TemplateProductProps {
  id?: number;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  promo_price?: number | null;
  images: string[];
  cover_image?: string;
  layout_color?: string;
  layout_theme?: string;
  layout_font?: string;
  cta_text?: string;
  cta_icon?: string;
  cta_animation?: string;
  headline?: string;
  guarantee_text?: string;
  benefits?: (string | BenefitItem)[];
  benefits_icon?: string;
  offer_box_style?: string;
  external_link?: string;
  company_name?: string;
  company_city?: string;
  company_state?: string;
  target_whatsapp?: string;
  onBuyClick?: () => void;
  isInsideMockup?: boolean;
}

const DEFAULT_FAQ = [
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
    a: "Você será atendido diretamente por um especialista da nossa equipe com suporte humano e dedicado.",
  },
  {
    q: "E se eu ficar com dúvida antes de decidir?",
    a: "Fique tranquilo! Ao chamar no WhatsApp você pode tirar dúvidas de tamanho, fotos adicionais, formas de envio e pagamento antes de concluir qualquer compra.",
  },
];

export const Modelo1Template: React.FC<TemplateProductProps> = ({
  name,
  description,
  price,
  promo_price,
  images = [],
  cover_image,
  layout_color = "#991b53",
  layout_theme = "light",
  layout_font = "sans_modern",
  cta_text = "Quero aproveitar agora",
  cta_icon = "arrow-right",
  cta_animation = "none",
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
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [mouseStartX, setMouseStartX] = useState<number | null>(null);

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
  const currentImage = gallery[activeImageIndex] || cover_image || "";

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
    if (!touchStartX || !touchEndX || gallery.length <= 1) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      handleNextImage();
    } else if (distance < -minSwipeDistance) {
      handlePrevImage();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setIsMouseDown(true);
    setMouseStartX(e.clientX);
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDown || mouseStartX === null || gallery.length <= 1) {
      setIsMouseDown(false);
      setMouseStartX(null);
      return;
    }
    const distance = mouseStartX - e.clientX;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      handleNextImage();
    } else if (distance < -minSwipeDistance) {
      handlePrevImage();
    }
    setIsMouseDown(false);
    setMouseStartX(null);
  };

  const onMouseLeave = () => {
    setIsMouseDown(false);
    setMouseStartX(null);
  };

  const hasDiscount = Boolean(promo_price && price > promo_price);
  const discountAmount = hasDiscount && promo_price ? price - promo_price : 0;
  const discountPercentage = hasDiscount && promo_price ? Math.round(((price - promo_price) / price) * 100) : null;

  const currentFinalPrice = hasDiscount && promo_price ? promo_price : price;

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const defaultBenefitsList = [
    `Entrega rápida em ${company_city || "sua região"} e região`,
    "Embalagem reforçada para o transporte",
    "Pagamento no PIX ou cartão",
  ];

  const displayBenefits = benefits && benefits.length > 0 ? benefits : defaultBenefitsList;

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const mainColor = layout_color || "#991b53";
  const isDark = layout_theme === "dark";
  const fontFamilyStyle = { fontFamily: getFontFamilyCss(layout_font) };
  const titleFontStyle = { fontFamily: getFontTitleFamilyCss(layout_font) };

  return (
    <div
      ref={containerRef}
      style={fontFamilyStyle}
      className={`w-full antialiased transition-colors duration-200 ${
        isDark ? "bg-[#0c0d12] text-slate-100 selection:bg-slate-800" : "bg-[#FDF8FC] text-slate-900 selection:bg-pink-100"
      } ${isInsideMockup ? "text-[13px]" : "min-h-screen"}`}
    >
      {/* Container Central Estreito com visual minimalista de moda */}
      <div className={`w-full ${isInsideMockup ? "px-3 pt-3 pb-2" : "max-w-[430px] mx-auto px-4 pt-8 pb-16"} flex flex-col items-center`}>
        
        {/* 1. BADGE SUPERIOR DE DESCONTO */}
        {discountPercentage ? (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border mb-3.5"
            style={{
              backgroundColor: `${mainColor}18`,
              borderColor: `${mainColor}35`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: mainColor }}></span>
            <span className="text-[11px] font-bold tracking-tight uppercase" style={{ color: mainColor }}>
              {discountPercentage}% DE DESCONTO
            </span>
          </div>
        ) : (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border mb-3.5"
            style={{
              backgroundColor: `${mainColor}18`,
              borderColor: `${mainColor}35`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: mainColor }}></span>
            <span className="text-[11px] font-bold tracking-tight uppercase" style={{ color: mainColor }}>
              OFERTA EXCLUSIVA
            </span>
          </div>
        )}

        {/* 2. HEADLINE PRINCIPAL (NOME DO PRODUTO) */}
        <h1
          style={titleFontStyle}
          className={`text-center ${isInsideMockup ? "text-[22px]" : "text-[26px] sm:text-[28px]"} font-black tracking-tight ${isDark ? "text-white" : "text-slate-950"} uppercase leading-snug px-1`}
        >
          {name || "Produto Sem Nome"}
        </h1>

        {/* 3. DETALHE HORIZONTAL */}
        <div
          className="w-7 h-[2.5px] rounded-full my-3.5"
          style={{ backgroundColor: mainColor }}
        ></div>

        {/* 4. GALERIA PRINCIPAL COM TOUCH / SWIPE & TRANSIÇÃO SUAVE */}
        <div className="w-full relative mb-3">
          <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            className={`w-full aspect-square rounded-[18px] overflow-hidden relative shadow-sm group select-none cursor-grab active:cursor-grabbing border ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-[#EDE7EC]"
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
                  <div key={idx} className={`w-full h-full shrink-0 relative ${isDark ? "bg-slate-900" : "bg-slate-100"}`}>
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
              <div className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${isDark ? "bg-slate-900 text-slate-500" : "bg-slate-100 text-slate-400"}`}>
                <span className="text-xs font-medium">Sem imagem principal</span>
              </div>
            )}

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
                  aria-label="Imagem anterior"
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
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="w-4 h-4 -mr-0.5" />
                </button>
              </>
            )}

            {/* Badge Circular de Desconto (Canto Superior Esquerdo) */}
            {discountPercentage && (
              <div
                className="absolute top-3.5 left-3.5 w-12 h-12 rounded-full text-white flex flex-col items-center justify-center shadow-md leading-none border border-white/40 select-none"
                style={{ backgroundColor: mainColor }}
              >
                <span className="text-[12px] font-extrabold tracking-tighter">-{discountPercentage}%</span>
                <span className="text-[9px] font-bold tracking-tight uppercase mt-0.5">OFF</span>
              </div>
            )}

            {/* Contador de Imagens (Canto Inferior Direito) */}
            {gallery.length > 0 && (
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold tracking-wide select-none">
                {activeImageIndex + 1}/{gallery.length}
              </div>
            )}
          </div>
        </div>

        {/* 6. MINIATURAS HORIZONTAIS */}
        {gallery.length > 1 && (
          <div className="w-full flex items-center gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
            {gallery.map((img, idx) => {
              const isSelected = activeImageIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-12 h-12 rounded-xl shrink-0 overflow-hidden border-2 transition-all cursor-pointer ${
                    isDark ? "bg-slate-900" : "bg-slate-50"
                  } ${
                    isSelected ? "ring-2 ring-offset-1 ring-offset-transparent" : isDark ? "border-slate-800 opacity-60 hover:opacity-100" : "border-slate-200/80 opacity-70 hover:opacity-100"
                  }`}
                  style={{
                    borderColor: isSelected ? mainColor : undefined,
                  }}
                >
                  <img src={img} alt={`${name} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        )}

        {/* 7. BLOCO DE BENEFÍCIOS RÁPIDOS */}
        <div className={`w-full rounded-[14px] border overflow-hidden mb-6 shadow-xs ${isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-[#EDE7EC]"}`}>
          {displayBenefits.map((item, idx) => {
            const benefitText = typeof item === "string" ? item : item?.text || "";
            const itemIconKey = typeof item === "object" && item?.icon ? item.icon : benefits_icon;
            const IconComp = getBenefitIconComponent(itemIconKey);

            return (
              <div
                key={idx}
                className={`px-4 py-3 flex items-center gap-3 ${
                  idx > 0 ? (isDark ? "border-t border-slate-800/80" : "border-t border-[#F2ECF1]") : ""
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${mainColor}20`, color: mainColor }}
                >
                  <IconComp className="w-3 h-3 stroke-[3]" />
                </div>
                <span className={`text-[12.5px] font-medium leading-tight ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  {benefitText}
                </span>
              </div>
            );
          })}
        </div>

        {/* 8. SEÇÃO "SOBRE O PRODUTO" */}
        {description && (
          <div className="w-full text-left mb-6 px-1">
            <h2 className={`font-serif text-[17px] font-bold mb-2 ${isDark ? "text-white" : "text-slate-950"}`}>
              Sobre o produto
            </h2>
            <div className={`text-[13px] leading-relaxed whitespace-pre-line space-y-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              {description}
            </div>
          </div>
        )}

        {/* 9. CARD PRINCIPAL DE PREÇO E CONVERSÃO (QUADRO DE OFERTAS DINÂMICO) */}
        <OfferBox
          ctaCardRef={ctaCard1Ref}
          modelId={offer_box_style || "model_1"}
          isDark={isDark}
          mainColor={mainColor}
          price={price}
          promo_price={promo_price}
          hasDiscount={hasDiscount}
          discountAmount={discountAmount}
          discountPercentage={discountPercentage}
          currentFinalPrice={currentFinalPrice}
          formatBRL={formatBRL}
          cta_text={cta_text}
          cta_icon={cta_icon}
          cta_animation={cta_animation}
          company_name={company_name}
          onBuyClick={onBuyClick}
        />

        {/* 10. SEÇÃO "ANTES DE FECHAR" / FAQ ACCORDION */}
        <div className="w-full text-left mb-6">
          <h2 className={`font-serif text-[17px] font-bold mb-3 px-1 ${isDark ? "text-white" : "text-slate-950"}`}>
            Antes de fechar
          </h2>

          <div className="space-y-2">
            {DEFAULT_FAQ.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`w-full rounded-xl border overflow-hidden transition-all duration-200 ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-[#EDE7EC]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer gap-2"
                  >
                    <span className={`text-[12.5px] font-semibold leading-tight ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                      {faq.q}
                    </span>
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold"
                      style={{ color: mainColor }}
                    >
                      {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className={`px-4 pb-3.5 pt-0 text-[12px] leading-relaxed border-t ${
                      isDark ? "text-slate-400 border-slate-800/80" : "text-slate-600 border-[#F7F2F6]"
                    }`}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 11. CARD FINAL DE CONVERSÃO */}
        <div
          ref={ctaCard2Ref}
          className={`w-full rounded-[20px] p-5 border mb-8 ${
            isDark ? "bg-slate-900 border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.4)]" : "bg-white border-[#EDE7EC] shadow-[0_10px_30px_rgba(40,15,30,0.04)]"
          }`}
        >
          <h3 className={`font-serif text-[16px] font-bold mb-3 text-left ${isDark ? "text-white" : "text-slate-950"}`}>
            Fechar pedido pelo WhatsApp
          </h3>

          <div className="flex items-baseline gap-2 flex-wrap mb-3.5">
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through font-medium">
                {formatBRL(price)}
              </span>
            )}
            <span
              className="text-[26px] font-black tracking-tight leading-none"
              style={{ color: mainColor }}
            >
              {formatBRL(currentFinalPrice)}
            </span>

            {hasDiscount && discountAmount > 0 && (
              <span
                className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${mainColor}20`,
                  color: mainColor,
                }}
              >
                economize {formatBRL(discountAmount)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onBuyClick}
            className={`w-full py-3 px-4 rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm transition-all duration-200 active:scale-[0.99] cursor-pointer hover:brightness-95 mb-2.5 ${getCtaAnimationClass(cta_animation)}`}
            style={{ backgroundColor: mainColor }}
          >
            <span>{cta_text || "Quero aproveitar agora"}</span>
            {React.createElement(getCtaIconComponent(cta_icon), { className: "w-4 h-4" })}
          </button>

          <p className={`text-center text-[11px] leading-tight ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            A conversa abre com o produto e o preço já escritos. Você só confirma.
          </p>
        </div>

        {/* 12. RODAPÉ INSTITUCIONAL */}
        <div className={`w-full text-center pt-2 pb-2 border-t text-slate-500 space-y-1.5 ${isDark ? "border-slate-800 text-slate-400" : "border-[#EDE7EC]/60"}`}>
          <h4 className={`text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            {company_name || "Dias Imports"}
          </h4>
          <p className="text-[11px]">
            {company_city ? `${company_city} - ${company_state || "SP"}` : "Brasil"}
          </p>
          <div className={`text-[10px] leading-tight pt-1 max-w-xs mx-auto space-y-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            <p>Atendimento e pedidos pelo WhatsApp.</p>
            <p>Imagens meramente ilustrativas.</p>
            <p>Preço promocional válido para compra feita por esta página.</p>
          </div>
        </div>

      </div>

      {/* 13. BARRA FIXA INFERIOR STICKY COM OCULTAÇÃO INTELIGENTE SE HOUVER CTA VISÍVEL */}
      <div
        className={`${
          isInsideMockup ? "sticky bottom-0" : "fixed bottom-0"
        } left-0 right-0 z-40 backdrop-blur-md border-t py-2.5 px-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 transform ${
          isDark ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-[#EDE7EC]"
        } ${
          isAnyCtaVisible
            ? "translate-y-full opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100 pointer-events-auto"
        }`}
      >
        <div className={`w-full ${isInsideMockup ? "max-w-full" : "max-w-[430px]"} mx-auto flex items-center justify-between gap-2.5`}>
          <div className="flex flex-col text-left shrink-0">
            {hasDiscount && (
              <span className="text-[9.5px] text-slate-400 line-through leading-tight">
                {formatBRL(price)}
              </span>
            )}
            <span
              className="text-[15px] font-black tracking-tight leading-none"
              style={{ color: mainColor }}
            >
              {formatBRL(currentFinalPrice)}
            </span>
          </div>

          <button
            type="button"
            onClick={onBuyClick}
            className={`flex-1 py-2 px-3 rounded-lg text-white font-bold text-[12px] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs hover:brightness-95 whitespace-nowrap ${getCtaAnimationClass(cta_animation)}`}
            style={{ backgroundColor: mainColor }}
          >
            <span>{cta_text || "Quero aproveitar agora"}</span>
            {React.createElement(getCtaIconComponent(cta_icon), { className: "w-3.5 h-3.5 shrink-0" })}
          </button>
        </div>
      </div>
    </div>
  );
};
