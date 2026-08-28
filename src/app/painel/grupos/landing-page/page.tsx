"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Users2,
  Sparkles,
  Smartphone,
  ExternalLink,
  Save,
  RefreshCw,
  Zap,
  ShieldCheck,
  Palette,
  FileText,
  Pipette,
  Sun,
  Moon,
  Type,
  Plus,
  Trash2,
  CheckCircle2,
  Star,
  MessageCircle,
  Eye,
  UserCheck,
  Link2,
} from "lucide-react";
import { PainelLayoutClient } from "@/components/painel/PainelLayoutClient";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { FloatingActionBar } from "@/components/ui/FloatingActionBar";
import { GroupVipLandingTemplate } from "@/components/landing-templates/GroupVipLandingTemplate";
import { FONT_OPTIONS } from "@/components/landing-templates/fontOptions";
import { BadgePickerModal } from "@/components/landing-templates/BadgePickerModal";
import { HeadlinePickerModal } from "@/components/landing-templates/HeadlinePickerModal";
import { CtaTextPickerModal } from "@/components/landing-templates/CtaTextPickerModal";
import { TestimonialPickerModal } from "@/components/landing-templates/TestimonialPickerModal";
import {
  HUMANIZED_TESTIMONIALS_POOL,
  getRandomTestimonials,
  TestimonialPreset,
} from "@/components/landing-templates/testimonialOptions";

interface GroupLandingSettings {
  id?: number;
  title: string;
  headline: string;
  subheadline: string;
  slug: string;
  badge_text: string;
  group_id: string | number;
  invite_link: string;
  cover_image: string;
  logo_url: string;
  layout_color: string;
  layout_theme: "light" | "dark";
  layout_font: string;
  form_button_text: string;
  benefits: string[];
  testimonials: string[]; // IDs dos depoimentos ativos selecionados
  testimonials_enabled: boolean;
  social_proof_count: number;
  modal_title: string;
  modal_description: string;
  modal_button_text: string;
  status: "active" | "inactive";
  views_count?: number;
  leads_count?: number;
}

interface WhatsAppGroupOption {
  id: number;
  name: string;
  invite_link?: string;
  participants_count: number;
}

const COLOR_PALETTES = [
  { id: "indigo", name: "Índigo Tech", hex: "#6366f1" },
  { id: "emerald", name: "Esmeralda", hex: "#10b981" },
  { id: "rose", name: "Vermelho Rubi", hex: "#e11d48" },
  { id: "amber", name: "Ouro Âmbar", hex: "#f59e0b" },
  { id: "violet", name: "Roxo Real", hex: "#8b5cf6" },
  { id: "cyan", name: "Ciano Neon", hex: "#06b6d4" },
];

export default function PainelLandingPageGrupoPage() {
  const { showSuccess, showError } = useFeedbackModal();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<WhatsAppGroupOption[]>([]);
  const [activeTab, setActiveTab] = useState<"conteudo" | "layout" | "modal">("conteudo");
  const [newBenefit, setNewBenefit] = useState("");

  const [initialData, setInitialData] = useState<GroupLandingSettings>({
    title: "Grupo VIP Exclusivo",
    headline: "Receba ofertas secretas e novidades em primeira mão!",
    subheadline: "Faça parte da nossa comunidade exclusiva no WhatsApp e tenha acesso a condições especiais que nunca postamos abertamente.",
    slug: "grupo-vip",
    badge_text: "⚡ ACESSO ANTECIPADO & EXCLUSIVO",
    group_id: "",
    invite_link: "https://chat.whatsapp.com/",
    cover_image: "",
    logo_url: "",
    layout_color: "#6366f1",
    layout_theme: "dark",
    layout_font: "plusjakarta_inter",
    form_button_text: "Entrar no Grupo VIP Grátis",
    benefits: [
      "Acesso antecipado aos melhores produtos e reposições",
      "Descontos e cupons relâmpago exclusivos para membros",
      "Atendimento prioritário e direto no WhatsApp",
      "100% gratuito e sem spam — apenas conteúdo VIP"
    ],
    testimonials: HUMANIZED_TESTIMONIALS_POOL.map((t) => t.id),
    testimonials_enabled: true,
    social_proof_count: 847,
    modal_title: "Tudo pronto! 🎉",
    modal_description: "Seu cadastro foi confirmado com sucesso. Clique no botão abaixo para ingressar diretamente no Grupo VIP no WhatsApp.",
    modal_button_text: "Acessar Grupo VIP no WhatsApp",
    status: "active",
  });

  const [formData, setFormData] = useState<GroupLandingSettings>(initialData);

  // Estados de simulação do Modal no Preview
  const [simulatedModalOpen, setSimulatedModalOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [headlineModalOpen, setHeadlineModalOpen] = useState(false);
  const [ctaModalOpen, setCtaModalOpen] = useState(false);
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [previewTestimonials, setPreviewTestimonials] = useState<TestimonialPreset[]>([]);

  useEffect(() => {
    setPreviewTestimonials(getRandomTestimonials(2, formData.testimonials));
  }, [formData.testimonials]);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/painel/landing-page-grupo");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.landing_page) {
          const lp = data.landing_page;
          const loaded: GroupLandingSettings = {
            id: lp.id,
            title: lp.title || "Grupo VIP Exclusivo",
            headline: lp.headline || "Receba ofertas secretas e novidades em primeira mão!",
            subheadline: lp.subheadline || "",
            slug: lp.slug || "grupo-vip",
            badge_text: lp.badge_text || "⚡ ACESSO ANTECIPADO",
            group_id: lp.group_id || "",
            invite_link: lp.invite_link || "https://chat.whatsapp.com/",
            cover_image: lp.cover_image || "",
            logo_url: lp.logo_url || "",
            layout_color: lp.layout_color || "#6366f1",
            layout_theme: lp.layout_theme || "dark",
            layout_font: lp.layout_font || "plusjakarta_inter",
            form_button_text: lp.form_button_text || "Entrar no Grupo VIP Grátis",
            benefits: Array.isArray(lp.benefits) ? lp.benefits : [],
            testimonials: Array.isArray(lp.testimonials) && lp.testimonials.length > 0 && typeof lp.testimonials[0] === "string"
              ? lp.testimonials
              : HUMANIZED_TESTIMONIALS_POOL.map((t) => t.id),
            testimonials_enabled: lp.testimonials_enabled !== false && lp.testimonials_enabled !== 0,
            social_proof_count: Number(lp.social_proof_count) || 847,
            modal_title: lp.modal_title || "Tudo pronto! 🎉",
            modal_description: lp.modal_description || "",
            modal_button_text: lp.modal_button_text || "Acessar Grupo VIP no WhatsApp",
            status: lp.status || "active",
            views_count: lp.views_count || 0,
            leads_count: lp.leads_count || 0,
          };
          setInitialData(loaded);
          setFormData(loaded);
        }
        if (data.groups) {
          setGroups(data.groups);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar configurações da Landing Page:", err);
      showError("Não foi possível carregar as configurações.", "Erro");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Identifica alterações pendentes
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const handleResetForm = () => {
    setFormData(initialData);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/painel/landing-page-grupo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setInitialData(formData);
        showSuccess(json.message || "Landing page do Grupo atualizada com sucesso!", "Salvo com Sucesso");
      } else {
        showError(json.message || "Erro ao salvar configurações.", "Falha ao Salvar");
      }
    } catch {
      showError("Ocorreu um erro ao comunicar com o servidor.", "Falha de Conexão");
    } finally {
      setSaving(false);
    }
  };

  const handleGroupSelect = (groupIdStr: string) => {
    const selected = groups.find((g) => String(g.id) === groupIdStr);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        group_id: selected.id,
        invite_link: selected.invite_link || prev.invite_link,
      }));
    } else {
      setFormData((prev) => ({ ...prev, group_id: "" }));
    }
  };

  const handleAddBenefit = () => {
    if (!newBenefit.trim()) return;
    setFormData((prev) => ({
      ...prev,
      benefits: [...prev.benefits, newBenefit.trim()],
    }));
    setNewBenefit("");
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  return (
    <PainelLayoutClient>
      <div className="space-y-6 pb-28">
        {/* CABEÇALHO UNIFICADO PADRÃO */}
        <div className="flex flex-col gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Landing Page do Grupo VIP
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Alta Conversão
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Página de captura otimizada para atrair pessoas para o seu grupo do WhatsApp através de Nome e Telefone.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 w-full pt-1">
            <a
              href={`/g/${formData.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all cursor-pointer shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Página Pública</span>
            </a>
          </div>
        </div>

        {/* ESTRUTURA 2 COLUNAS: ESQUERDA (CONFIGURAÇÕES) & DIREITA (PREVIEW REAL) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* COLUNA DA ESQUERDA: CONFIGURAÇÕES */}
          <div className="lg:col-span-7 space-y-6">
            {/* ABAS DE NAVEGAÇÃO INTERNA */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#090f1d]/90 border border-slate-800/80">
              <button
                type="button"
                onClick={() => setActiveTab("conteudo")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "conteudo"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Conteúdo & Textos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("layout")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "layout"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Cores & Design</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("modal")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "modal"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Modal de Convite</span>
              </button>
            </div>

            <form id="group-landing-form" onSubmit={handleSave} className="space-y-6">
              {/* ABA 1: CONTEÚDO E TEXTOS */}
              {activeTab === "conteudo" && (
                <div className="space-y-5 rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-5 sm:p-6">
                  {/* LINK DE CONVITE DO WHATSAPP */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Link de Convite do WhatsApp</span>
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://chat.whatsapp.com/..."
                      value={formData.invite_link}
                      onChange={(e) => setFormData({ ...formData, invite_link: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                    />
                  </div>

                  {/* SLUG DA PÁGINA */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                      <span>Link da Landing Page (Slug)</span>
                      <span className="text-[10px] text-slate-500 font-mono">/g/{formData.slug || "grupo-vip"}</span>
                    </label>
                    <div className="flex items-center rounded-xl bg-slate-900/90 border border-slate-800 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 overflow-hidden">
                      <span className="px-3 py-2.5 text-xs text-slate-500 bg-slate-950/60 border-r border-slate-800 select-none">
                        /g/
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="grupo-vip-promocoes"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-"),
                          })
                        }
                        className="w-full px-3 py-2.5 bg-transparent text-xs font-mono text-white placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* BADGE DE IMPACTO / URGÊNCIA */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200">
                        Badge de Chamada / Urgência
                      </label>
                      <button
                        type="button"
                        onClick={() => setBadgeModalOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded-lg border border-indigo-500/20 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>50 Modelos de Chamada</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Ex: ⚡ VAGAS LIMITADAS"
                      value={formData.badge_text}
                      onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  {/* HEADLINE PRINCIPAL */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200">
                        Headline Principal (Frase de Alto Impacto)
                      </label>
                      <button
                        type="button"
                        onClick={() => setHeadlineModalOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/20 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>50 Modelos de Headline</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Ex: Receba ofertas secretas, lançamentos e descontos antes de todo mundo!"
                      value={formData.headline}
                      onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>

                  {/* SUB-HEADLINE */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200">
                        Sub-Headline (Texto complementar persuasivo)
                      </label>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Ex: Faça parte da nossa comunidade exclusiva no WhatsApp e tenha acesso a condições especiais..."
                      value={formData.subheadline}
                      onChange={(e) => setFormData({ ...formData, subheadline: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>

                  {/* TEXTO DO BOTÃO DO FORMULÁRIO */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200">
                        Texto do Botão de Acesso (CTA)
                      </label>
                      <button
                        type="button"
                        onClick={() => setCtaModalOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/20 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>50 Modelos de CTA</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Ex: Quero Entrar no Grupo VIP Grátis"
                      value={formData.form_button_text}
                      onChange={(e) => setFormData({ ...formData, form_button_text: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  {/* LISTA DE BENEFÍCIOS */}
                  <div className="space-y-3 pt-3 border-t border-slate-800/80">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Benefícios e Vantagens do Grupo</span>
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Adicionar novo benefício (Ex: Sorteios semanais)..."
                        value={newBenefit}
                        onChange={(e) => setNewBenefit(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddBenefit();
                          }
                        }}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                      <button
                        type="button"
                        onClick={handleAddBenefit}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Adicionar</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formData.benefits.map((b, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-200"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span>{b}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveBenefit(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DEPOIMENTOS EDITÁVEIS */}
                  <div className="space-y-3 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span>Depoimentos / Avaliações dos Membros</span>
                        </label>
                        {/* SWITCH HABILITAR / DESABILITAR */}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, testimonials_enabled: !formData.testimonials_enabled })}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            formData.testimonials_enabled ? "bg-emerald-500" : "bg-slate-700"
                          }`}
                          title={formData.testimonials_enabled ? "Depoimentos habilitados" : "Depoimentos desabilitados"}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              formData.testimonials_enabled ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {formData.testimonials_enabled && (
                        <button
                          type="button"
                          onClick={() => setTestimonialModalOpen(true)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/20 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>150 Modelos</span>
                        </button>
                      )}
                    </div>

                    {!formData.testimonials_enabled ? (
                      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-500">
                        A seção de depoimentos está desabilitada e não será exibida na página pública do grupo.
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                        <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          Sorteio Automático Ativo
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          A página pública sorteia automaticamente 2 depoimentos aleatórios e humanizados entre a base de 150 modelos a cada acesso de visitante, gerando prova social autêntica e dinâmica.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA 2: LAYOUT, CORES E TEMA */}
              {activeTab === "layout" && (
                <div className="space-y-5 rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-5 sm:p-6">
                  {/* PALETA DE CORES */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-indigo-400" />
                      <span>Cor de Destaque & Botões</span>
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {COLOR_PALETTES.map((pal) => {
                        const isSelected = formData.layout_color === pal.hex;
                        return (
                          <button
                            key={pal.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, layout_color: pal.hex })}
                            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/30 text-white"
                                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <div
                              className="w-5 h-5 rounded-full shadow-inner border border-white/20 shrink-0"
                              style={{ backgroundColor: pal.hex }}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{pal.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{pal.hex}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* COR PERSONALIZADA */}
                    <div className="flex items-center gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <div className="relative shrink-0 flex items-center justify-center w-8 h-8">
                        <input
                          type="color"
                          value={formData.layout_color}
                          onChange={(e) => setFormData({ ...formData, layout_color: e.target.value })}
                          className="w-full h-full rounded-lg border-0 bg-transparent cursor-pointer p-0 opacity-0 absolute inset-0 z-10"
                        />
                        <div
                          className="w-full h-full rounded-lg shadow-inner border border-white/20"
                          style={{ backgroundColor: formData.layout_color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-[11px] font-bold text-slate-300">Cor Personalizada Hex:</label>
                        <input
                          type="text"
                          value={formData.layout_color}
                          onChange={(e) => setFormData({ ...formData, layout_color: e.target.value })}
                          className="w-full bg-transparent text-xs font-mono font-bold text-white uppercase focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* TEMA LIGHT OU DARK */}
                  <div className="space-y-3 pt-3 border-t border-slate-800/80">
                    <label className="text-xs font-bold text-slate-200">
                      Tema da Página
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, layout_theme: "dark" })}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          formData.layout_theme === "dark"
                            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/60 shadow-sm"
                            : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        <Moon className="w-4 h-4 text-indigo-400" />
                        <span>Dark Premium</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, layout_theme: "light" })}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          formData.layout_theme === "light"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm"
                            : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        <Sun className="w-4 h-4 text-amber-400" />
                        <span>Light Clean</span>
                      </button>
                    </div>
                  </div>

                  {/* TIPOGRAFIA */}
                  <div className="space-y-3 pt-3 border-t border-slate-800/80">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Type className="w-4 h-4 text-indigo-400" />
                      <span>Família Tipográfica</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {FONT_OPTIONS.map((f) => {
                        const isSelected = formData.layout_font === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, layout_font: f.id })}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? "bg-indigo-950/40 border-indigo-500 text-white ring-1 ring-indigo-500/30"
                                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <p className="text-xs font-bold">{f.name}</p>
                            <p className="text-[10px] text-slate-500">{f.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: MODAL DE CONVITE */}
              {activeTab === "modal" && (
                <div className="space-y-5 rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-5 sm:p-6">
                  <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Este modal aparece instantaneamente após a pessoa preencher Nome e WhatsApp</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Título do Modal
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Tudo pronto! 🎉"
                      value={formData.modal_title}
                      onChange={(e) => setFormData({ ...formData, modal_title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Descrição / Instrução de Entrada
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ex: Seu cadastro foi confirmado com sucesso. Clique no botão abaixo para ingressar diretamente no Grupo VIP no WhatsApp."
                      value={formData.modal_description}
                      onChange={(e) => setFormData({ ...formData, modal_description: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      Texto do Botão de Entrada no Grupo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Acessar Grupo VIP no WhatsApp"
                      value={formData.modal_button_text}
                      onChange={(e) => setFormData({ ...formData, modal_button_text: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSimulatedModalOpen(!simulatedModalOpen)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-800/80 hover:bg-indigo-900 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{simulatedModalOpen ? "Fechar Modal no Preview" : "Simular Abertura do Modal no Preview"}</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* COLUNA DA DIREITA: PREVIEW IPHONE 15 PRO MAX (STICKY) */}
          <div className="lg:col-span-5 flex flex-col items-center lg:sticky lg:top-20 z-20 self-start">
            <div className="flex items-center justify-between w-full max-w-[340px] mb-3 px-1">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                Preview em Tempo Real
              </span>
              <a
                href={`/g/${formData.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 px-2 py-0.5 rounded-full transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Abrir Página</span>
              </a>
            </div>

            {/* IPHONE 15 PRO MAX FRAME */}
            <div className="relative w-[320px] sm:w-[340px] h-[670px] max-h-[calc(100vh-120px)] rounded-[50px] bg-[#1e2330] p-[10px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(99,102,241,0.25)] border-4 border-slate-700/80 ring-1 ring-white/10 select-none">
              {/* Dynamic Island */}
              <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-40 flex items-center justify-between px-2.5 shadow-md pointer-events-none">
                <div className="w-3 h-3 rounded-full bg-[#111] border border-slate-800/80 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0a192f]"></div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#0d1117]"></div>
              </div>

              {/* Speaker Grill */}
              <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-800/90 rounded-full z-40 pointer-events-none"></div>

              {/* Screen Content */}
              <div className="w-full h-full rounded-[40px] overflow-hidden bg-[#070b14] text-slate-100 transition-colors font-sans antialiased relative flex flex-col">
                {/* Status Bar */}
                <div className={`pt-8 px-6 pb-2 flex items-center justify-between text-[11px] font-semibold shrink-0 z-30 transition-colors ${
                  formData.layout_theme === "dark" ? "bg-[#070b14] text-slate-400" : "bg-[#f8fafc] text-slate-500"
                }`}>
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-2 border border-current rounded-sm flex items-center p-0.5">
                      <div className="w-full h-full bg-current rounded-2xs"></div>
                    </div>
                  </div>
                </div>

                {/* Body Preview */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700/40 relative">
                  <GroupVipLandingTemplate
                    title={formData.title}
                    headline={formData.headline}
                    subheadline={formData.subheadline}
                    badge_text={formData.badge_text}
                    cover_image={formData.cover_image}
                    logo_url={formData.logo_url}
                    layout_color={formData.layout_color}
                    layout_theme={formData.layout_theme}
                    layout_font={formData.layout_font}
                    form_button_text={formData.form_button_text}
                    benefits={formData.benefits}
                    testimonials={previewTestimonials}
                    testimonials_enabled={formData.testimonials_enabled}
                    social_proof_count={formData.social_proof_count}
                    company_name="Sua Loja VIP"
                    onSimulateSubmit={() => setSimulatedModalOpen(true)}
                    previewMode={true}
                  />

                  {/* MODAL SIMULADO NO PREVIEW */}
                  {simulatedModalOpen && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fadeIn">
                      <div className="relative w-full bg-[#0c1222] border border-slate-800 rounded-3xl p-5 text-center shadow-2xl space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white mx-auto shadow-md">
                          <MessageCircle className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-white">
                          {formData.modal_title || "Tudo pronto! 🎉"}
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          {formData.modal_description || "Seu acesso ao Grupo VIP foi liberado."}
                        </p>
                        <button
                          type="button"
                          onClick={() => setSimulatedModalOpen(false)}
                          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white shadow-lg cursor-pointer"
                          style={{ backgroundColor: formData.layout_color }}
                        >
                          {formData.modal_button_text || "Acessar Grupo VIP"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BARRA FLUTUANTE DE SALVAR PADRÃO DO SISTEMA */}
        <FloatingActionBar
          isVisible={isDirty}
          isSubmitting={saving}
          onCancel={handleResetForm}
          formId="group-landing-form"
          saveLabel="Salvar Landing Page"
          savingLabel="Salvando Alterações..."
        />

        {/* MODAL DE SELEÇÃO DE 50 BADGES / CHAMADAS */}
        <BadgePickerModal
          isOpen={badgeModalOpen}
          onClose={() => setBadgeModalOpen(false)}
          selectedBadgeText={formData.badge_text}
          onSelectBadge={(text) => setFormData({ ...formData, badge_text: text })}
        />

        {/* MODAL DE SELEÇÃO DE 50 HEADLINES & SUB-HEADLINES */}
        <HeadlinePickerModal
          isOpen={headlineModalOpen}
          onClose={() => setHeadlineModalOpen(false)}
          selectedHeadlineText={formData.headline}
          selectedSubheadlineText={formData.subheadline}
          onSelectHeadline={(headline, subheadline) =>
            setFormData({
              ...formData,
              headline: headline,
              ...(subheadline ? { subheadline: subheadline } : {}),
            })
          }
        />

        {/* MODAL DE SELEÇÃO DE 50 CTAS / BOTÕES DE ACESSO */}
        <CtaTextPickerModal
          isOpen={ctaModalOpen}
          onClose={() => setCtaModalOpen(false)}
          selectedCtaText={formData.form_button_text}
          onSelectCta={(ctaText) =>
            setFormData({
              ...formData,
              form_button_text: ctaText,
            })
          }
        />

        {/* MODAL DE ATIVAÇÃO / INATIVAÇÃO DE 150 DEPOIMENTOS HUMANIZADOS */}
        <TestimonialPickerModal
          isOpen={testimonialModalOpen}
          onClose={() => setTestimonialModalOpen(false)}
          activeIds={formData.testimonials}
          onToggleActive={(id) => {
            const current = formData.testimonials || [];
            const exists = current.includes(id);
            const updated = exists ? current.filter((x) => x !== id) : [...current, id];
            setFormData({ ...formData, testimonials: updated });
          }}
          onSelectAll={() => {
            const allIds = HUMANIZED_TESTIMONIALS_POOL.map((t) => t.id);
            setFormData({ ...formData, testimonials: allIds });
          }}
          onDeselectAll={() => {
            setFormData({ ...formData, testimonials: [] });
          }}
        />
      </div>
    </PainelLayoutClient>
  );
}
