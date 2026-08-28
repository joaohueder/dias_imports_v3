"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Home,
  Building2,
  Users,
  Server,
  Cpu,
  Database,
  KeyRound,
  FileCode2,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Layers,
  Zap,
  User,
  RefreshCw,
  AlertTriangle,
  ListTodo,
} from "lucide-react";
import { toast } from "sonner";
import { DatabaseStatusIndicator } from "@/components/auth/DatabaseStatusIndicator";
import { EvolutionStatusIndicator } from "@/components/auth/EvolutionStatusIndicator";
import { WhatsappDefaultStatusIndicator } from "@/components/auth/WhatsappDefaultStatusIndicator";
import { RedisStatusIndicator } from "@/components/auth/RedisStatusIndicator";
import { Pm2StatusIndicator } from "@/components/auth/Pm2StatusIndicator";
import { ClusterStatusIndicator } from "@/components/painel/ClusterStatusIndicator";
import { SYSTEM_VERSION } from "@/lib/config";
import { hasUserPermission, getModuleFromPath } from "@/lib/permissions";
import { useLayout } from "@/context/LayoutContext";

interface SaLayoutClientProps {
  children: React.ReactNode;
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
    isStandalone: true,
    items: [
      { name: "Início", href: "/sa/inicio", icon: Home, badge: null, module: "inicio" },
    ],
  },
  {
    category: "Visão Geral",
    icon: LayoutDashboard,
    items: [
      { name: "Dashboard", href: "/sa", icon: LayoutDashboard, badge: null, module: "dashboard" },
      { name: "Métricas & Saúde", href: "/sa/health", icon: Activity, badge: "Realtime", module: "health" },
    ],
  },
  {
    category: "Governança e Empresas",
    icon: Building2,
    items: [
      { name: "Empresas", href: "/sa/companies", icon: Building2, badge: null, module: "companies" },
      { name: "Planos", href: "/sa/plans", icon: Layers, badge: null, module: "plans" },
      { name: "Assinaturas", href: "/sa/subscriptions", icon: Zap, badge: null, module: "subscriptions" },
      { name: "Usuários", href: "/sa/users", icon: Users, badge: null, module: "users" },
    ],
  },
  {
    category: "Infra e Banco de Dados",
    icon: Server,
    items: [
      { name: "Migrations & DB", href: "/sa/migrations", icon: Database, badge: "Seguro", module: "migrations" },
      { name: "Instâncias WhatsApp", href: "/sa/instances", icon: Server, badge: null, module: "instances" },
      { name: "Workers", href: "/sa/workers", icon: Cpu, badge: null, module: "workers" },
      { name: "Central de Tarefas", href: "/sa/jobs", icon: ListTodo, badge: null, module: "jobs" },
      { name: "Logs de Auditoria", href: "/sa/logs", icon: FileCode2, badge: null, module: "logs" },
    ],
  },
  {
    category: "Configurações",
    icon: Settings,
    items: [
      { name: "Parâmetros do SaaS", href: "/sa/settings", icon: Settings, badge: null, module: "settings" },
      { name: "Instância Padrão", href: "/sa/default-instance", icon: Server, badge: null, module: "default_instance" },
    ],
  },
];

function getInitials(name: string): string {
  if (!name) return "SA";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SaLayoutClient({ children }: SaLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { containerMaxWidthStyle } = useLayout();

  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    role: string;
    permissions: Record<string, any> | null;
    isLoaded: boolean;
  }>({
    name: "Administrador",
    email: "carregando...",
    role: "ADMIN",
    permissions: null,
    isLoaded: false,
  });

  const userName = userData.name;
  const userEmail = userData.email;
  const userInitials = getInitials(userName);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isRefreshingPerms, setIsRefreshingPerms] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const [pendingMigrationsCount, setPendingMigrationsCount] = useState<number>(0);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Monitorar periodicamente o status de migrations para alertar no menu se o usuário tiver permissão
  useEffect(() => {
    if (!userData.isLoaded) return;
    
    // Se não for SUPER_ADMIN e não tiver permissão de view no módulo migrations, não consultar
    const hasMigrationAccess =
      userData.role === "SUPER_ADMIN" ||
      userData.permissions?.migrations?.view === true;

    if (!hasMigrationAccess) return;

    let isMounted = true;
    const checkMigrations = async () => {
      try {
        const res = await fetch("/api/sa/migrations");
        if (res.status === 401 || res.status === 403 || !res.ok) return;
        const data = await res.json();
        if (isMounted && data.success && typeof data.pendingCount === "number") {
          setPendingMigrationsCount(data.pendingCount);
        }
      } catch {
        // Falha silenciosa
      }
    };

    checkMigrations();
    const interval = setInterval(checkMigrations, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userData.isLoaded, userData.role, userData.permissions]);

  // Abrir exclusivamente o submenu correspondente à rota atual
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

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("/api/sa/profile");
      const data = await res.json();
      if (data.success && data.user) {
        setUserData({
          name: data.user.name || "Administrador",
          email: data.user.email || "",
          role: data.user.role || "ADMIN",
          permissions: data.user.permissions || null,
          isLoaded: true,
        });
      }
    } catch (err) {
      console.warn("Falha ao carregar perfil do operador:", err);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [pathname]);

  // Verificar se o usuário tem permissão para a rota atual
  const currentModule = getModuleFromPath(pathname);
  const isAuthorized =
    !currentModule ||
    !userData.isLoaded ||
    userData.role === "SUPER_ADMIN" ||
    hasUserPermission(userData.role, userData.permissions, currentModule, "view");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isItemActive = (href: string) => {
    if (href === "/sa") {
      return pathname === "/sa";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Não renderizar o layout com sidebar/header quando a rota for a tela de login
  if (pathname === "/sa/login") {
    return <>{children}</>;
  }

  const handleRefreshPermissions = () => {
    setIsRefreshingPerms(true);
    setTimeout(() => {
      setIsRefreshingPerms(false);
      setUserMenuOpen(false);
      const isSuper = userData?.role === "SUPER_ADMIN";
      toast.success(
        isSuper
          ? "Permissões de Super Admin recarregadas com sucesso!"
          : "Permissões de Administrador recarregadas com sucesso!",
        {
          description: isSuper
            ? "Sua sessão e privilégios de acesso global estão atualizados."
            : "Sua sessão e privilégios de acesso aos módulos foram atualizados.",
        }
      );
    }, 600);
  };

  const handleConfirmLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Falha de rede não impede a limpeza local
    } finally {
      if (typeof window !== "undefined") {
        try {
          localStorage.clear();
          sessionStorage.clear();
          document.cookie = "sa_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "sa_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "sa_user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        } catch {
          // Ignora caso de sandbox bloqueado
        }
      }
      setShowLogoutModal(false);
      setUserMenuOpen(false);
      toast.info("Sessão finalizada com sucesso!");
      window.location.href = "/sa/login";
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 1. HEADER FIXO COM CONTAINER LARGURA MÁXIMA */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#090f1d]/90 backdrop-blur-xl border-b border-slate-800/80 flex justify-center shadow-lg shadow-black/40">
        <div
          className="w-full h-full px-4 sm:px-6 flex items-center justify-between transition-all duration-300 bg-[#080d1a] border-x border-slate-800/40"
          style={containerMaxWidthStyle}
        >
          <div className="flex items-center gap-3">
            {/* Botão Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Abrir Menu Lateral"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Botão Desktop Recolher/Expandir Menu (No topo ao lado do logo) */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
              aria-label={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
              className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/60 hover:border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="h-5 w-px bg-slate-800/80 hidden md:block" />

            {/* Logo & Identidade do SaaS */}
            <Link href="/sa" className="flex items-center gap-3 group focus:outline-none">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 transition-transform group-hover:scale-105">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-black tracking-tight text-base bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  JH7 Marketing
                </span>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Painel Central de Governança
                </span>
              </div>
            </Link>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Status do Sistema */}
            <div className="hidden sm:flex items-center">
              <ClusterStatusIndicator />
            </div>

            {/* User Profile Menu Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700/80 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 group"
              >
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                    {userName}
                  </span>
                  <span className="text-[10px] text-slate-400">{userEmail}</span>
                </div>

                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/25 to-violet-500/25 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs shadow-inner group-hover:scale-105 transition-transform">
                  {userInitials}
                </div>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
                    userMenuOpen ? "rotate-180 text-indigo-400" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0b1120] border border-slate-800/90 shadow-2xl shadow-black/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Header User info */}
                  <div className="px-4 py-3 border-b border-slate-800/70">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{userName}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                        {userData.role === "SUPER_ADMIN" ? "SUPER ADMIN" : "ADMIN"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{userEmail}</p>
                  </div>

                  {/* Actions */}
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href="/sa/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      <User className="w-4 h-4 text-indigo-400" />
                      <span>Editar Perfil</span>
                    </Link>

                    <button
                      onClick={handleRefreshPermissions}
                      disabled={isRefreshingPerms}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors disabled:opacity-60 text-left"
                    >
                      <RefreshCw
                        className={`w-4 h-4 text-violet-400 ${
                          isRefreshingPerms ? "animate-spin text-indigo-400" : ""
                        }`}
                      />
                      <span>{isRefreshingPerms ? "Recarregando..." : "Recarregar Permissões"}</span>
                    </button>
                  </div>

                  <div className="p-1.5 pt-1 border-t border-slate-800/70">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. CORPO (BARRA DE MENU LATERAL + MAIN) CENTRALIZADO NA LARGURA */}
      <div className="w-full flex-1 flex justify-center pt-16 pb-6 min-h-screen">
        <div
          className="w-full flex relative transition-all duration-300 bg-[#080d1a] border-x border-slate-800/50 shadow-2xl shadow-black/80 items-stretch"
          style={containerMaxWidthStyle}
        >
          {/* SIDEBAR DESKTOP - DESIGN MODERNO CLEAN & INTEGRADO */}
          <aside
            className={`hidden md:flex flex-col sticky top-16 self-start h-[calc(100vh-4rem)] shrink-0 bg-[#080d1a] border-r border-slate-800/80 transition-all duration-300 z-30 ${
              sidebarCollapsed ? "w-20" : "w-72"
            }`}
          >
            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto pt-[30px] pb-4 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-transparent">
              {navigationItems
                .map((group) => {
                  const visibleItems = group.items.filter(
                    (item) =>
                      !userData.isLoaded ||
                      userData.role === "SUPER_ADMIN" ||
                      hasUserPermission(userData.role, userData.permissions, item.module, "view")
                  );
                  return { ...group, items: visibleItems };
                })
                .filter((group) => group.items.length > 0)
                .map((group, gIdx) => {
                  const isExpanded = !!openSubmenus[group.category || ""];
                  const hasActiveChild = group.items.some((item) => isItemActive(item.href));
                  const GroupIcon = group.icon;
                  const groupHasPendingMigrations =
                    pendingMigrationsCount > 0 &&
                    group.items.some((item) => item.href === "/sa/migrations");

                  // Itens standalone (sem submenu colapsável)
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
                                  ? "bg-indigo-600/15 text-white border border-indigo-500/40 shadow-sm shadow-indigo-600/10 font-semibold"
                                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/70 border border-transparent"
                              }`}
                            >
                              {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full shadow-sm shadow-indigo-500" />
                              )}
                              <div
                                className={`relative p-1.5 rounded-lg transition-all shrink-0 ${
                                  isActive
                                    ? "bg-indigo-500/25 text-indigo-300"
                                    : "text-slate-400 group-hover:text-indigo-400 group-hover:bg-slate-800/80"
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
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all group/header ${
                            groupHasPendingMigrations
                              ? "text-amber-300 bg-amber-500/10 border border-amber-500/30"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-1">
                            <GroupIcon
                              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                groupHasPendingMigrations
                                  ? "text-amber-400"
                                  : "text-indigo-400/80 group-hover/header:text-indigo-400"
                              }`}
                            />
                            <span className="whitespace-nowrap">{group.category}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {groupHasPendingMigrations && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                              </span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-slate-850 border border-slate-800 text-slate-400">
                              {group.items.length}
                            </span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                groupHasPendingMigrations ? "text-amber-400" : "text-slate-400"
                              } ${isExpanded ? "rotate-0" : "-rotate-90 text-slate-500"}`}
                            />
                          </div>
                        </button>
                      ) : (
                        <div className="relative flex justify-center py-1 border-b border-slate-800/40 mb-1">
                          <GroupIcon
                            className={`w-4 h-4 ${
                              groupHasPendingMigrations ? "text-amber-400 animate-pulse" : "text-indigo-400/70"
                            }`}
                          />
                          {groupHasPendingMigrations && (
                            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          )}
                        </div>
                      )}

                      {(!sidebarCollapsed ? isExpanded : true) && (
                        <div className={`space-y-1 ${!sidebarCollapsed ? "pl-1.5" : ""}`}>
                          {group.items.map((item) => {
                            const isActive = isItemActive(item.href);
                            const Icon = item.icon;
                            const isMigrationsItem = item.href === "/sa/migrations";
                            const hasPendingMigrations = isMigrationsItem && pendingMigrationsCount > 0;

                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                title={
                                  hasPendingMigrations
                                    ? `${pendingMigrationsCount} migration(s) pendente(s)! Clique para aplicar.`
                                    : sidebarCollapsed
                                    ? item.name
                                    : undefined
                                }
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative overflow-hidden ${
                                  hasPendingMigrations
                                    ? "bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-transparent text-amber-200 border border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:border-amber-300 font-bold"
                                    : isActive
                                    ? "bg-indigo-600/15 text-white border border-indigo-500/40 shadow-sm shadow-indigo-600/10 font-semibold"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/70 border border-transparent"
                                }`}
                              >
                                {/* Efeito Sonar Radar ondulante cobrindo o botão inteiro do menu */}
                                {hasPendingMigrations && (
                                  <>
                                    <span className="absolute inset-0 bg-amber-400/10 animate-sonar-1 pointer-events-none rounded-xl" />
                                    <span className="absolute inset-0 bg-amber-500/5 animate-sonar-2 pointer-events-none rounded-xl" />
                                    <span className="absolute inset-0 border border-amber-400/40 rounded-xl animate-pulse pointer-events-none" />
                                  </>
                                )}

                                {isActive && !hasPendingMigrations && (
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full shadow-sm shadow-indigo-500" />
                                )}
                                {hasPendingMigrations && (
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-amber-400 rounded-r-full shadow-[0_0_10px_#f59e0b] animate-pulse" />
                                )}

                                <div
                                  className={`relative p-1.5 rounded-lg transition-all shrink-0 ${
                                    hasPendingMigrations
                                      ? "bg-amber-500/30 text-amber-300 ring-2 ring-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                                      : isActive
                                      ? "bg-indigo-500/25 text-indigo-300"
                                      : "text-slate-400 group-hover:text-indigo-400 group-hover:bg-slate-800/80"
                                  }`}
                                >
                                  {hasPendingMigrations ? (
                                    <>
                                      <AlertTriangle className="w-4 h-4 text-amber-300 animate-bounce" />
                                      {/* Ondas do sonar no ícone */}
                                      <span className="absolute -inset-1 rounded-lg bg-amber-400/40 animate-ping opacity-80 pointer-events-none" />
                                    </>
                                  ) : (
                                    <Icon className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                                  )}
                                </div>

                                {!sidebarCollapsed && (
                                  <>
                                    <span className="flex-1 whitespace-nowrap text-xs tracking-tight">
                                      {item.name}
                                    </span>
                                    {hasPendingMigrations ? (
                                      <div className="relative flex items-center shrink-0">
                                        <span className="relative flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500/40 to-amber-600/40 text-amber-100 border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse">
                                          <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-90" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                                          </span>
                                          {pendingMigrationsCount} Pendente{pendingMigrationsCount > 1 ? "s" : ""}
                                        </span>
                                      </div>
                                    ) : item.badge ? (
                                      <span
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                                          item.badge === "Realtime"
                                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                                            : item.badge === "Seguro"
                                            ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                                            : "bg-slate-800 text-slate-400 border border-slate-700"
                                        }`}
                                      >
                                        {item.badge === "Realtime" && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        )}
                                        {item.badge}
                                      </span>
                                    ) : null}
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
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Panel */}
            <div className="relative flex-1 max-w-xs w-full bg-[#080d19] border-r border-slate-800 p-5 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-white">JH7 Marketing</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800/50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {navigationItems
                    .map((group) => {
                      const visibleItems = group.items.filter(
                        (item) =>
                          !userData.isLoaded ||
                          userData.role === "SUPER_ADMIN" ||
                          hasUserPermission(userData.role, userData.permissions, item.module, "view")
                      );
                      return { ...group, items: visibleItems };
                    })
                    .filter((group) => group.items.length > 0)
                    .map((group, gIdx) => {
                      const isExpanded = !!openSubmenus[group.category || ""];
                      const hasActiveChild = group.items.some((item) => isItemActive(item.href));
                      const GroupIcon = group.icon;
                      const groupHasPendingMigrations =
                        pendingMigrationsCount > 0 &&
                        group.items.some((item) => item.href === "/sa/migrations");

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
                                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                                      : "text-slate-300 hover:text-white hover:bg-slate-850"
                                  }`}
                                >
                                  <div
                                    className={`p-1.5 rounded-lg shrink-0 ${
                                      isActive ? "bg-white/20 text-white" : "bg-slate-800 text-indigo-400"
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
                              groupHasPendingMigrations
                                ? "text-amber-300 bg-amber-500/15 border border-amber-500/30"
                                : hasActiveChild
                                ? "text-indigo-300 bg-indigo-500/10"
                                : "text-slate-300 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`p-1 rounded-md shrink-0 ${
                                  groupHasPendingMigrations
                                    ? "bg-amber-500/20 text-amber-400"
                                    : hasActiveChild
                                    ? "bg-indigo-500/20 text-indigo-400"
                                    : "text-slate-400 bg-slate-800"
                                }`}
                              >
                                <GroupIcon className="w-4 h-4" />
                              </div>
                              <span className="uppercase tracking-wider text-[11px] font-bold truncate">
                                {group.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {groupHasPendingMigrations && (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                </span>
                              )}
                              <span className="text-[10px] px-1.5 py-0.2 font-semibold rounded bg-slate-800 text-slate-400">
                                {group.items.length}
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  groupHasPendingMigrations ? "text-amber-400" : "text-slate-400"
                                } ${isExpanded ? "rotate-0" : "-rotate-90 text-slate-500"}`}
                              />
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="space-y-1 pt-1 pl-2 border-l-2 border-slate-800 ml-3">
                              {group.items.map((item) => {
                                const isActive = isItemActive(item.href);
                                const Icon = item.icon;
                                const isMigrationsItem = item.href === "/sa/migrations";
                                const hasPendingMigrations = isMigrationsItem && pendingMigrationsCount > 0;

                                return (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all relative overflow-hidden ${
                                      hasPendingMigrations
                                        ? "bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-transparent text-amber-200 border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.35)] font-bold"
                                        : isActive
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                    }`}
                                  >
                                    {hasPendingMigrations && (
                                      <>
                                        <span className="absolute inset-0 bg-amber-400/10 animate-sonar-1 pointer-events-none rounded-lg" />
                                        <span className="absolute inset-0 border border-amber-400/40 rounded-lg animate-pulse pointer-events-none" />
                                      </>
                                    )}

                                    {hasPendingMigrations ? (
                                      <div className="relative shrink-0">
                                        <AlertTriangle className="w-4 h-4 text-amber-300 animate-bounce" />
                                        <span className="absolute -inset-1 rounded-full bg-amber-400/40 animate-ping opacity-80 pointer-events-none" />
                                      </div>
                                    ) : (
                                      <Icon className="w-4 h-4 shrink-0" />
                                    )}
                                    <span className="flex-1 whitespace-nowrap">{item.name}</span>
                                    {hasPendingMigrations ? (
                                      <span className="relative flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500/40 to-amber-600/40 text-amber-100 border border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] shrink-0 animate-pulse">
                                        <span className="relative flex h-1.5 w-1.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-90" />
                                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
                                        </span>
                                        {pendingMigrationsCount} Pendente{pendingMigrationsCount > 1 ? "s" : ""}
                                      </span>
                                    ) : item.badge ? (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 font-bold shrink-0">
                                        {item.badge}
                                      </span>
                                    ) : null}
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
                <DatabaseStatusIndicator />
                <div>
                  <EvolutionStatusIndicator />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. MAIN (CONTEÚDO PRINCIPAL SCROLLÁVEL) */}
        <main
          className="flex-1 transition-all duration-300 w-full overflow-y-auto p-4 sm:p-5 lg:p-6"
        >
          <div className="mx-auto space-y-4">
            {!isAuthorized ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-slate-900/40 rounded-3xl border border-rose-500/20 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5 shadow-lg shadow-rose-500/10">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white mb-2">
                  Acesso Restrito
                </h2>
                <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
                  Seu usuário (<span className="text-slate-200 font-semibold">{userEmail}</span>) não possui permissão de acesso ao módulo <span className="text-rose-400 font-semibold">{currentModule}</span>. Contate um Super Admin para solicitar privilégios.
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    href="/sa"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Voltar ao Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>

      {/* 4. FOOTER FIXO COM CONTAINER LARGURA MÁXIMA */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 h-12 bg-[#090f1d]/90 backdrop-blur-xl border-t border-slate-800/80 flex justify-center text-xs text-slate-400 shadow-inner">
        <div
          className="w-full h-full px-4 sm:px-6 flex items-center justify-between transition-all duration-300 bg-[#080d1a] border-x border-slate-800/40"
          style={containerMaxWidthStyle}
        >
          <div className="flex items-center gap-3 truncate">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              JH7 Marketing SaaS
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <DatabaseStatusIndicator />
            <RedisStatusIndicator />
            <Pm2StatusIndicator />
            <EvolutionStatusIndicator />
            <WhatsappDefaultStatusIndicator />

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-indigo-300">
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
                  Sua sessão será encerrada com segurança e você precisará autenticar novamente para acessar o painel de governança.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/30 transition-all"
              >
                Sim, sair agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}