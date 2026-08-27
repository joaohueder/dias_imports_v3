import React from "react";
import {
  ArrowRight,
  Info,
  User,
  CreditCard,
  DollarSign,
  ShieldCheck,
  Zap,
  Truck,
  Sparkles,
  Lock,
  Clock,
  ThumbsUp,
  CheckCircle2,
  Gift,
  Flame,
  Star,
  ShoppingBag,
  HeartHandshake,
} from "lucide-react";

export interface OfferBoxStyleOption {
  id: string;
  name: string;
  desc: string;
  tag: string;
}

export const OFFER_BOX_MODELS: OfferBoxStyleOption[] = [
  {
    id: "model_1",
    name: "Modelo 1 • Três Pilares Limpos",
    desc: "Cards individuais com micro-ícones arredondados, fundo suave e 3 colunas compactas.",
    tag: "Padrão Fashion",
  },
  {
    id: "model_2",
    name: "Modelo 2 • Faixa de Confiança & Segurança",
    desc: "Visual de selo de autenticidade com borda de destaque, checkmark e ênfase em compra protegida.",
    tag: "Segurança Total",
  },
  {
    id: "model_3",
    name: "Modelo 3 • Urgência & Destaque Comercial",
    desc: "Faixa de economia com badge de queima de estoque e cronômetro de atendimento prioritário.",
    tag: "Alta Conversão",
  },
  {
    id: "model_4",
    name: "Modelo 4 • Minimalista VIP & Sofisticado",
    desc: "Bordas finas, tipografia elegante, micro-selos em linha e foco total no valor e botão de ação.",
    tag: "Minimalista",
  },
  {
    id: "model_5",
    name: "Modelo 5 • Garantia Blindada & PIX Direto",
    desc: "Caixa de destaque duplo para chave PIX/cartão + garantia incondicional com selo de escudo.",
    tag: "Garantia Forte",
  },
  {
    id: "model_6",
    name: "Modelo 6 • Atendimento WhatsApp Humanizado",
    desc: "Foco no atendimento direto com foto/avatar de consultor, tempo médio de resposta e zero burocracia.",
    tag: "Atendimento VIP",
  },
];

interface OfferBoxProps {
  modelId?: string;
  isDark: boolean;
  mainColor: string;
  price: number;
  promo_price?: number | null;
  hasDiscount: boolean;
  discountAmount: number;
  discountPercentage: number | null;
  currentFinalPrice: number;
  formatBRL: (val: number) => string;
  cta_text?: string;
  company_name?: string;
  onBuyClick?: () => void;
  ctaCardRef?: React.RefObject<HTMLDivElement | null>;
}

export const OfferBox: React.FC<OfferBoxProps> = ({
  modelId = "model_1",
  isDark,
  mainColor,
  price,
  promo_price,
  hasDiscount,
  discountAmount,
  discountPercentage,
  currentFinalPrice,
  formatBRL,
  cta_text,
  company_name = "Dias Imports",
  onBuyClick,
  ctaCardRef,
}) => {
  // RENDERIZAÇÃO POR MODELO ESCOLHIDO

  // -------------------------------------------------------------
  // MODELO 1: Três Pilares Limpos (Clássico Fashion Clean)
  // -------------------------------------------------------------
  if (modelId === "model_1") {
    return (
      <div
        ref={ctaCardRef}
        className={`w-full rounded-[22px] p-5 sm:p-6 border mb-6 relative overflow-hidden transition-all duration-200 ${
          isDark
            ? "bg-slate-900 border-slate-800 shadow-[0_12px_36px_rgba(0,0,0,0.5)]"
            : "bg-white border-[#EDE7EC] shadow-[0_12px_36px_rgba(40,15,30,0.07)]"
        }`}
      >
        {/* Header do Preço */}
        <div className="text-left mb-4">
          <span className={`text-[11px] font-bold font-serif tracking-wider uppercase block mb-2 ${isDark ? "text-slate-400" : "text-slate-400"}`}>
            PREÇO DE HOJE
          </span>

          <div className="flex items-center gap-2.5 flex-wrap">
            {hasDiscount && (
              <span className="text-[13px] text-slate-400 line-through font-medium">
                {formatBRL(price)}
              </span>
            )}
            <span
              className="text-[30px] sm:text-[34px] font-black tracking-tight leading-none"
              style={{ color: mainColor }}
            >
              {formatBRL(currentFinalPrice)}
            </span>

            {hasDiscount && discountPercentage && discountPercentage > 0 && (
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-current/10"
                style={{
                  backgroundColor: `${mainColor}18`,
                  color: mainColor,
                }}
              >
                {discountPercentage}% OFF
              </span>
            )}
          </div>

          {hasDiscount && discountAmount > 0 && (
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-rose-500 mt-2.5">
              <span>❤️</span>
              <span>Você economiza {formatBRL(discountAmount)} neste preço</span>
            </div>
          )}
        </div>

        {/* Botão Principal CTA */}
        <button
          type="button"
          onClick={onBuyClick}
          className="w-full py-3.5 px-5 rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm transition-all duration-200 active:scale-[0.99] cursor-pointer hover:brightness-95 hover:shadow-md"
          style={{ backgroundColor: mainColor }}
        >
          <span>{cta_text || "Quero aproveitar agora"}</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className={`flex items-center justify-center gap-1.5 text-[11px] mt-3 ${isDark ? "text-slate-400" : "text-slate-400"}`}>
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Tire dúvidas no WhatsApp antes de fechar.</span>
        </div>

        {/* 3 Mini Benefícios em Coluna Tripla */}
        <div className={`mt-5 pt-4 border-t grid grid-cols-3 gap-2 text-center ${isDark ? "border-slate-800" : "border-[#F2ECF1]"}`}>
          <div className={`flex flex-col items-center p-2 rounded-xl border ${isDark ? "bg-slate-950/60 border-slate-800/80" : "bg-slate-50/60 border-slate-100/80"}`}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center mb-1.5 shadow-2xs"
              style={{ backgroundColor: `${mainColor}20`, color: mainColor }}
            >
              <User className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <h5 className={`text-[11px] font-bold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Atendimento humano
            </h5>
            <p className={`text-[9px] leading-tight mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Você fala com {company_name || "a loja"}, não com robô
            </p>
          </div>

          <div className={`flex flex-col items-center p-2 rounded-xl border ${isDark ? "bg-slate-950/60 border-slate-800/80" : "bg-slate-50/60 border-slate-100/80"}`}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center mb-1.5 shadow-2xs"
              style={{ backgroundColor: `${mainColor}20`, color: mainColor }}
            >
              <CreditCard className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <h5 className={`text-[11px] font-bold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Sem cadastro
            </h5>
            <p className={`text-[9px] leading-tight mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Nenhum formulário, nenhuma senha
            </p>
          </div>

          <div className={`flex flex-col items-center p-2 rounded-xl border ${isDark ? "bg-slate-950/60 border-slate-800/80" : "bg-slate-50/60 border-slate-100/80"}`}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center mb-1.5 shadow-2xs"
              style={{ backgroundColor: `${mainColor}20`, color: mainColor }}
            >
              <DollarSign className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <h5 className={`text-[11px] font-bold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Preço fechado
            </h5>
            <p className={`text-[9px] leading-tight mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Confirmando na conversa antes de pagar
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MODELO 2: Faixa de Confiança & Segurança Blindada
  // -------------------------------------------------------------
  if (modelId === "model_2") {
    return (
      <div
        ref={ctaCardRef}
        className={`w-full rounded-[24px] p-5 sm:p-6 border-2 mb-6 relative overflow-hidden transition-all duration-200 ${
          isDark
            ? "bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800 shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
            : "bg-gradient-to-b from-white to-slate-50/70 border-emerald-500/30 shadow-[0_16px_40px_rgba(16,185,129,0.08)]"
        }`}
      >
        {/* Badge Flutuante de Compra 100% Segura */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-dashed border-emerald-500/25">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
            <span className="text-[11px] font-bold tracking-tight text-emerald-600 dark:text-emerald-400 uppercase">
              Compra Verificada & Segura
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
            ESTOQUE PRONTO
          </span>
        </div>

        {/* Preço com Destaque Central */}
        <div className="text-center my-3">
          {hasDiscount && (
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[13px] text-slate-400 line-through">De {formatBRL(price)}</span>
              {discountPercentage && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                  -{discountPercentage}%
                </span>
              )}
            </div>
          )}

          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Por apenas</span>
            <span className="text-[34px] sm:text-[38px] font-black tracking-tight leading-none" style={{ color: mainColor }}>
              {formatBRL(currentFinalPrice)}
            </span>
          </div>

          {hasDiscount && discountAmount > 0 && (
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1.5">
              Economia real garantida de {formatBRL(discountAmount)}
            </p>
          )}
        </div>

        {/* Botão CTA com Efeito de Destaque */}
        <div className="mt-4">
          <button
            type="button"
            onClick={onBuyClick}
            className="w-full py-4 px-5 rounded-2xl text-white font-extrabold text-[15px] flex items-center justify-center gap-2.5 shadow-lg transition-all duration-200 active:scale-[0.99] cursor-pointer hover:brightness-105"
            style={{ backgroundColor: mainColor }}
          >
            <span>{cta_text || "Garantir no Preço Promocional"}</span>
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Linha de Garantias com Ícones Horizontais */}
        <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800 space-y-2 text-left">
          <div className="flex items-center gap-2.5 text-[11.5px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className={isDark ? "text-slate-300" : "text-slate-700"}>
              Pagamento combinado diretamente no WhatsApp com {company_name}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[11.5px]">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className={isDark ? "text-slate-300" : "text-slate-700"}>
              Conversa segura e atendimento 100% humano
            </span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MODELO 3: Urgência & Destaque Comercial (Queima de Oferta)
  // -------------------------------------------------------------
  if (modelId === "model_3") {
    return (
      <div
        ref={ctaCardRef}
        className={`w-full rounded-[24px] p-5 border-2 mb-6 relative overflow-hidden transition-all duration-200 ${
          isDark
            ? "bg-slate-900 border-rose-500/40 shadow-[0_16px_40px_rgba(244,63,94,0.15)]"
            : "bg-white border-rose-500/40 shadow-[0_16px_40px_rgba(244,63,94,0.12)]"
        }`}
      >
        {/* Banner Superior de Urgência */}
        <div
          className="w-full -mt-5 -mx-5 px-5 py-2 mb-4 flex items-center justify-between text-white text-[11px] font-black uppercase tracking-wider"
          style={{ backgroundColor: mainColor }}
        >
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 fill-amber-300 text-amber-300 animate-pulse" />
            <span>Condição Exclusiva</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Poucas Unidades</span>
          </div>
        </div>

        {/* Caixa de Preço Impactante */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              VALOR PROMOCIONAL
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] sm:text-[36px] font-black leading-none" style={{ color: mainColor }}>
                {formatBRL(currentFinalPrice)}
              </span>
            </div>
            {hasDiscount && (
              <span className="text-[12px] text-slate-400 line-through">
                Preço normal: {formatBRL(price)}
              </span>
            )}
          </div>

          {hasDiscount && discountPercentage && (
            <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-center shrink-0">
              <span className="text-[18px] font-black leading-none">-{discountPercentage}%</span>
              <span className="text-[9px] font-bold tracking-tight uppercase mt-0.5">DESCONTO</span>
            </div>
          )}
        </div>

        {/* Botão CTA com Animação e Contraste Máximo */}
        <button
          type="button"
          onClick={onBuyClick}
          className="w-full py-4 px-5 rounded-xl text-white font-black text-[15px] flex items-center justify-center gap-2 shadow-lg transition-all duration-200 active:scale-[0.99] cursor-pointer hover:brightness-95 uppercase tracking-wide"
          style={{ backgroundColor: mainColor }}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>{cta_text || "Reservar Minha Oferta Agora"}</span>
        </button>

        {/* Faixa Inferior de Informações */}
        <div className="mt-3.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Qualidade Garantida
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            Suporte via WhatsApp
          </span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MODELO 4: Minimalista VIP & Sofisticado
  // -------------------------------------------------------------
  if (modelId === "model_4") {
    return (
      <div
        ref={ctaCardRef}
        className={`w-full rounded-[26px] p-6 sm:p-7 border mb-6 text-center transition-all duration-200 ${
          isDark
            ? "bg-slate-950 border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
            : "bg-white border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
        }`}
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-700/40 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Edição Especial
        </div>

        <h4 className={`text-[13px] font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          Adquira com condições exclusivas direto com nossa equipe
        </h4>

        <div className="my-4">
          {hasDiscount && (
            <p className="text-[13px] text-slate-400 line-through mb-1">
              De {formatBRL(price)}
            </p>
          )}
          <h2 className="text-[38px] sm:text-[42px] font-serif font-black tracking-tight leading-none" style={{ color: mainColor }}>
            {formatBRL(currentFinalPrice)}
          </h2>
          {hasDiscount && discountAmount > 0 && (
            <p className="text-[11px] font-medium text-emerald-500 mt-2">
              Economize {formatBRL(discountAmount)} hoje
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onBuyClick}
          className="w-full py-4 px-6 rounded-full text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer hover:opacity-90 tracking-wide"
          style={{ backgroundColor: mainColor }}
        >
          <span>{cta_text || "Falar com Consultor no WhatsApp"}</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        <p className="text-[10.5px] text-slate-400 mt-3 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Atendimento personalizado • Sem taxas ocultas
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MODELO 5: Garantia Blindada & PIX Direto
  // -------------------------------------------------------------
  if (modelId === "model_5") {
    return (
      <div
        ref={ctaCardRef}
        className={`w-full rounded-[22px] p-5 sm:p-6 border mb-6 relative overflow-hidden transition-all duration-200 ${
          isDark
            ? "bg-slate-900/90 border-slate-800 shadow-[0_12px_36px_rgba(0,0,0,0.5)]"
            : "bg-white border-[#EDE7EC] shadow-[0_12px_36px_rgba(40,15,30,0.07)]"
        }`}
      >
        {/* Bloco 1: Garantia e Segurança */}
        <div className={`flex items-start gap-3 p-3 rounded-2xl border mb-4 ${
          isDark ? "bg-slate-950/70 border-slate-800" : "bg-emerald-50/60 border-emerald-100"
        }`}>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h5 className="text-[12px] font-bold text-emerald-700 dark:text-emerald-400">
              Garantia & Procedência
            </h5>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight mt-0.5">
              Receba exatamente o que comprou ou seu dinheiro de volta na hora.
            </p>
          </div>
        </div>

        {/* Preço e Oferta */}
        <div className="text-left mb-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Preço à vista no PIX</span>
            {discountPercentage && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500">
                {discountPercentage}% DE DESCONTO
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[32px] sm:text-[36px] font-black tracking-tight" style={{ color: mainColor }}>
              {formatBRL(currentFinalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-[13px] text-slate-400 line-through">
                {formatBRL(price)}
              </span>
            )}
          </div>
        </div>

        {/* Botão de Ação */}
        <button
          type="button"
          onClick={onBuyClick}
          className="w-full py-3.5 px-5 rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm transition-all duration-200 active:scale-[0.99] cursor-pointer hover:brightness-95"
          style={{ backgroundColor: mainColor }}
        >
          <CreditCard className="w-4 h-4" />
          <span>{cta_text || "Pagar com Desconto no WhatsApp"}</span>
        </button>

        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-center text-[10.5px] font-medium text-slate-600 dark:text-slate-300">
          <div className="flex items-center justify-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Confirmação Imediata</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Compra Segura</span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MODELO 6: Atendimento WhatsApp Humanizado (Consultor VIP)
  // -------------------------------------------------------------
  return (
    <div
      ref={ctaCardRef}
      className={`w-full rounded-[24px] p-5 sm:p-6 border mb-6 relative overflow-hidden transition-all duration-200 ${
        isDark
          ? "bg-slate-900 border-slate-800 shadow-[0_12px_36px_rgba(0,0,0,0.5)]"
          : "bg-white border-[#EDE7EC] shadow-[0_12px_36px_rgba(40,15,30,0.07)]"
      }`}
    >
      {/* Box do Atendente / Consultor */}
      <div className={`p-3 rounded-2xl border mb-4 flex items-center gap-3 ${
        isDark ? "bg-slate-950/70 border-slate-800" : "bg-purple-50/50 border-purple-100"
      }`}>
        <div className="relative shrink-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
            style={{ backgroundColor: mainColor }}
          >
            <User className="w-5 h-5" />
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <h5 className={`text-[12px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Consultor {company_name}
            </h5>
            <span className="text-[9px] font-semibold text-emerald-500 font-mono">ONLINE AGORA</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
            Tempo médio de resposta: menos de 2 minutos
          </p>
        </div>
      </div>

      {/* Preço Especial */}
      <div className="text-left mb-4">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Condição Negociada
        </span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-[32px] sm:text-[36px] font-black tracking-tight" style={{ color: mainColor }}>
            {formatBRL(currentFinalPrice)}
          </span>
          {hasDiscount && (
            <span className="text-[13px] text-slate-400 line-through">
              {formatBRL(price)}
            </span>
          )}
        </div>
      </div>

      {/* Botão de Contato Direto */}
      <button
        type="button"
        onClick={onBuyClick}
        className="w-full py-3.5 px-5 rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm transition-all duration-200 active:scale-[0.99] cursor-pointer hover:brightness-95"
        style={{ backgroundColor: mainColor }}
      >
        <HeartHandshake className="w-4 h-4" />
        <span>{cta_text || "Chamar no WhatsApp"}</span>
      </button>

      <div className="mt-3.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>Negocie direto com nossa equipe pelo WhatsApp.</span>
      </div>
    </div>
  );
};
