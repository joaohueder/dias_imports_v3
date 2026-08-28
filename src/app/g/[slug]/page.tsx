"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Users2,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  ExternalLink,
  MessageCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { GroupVipLandingTemplate } from "@/components/landing-templates/GroupVipLandingTemplate";
import { MetaPixel, trackMetaLead } from "@/components/MetaPixel";

export default function PublicGroupLandingPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";

  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorCompany, setErrorCompany] = useState<string | null>(null);

  // Estados do Modal de Confirmação & Convite
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState<{
    title: string;
    description: string;
    buttonText: string;
    inviteLink: string;
  }>({
    title: "Tudo pronto! 🎉",
    description: "Seu acesso ao Grupo VIP foi liberado.",
    buttonText: "Acessar Grupo VIP no WhatsApp",
    inviteLink: "https://chat.whatsapp.com/",
  });

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/grupos/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.landing_page) {
          setPageData(data.landing_page);
        } else {
          setError(true);
          if (data.error_code) {
            setErrorCode(data.error_code);
          }
          if (data.company_name) {
            setErrorCompany(data.company_name);
          }
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleLeadSubmit = async (name: string, whatsapp: string) => {
    try {
      const res = await fetch(`/api/public/grupos/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, whatsapp }),
      });

      const json = await res.json();
      if (json.success) {
        // Dispara evento no Meta Pixel do navegador se ativo
        trackMetaLead(pageData?.id, pageData?.title || "Grupo VIP", 0);

        setModalInfo({
          title: json.modal_title || pageData?.modal_title || "Tudo pronto! 🎉",
          description: json.modal_description || pageData?.modal_description || "Seu acesso ao Grupo VIP foi liberado com sucesso. Clique abaixo para entrar no WhatsApp:",
          buttonText: json.modal_button_text || pageData?.modal_button_text || "Acessar Grupo VIP no WhatsApp",
          inviteLink: json.invite_link || pageData?.invite_link || "https://chat.whatsapp.com/",
        });
        setIsModalOpen(true);
      } else {
        if (json.error_code === "LIMITE_LEAD") {
          setErrorCode("LIMITE_LEAD");
          setError(true);
        } else {
          alert(json.message || "Não foi possível registrar seu acesso. Tente novamente.");
        }
      }
    } catch {
      alert("Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-9 h-9 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-300 tracking-wide animate-pulse">Carregando convite VIP...</p>
      </div>
    );
  }

  // TELA AMIGÁVEL E ANIMADA DE CONVITE ENCERRADO TEMPORARIAMENTE (LIMITE_LEAD)
  if (error && errorCode === "LIMITE_LEAD") {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
        {/* Glows Decorativos de Fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-lg bg-[#0c1222]/95 border border-slate-800/80 rounded-3xl p-6 sm:p-10 text-center shadow-2xl shadow-black/80 backdrop-blur-xl space-y-6 animate-in zoom-in-95 fade-in duration-300">
          {/* Header da Empresa */}
          {errorCompany && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-semibold text-slate-300">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{errorCompany}</span>
            </div>
          )}

          {/* Ícone Animado com Radar */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <span className="absolute inset-0 rounded-3xl bg-amber-500/20 animate-ping pointer-events-none opacity-75" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/30">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>
          </div>

          {/* Textos Principais */}
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Vagas Temporariamente Encerradas</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Convite Encerrado Temporariamente
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              Agradecemos imensamente o seu interesse! As vagas para entrada neste Grupo VIP atingiram a cota máxima de participantes para esta etapa.
            </p>
          </div>

          {/* Card de Informação Amigável */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Novas vagas podem ser abertas em breve</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Estamos organizando a estrutura do grupo para garantir a melhor experiência para todos os membros. Fique atento às nossas comunicações para novas aberturas.
            </p>
          </div>

          {/* Rodapé com Código do Erro */}
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono">
            <AlertCircle className="w-3 h-3 text-slate-600" />
            <span>Código de Referência:</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-bold text-amber-400/90 tracking-wider">
              LIMITE_LEAD
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-300 p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
          <Users2 className="w-8 h-8" />
        </div>
        <h1 className="text-lg font-bold text-white mb-1">Página Não Encontrada</h1>
        <p className="text-xs text-slate-400 max-w-sm mb-4">
          O link deste grupo VIP pode estar expirado, pausado ou temporariamente indisponível.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Script do Meta Pixel se configurado */}
      <MetaPixel
        pixelId={pageData.meta_pixel_id}
        isActive={pageData.meta_pixel_active}
        productId={pageData.id}
        productName={pageData.title || "Grupo VIP"}
        price={0}
      />

      {/* Template da Landing Page */}
      <GroupVipLandingTemplate
        title={pageData.title}
        headline={pageData.headline}
        subheadline={pageData.subheadline}
        badge_text={pageData.badge_text}
        cover_image={pageData.cover_image}
        logo_url={pageData.logo_url}
        layout_color={pageData.layout_color}
        layout_theme={pageData.layout_theme}
        layout_font={pageData.layout_font}
        form_button_text={pageData.form_button_text}
        benefits={pageData.benefits}
        testimonials={pageData.testimonials}
        testimonials_enabled={pageData.testimonials_enabled !== false}
        social_proof_count={pageData.social_proof_count}
        company_name={pageData.company_name}
        onSimulateSubmit={handleLeadSubmit}
      />

      {/* MODAL DE CONFIRMAÇÃO & ENTRADA NO GRUPO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#0c1222] border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-5 animate-scaleUp">
            {/* Glow decorativo */}
            <div
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-[60px] opacity-40 pointer-events-none"
              style={{ backgroundColor: pageData.layout_color || "#6366f1" }}
            />

            {/* Ícone Animado */}
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <MessageCircle className="w-8 h-8" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-slate-950">
                <Sparkles className="w-3 h-3 fill-current" />
              </div>
            </div>

            {/* Textos do Modal */}
            <div className="space-y-2 relative z-10">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {modalInfo.title}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {modalInfo.description}
              </p>
            </div>

            {/* Botão de Ação: Abrir link do Grupo WhatsApp */}
            <div className="pt-2 relative z-10 space-y-3">
              <a
                href={modalInfo.inviteLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 px-6 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{
                  backgroundColor: pageData.layout_color || "#22c55e",
                  boxShadow: `0 10px 25px -5px ${pageData.layout_color || "#22c55e"}60`,
                }}
              >
                <span>{modalInfo.buttonText}</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <p className="text-[10px] text-slate-500">
                Você será redirecionado para o aplicativo do WhatsApp.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
