"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Building2,
  Smartphone,
  MessageSquareQuote,
  Radio,
  Users2,
  Link2,
  Package,
  PartyPopper,
  ChevronRight,
  ChevronLeft,
  X,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Clock,
  Loader2,
  Check,
} from "lucide-react";

import { WizardStep1Company, WizardStep1Handle } from "./wizard-steps/WizardStep1Company";
import { WizardStep2Whatsapp } from "./wizard-steps/WizardStep2Whatsapp";
import { WizardStep3Templates } from "./wizard-steps/WizardStep3Templates";
import { WizardStep4MetaAds } from "./wizard-steps/WizardStep4MetaAds";
import { WizardStep5Groups } from "./wizard-steps/WizardStep5Groups";
import { WizardStep6LandingPage, WizardStep6Handle } from "./wizard-steps/WizardStep6LandingPage";
import { WizardStep7Product } from "./wizard-steps/WizardStep7Product";
import { WizardStep8Conclusion } from "./wizard-steps/WizardStep8Conclusion";

export interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
  onCompleted?: () => void;
}

interface StepConfig {
  number: number;
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  route: string;
  accentColor: string;
  bgGlow: string;
  buttonLabel: string;
  checklist: string[];
  tips: string[];
}

const ONBOARDING_STEPS: StepConfig[] = [
  {
    number: 1,
    id: "empresa",
    title: "Dados da Empresa",
    shortTitle: "Empresa",
    subtitle: "Identidade, Razão Social e WhatsApp de Contato",
    description: "Cadastre as informações da sua empresa, logotipo e o número do WhatsApp de administração para receber alertas de telemetria.",
    icon: Building2,
    route: "/painel/configuracoes/empresa",
    accentColor: "from-blue-500 to-indigo-500",
    bgGlow: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    buttonLabel: "Abrir Dados da Empresa",
    checklist: [
      "Razão Social e Nome Fantasia definidos",
      "CNPJ ou CPF cadastrado",
      "WhatsApp de administração preenchido",
      "Logotipo da marca adicionado",
    ],
    tips: [
      "O WhatsApp de administração cadastrado aqui é onde você receberá códigos de login rápido e notificações vitais da plataforma.",
    ],
  },
  {
    number: 2,
    id: "whatsapp",
    title: "Conexão com o WhatsApp",
    shortTitle: "WhatsApp",
    subtitle: "Conectar instância via QR Code (Evolution API)",
    description: "Conecte o número de WhatsApp que será utilizado para disparar mensagens e sincronizar os grupos da sua empresa.",
    icon: Smartphone,
    route: "/painel/configuracoes/whatsapp",
    accentColor: "from-emerald-500 to-teal-500",
    bgGlow: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    buttonLabel: "Conectar WhatsApp",
    checklist: [
      "Instância padrão criada",
      "QR Code escaneado no aplicativo do WhatsApp",
      "Status da conexão confirmado como 'Conectado'",
      "Bateria e telemetria sincronizadas",
    ],
    tips: [
      "Certifique-se de que o aparelho conectado tenha boa conexão com a internet para garantir alta velocidade de entrega.",
    ],
  },
  {
    number: 3,
    id: "modelos",
    title: "Modelos de Mensagens",
    shortTitle: "Modelos",
    subtitle: "Copys persuasivas com tags dinâmicas e emojis",
    description: "Crie e personalize os modelos de mensagens usados nos envios de promoções e comunicados para os grupos.",
    icon: MessageSquareQuote,
    route: "/painel/configuracoes/modelos",
    accentColor: "from-purple-500 to-pink-500",
    bgGlow: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    buttonLabel: "Gerenciar Modelos de Mensagens",
    checklist: [
      "Modelos padrão ativados na sua conta",
      "Tags dinâmicas como {nome_produto} e {link_produto} configuradas",
      "Pré-visualização aprovada no mockup do WhatsApp",
    ],
    tips: [
      "Você pode usar emojis e formatações como *negrito*, _itálico_ e ~tachado~ para deixar as mensagens atraentes.",
    ],
  },
  {
    number: 4,
    id: "meta_ads",
    title: "Configurar o Pixel da Meta Ads",
    shortTitle: "Meta Ads",
    subtitle: "Rastreamento inteligente de Leads e Conversões",
    description: "Integre seu Pixel do Facebook e Token da API de Conversões (CAPI) para rastrear visitantes nas Landing Pages.",
    icon: Radio,
    route: "/painel/configuracoes/meta-ads",
    accentColor: "from-sky-500 to-cyan-500",
    bgGlow: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    buttonLabel: "Configurar Meta Pixel",
    checklist: [
      "ID do Meta Pixel inserido",
      "Token de acesso da API de Conversões (CAPI) adicionado",
      "Rastreamento de PageView e Lead ativado",
    ],
    tips: [
      "A API de Conversões permite mensurar leads mesmo quando os navegadores bloqueiam cookies de terceiros.",
    ],
  },
  {
    number: 5,
    id: "grupos",
    title: "Cadastrar o Primeiro Grupo",
    shortTitle: "Grupos",
    subtitle: "Sincronização e monitoramento de grupos de WhatsApp",
    description: "Sincronize os grupos da sua conta do WhatsApp para que você possa disparar ofertas de forma segmentada.",
    icon: Users2,
    route: "/painel/grupos",
    accentColor: "from-amber-500 to-orange-500",
    bgGlow: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    buttonLabel: "Acessar e Sincronizar Grupos",
    checklist: [
      "Grupos sincronizados da instância WhatsApp",
      "Grupos de ofertas identificados e categorizados",
      "Permissões de envio de mensagens verificadas",
    ],
    tips: [
      "Certifique-se de que o número conectado seja administrador do grupo para permitir o envio programado de mensagens.",
    ],
  },
  {
    number: 6,
    id: "landing_page",
    title: "Link de Convite do WhatsApp",
    shortTitle: "Link de Convite",
    subtitle: "Landing Page de alta conversão para captação de leads",
    description: "Configure sua página de captura de leads vinculada ao link de convite do grupo VIP, coletando nome e WhatsApp antes da entrada.",
    icon: Link2,
    route: "/painel/grupos/landing-page",
    accentColor: "from-teal-500 to-emerald-500",
    bgGlow: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    buttonLabel: "Configurar Landing Page de Grupo",
    checklist: [
      "Link de convite do grupo WhatsApp inserido",
      "Título, headline e cores personalizadas",
      "Depoimentos e benefícios configurados",
      "Link público testado e publicado",
    ],
    tips: [
      "Você pode usar a URL pública /g/sua-empresa/slug em seus anúncios no Instagram e Facebook para maximizar leads.",
    ],
  },
  {
    number: 7,
    id: "produtos",
    title: "Cadastrar o Primeiro Produto",
    shortTitle: "Produtos",
    subtitle: "Catálogo de ofertas, preços promocionais e fotos",
    description: "Cadastre suas primeiras ofertas ou produtos para gerar mensagens de vendas automáticas e disparar com 1 clique.",
    icon: Package,
    route: "/painel/produtos",
    accentColor: "from-rose-500 to-red-500",
    bgGlow: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    buttonLabel: "Cadastrar Primeiro Produto",
    checklist: [
      "Nome, descrição e fotos do produto adicionados",
      "Preço original e preço promocional preenchidos",
      "Link de destino do botão de compra configurado",
      "Produto publicado e ativo para envio",
    ],
    tips: [
      "Produtos com imagens atraentes e desconto em destaque têm até 3x mais cliques nos grupos do WhatsApp.",
    ],
  },
  {
    number: 8,
    id: "conclusao",
    title: "Conclusão & Setup Completo",
    shortTitle: "Conclusão",
    subtitle: "Sua plataforma está pronta para gerar vendas",
    description: "Parabéns! Todas as etapas essenciais foram configuradas. Agora você está pronto para disparar campanhas, captar novos membros e acompanhar métricas em tempo real.",
    icon: PartyPopper,
    route: "/painel",
    accentColor: "from-emerald-400 via-teal-400 to-cyan-400",
    bgGlow: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    buttonLabel: "Ir para a Visão Geral",
    checklist: [
      "Empresa cadastrada e pronta",
      "WhatsApp conectado com alta estabilidade",
      "Modelos e Catálogo configurados",
      "Página de captura pronta para receber tráfego",
    ],
    tips: [
      "Você pode reabrir este assistente a qualquer momento clicando no menu da empresa ou pelo card na Visão Geral.",
    ],
  },
];

export function CompanyOnboardingWizardModal({
  isOpen,
  onClose,
  initialStep = 1,
  onCompleted,
}: OnboardingWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep - 1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [liveStatus, setLiveStatus] = useState<Record<string, boolean>>({});
  const [step1Valid, setStep1Valid] = useState<boolean>(false);
  const step1Ref = useRef<WizardStep1Handle>(null);
  const step6Ref = useRef<WizardStep6Handle>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carregar status do onboarding
  useEffect(() => {
    if (!isOpen) return;

    async function loadOnboarding() {
      try {
        setLoading(true);
        const res = await fetch("/api/painel/onboarding");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.onboarding) {
            if (Array.isArray(json.onboarding.completedSteps)) {
              setCompletedSteps(json.onboarding.completedSteps);
            }
            if (json.onboarding.liveStatus) {
              setLiveStatus(json.onboarding.liveStatus);
            }
            if (json.onboarding.currentStep && initialStep === 1) {
              const stepIdx = Math.max(0, Math.min(7, json.onboarding.currentStep - 1));
              setCurrentStepIndex(stepIdx);
            }
          }
        }
      } catch (err) {
        console.error("Erro ao carregar onboarding:", err);
      } finally {
        setLoading(false);
      }
    }

    loadOnboarding();
  }, [isOpen, initialStep]);

  const currentStep = ONBOARDING_STEPS[currentStepIndex] || ONBOARDING_STEPS[0];
  const StepIcon = currentStep.icon;

  const isStepCompleted = (stepNumber: number) => completedSteps.includes(stepNumber);

  const toggleStepCompleted = async (stepNumber: number) => {
    const updated = completedSteps.includes(stepNumber)
      ? completedSteps.filter((s) => s !== stepNumber)
      : [...completedSteps, stepNumber];
    
    setCompletedSteps(updated);

    try {
      await fetch("/api/painel/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedSteps: updated,
          currentStep: currentStep.number,
        }),
      });
    } catch {}
  };

  const handleNextStep = async () => {
    // Se estiver no passo 1, persiste e valida antes de prosseguir
    if (currentStep.number === 1 && step1Ref.current) {
      const ok = await step1Ref.current.saveAndValidate();
      if (!ok) return;
    }

    // Se estiver no passo 6, persiste o link do grupo antes de prosseguir
    if (currentStep.number === 6 && step6Ref.current) {
      await step6Ref.current.saveAndValidate();
    }

    // Auto marca o passo atual como completado se ainda não estiver
    let updatedCompleted = completedSteps;
    if (!completedSteps.includes(currentStep.number)) {
      updatedCompleted = [...completedSteps, currentStep.number];
      setCompletedSteps(updatedCompleted);
    }

    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);

      try {
        await fetch("/api/painel/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentStep: ONBOARDING_STEPS[nextIdx].number,
            completedSteps: updatedCompleted,
          }),
        });
      } catch {}
    } else {
      // Concluir Onboarding
      await handleFinishOnboarding();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleFinishOnboarding = async () => {
    try {
      setSaving(true);
      await fetch("/api/painel/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: true,
          currentStep: 8,
          completedSteps: [1, 2, 3, 4, 5, 6, 7, 8],
        }),
      });
      onCompleted?.();
      onClose();
    } catch (err) {
      console.error("Erro ao concluir onboarding:", err);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const progressPercent = useMemo(() => {
    const count = completedSteps.length;
    return Math.min(100, Math.round((count / 8) * 100));
  }, [completedSteps]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-[#090e1a] border border-slate-800 shadow-2xl shadow-black/80 overflow-hidden text-slate-100">
        
        {/* TOPO: Cabeçalho com Progresso */}
        <div className="px-5 sm:px-8 pt-6 pb-4 border-b border-slate-800/80 bg-gradient-to-r from-[#0b1222] via-[#090f1d] to-[#0b1222]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Assistente de Configuração do Painel
                  </h2>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Passo a Passo
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure o sistema em 8 etapas para liberar todo o potencial de vendas e disparos.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-all cursor-pointer"
              title="Fechar assistente"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Progresso Horizontal */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Progresso do Setup: <strong className="text-white">{completedSteps.length} de 8 concluídos</strong>
              </span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500 shadow-sm shadow-emerald-500/50"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Mini Steps Nav Indicators (Somente visualização, navegação exclusivamente via Anterior/Próximo) */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mt-4 pt-1">
            {ONBOARDING_STEPS.map((step, idx) => {
              const isCurrent = idx === currentStepIndex;
              const isDone = completedSteps.includes(step.number);
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all select-none text-left ${
                    isCurrent
                      ? "bg-slate-800/90 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                      : isDone
                      ? "bg-slate-900/60 border-slate-800/80 text-slate-300"
                      : "bg-slate-950/40 border-slate-800/40 opacity-70 text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${isCurrent ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"}`}>
                        {step.number}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium tracking-tight mt-1 truncate max-w-full text-center">
                    {step.shortTitle}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTRO: Conteúdo do Passo Atual */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-6 custom-scrollbar">
          
          {/* Card Principal do Passo */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0d1424]/90 border border-slate-800/90 p-5 sm:p-6 shadow-xl">
            <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${currentStep.accentColor}`} />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3.5 rounded-2xl border shadow-lg shrink-0 ${currentStep.bgGlow}`}>
                  <StepIcon className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      Passo {currentStep.number} de 8
                    </span>
                    {isStepCompleted(currentStep.number) && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <Check className="w-3 h-3" /> Concluído
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5">
                    {currentStep.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl font-medium">
                    {currentStep.description}
                  </p>
                </div>
              </div>

              {/* Botão de Ação Direta para a Rota */}
              {currentStep.route && (
                <div className="shrink-0 w-full md:w-auto">
                  <Link
                    href={currentStep.route}
                    onClick={onClose}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer whitespace-nowrap group"
                  >
                    <span>{currentStep.buttonLabel}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Painel Central com Formulário/Componente Embutido */}
          <div className="space-y-4">
            {currentStep.number === 1 && (
              <WizardStep1Company
                ref={step1Ref}
                onValidityChange={(isValid) => setStep1Valid(isValid)}
                onSaved={() => {
                  if (!completedSteps.includes(1)) {
                    setCompletedSteps((prev) => [...prev, 1]);
                  }
                }}
              />
            )}

            {currentStep.number === 2 && (
              <WizardStep2Whatsapp
                onSaved={() => {
                  if (!completedSteps.includes(2)) {
                    setCompletedSteps((prev) => [...prev, 2]);
                  }
                }}
              />
            )}

            {currentStep.number === 3 && (
              <WizardStep3Templates
                onSaved={() => {
                  if (!completedSteps.includes(3)) {
                    setCompletedSteps((prev) => [...prev, 3]);
                  }
                }}
              />
            )}

            {currentStep.number === 4 && (
              <WizardStep4MetaAds
                onSaved={() => {
                  if (!completedSteps.includes(4)) {
                    setCompletedSteps((prev) => [...prev, 4]);
                  }
                }}
              />
            )}

            {currentStep.number === 5 && (
              <WizardStep5Groups
                onSaved={() => {
                  if (!completedSteps.includes(5)) {
                    setCompletedSteps((prev) => [...prev, 5]);
                  }
                }}
              />
            )}

            {currentStep.number === 6 && (
              <WizardStep6LandingPage
                ref={step6Ref}
                onSaved={() => {
                  if (!completedSteps.includes(6)) {
                    setCompletedSteps((prev) => [...prev, 6]);
                  }
                }}
              />
            )}

            {currentStep.number === 7 && (
              <WizardStep7Product
                onSaved={() => {
                  if (!completedSteps.includes(7)) {
                    setCompletedSteps((prev) => [...prev, 7]);
                  }
                }}
              />
            )}

            {currentStep.number === 8 && (
              <WizardStep8Conclusion
                completedSteps={completedSteps}
                onFinish={handleFinishOnboarding}
              />
            )}
          </div>

          {/* Grid de Detalhes: Checklist e Dicas */}
          {currentStep.number < 8 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Bloco Checklist da Etapa */}
              <div className="rounded-2xl bg-[#0b1222]/80 border border-slate-800/80 p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Itens Recomendados
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {currentStep.checklist.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60"
                    >
                      <div className="mt-0.5">
                        {isStepCompleted(currentStep.number) ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloco Dicas & Boas Práticas */}
              <div className="rounded-2xl bg-[#0b1222]/80 border border-slate-800/80 p-5 space-y-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Dica de Especialista
                  </span>
                  <div className="space-y-2.5 pt-3">
                    {currentStep.tips.map((tip, i) => (
                      <p key={i} className="text-xs text-slate-300 leading-relaxed bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
                        {tip}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Status ao vivo se detectado */}
                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Roteamento rápido (caso queira abrir tela cheia):</span>
                  <Link
                    href={currentStep.route}
                    onClick={onClose}
                    className="font-mono text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {currentStep.route}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* RODAPÉ: Navegação e Ações */}
        <div className="px-5 sm:px-8 py-4 border-t border-slate-800/80 bg-[#080d1a] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                currentStepIndex === 0
                  ? "bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              onClick={() => toggleStepCompleted(currentStep.number)}
              className="sm:hidden text-xs text-slate-400 underline"
            >
              {isStepCompleted(currentStep.number) ? "Desmarcar" : "Marcar Feito"}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              Fechar e Continuar Depois
            </button>

            {currentStepIndex === ONBOARDING_STEPS.length - 1 ? (
              <button
                onClick={handleFinishOnboarding}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PartyPopper className="w-4 h-4" />}
                <span>Concluir Onboarding</span>
              </button>
            ) : (
              <button
                onClick={handleNextStep}
                disabled={currentStep.number === 1 && !step1Valid}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Próximo Passo</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default CompanyOnboardingWizardModal;
