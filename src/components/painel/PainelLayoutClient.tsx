"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Home,
  Users2,
  Package,
  UserCheck,
  Settings,
  Server,
  Users,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Layers,
  Zap,
  Sliders,
  RotateCw,
  Eye,
  Loader2,
  Smartphone,
  MessageSquareQuote,
  Radio,
  Crown,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { SYSTEM_VERSION, SYSTEM_NAME } from "@/lib/config";
import { useLayout } from "@/context/LayoutContext";
import { CompanyWhatsappStatusIndicator } from "./CompanyWhatsappStatusIndicator";
import { ClusterStatusIndicator } from "./ClusterStatusIndicator";
import { SubscriptionBlockedBanner, SubscriptionBlockedCard } from "./SubscriptionBlockedState";

interface PainelLayoutClientProps {
  children: React.ReactNode;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    company_id?: number | null;
  } | null;
  company?: {
    id: number;
    name: string;
    plan: string;
    status: string;
    max_instances?: number;
    has_active_subscription?: boolean;
    subscription_status?: string;
  } | null;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  badge: string | null;
  module: string;
}

interface NavigationGroup {
  category?: string;
  icon?: any;
  isStandalone?: boolean;
  items: NavigationItem[];
}

const navigationItems: NavigationGroup[] = [
  {
    category: "Visão Geral",
    icon: LayoutDashboard,
    items: [
      { name: "Dashboard", href: "/painel", icon: LayoutDashboard, badge: null, module: "dashboard" },
    ],
  },
  {
    category: "Marketing & Grupos",
    icon: Users2,
    items: [
      { name: "Grupos WhatsApp", href: "/painel/grupos", icon: Users2, badge: null, module: "grupos" },
      { name: "Landing Page Grupo", href: "/painel/grupos/landing-page", icon: Sparkles, badge: null, module: "landing-page-grupo" },
      { name: "Produtos & Ofertas", href: "/painel/produtos", icon: Package, badge: null, module: "produtos" },
      { name: "Gestão de Leads", href: "/painel/leads", icon: UserCheck, badge: null, module: "leads" },
      { name: "Tarefas & Disparos", href: "/painel/tarefas", icon: Layers, badge: null, module: "tarefas" },
    ],
  },
  {
    category: "Configurações",
    icon: Settings,
    items: [
      { name: "WhatsApp & Conexão", href: "/painel/configuracoes/whatsapp", icon: Smartphone, badge: null, module: "whatsapp" },
      { name: "Dados da Empresa", href: "/painel/configuracoes/empresa", icon: Building2, badge: null, module: "empresa" },
      { name: "Modelos de Mensagens", href: "/painel/configuracoes/modelos", icon: MessageSquareQuote, badge: null, module: "modelos" },
      { name: "Meta Ads & Pixel", href: "/painel/configuracoes/meta-ads", icon: Radio, badge: null, module: "meta-ads" },
      { name: "Planos & Assinatura", href: "/painel/configuracoes/assinatura", icon: Crown, badge: null, module: "assinatura" },
    ],
  },
];

function getInitials(name: string): string {
  if (!name) return "EP";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PainelLayoutClient({ children, user: initialUser, company: initialCompany }: PainelLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { containerMaxWidthStyle } = useLayout();

  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    role: string;
    isLoaded: boolean;
  }>({
    name: initialUser?.name || "",
    email: initialUser?.email || "",
    role: initialUser?.role || "COMPANY_ADMIN",
    isLoaded: !!initialUser,
  });

  const [companyData, setCompanyData] = useState<{
    id: number;
    name: string;
    plan: string;
    status: string;
    subscription_end?: string | null;
    admin_whatsapp?: string | null;
    has_active_subscription?: boolean;
    subscription_status?: string;
    onboarding_completed?: boolean;
    onboarding_current_step?: number;
    isLoaded: boolean;
  }>({
    id: initialCompany?.id || 0,
    name: initialCompany?.name || "",
    plan: initialCompany?.plan || "",
    status: initialCompany?.status || "active",
    subscription_end: null,
    admin_whatsapp: null,
    has_active_subscription: initialCompany?.has_active_subscription ?? true,
    subscription_status: initialCompany?.subscription_status ?? "active",
    onboarding_completed: true,
    onboarding_current_step: 1,
    isLoaded: !!initialCompany,
  });

  const [quotas, setQuotas] = useState<{
    groups: { current: number; limit: number };
    products: { current: number; limit: number };
    messages_day: { current: number; limit: number };
    views: { current: number; limit: number };
    leads?: { current: number; limit: number };
  } | null>(null);

  const [limitsExceededInfo, setLimitsExceededInfo] = useState<{
    exceeded: boolean;
    exceededItems: { key: string; label: string; current: number; max: number }[];
    plan_name?: string;
  }>({
    exceeded: false,
    exceededItems: [],
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isRefreshingPerms, setIsRefreshingPerms] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Carregar dados de perfil/empresa se não fornecidos
  useEffect(() => {
    if (pathname === "/painel/login") return;

    async function loadData() {
      try {
        const res = await fetch("/api/painel/dashboard");
        if (res.status === 401) {
          router.push("/painel/login");
          return;
        }
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            if (json.user) {
              setUserData({
                name: json.user.name || "Minha Empresa",
                email: json.user.email || "",
                role: json.user.role || "COMPANY_ADMIN",
                isLoaded: true,
              });
            }
            if (json.company) {
              setCompanyData({
                id: json.company.id || 0,
                name: json.company.name || "Minha Empresa",
                plan: json.company.plan || "Plano",
                status: json.company.status || "active",
                subscription_end: json.company.subscription_end || null,
                admin_whatsapp: json.company.admin_whatsapp || null,
                has_active_subscription: json.hasActiveSubscription ?? json.company.has_active_subscription ?? true,
                subscription_status: json.subscriptionStatus ?? json.company.subscription_status ?? "active",
                onboarding_completed: json.company.onboarding_completed ?? true,
                onboarding_current_step: json.company.onboarding_current_step || 1,
                isLoaded: true,
              });
            }
            if (json.quotas) {
              setQuotas(json.quotas);
            }
            if (json.limits) {
              setLimitsExceededInfo({
                exceeded: !!json.limits.exceeded,
                exceededItems: json.limits.exceededItems || [],
                plan_name: json.limits.plan_name,
              });
            }
          }
        }
      } catch {
        // Fallback silencioso
      }
    }
    loadData();
  }, [initialUser, initialCompany, pathname, router]);

  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsImpersonating(document.cookie.includes("impersonate_by_sa="));
    }
  }, []);

  const isItemActive = (href: string) => {
    if (href === "/painel") {
      return pathname === "/painel";
    }
    if (pathname === href) {
      return true;
    }
    // Se existir outro item no menu que seja mais específico (comum em sub-rotas como /painel/grupos/landing-page),
    // apenas dê match de prefixo se não houver um link exato correspondente
    const hasMoreSpecificItem = navigationItems
      .flatMap((g) => g.items)
      .some((item) => item.href !== href && item.href.startsWith(href) && (pathname === item.href || pathname.startsWith(`${item.href}/`)));

    if (hasMoreSpecificItem) {
      return false;
    }

    return pathname.startsWith(`${href}/`);
  };

  // Abrir o submenu da rota atual
  useEffect(() => {
    const activeCategory = navigationItems.find((group) =>
      group.items.some((item) => isItemActive(item.href))
    )?.category;

    if (activeCategory) {
      setOpenSubmenus({ [activeCategory]: true });
    } else {
      setOpenSubmenus({});
    }
  }, [pathname]);

  const toggleSubmenu = (category: string) => {
    setOpenSubmenus((prev) => {
      const isCurrentlyOpen = !!prev[category];
      if (isCurrentlyOpen) {
        return {};
      }
      return { [category]: true };
    });
  };

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRefreshPermissions = async () => {
    try {
      setIsRefreshingPerms(true);
      await fetch("/api/auth/me", { cache: "no-store" });
      toast.success("Permissões e sessão sincronizadas com sucesso!");
      setUserDropdownOpen(false);
    } catch {
      toast.error("Erro ao sincronizar permissões.");
    } finally {
      setIsRefreshingPerms(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignora erro
    } finally {
      if (typeof window !== "undefined") {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {}
      }
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      toast.info("Sessão finalizada com sucesso!");
      router.push("/painel/login");
    }
  };

  // Formatação amigável da data final da assinatura
  const formattedSubscriptionEnd = useMemo(() => {
    if (!companyData.subscription_end) return null;
    try {
      const date = new Date(companyData.subscription_end);
      if (isNaN(date.getTime())) return null;
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    } catch {
      return null;
    }
  }, [companyData.subscription_end]);

  // Formatação amigável do WhatsApp Admin
  const formattedAdminWhatsapp = useMemo(() => {
    const wa = companyData.admin_whatsapp;
    if (!wa) return null;
    const clean = wa.replace(/\D/g, "");
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return wa;
  }, [companyData.admin_whatsapp]);

  // Se for a tela de login, não renderiza sidebar/layout
  if (pathname === "/painel/login") {
    return <>{children}</>;
  }

  const userName = userData.name || (userData.isLoaded ? "Administrador" : "");
  const userEmail = userData.email;
  const userInitials = userData.name ? getInitials(userData.name) : "EP";
  const companyName = companyData.name || (companyData.isLoaded ? "Empresa" : "");
  const companyPlan = companyData.plan || "";

  // Função auxiliar para calcular estilos de alerta dinâmico de limites (0-50% verde, 51-90% amarelo, >90% vermelho piscando)
  const getQuotaStatusClass = (current: number, limit: number) => {
    if (!limit || limit <= 0) {
      return "text-emerald-400 font-semibold";
    }
    const percent = (current / limit) * 100;
    if (percent > 90) {
      return "text-rose-400 font-bold animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]";
    }
    if (percent > 50) {
      return "text-amber-400 font-semibold";
    }
    return "text-emerald-400 font-semibold";
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* BARRA SUPERIOR DE IMPERSONAÇÃO */}
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-50 h-8 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 text-xs font-bold border-b border-amber-300 flex items-center justify-between shadow-md">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-slate-950/20 text-slate-950">
                <Eye className="w-3.5 h-3.5 animate-pulse" />
              </span>
              <span>
                <strong>MODO IMPERSONALIZADO:</strong> Você está visualizando o painel como administrador da empresa{" "}
                <span className="underline font-black">{companyName}</span>.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  window.close();
                }}
                className="px-3 py-1 rounded-lg bg-slate-950 text-amber-300 hover:text-white hover:bg-slate-900 transition-colors text-[11px] font-extrabold whitespace-nowrap cursor-pointer shadow"
              >
                Fechar Janela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TARJA VERMELHA FIXA NO TOPO - ASSINATURA INATIVA / EXPIRADA / BLOQUEADA */}
      {!companyData.has_active_subscription && (
        <SubscriptionBlockedBanner
          status={companyData.subscription_status}
          planName={companyPlan}
          isImpersonating={isImpersonating}
        />
      )}

      {/* TARJA VERMELHA FIXA NO TOPO - LIMITE DA ASSINATURA ATINGIDO */}
      {companyData.has_active_subscription && limitsExceededInfo.exceeded && (
        <div
          className={`fixed left-0 right-0 z-50 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl shadow-red-950/60 border-b border-red-400/30 transition-all ${
            isImpersonating ? "top-8" : "top-0"
          }`}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-center sm:text-left min-h-[44px]">
            <div className="flex items-center gap-2.5">
              <span className="p-1 rounded-lg bg-black/25 text-white shrink-0 animate-bounce">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
              </span>
              <div className="text-xs sm:text-sm font-semibold text-white/95 leading-tight">
                <strong className="text-amber-200 font-extrabold uppercase tracking-wide">Atenção:</strong>{" "}
                <span>
                  Você atingiu o limite do seu plano ({limitsExceededInfo.exceededItems.map((i) => i.label).join(", ")}). Desbloqueie todo o potencial para não perder novas conversões e vendas!
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center">
              <Link
                href="/painel/configuracoes/assinatura?tab=upgrade"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1 rounded-lg bg-white text-rose-700 hover:bg-amber-100 hover:text-rose-800 transition-all font-black text-xs shadow-md shadow-black/20 hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Fazer Upgrade Agora</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 1. HEADER FIXO COM CONTAINER LARGURA MÁXIMA */}
      <header
        className={`fixed left-0 right-0 z-40 h-16 bg-[#090f1d]/90 backdrop-blur-xl border-b border-slate-800/80 flex justify-center shadow-lg shadow-black/40 transition-all ${
          !companyData.has_active_subscription
            ? isImpersonating
              ? "top-[80px]"
              : "top-[48px]"
            : limitsExceededInfo.exceeded
            ? isImpersonating
              ? "top-[76px]"
              : "top-[44px]"
            : isImpersonating
            ? "top-8"
            : "top-0"
        }`}
      >
        <div
          className="w-full h-full px-4 sm:px-6 flex items-center justify-between transition-all duration-300 bg-[#080d1a] border-x border-slate-800/40"
          style={containerMaxWidthStyle}
        >
          <div className="flex items-center gap-3">
            {/* Botão Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Abrir Menu Lateral"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Botão Desktop Recolher/Expandir Menu (No topo ao lado do logo) */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
              aria-label={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
              className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/60 hover:border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="h-5 w-px bg-slate-800/80 hidden md:block" />

            {/* Logo & Identidade da Empresa */}
            <Link href="/painel" className="flex items-center gap-3 group focus:outline-none">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 transition-transform group-hover:scale-105">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-black tracking-tight text-base bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent truncate max-w-[150px] sm:max-w-xs">
                  {companyName}
                </span>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Portal do Cliente
                </span>
              </div>
            </Link>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Status do Sistema (Cluster) */}
            <div className="hidden sm:flex items-center">
              <ClusterStatusIndicator />
            </div>
            
            {/* Status do WhatsApp da Empresa */}
            <div className="hidden sm:flex items-center">
              <CompanyWhatsappStatusIndicator />
            </div>

            {/* Super Admin Retorno se for Super Admin */}
            {userData.role === "SUPER_ADMIN" && (
              <Link
                href="/sa/inicio"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-all whitespace-nowrap"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Super Admin</span>
              </Link>
            )}

            {/* Menu Perfil do Usuário */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700/80 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 group cursor-pointer"
              >
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate max-w-[130px]">
                    {userName}
                  </span>
                  <span
                    className={`text-[10px] font-mono truncate max-w-[130px] ${
                      !companyData.has_active_subscription ? "text-rose-400 font-semibold" : "text-slate-400"
                    }`}
                    title="Status e validade da assinatura"
                  >
                    {!companyData.has_active_subscription
                      ? "Sem assinatura"
                      : formattedSubscriptionEnd
                      ? `Validade: ${formattedSubscriptionEnd}`
                      : "Sem expiração"}
                  </span>
                </div>

                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/25 to-teal-500/25 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-xs shadow-inner group-hover:scale-105 transition-transform">
                  {userInitials}
                </div>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
                    userDropdownOpen ? "rotate-180 text-emerald-400" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0b1120] border border-slate-800/90 shadow-2xl shadow-black/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Header User info */}
                  <div className="px-4 py-3 border-b border-slate-800/70">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{userName}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                        {userData.role === "SUPER_ADMIN" ? "SUPER ADMIN" : userData.role === "COMPANY_ADMIN" ? "ADMIN" : "OPERADOR"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-mono font-medium">
                      <Smartphone className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{formattedAdminWhatsapp || "Sem WhatsApp Admin"}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href="/painel/configuracoes/assinatura?tab=upgrade"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-colors"
                    >
                      <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Fazer Upgrade de Plano</span>
                    </Link>

                    <Link
                      href="/painel/configuracoes/assinatura?tab=historico"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      <History className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Histórico de Assinatura</span>
                    </Link>

                    {userData.role === "SUPER_ADMIN" && (
                      <Link
                        href="/sa/inicio"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-colors"
                      >
                        <Sliders className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>Painel Super Admin SaaS</span>
                      </Link>
                    )}
                  </div>

                  <div className="p-1.5 pt-1 border-t border-slate-800/70">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair do Painel</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. CORPO (BARRA DE MENU LATERAL + MAIN) CENTRALIZADO NA LARGURA (1200px) */}
      <div
        className={`w-full flex-1 flex justify-center pb-12 min-h-screen ${
          !companyData.has_active_subscription
            ? isImpersonating
              ? "pt-[144px]"
              : "pt-[112px]"
            : limitsExceededInfo.exceeded
            ? isImpersonating
              ? "pt-[140px]"
              : "pt-[108px]"
            : isImpersonating
            ? "pt-24"
            : "pt-16"
        }`}
      >
        <div
          className="w-full flex relative transition-all duration-300 bg-[#080d1a] border-x border-slate-800/50 shadow-2xl shadow-black/80 items-stretch"
          style={containerMaxWidthStyle}
        >
          {/* SIDEBAR DESKTOP */}
          <aside
            className={`hidden md:flex flex-col sticky self-start shrink-0 bg-[#080d1a] border-r border-slate-800/80 transition-all duration-300 z-30 ${
              limitsExceededInfo.exceeded
                ? isImpersonating
                  ? "top-[140px] h-[calc(100vh-140px)]"
                  : "top-[108px] h-[calc(100vh-108px)]"
                : isImpersonating
                ? "top-24 h-[calc(100vh-6rem)]"
                : "top-16 h-[calc(100vh-4rem)]"
            } ${sidebarCollapsed ? "w-20" : "w-72"}`}
          >
            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto pt-[30px] pb-4 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-transparent">
              {navigationItems.map((group, gIdx) => {
                const isExpanded = !!openSubmenus[group.category || ""];
                const GroupIcon = group.icon;

                if (group.isStandalone) {
                  return (
                    <div key={gIdx} className="space-y-1">
                      {group.items.map((item) => {
                        const isActive = isItemActive(item.href);
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            title={sidebarCollapsed ? item.name : undefined}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative overflow-hidden ${
                              isActive
                                ? "bg-emerald-600/15 text-white border border-emerald-500/40 shadow-sm shadow-emerald-600/10 font-semibold"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/70 border border-transparent"
                            }`}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r-full shadow-sm shadow-emerald-500" />
                            )}
                            <div
                              className={`p-1.5 rounded-lg transition-all shrink-0 ${
                                isActive
                                  ? "bg-emerald-500/25 text-emerald-300"
                                  : "text-slate-400 group-hover:text-emerald-400 group-hover:bg-slate-800/80"
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                            </div>
                            {!sidebarCollapsed && (
                              <span className="flex-1 whitespace-nowrap text-xs tracking-tight">
                                {item.name}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div key={gIdx} className="space-y-1">
                    {!sidebarCollapsed ? (
                      <button
                        type="button"
                        onClick={() => group.category && toggleSubmenu(group.category)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all text-slate-400 hover:text-slate-200 group/header"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <GroupIcon className="w-3.5 h-3.5 shrink-0 transition-colors text-emerald-400/80 group-hover/header:text-emerald-400" />
                          <span className="whitespace-nowrap">{group.category}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-slate-850 border border-slate-800 text-slate-400">
                            {group.items.length}
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 ${
                              isExpanded ? "rotate-0" : "-rotate-90 text-slate-500"
                            }`}
                          />
                        </div>
                      </button>
                    ) : (
                      <div className="relative flex justify-center py-1 border-b border-slate-800/40 mb-1">
                        <GroupIcon className="w-4 h-4 text-emerald-400/70" />
                      </div>
                    )}

                    {(!sidebarCollapsed ? isExpanded : true) && (
                      <div className={`space-y-1 ${!sidebarCollapsed ? "pl-1.5" : ""}`}>
                        {group.items.map((item) => {
                          const isActive = isItemActive(item.href);
                          const Icon = item.icon;

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              title={sidebarCollapsed ? item.name : undefined}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative overflow-hidden ${
                                isActive
                                  ? "bg-emerald-600/15 text-white border border-emerald-500/40 shadow-sm shadow-emerald-600/10 font-semibold"
                                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/70 border border-transparent"
                              }`}
                            >
                              {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r-full shadow-sm shadow-emerald-500" />
                              )}

                              <div
                                className={`p-1.5 rounded-lg transition-all shrink-0 ${
                                  isActive
                                    ? "bg-emerald-500/25 text-emerald-300"
                                    : "text-slate-400 group-hover:text-emerald-400 group-hover:bg-slate-800/80"
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                              </div>

                              {!sidebarCollapsed && (
                                <>
                                  <span className="flex-1 whitespace-nowrap text-xs tracking-tight">
                                    {item.name}
                                  </span>
                                  {item.badge && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 bg-slate-800 text-slate-400 border border-slate-700">
                                      {item.badge}
                                    </span>
                                  )}
                                </>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* SIDEBAR MOBILE (DRAWER) */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={() => setMobileMenuOpen(false)}
              />

              <div className="relative flex-1 max-w-xs w-full bg-[#080d19] border-r border-slate-800 p-5 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-white truncate max-w-[170px]">{companyName}</span>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800/50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {navigationItems.map((group, gIdx) => {
                      const isExpanded = !!openSubmenus[group.category || ""];
                      const hasActiveChild = group.items.some((item) => isItemActive(item.href));
                      const GroupIcon = group.icon;

                      if (group.isStandalone) {
                        return (
                          <div key={gIdx} className="space-y-1">
                            {group.items.map((item) => {
                              const isActive = isItemActive(item.href);
                              const Icon = item.icon;
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                    isActive
                                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                                      : "text-slate-300 hover:text-white hover:bg-slate-850"
                                  }`}
                                >
                                  <div
                                    className={`p-1.5 rounded-lg shrink-0 ${
                                      isActive ? "bg-white/20 text-white" : "bg-slate-800 text-emerald-400"
                                    }`}
                                  >
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <span>{item.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        );
                      }

                      return (
                        <div key={gIdx} className="space-y-1 rounded-xl bg-slate-900/40 border border-slate-800/50 p-2">
                          <button
                            type="button"
                            onClick={() => group.category && toggleSubmenu(group.category)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                              hasActiveChild ? "text-emerald-300 bg-emerald-500/10" : "text-slate-300 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`p-1 rounded-md shrink-0 ${
                                  hasActiveChild ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 bg-slate-800"
                                }`}
                              >
                                <GroupIcon className="w-4 h-4" />
                              </div>
                              <span className="uppercase tracking-wider text-[11px] font-bold truncate">
                                {group.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] px-1.5 py-0.2 font-semibold rounded bg-slate-800 text-slate-400">
                                {group.items.length}
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 text-slate-400 ${
                                  isExpanded ? "rotate-0" : "-rotate-90 text-slate-500"
                                }`}
                              />
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="space-y-1 pt-1 pl-2 border-l-2 border-slate-800 ml-3">
                              {group.items.map((item) => {
                                const isActive = isItemActive(item.href);
                                const Icon = item.icon;

                                return (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all relative overflow-hidden ${
                                      isActive
                                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                    }`}
                                  >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span className="flex-1 whitespace-nowrap">{item.name}</span>
                                    {item.badge && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 font-bold shrink-0">
                                        {item.badge}
                                      </span>
                                    )}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 mt-6 space-y-2">
                  <CompanyWhatsappStatusIndicator />
                </div>
              </div>
            </div>
          )}

          {/* 3. MAIN (CONTEÚDO PRINCIPAL) */}
          <main className="flex-1 transition-all duration-300 w-full min-w-0 p-4 sm:p-5 lg:p-6">
            <div className="mx-auto space-y-4">
              {!companyData.has_active_subscription && pathname !== "/painel/configuracoes/assinatura" ? (
                <SubscriptionBlockedCard
                  title="Recurso Bloqueado por Falta de Assinatura"
                  description="Para acessar seus grupos, produtos, leads, modelos de mensagens e automações, regularize ou ative a assinatura da sua empresa."
                  actionText="Ativar / Renovar Assinatura"
                />
              ) : (
                children
              )}
            </div>
          </main>
        </div>
      </div>

      {/* 4. FOOTER FIXO COM CONTAINER LARGURA MÁXIMA */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 h-12 bg-[#090f1d]/95 backdrop-blur-xl border-t border-slate-800/80 flex justify-center text-xs text-slate-400 shadow-inner">
        <div
          className="w-full h-full px-4 sm:px-6 flex items-center justify-between transition-all duration-300 bg-[#080d1a] border-x border-slate-800/40"
          style={containerMaxWidthStyle}
        >
          {/* Lado Esquerdo: Empresa e Plano */}
          <div className="flex items-center gap-2.5 truncate">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[120px] sm:max-w-none">{companyName}</span>
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                !companyData.has_active_subscription
                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
              }`}
            >
              {!companyData.has_active_subscription ? "Sem Assinatura" : `Plano ${companyPlan}`}
            </span>
          </div>

          {/* Centro: Limites da Assinatura (exibido apenas quando houver assinatura ativa) */}
          {companyData.has_active_subscription && quotas && (
            <div className="hidden md:flex items-center gap-3 lg:gap-4 text-[11px]">
              <div className="flex items-center gap-1.5" title="Limite de Grupos WhatsApp">
                <Users2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-400">Grupos:</span>
                <span className={getQuotaStatusClass(quotas.groups.current, quotas.groups.limit)}>
                  {quotas.groups.current} / {quotas.groups.limit > 0 ? quotas.groups.limit : "∞"}
                </span>
              </div>

              <span className="text-slate-700">&bull;</span>

              <div className="flex items-center gap-1.5" title="Limite de Produtos no Catálogo">
                <Package className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-slate-400">Produtos:</span>
                <span className={getQuotaStatusClass(quotas.products.current, quotas.products.limit)}>
                  {quotas.products.current} / {quotas.products.limit > 0 ? quotas.products.limit : "∞"}
                </span>
              </div>

              <span className="text-slate-700">&bull;</span>

              <div className="flex items-center gap-1.5" title="Limite de Visualizações das Landing Pages">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Views:</span>
                <span className={getQuotaStatusClass(quotas.views.current, quotas.views.limit)}>
                  {quotas.views.current} / {quotas.views.limit > 0 ? quotas.views.limit : "∞"}
                </span>
              </div>

              {quotas.leads && (
                <>
                  <span className="text-slate-700">&bull;</span>

                  <div className="flex items-center gap-1.5" title="Total de Leads Capturados vs Limite da Assinatura">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-400">Leads:</span>
                    <span className={getQuotaStatusClass(quotas.leads.current, quotas.leads.limit)}>
                      {quotas.leads.current} / {quotas.leads.limit > 0 ? quotas.leads.limit : "∞"}
                    </span>
                  </div>
                </>
              )}

              <span className="text-slate-700">&bull;</span>

              <div className="flex items-center gap-1.5" title="Disparos realizados hoje vs Limite Diário de WhatsApp">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">Disparos/dia:</span>
                <span className={getQuotaStatusClass(quotas.messages_day.current, quotas.messages_day.limit)}>
                  {quotas.messages_day.current} / {quotas.messages_day.limit > 0 ? quotas.messages_day.limit : "∞"}
                </span>
              </div>
            </div>
          )}

          {/* Lado Direito: Versão */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-300">
              <Zap className="w-3 h-3 text-amber-400" />
              v{SYSTEM_VERSION}
            </span>
          </div>
        </div>
      </footer>

      {/* 5. MODAL DE CONFIRMAÇÃO DE LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setShowLogoutModal(false)}
          />

          <div className="relative w-full max-w-md rounded-2xl bg-[#0b1120] border border-slate-800 p-6 shadow-2xl shadow-black space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Deseja realmente sair?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sua sessão será encerrada com segurança e você precisará autenticar novamente para acessar o portal da empresa.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/30 whitespace-nowrap cursor-pointer disabled:opacity-60"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                <span>Confirmar e Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
