"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  MessageSquareShare, 
  Sparkles, 
  ShieldCheck, 
  Bot, 
  Zap,
  Building2,
  Shield,
  Layers,
  Server,
  Users2
} from "lucide-react";
import { AnimatedBackground } from "./AnimatedBackground";

interface AuthLayoutProps {
  type: "sa" | "painel";
}

export function AuthFormLayout({ type }: AuthLayoutProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isSaas = type === "sa";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div 
      className={`relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100 ${
        isSaas 
          ? "selection:bg-indigo-500/30 selection:text-indigo-300" 
          : "selection:bg-emerald-500/30 selection:text-emerald-300"
      }`}
    >
      <AnimatedBackground palette={isSaas ? "indigo" : "emerald"} />

      {/* Main Container */}
      <div 
        className={`w-full max-w-6xl rounded-3xl border bg-slate-900/60 backdrop-blur-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] ${
          isSaas 
            ? "border-indigo-950/80 shadow-indigo-950/20" 
            : "border-slate-800/80 shadow-emerald-950/20"
        }`}
      >
        
        {/* Left Column */}
        <div 
          className={`relative lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r ${
            isSaas
              ? "border-indigo-900/40 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-indigo-950/30"
              : "border-slate-800/60 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-emerald-950/20"
          }`}
        >
          {/* Subtle decoration inside card */}
          <div 
            className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none ${
              isSaas ? "bg-indigo-500/15" : "bg-emerald-500/10"
            }`} 
          />
          
          <div>
            {/* Top Logo / Identity */}
            <div className="flex items-center gap-3">
              <div 
                className={`flex items-center justify-center w-11 h-11 rounded-2xl shadow-lg ${
                  isSaas 
                    ? "bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-indigo-500/25" 
                    : "bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-emerald-500/25"
                }`}
              >
                {isSaas ? (
                  <Shield className="w-6 h-6 text-white" />
                ) : (
                  <MessageSquareShare className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  JH7 Marketing 
                  <span 
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      isSaas 
                        ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300" 
                        : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    }`}
                  >
                    {isSaas ? "Super Admin" : "Empresas"}
                  </span>
                </span>
                <p className="text-xs text-slate-400 font-medium">
                  {isSaas ? "Gestão Global da Infraestrutura SaaS" : "Gerenciamento de Marketing em Grupos de WhatsApp"}
                </p>
              </div>
            </div>

            {/* Middle Content */}
            <div className="mt-12 sm:mt-16 space-y-6">
              <div 
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${
                  isSaas 
                    ? "bg-indigo-950/60 border-indigo-800/60 text-indigo-300" 
                    : "bg-slate-800/80 border-slate-700/60 text-emerald-400"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSaas ? "Controle Central & Multi-Tenant" : "Marketing & Automação Inteligente"}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {isSaas ? (
                  <>
                    Central de controle e gestão de <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200 bg-clip-text text-transparent">Tenants</span>.
                  </>
                ) : (
                  <>
                    Potencialize suas vendas em grupos de <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">WhatsApp</span>.
                  </>
                )}
              </h1>

              {/* In construction / Brief explanation tag */}
              <div 
                className={`rounded-2xl bg-slate-950/50 border p-5 backdrop-blur-sm space-y-3 ${
                  isSaas ? "border-indigo-900/40" : "border-slate-800/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                    <Zap className={`w-3.5 h-3.5 ${isSaas ? "text-indigo-400" : "text-emerald-400"}`} /> 
                    {isSaas ? "Visão Geral do SaaS" : "Visão Geral da Plataforma"}
                  </span>
                  <span 
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      isSaas 
                        ? "text-indigo-300 bg-indigo-500/10 border-indigo-500/25" 
                        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    }`}
                  >
                    Em Breve
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {isSaas ? (
                    "Gerencie planos, empresas cadastradas, instâncias de WhatsApp, métricas de faturamento e infraestrutura de envio em larga escala."
                  ) : (
                    "Automatize o envio de ofertas, controle múltiplos grupos e impulsione a conversão da sua empresa de maneira escalável e segura."
                  )}
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {isSaas ? (
                  <>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
                      <Users2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">Gestão de Empresas</h4>
                        <p className="text-[11px] text-slate-400">Assinaturas e acessos</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
                      <Server className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">Instâncias & Filas</h4>
                        <p className="text-[11px] text-slate-400">Monitoramento em tempo real</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
                      <Bot className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">Disparos Programados</h4>
                        <p className="text-[11px] text-slate-400">Ofertas no momento ideal</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
                      <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">Anti-Bloqueio</h4>
                        <p className="text-[11px] text-slate-400">Proteção e rotação de envios</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer info */}
          <div className="mt-12 pt-6 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
            <span>Desenvolvido por JH7</span>
            <span className="text-slate-400">v2026.08.0001</span>
          </div>
        </div>

        {/* Right Column: Authentication Form */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center bg-slate-900/30">
          <div className="max-w-md w-full mx-auto space-y-8">
            
            {/* Header / Type Badge */}
            <div>
              <div 
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium mb-3 ${
                  isSaas 
                    ? "bg-indigo-500/10 border-indigo-500/25 text-indigo-300" 
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}
              >
                {isSaas ? <Shield className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                <span>{isSaas ? "Super Admin" : "Portal da Empresa"}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {isSaas ? "Acesso Administrativo" : "Acessar Painel"}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {isSaas 
                  ? "Gerenciamento global e configurações do ecossistema SaaS." 
                  : "Entre com as credenciais da sua empresa para continuar."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* E-mail Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  E-mail
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isSaas ? "admin@diasimports.com" : "exemplo@empresa.com"}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-950/60 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      isSaas
                        ? "border-slate-800 focus:ring-indigo-500/40 focus:border-indigo-500"
                        : "border-slate-800 focus:ring-emerald-500/40 focus:border-emerald-500"
                    }`}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Senha
                  </label>
                  <Link
                    href="#"
                    className={`text-xs font-medium transition-colors ${
                      isSaas 
                        ? "text-indigo-400 hover:text-indigo-300" 
                        : "text-emerald-400 hover:text-emerald-300"
                    }`}
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`w-full pl-10 pr-11 py-3 bg-slate-950/60 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      isSaas
                        ? "border-slate-800 focus:ring-indigo-500/40 focus:border-indigo-500"
                        : "border-slate-800 focus:ring-emerald-500/40 focus:border-emerald-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group ${
                  isSaas
                    ? "text-white bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 hover:from-indigo-400 hover:to-violet-400 shadow-indigo-500/25"
                    : "text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300 hover:from-emerald-300 hover:to-teal-300 shadow-emerald-500/20"
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isSaas ? "Entrar no Painel Super Admin" : "Entrar no Painel"}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Switch Links between Portals */}
            <div className="pt-4 border-t border-slate-800/60 text-center">
              <p className="text-xs text-slate-500">
                {isSaas ? (
                  <>
                    Acessar o portal de clientes?{" "}
                    <Link
                      href="/painel/login"
                      className="text-indigo-400 hover:underline font-medium"
                    >
                      Login da Empresa
                    </Link>
                  </>
                ) : (
                  <>
                    É um administrador da plataforma?{" "}
                    <Link
                      href="/sa/login"
                      className="text-emerald-400 hover:underline font-medium"
                    >
                      Painel Super Admin
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
