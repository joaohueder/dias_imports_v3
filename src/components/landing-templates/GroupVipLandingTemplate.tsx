"use client";

import React from "react";
import {
  Users2,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Star,
  Lock,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { FONT_OPTIONS, getFontFamilyCss, getFontTitleFamilyCss } from "./fontOptions";

export interface GroupLandingPreviewData {
  title: string;
  headline: string;
  subheadline: string;
  badge_text: string;
  cover_image?: string;
  logo_url?: string;
  layout_color: string;
  layout_theme: "light" | "dark";
  layout_font?: string;
  form_button_text: string;
  benefits: string[];
  testimonials: Array<{ name: string; comment: string; stars: number }>;
  testimonials_enabled?: boolean;
  social_proof_count: number;
  company_name?: string;
  onSimulateSubmit?: (name: string, whatsapp: string) => void;
  previewMode?: boolean;
}

export function GroupVipLandingTemplate({
  title,
  headline,
  subheadline,
  badge_text,
  cover_image,
  logo_url,
  layout_color = "#6366f1",
  layout_theme = "dark",
  layout_font = "plusjakarta_inter",
  form_button_text = "Entrar no Grupo VIP Grátis",
  benefits = [],
  testimonials = [],
  testimonials_enabled = true,
  social_proof_count = 847,
  company_name = "JH7 Marketing",
  onSimulateSubmit,
  previewMode = false,
}: GroupLandingPreviewData) {
  const [name, setName] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const isDark = layout_theme === "dark";
  const bgClass = isDark ? "bg-[#070b14] text-slate-100" : "bg-[#f8fafc] text-slate-900";
  const cardBgClass = isDark ? "bg-[#0c1222]/90 border-slate-800/80 shadow-2xl" : "bg-white border-slate-200/90 shadow-xl";
  const textMutedClass = isDark ? "text-slate-300" : "text-slate-700";
  const textHeadingClass = isDark ? "text-white" : "text-slate-950";
  const inputBgClass = isDark ? "bg-slate-900/90 border-slate-800 text-white placeholder-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white";

  const bodyFontStyle = { fontFamily: getFontFamilyCss(layout_font) };
  const titleFontStyle = { fontFamily: getFontTitleFamilyCss(layout_font) };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.substring(0, 11);
    if (val.length <= 2) {
      setWhatsapp(val ? `(${val}` : "");
    } else if (val.length <= 6) {
      setWhatsapp(`(${val.substring(0, 2)}) ${val.substring(2)}`);
    } else if (val.length <= 10) {
      setWhatsapp(`(${val.substring(0, 2)}) ${val.substring(2, 6)}-${val.substring(6)}`);
    } else {
      setWhatsapp(`(${val.substring(0, 2)}) ${val.substring(2, 7)}-${val.substring(7, 11)}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || whatsapp.replace(/\D/g, "").length < 10) {
      alert("Preencha seu Nome e WhatsApp completo para continuar.");
      return;
    }
    setSubmitting(true);
    if (onSimulateSubmit) {
      onSimulateSubmit(name, whatsapp);
    }
    setSubmitting(false);
  };

  return (
    <div
      style={bodyFontStyle}
      className={`min-h-full w-full ${bgClass} relative transition-colors duration-300 pb-12`}
    >
      {/* GLOW DECORATIVO DE FUNDO */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 rounded-full blur-[110px] opacity-25 pointer-events-none"
        style={{ backgroundColor: layout_color }}
      />

      {/* CABEÇALHO / LOGO */}
      <header className="relative z-10 pt-6 pb-4 px-4 text-center flex flex-col items-center">
        {logo_url ? (
          <img src={logo_url} alt={company_name} className="h-10 sm:h-12 object-contain mx-auto mb-2 drop-shadow-md" />
        ) : (
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md mb-2 border ${isDark ? "bg-slate-800/60 border-slate-700/60 text-slate-200" : "bg-white/90 border-slate-300 text-slate-800 shadow-sm"}`}>
            <Users2 className="w-3.5 h-3.5" style={{ color: layout_color }} />
            <span className="text-[11px] font-bold tracking-wide uppercase">{company_name}</span>
          </div>
        )}

        {/* BADGE DE IMPACTO / URGÊNCIA */}
        {badge_text && (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase border shadow-sm my-2 animate-pulse"
            style={{
              backgroundColor: `${layout_color}18`,
              borderColor: `${layout_color}50`,
              color: layout_color,
            }}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>{badge_text}</span>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <main className="relative z-10 max-w-xl mx-auto px-4 space-y-6">
        {/* TÍTULO PRINCIPAL E HEADLINE */}
        <div className="text-center space-y-2">
          <h1
            style={titleFontStyle}
            className={`text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight ${textHeadingClass}`}
          >
            {headline || "Receba ofertas secretas e novidades em primeira mão!"}
          </h1>
          {subheadline && (
            <p className={`text-xs sm:text-sm font-medium ${textMutedClass} max-w-md mx-auto leading-relaxed`}>
              {subheadline}
            </p>
          )}
        </div>

        {/* IMAGEM DE CAPA (OPCIONAL) */}
        {cover_image && (
          <div className="relative rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl">
            <img src={cover_image} alt="Capa VIP" className="w-full h-48 sm:h-56 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-bold">
              <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                <Users2 className="w-3.5 h-3.5" style={{ color: layout_color }} />
                <span>Comunidade VIP</span>
              </span>
              <span className="bg-emerald-500/90 text-white text-[10px] px-2 py-0.5 rounded-md font-mono">
                100% Gratuito
              </span>
            </div>
          </div>
        )}

        {/* CARD FORMULÁRIO DE CAPTURA (ALTA CONVERSÃO) */}
        <div className={`rounded-2xl border p-5 sm:p-6 backdrop-blur-xl relative overflow-hidden ${cardBgClass}`}>
          {/* Faixa decorativa no topo do card */}
          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: layout_color }} />

          <div className="text-center mb-5 space-y-1">
            <h2
              style={titleFontStyle}
              className={`text-base sm:text-lg font-extrabold flex items-center justify-center gap-2 ${textHeadingClass}`}
            >
              <Sparkles className="w-4 h-4" style={{ color: layout_color }} />
              <span>Garantir Minha Vaga VIP</span>
            </h2>
            <p className={`text-[11px] sm:text-xs font-medium ${textMutedClass}`}>
              Preencha para receber o link exclusivo de acesso direto:
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                <span>Seu Nome Completo:</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 transition-all ${inputBgClass}`}
                style={{ ["--tw-ring-color" as any]: `${layout_color}60` }}
              />
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-bold flex items-center justify-between ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                <span>Seu WhatsApp (com DDD):</span>
                <span className={`text-[10px] font-mono flex items-center gap-1 ${isDark ? "text-emerald-400" : "text-emerald-600 font-bold"}`}>
                  <Lock className="w-2.5 h-2.5" /> 100% Seguro
                </span>
              </label>
              <input
                type="tel"
                required
                placeholder="(00) 00000-0000"
                value={whatsapp}
                onChange={handlePhoneChange}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 transition-all ${inputBgClass}`}
                style={{ ["--tw-ring-color" as any]: `${layout_color}60` }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-xl font-extrabold text-xs sm:text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: layout_color,
                boxShadow: `0 10px 25px -5px ${layout_color}50`,
              }}
            >
              <span>{submitting ? "Liberando seu acesso..." : form_button_text}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            {/* SELO DE PRIVACIDADE */}
            <div className={`flex items-center justify-center gap-1.5 text-[10px] font-medium pt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              <ShieldCheck className={`w-3.5 h-3.5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
              <span>Seus dados estão protegidos. Não enviamos spam.</span>
            </div>
          </form>
        </div>

        {/* BENEFÍCIOS DO GRUPO */}
        {benefits && benefits.length > 0 && (
          <div className={`rounded-2xl border p-5 sm:p-6 space-y-3.5 ${cardBgClass}`}>
            <h3
              style={titleFontStyle}
              className={`text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${textHeadingClass}`}
            >
              <CheckCircle2 className={`w-4 h-4 ${isDark ? "text-emerald-400" : "text-emerald-600"} shrink-0`} />
              <span>O que você vai receber no grupo:</span>
            </h3>

            <div className="space-y-2.5 pt-1">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${layout_color}25`, color: layout_color }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className={`font-semibold leading-tight ${isDark ? "text-slate-200" : "text-slate-800"}`}>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DEPOIMENTOS / AVALIAÇÕES */}
        {testimonials_enabled && testimonials && testimonials.length > 0 && (
          <div className="space-y-3">
            <h3
              style={titleFontStyle}
              className={`text-xs font-bold uppercase tracking-wider text-center ${isDark ? "text-slate-400" : "text-slate-700"}`}
            >
              Quem já participa recomenda
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {testimonials.map((testi, idx) => (
                <div key={idx} className={`p-4 rounded-xl border space-y-2 ${cardBgClass}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>{testi.name}</span>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(testi.stars || 5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                  </div>
                  <p className={`text-[11px] italic leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700 font-medium"}`}>
                    &quot;{testi.comment}&quot;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RODAPÉ INSTITUCIONAL DA EMPRESA */}
        <footer className={`pt-6 pb-2 text-center space-y-2 border-t ${isDark ? "border-slate-800/80 text-slate-400" : "border-slate-200 text-slate-600"}`}>
          <div className="flex items-center justify-center gap-2">
            <Users2 className="w-3.5 h-3.5" style={{ color: layout_color }} />
            <span className={`text-xs font-bold tracking-wide uppercase ${isDark ? "text-slate-200" : "text-slate-800"}`}>
              {company_name}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed max-w-sm mx-auto">
            Comunidade e canal oficial de ofertas exclusivas, lançamentos antecipados e suporte direto.
          </p>
          <div className="flex items-center justify-center gap-3 text-[10px] opacity-75 pt-1">
            <span>© {new Date().getFullYear()} {company_name}</span>
            <span>•</span>
            <span>Todos os direitos reservados</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
