"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  LayoutDashboard,
  Shield,
  Building2,
  Users,
  Activity,
  Zap,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  Lock,
  Ghost,
  SmilePlus,
} from "lucide-react";
import { SaPageHeader } from "@/components/sa/SaPageHeader";
import { hasUserPermission } from "@/lib/permissions";

export default function SaHomePage() {
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    role: string;
    permissions: Record<string, any> | null;
  }>({
    name: "Administrador",
    email: "",
    role: "SUPER_ADMIN",
    permissions: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/sa/profile");
        const json = await res.json();
        if (json.success && json.user) {
          setUserData({
            name: json.user.name || "Administrador",
            email: json.user.email || "",
            role: json.user.role || "SUPER_ADMIN",
            permissions: json.user.permissions || null,
          });
        }
      } catch {
        // Fallback silencioso
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const quickLinks = [
    {
      title: "Dashboard Central",
      description: "Métricas de faturamento, novos clientes e visão executiva consolidada.",
      href: "/sa",
      module: "dashboard",
      icon: LayoutDashboard,
      color: "from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/30",
    },
    {
      title: "Métricas & Saúde",
      description: "Telemetria de banco de dados, Redis, Evolution API e infraestrutura.",
      href: "/sa/health",
      module: "health",
      icon: Activity,
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
    },
    {
      title: "Empresas & Clientes",
      description: "Gerenciar tenants, empresas clientes, planos e limites operacionais.",
      href: "/sa/companies",
      module: "companies",
      icon: Building2,
      color: "from-violet-500/20 to-purple-500/20 text-violet-400 border-violet-500/30",
    },
    {
      title: "Usuários & Acessos",
      description: "Controle de permissões granulares, operadores e super administradores.",
      href: "/sa/users",
      module: "users",
      icon: Users,
      color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. CABEÇALHO PADRÃO */}
      <SaPageHeader
        title="Início & Boas-vindas"
        subtitle="Portal administrativo central da plataforma de automação e governança"
        icon={Sparkles}
        badge="Acesso Autorizado"
        badgeVariant="emerald"
      />

      {/* 2. CARD HERO DE BOAS-VINDAS COM NOME DO USUÁRIO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/60 via-[#090f1d] to-slate-950/90 border border-indigo-500/30 p-8 sm:p-10 shadow-2xl shadow-indigo-950/30">
        {/* Glow de fundo decorativo */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sessão Autenticada com Segurança</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {getGreeting()},{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200">
              {loading ? "..." : userData.name}!
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Seja bem-vindo ao painel central do <strong className="text-white font-semibold">JH7 Marketing</strong>.
            Você está conectado como{" "}
            <span className="font-semibold text-indigo-300">
              {userData.role === "SUPER_ADMIN" ? "Super Administrador" : "Operador Autorizado"}
            </span>
            . Navegue pelo menu lateral para gerenciar os módulos do sistema.
          </p>
        </div>
      </div>

      {/* 3. ATALHOS RÁPIDOS PRINCIPAIS */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-400" />
          Acesso Rápido aos Módulos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((item, idx) => {
            const hasAccess = hasUserPermission(userData.role, userData.permissions, item.module, "view");
            const Icon = item.icon;

            if (!hasAccess) {
              return (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-5 shadow-xl shadow-black/20 flex flex-col justify-between select-none"
                >
                  {/* Conteúdo base do card (visível por baixo) */}
                  <div className="space-y-2.5 opacity-40">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} border flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-300">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-500 opacity-40">
                    <span>Módulo Restrito</span>
                    <Lock className="w-3.5 h-3.5" />
                  </div>

                  {/* Capa semitransparente sobreposta com badge e ícone animado */}
                  <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center z-10">
                    <div className="relative mb-2">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50">
                        {idx % 2 === 0 ? (
                          <Ghost className="w-5 h-5 animate-bounce" />
                        ) : (
                          <SmilePlus className="w-5 h-5 animate-pulse" />
                        )}
                      </div>
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 text-[8px] font-black text-white items-center justify-center">
                          !
                        </span>
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm">
                      SEM PERMISSÃO 🚫
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">
                      Acesso restrito ao operador
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={idx}
                href={item.href}
                className="group rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 hover:border-indigo-500/40 p-5 shadow-xl shadow-black/20 transition-all hover:scale-[1.02] flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} border flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                  <span>Abrir Módulo</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
