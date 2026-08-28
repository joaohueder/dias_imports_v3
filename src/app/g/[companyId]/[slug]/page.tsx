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

export default function PublicCompanyGroupLandingPage() {
  const params = useParams();
  const companyId = typeof params?.companyId === "string" ? params.companyId : Array.isArray(params?.companyId) ? params.companyId[0] : "";
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
    if (!companyId || !slug) return;
    fetch(`/api/public/grupos/${companyId}/${slug}`)
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
  }, [companyId, slug]);

  const handleLeadSubmit = async (name: string, whatsapp: string) => {
    try {
      const res = await fetch(`/api/public/grupos/${companyId}/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, whatsapp }),
      });
      const data = await res.json();

      if (data.success) {
        // Disparo no navegador para Meta Pixel Client-side
        if (pageData?.meta_pixel_active && pageData?.meta_pixel_id) {
          trackMetaLead(0);
        }

        setModalInfo({
          title: data.modal?.title || "Tudo pronto! 🎉",
          description: data.modal?.description || "Seu acesso ao Grupo VIP foi liberado.",
          buttonText: data.modal?.button_text || "Acessar Grupo VIP no WhatsApp",
          inviteLink: data.invite_link || pageData.invite_link,
        });
        setIsModalOpen(true);
      } else {
        alert(data.message || "Ocorreu um erro ao ingressar. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor. Tente novamente.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm font-medium animate-pulse tracking-wide text-slate-300">Carregando convite exclusivo...</p>
      </div>
    );
  }

  if (error || !pageData) {
    if (errorCode === "SUBSCRIPTION_INACTIVE") {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-400">
              <Clock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Convite Indisponível</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Esta página de convite do grupo VIP de <strong className="text-slate-200">{errorCompany || "nossa loja"}</strong> está temporariamente pausada para manutenção ou renovação de plano.
            </p>
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-500 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Por favor, volte a consultar mais tarde.</span>
            </div>
          </div>
        </div>
      );
    }

    if (errorCode === "LIMITE_LEAD") {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-400">
              <Users2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Vagas Esgotadas</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              O limite de cadastros para o grupo exclusivo de <strong className="text-slate-200">{errorCompany || "nossa loja"}</strong> foi atingido para esta campanha.
            </p>
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-500 flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              <span>Novas vagas poderão ser abertas em breve!</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-400">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link Expirado ou Inválido</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Não conseguimos encontrar esta página de grupo VIP. O link pode ter sido desativado ou alterado pelo administrador.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
          >
            Voltar ao Início
          </a>
        </div>
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

      {/* Renderizador do Template Real da Landing Page */}
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

      {/* Modal Moderno de Acesso ao Grupo WhatsApp */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/10 text-center overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 text-emerald-400 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-white tracking-tight mb-2">
              {modalInfo.title}
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6 font-normal">
              {modalInfo.description}
            </p>

            <div className="space-y-3">
              <a
                href={modalInfo.inviteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-base shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>{modalInfo.buttonText}</span>
                <ExternalLink className="w-4 h-4 opacity-70" />
              </a>

              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Acesso seguro via WhatsApp oficial
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
