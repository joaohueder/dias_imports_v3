"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Building2,
  Users,
  Server,
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
} from "lucide-react";
import { toast } from "sonner";
import { DatabaseStatusIndicator } from "@/components/auth/DatabaseStatusIndicator";

interface SaLayoutClientProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    category: "Visão Geral",
    items: [
      { name: "Dashboard", href: "/sa", icon: LayoutDashboard, badge: null },
      { name: "Métricas & Saúde", href: "/sa/health", icon: Activity, badge: "Realtime" },
    ],
  },
  {
    category: "Governança & Tenants",
    items: [
      { name: "Empresas (Tenants)", href: "/sa/tenants", icon: Building2, badge: "1" },
      { name: "Planos & Assinaturas", href: "/sa/plans", icon: Layers, badge: null },
      { name: "Super Admins", href: "/sa/users", icon: Users, badge: null },
    ],
  },
  {
    category: "Infra & Banco de Dados",
    items: [
      { name: "Migrations & DB", href: "/sa/migrations", icon: Database, badge: "Seguro" },
      { name: "Instâncias & Workers", href: "/sa/instances", icon: Server, badge: null },
      { name: "Chaves de API & Webhooks", href: "/sa/api-keys", icon: KeyRound, badge: null },
      { name: "Logs de Auditoria", href: "/sa/logs", icon: FileCode2, badge: null },
    ],
  },
  {
    category: "Configurações",
    items: [
      { name: "Parâmetros do SaaS", href: "/sa/settings", icon: Settings, badge: null },
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
  const userName = "João Hueder";
  const userEmail = "joaohueder@gmail.com";
  const userInitials = getInitials(userName);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isRefreshingPerms, setIsRefreshingPerms] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRefreshPermissions = () => {
    setIsRefreshingPerms(true);
    setTimeout(() => {
      setIsRefreshingPerms(false);
      setUserMenuOpen(false);
      toast.success("Permissões de Super Admin recarregadas com sucesso!", {
        description: "Sua sessão e privilégios de acesso global estão atualizados.",
      });
    }, 600);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    setUserMenuOpen(false);
    toast.info("Sessão finalizada");
    router.push("/sa/login");
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 1. HEADER FIXO */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#090f1d]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between shadow-lg shadow-black/40">
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
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      SUPER ADMIN
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
      </header>

      {/* 2. CORPO (BARRA DE MENU LATERAL + MAIN) */}
      <div className="flex-1 flex pt-16 pb-12 overflow-hidden min-h-screen">
        {/* SIDEBAR DESKTOP */}
        <aside
          className={`hidden md:flex flex-col fixed top-16 bottom-12 left-0 z-40 bg-[#080d19]/95 backdrop-blur-md border-r border-slate-800/80 transition-all duration-300 ${
            sidebarCollapsed ? "w-20" : "w-72"
          }`}
        >
          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-5 px-3.5 space-y-6 scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-transparent">
            {navigationItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                {!sidebarCollapsed ? (
                  <div className="px-3 pb-1 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {group.category}
                    </h3>
                  </div>
                ) : (
                  <div className="w-full flex justify-center py-1">
                    <div className="w-5 h-0.5 bg-slate-800 rounded-full" />
                  </div>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={sidebarCollapsed ? item.name : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                          isActive
                            ? "bg-gradient-to-r from-indigo-600/20 to-violet-600/10 text-indigo-200 border border-indigo-500/30 shadow-sm shadow-indigo-500/10 font-semibold"
                            : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 hover:border-slate-800/80 border border-transparent"
                        }`}
                      >
                        <div
                          className={`p-1 rounded-lg transition-colors shrink-0 ${
                            isActive
                              ? "bg-indigo-500/20 text-indigo-400"
                              : "text-slate-400 group-hover:text-indigo-400 group-hover:bg-slate-800"
                          }`}
                        >
                          <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                        </div>

                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1 whitespace-nowrap">{item.name}</span>
                            {item.badge && (
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                                  item.badge === "Realtime"
                                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                                    : item.badge === "Seguro"
                                    ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                                    : "bg-slate-800 text-slate-300 border border-slate-700"
                                }`}
                              >
                                {item.badge === "Realtime" && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                )}
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                        {isActive && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-5 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-l-full shadow-sm shadow-indigo-500" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
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

                <div className="space-y-5">
                  {navigationItems.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-1.5">
                      <h3 className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {group.category}
                      </h3>
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const isActive = pathname === item.href;
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                                isActive
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
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
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 mt-6">
                <DatabaseStatusIndicator />
              </div>
            </div>
          </div>
        )}

        {/* 3. MAIN (CONTEÚDO PRINCIPAL SCROLLÁVEL) */}
        <main
          className={`flex-1 transition-all duration-300 w-full overflow-y-auto ${
            sidebarCollapsed ? "md:ml-20" : "md:ml-72"
          } p-4 sm:p-6 lg:p-8`}
        >
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>

      {/* 4. FOOTER FIXO */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 h-12 bg-[#090f1d]/95 backdrop-blur-xl border-t border-slate-800/80 px-4 sm:px-6 flex items-center justify-between text-xs text-slate-400 shadow-inner">
        <div className="flex items-center gap-3 truncate">
          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            JH7 Marketing SaaS
          </span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="hidden sm:inline text-slate-400">
            Super Admin Governance Engine
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <DatabaseStatusIndicator />

          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-indigo-300">
            <Zap className="w-3 h-3 text-amber-400" />
            v2026.08.0004
          </span>
          <span className="text-[11px] text-slate-400 hidden md:inline">
            © 2026 Todos os direitos reservados
          </span>
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
                  Sua sessão de Super Admin será encerrada com segurança e você precisará autenticar novamente para acessar o painel de governança.
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