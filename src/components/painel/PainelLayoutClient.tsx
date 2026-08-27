"use client";

import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { SYSTEM_VERSION, SYSTEM_NAME } from "@/lib/config";
import { useLayout } from "@/context/LayoutContext";
import { CompanyWhatsappStatusIndicator } from "./CompanyWhatsappStatusIndicator";
import { DatabaseStatusIndicator } from "@/components/auth/DatabaseStatusIndicator";
import { EvolutionStatusIndicator } from "@/components/auth/EvolutionStatusIndicator";
import { RedisStatusIndicator } from "@/components/auth/RedisStatusIndicator";
import { Pm2StatusIndicator } from "@/components/auth/Pm2StatusIndicator";

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
      { name: "Grupos WhatsApp", href: "/painel/grupos", icon: Users2, badge: "Base Local", module: "grupos" },
      { name: "Produtos & Ofertas", href: "/painel/produtos", icon: Package, badge: null, module: "produtos" },
      { name: "Gestão de Leads", href: "/painel/leads", icon: UserCheck, badge: "Em Breve", module: "leads" },
    ],
  },
  {
    category: "Configurações",
    icon: Settings,
    items: [
      { name: "WhatsApp & Empresa", href: "/painel/configuracoes", icon: Settings, badge: null, module: "configuracoes" },
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
    name: initialUser?.name || "Administrador da Empresa",
    email: initialUser?.email || "",
    role: initialUser?.role || "COMPANY_ADMIN",
    isLoaded: !!initialUser,
  });

  const [companyData, setCompanyData] = useState<{
    id: number;
    name: string;
    plan: string;
    status: string;
  }>({
    id: initialCompany?.id || 1,
    name: initialCompany?.name || "JH7 Marketing",
    plan: initialCompany?.plan || "Pro",
    status: initialCompany?.status || "active",
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
    async function loadData() {
      try {
        const res = await fetch("/api/painel/dashboard");
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            if (json.user) {
              setUserData({
                name: json.user.name || "Administrador da Empresa",
                email: json.user.email || "",
                role: json.user.role || "COMPANY_ADMIN",
                isLoaded: true,
              });
            }
            if (json.company) {
              setCompanyData({
                id: json.company.id || 1,
                name: json.company.name || "JH7 Marketing",
                plan: json.company.plan || "Pro",
                status: json.company.status || "active",
              });
            }
          }
        }
      } catch {
        // Fallback silencioso
      }
    }
    if (!initialUser || !initialCompany) {
      loadData();
    }
  }, [initialUser, initialCompany, pathname]);

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
    return pathname === href || pathname.startsWith(`${href}/`);
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

  // Se for a tela de login, não renderiza sidebar/layout
  if (pathname === "/painel/login") {
    return <>{children}</>;
  }

  const userName = userData.name;
  const userEmail = userData.email;
  const userInitials = getInitials(userName);
  const companyName = companyData.name;
  const companyPlan = companyData.plan;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* BARRA SUPERIOR DE IMPERSONAÇÃO */}
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold border-b border-amber-300 flex items-center justify-between shadow-md">
          <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2">
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

      {/* 1. HEADER FIXO COM CONTAINER LARGURA MÁXIMA */}
      <header
        className={`fixed left-0 right-0 z-40 h-16 bg-[#090f1d]/90 backdrop-blur-xl border-b border-slate-800/80 flex justify-center shadow-lg shadow-black/40 ${
          isImpersonating ? "top-8" : "top-0"
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
                <div className="flex items-center gap-2">
                  <span className="font-black tracking-tight text-base bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent truncate max-w-[150px] sm:max-w-xs">
                    {companyName}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                    {companyPlan}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  {SYSTEM_NAME} &bull; Portal do Cliente
                </span>
              </div>
            </Link>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            
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
                  <span className="text-[10px] text-slate-400 truncate max-w-[130px]">{userEmail || "Operador"}</span>
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
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{userEmail || "sem-email@empresa.com"}</p>
                  </div>

                  {/* Actions */}
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={handleRefreshPermissions}
                      disabled={isRefreshingPerms}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors disabled:opacity-60 text-left cursor-pointer"
                    >
                      <RotateCw
                        className={`w-4 h-4 text-emerald-400 ${
                          isRefreshingPerms ? "animate-spin" : ""
                        }`}
                      />
                      <span>{isRefreshingPerms ? "Recarregando..." : "Recarregar Permissões"}</span>
                    </button>

                    {userData.role === "SUPER_ADMIN" && (
                      <Link
                        href="/sa/inicio"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-colors"
                      >
                        <Sliders className="w-4 h-4 text-indigo-400" />
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
          isImpersonating ? "pt-24" : "pt-16"
        }`}
      >
        <div
          className="w-full flex relative transition-all duration-300 bg-[#080d1a] border-x border-slate-800/50 shadow-2xl shadow-black/80 items-stretch"
          style={containerMaxWidthStyle}
        >
          {/* SIDEBAR DESKTOP */}
          <aside
            className={`hidden md:flex flex-col sticky self-start shrink-0 bg-[#080d1a] border-r border-slate-800/80 transition-all duration-300 z-30 ${
              isImpersonating ? "top-24 h-[calc(100vh-6rem)]" : "top-16 h-[calc(100vh-4rem)]"
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
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* 4. FOOTER FIXO COM CONTAINER LARGURA MÁXIMA */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 h-12 bg-[#090f1d]/90 backdrop-blur-xl border-t border-slate-800/80 flex justify-center text-xs text-slate-400 shadow-inner">
        <div
          className="w-full h-full px-4 sm:px-6 flex items-center justify-between transition-all duration-300 bg-[#080d1a] border-x border-slate-800/40"
          style={containerMaxWidthStyle}
        >
          <div className="flex items-center gap-3 truncate">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              {companyName}
            </span>
            <span className="text-slate-600 hidden sm:inline">&bull;</span>
            <span className="text-slate-400 hidden sm:inline">Marketing & Grupos WhatsApp</span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <DatabaseStatusIndicator />
            <RedisStatusIndicator />
            <Pm2StatusIndicator />
            <EvolutionStatusIndicator />

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
