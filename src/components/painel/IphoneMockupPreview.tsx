"use client";

import React from "react";
import Image from "next/image";
import {
  Wifi,
  Battery,
  ChevronLeft,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  CheckCheck,
  ImageIcon,
} from "lucide-react";

interface ProductPreviewData {
  name?: string;
  description?: string;
  price?: number | string;
  promo_price?: number | string | null;
  slug?: string;
  id?: number | string;
  headline?: string;
  cover_image?: string | null;
}

interface IphoneMockupPreviewProps {
  content: string;
  senderName?: string;
  time?: string;
  compact?: boolean;
  imageUrl?: string;
  replaceVariablesWithGeneric?: boolean;
  product?: ProductPreviewData | null;
  companyName?: string;
}

// Formata número como moeda BRL
function formatMoneyBrl(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  if (isNaN(num)) return String(value);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Calcula % de desconto
function calculateDiscountPct(price: number | string | null | undefined, promoPrice: number | string | null | undefined): string {
  const p = typeof price === "number" ? price : parseFloat(String(price || 0).replace(",", "."));
  const pp = typeof promoPrice === "number" ? promoPrice : parseFloat(String(promoPrice || 0).replace(",", "."));
  if (!p || !pp || pp >= p) return "0%";
  const pct = Math.round(((p - pp) / p) * 100);
  return `${pct}%`;
}

// Substitui tags dinâmicas por dados do produto selecionado ou fictícios/genéricos para exibição realista
function fillTemplateVariables(text: string, product?: ProductPreviewData | null, companyName?: string): string {
  if (!text) return "";

  const resolvedCompany = companyName || "Dias Imports";

  if (product && product.name) {
    const pName = product.name;
    const pDesc = product.description || "Descrição completa do produto com alta qualidade e garantia de satisfação.";
    const pDe = product.price ? formatMoneyBrl(product.price) : "R$ 299,90";
    const pPor = product.promo_price ? formatMoneyBrl(product.promo_price) : pDe;
    const pDescPct = calculateDiscountPct(product.price, product.promo_price);
    const pLink = product.slug
      ? `https://diasimports.com/p/${product.slug}`
      : product.id
      ? `https://diasimports.com/p/${product.id}`
      : "https://diasimports.com/p/oferta";
    const pHeadline = product.headline || "SUPER OFERTA EXCLUSIVA DE HOJE!";

    return text
      .replace(/\{nome_produto\}/g, pName)
      .replace(/\{descricao_produto\}/g, pDesc)
      .replace(/\{descricao\}/g, pDesc)
      .replace(/\{preco_de\}/g, pDe)
      .replace(/\{preco_por\}/g, pPor)
      .replace(/\{desconto_pct\}/g, pDescPct)
      .replace(/\{link_produto\}/g, pLink)
      .replace(/\{headline\}/g, pHeadline)
      .replace(/\{nome_empresa\}/g, resolvedCompany);
  }

  return text
    .replace(/\{nome_produto\}/g, "Fone Bluetooth Pro Max Sem Fio")
    .replace(/\{descricao_produto\}/g, "Cancelamento de ruído ativo de última geração, bateria de 40h de duração e som ultra nítido.")
    .replace(/\{descricao\}/g, "Cancelamento de ruído ativo de última geração, bateria de 40h de duração e som ultra nítido.")
    .replace(/\{preco_de\}/g, "R$ 299,90")
    .replace(/\{preco_por\}/g, "R$ 149,90")
    .replace(/\{desconto_pct\}/g, "50%")
    .replace(/\{link_produto\}/g, "https://diasimports.com/p/fone-pro-max")
    .replace(/\{headline\}/g, "SUPER OFERTA EXCLUSIVA DE HOJE!")
    .replace(/\{nome_empresa\}/g, resolvedCompany);
}

// Converte marcação do WhatsApp (*bold*, _italic_, ~strike~, `mono`) para JSX seguro
function formatWhatsAppText(text: string) {
  if (!text) return "";

  // Divide por quebras de linha primeiro
  const lines = text.split("\n");

  return lines.map((line, lineIndex) => {
    // Processamento básico de formatadores inline
    let parts: React.ReactNode[] = [line];

    // *bold*
    const renderStyled = (str: string): React.ReactNode => {
      // Regex para negrito *texto*
      const boldRegex = /\*([^*]+)\*/g;
      const italicRegex = /_([^_]+)_/g;
      const strikeRegex = /~([^~]+)~/g;

      // Substituição simples por spans
      const tokens: React.ReactNode[] = [];
      let lastIndex = 0;

      // Regex composto
      const combinedRegex = /(\*[^*]+\*|_([^_]+)_|~[^~]+~)/g;
      let match;

      while ((match = combinedRegex.exec(str)) !== null) {
        if (match.index > lastIndex) {
          tokens.push(str.substring(lastIndex, match.index));
        }

        const raw = match[0];
        if (raw.startsWith("*") && raw.endsWith("*")) {
          tokens.push(
            <strong key={`${lineIndex}-${match.index}`} className="font-bold text-white">
              {raw.slice(1, -1)}
            </strong>
          );
        } else if (raw.startsWith("_") && raw.endsWith("_")) {
          tokens.push(
            <em key={`${lineIndex}-${match.index}`} className="italic text-emerald-200/90">
              {raw.slice(1, -1)}
            </em>
          );
        } else if (raw.startsWith("~") && raw.endsWith("~")) {
          tokens.push(
            <s key={`${lineIndex}-${match.index}`} className="line-through text-slate-400">
              {raw.slice(1, -1)}
            </s>
          );
        }

        lastIndex = combinedRegex.lastIndex;
      }

      if (lastIndex < str.length) {
        tokens.push(str.substring(lastIndex));
      }

      return tokens.length > 0 ? tokens : str;
    };

    return (
      <React.Fragment key={lineIndex}>
        {renderStyled(line)}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export function IphoneMockupPreview({
  content,
  senderName = "JH7 Marketing",
  time = "10:45",
  compact = false,
  imageUrl,
  replaceVariablesWithGeneric = true,
  product = null,
  companyName,
}: IphoneMockupPreviewProps) {
  const displayContent = replaceVariablesWithGeneric
    ? fillTemplateVariables(content, product, companyName || senderName)
    : content;

  // Imagem resolvida: preferência para imagem do produto selecionado se existir, senão fallback
  const resolvedImageUrl =
    imageUrl !== undefined
      ? imageUrl
      : product?.cover_image ||
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60";

  return (
    <div
      className={`relative mx-auto bg-[#0a0a0c] border-[6px] border-[#2d2f36] rounded-[42px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col transition-all select-none ${
        compact ? "w-full max-w-[320px] sm:max-w-[340px] h-[500px]" : "w-full max-w-[360px] h-[560px]"
      }`}
      style={{
        boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 25px 60px -15px rgba(0, 0, 0, 0.9)",
      }}
    >
      {/* BOTÕES LATERAIS DECORATIVOS NO FRAME */}
      <div className="absolute -left-[8px] top-20 w-[3px] h-6 bg-[#4a4d57] rounded-l-sm" />
      <div className="absolute -left-[8px] top-30 w-[3px] h-10 bg-[#4a4d57] rounded-l-sm" />
      <div className="absolute -left-[8px] top-44 w-[3px] h-10 bg-[#4a4d57] rounded-l-sm" />
      <div className="absolute -right-[8px] top-24 w-[3px] h-14 bg-[#4a4d57] rounded-r-sm" />

      {/* DYNAMIC ISLAND DO IPHONE 15 PRO */}
      <div className="relative pt-2 pb-1 px-5 flex items-center justify-between z-30 bg-[#0e1621] text-white">
        {/* Relógio superior */}
        <span className="text-[10px] font-bold tracking-tight text-slate-300">9:41</span>

        {/* Dynamic Island pílula */}
        <div className="w-18 h-3.5 bg-black rounded-full flex items-center justify-end px-1.5 gap-1 border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1c2438]" />
          <div className="w-1 h-1 rounded-full bg-[#0d5f3a]" />
        </div>

        {/* Ícones de sinal, wifi e bateria */}
        <div className="flex items-center gap-1 text-slate-300">
          <Wifi className="w-2.5 h-2.5" />
          <Battery className="w-3 h-3 text-slate-200 fill-slate-200" />
        </div>
      </div>

      {/* CABEÇALHO DO WHATSAPP */}
      <div className="bg-[#1f2c34] px-3 py-2 flex items-center justify-between border-b border-[#2a3942] z-20">
        <div className="flex items-center gap-1.5">
          <ChevronLeft className="w-4 h-4 text-[#00a884] -ml-1 cursor-pointer" />
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
            {senderName.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-white text-[11px] font-semibold tracking-tight truncate max-w-[120px]">
              {senderName}
            </span>
            <span className="text-[9px] text-[#00a884] font-medium leading-none">online</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#aebac1]">
          <Video className="w-3.5 h-3.5" />
          <Phone className="w-3.5 h-3.5" />
          <MoreVertical className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* WALLPAPER E CHAT BODY */}
      <div
        className="flex-1 p-2.5 overflow-y-auto flex flex-col justify-start space-y-2 relative whatsapp-scrollbar"
        style={{
          backgroundColor: "#0b141a",
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 0)`,
          backgroundSize: "16px 16px",
        }}
      >
        {/* BALÃO DE MENSAGEM DO WHATSAPP COM FOTO + LEGENDA */}
        <div className="self-end w-full max-w-[96%] bg-[#005c4b] text-white rounded-2xl rounded-tr-xs p-1.5 shadow-md relative group border border-[#005c4b]/50 animate-in fade-in zoom-in-95 duration-200">
          {/* IMAGEM DA OFERTA (FOTO DO PRODUTO) */}
          {resolvedImageUrl && (
            <div className="relative w-full h-44 sm:h-48 rounded-xl overflow-hidden bg-slate-900 mb-1.5 border border-emerald-950/40 shrink-0">
              <img
                src={resolvedImageUrl}
                alt="Produto"
                className="w-full h-full object-cover block"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60";
                }}
              />
            </div>
          )}

          {/* LEGENDA / TEXTO DA MENSAGEM */}
          <div className="px-1.5 pb-1">
            <div className="text-[11px] leading-relaxed text-slate-100 font-sans break-words whitespace-pre-wrap">
              {formatWhatsAppText(displayContent || "Sua mensagem aparecerá aqui...")}
            </div>

            {/* HORA E DUPLO CHECK AZUL */}
            <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-emerald-200/70 font-medium">
              <span>{time}</span>
              <CheckCheck className="w-3 h-3 text-[#53bdeb]" />
            </div>
          </div>
        </div>
      </div>

      {/* BARRA INFERIOR DE INPUT DO WHATSAPP */}
      <div className="bg-[#1f2c34] px-2.5 py-1.5 flex items-center gap-1.5 border-t border-[#2a3942] z-20">
        <Smile className="w-4 h-4 text-[#8696a0]" />
        <Paperclip className="w-4 h-4 text-[#8696a0]" />
        <div className="flex-1 bg-[#2a3942] rounded-2xl px-3 py-1 text-[10px] text-[#8696a0] truncate">
          Mensagem
        </div>
        <div className="w-6 h-6 rounded-full bg-[#00a884] flex items-center justify-center text-slate-950">
          <Mic className="w-3.5 h-3.5 fill-current" />
        </div>
      </div>

      {/* HOME BAR DO IPHONE */}
      <div className="bg-[#0e1621] py-1 flex items-center justify-center">
        <div className="w-24 h-1 bg-slate-500 rounded-full" />
      </div>
    </div>
  );
}
