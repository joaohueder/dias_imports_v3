"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Users2,
  AlertCircle
} from "lucide-react";
import { AnimatedBackground } from "./AnimatedBackground";
import { DatabaseStatusIndicator } from "./DatabaseStatusIndicator";

interface AuthLayoutProps {
  type: "sa" | "painel";
}

export function AuthFormLayout({ type }: AuthLayoutProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isSaas = type === "sa";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, portalType: type }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Falha na autenticação.");
        setIsLoading(false);
        return;
      }

      // Redireciona conforme o papel do usuário
      router.push(data.redirectTo);
    } catch {
      setErrorMessage("Erro ao conectar com o servidor. Verifique sua conexão.");
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100 ${
        isSaas 
          ? "selection:bg-indigo-500/30 selection:text-indigo-300" 
          : "selection:bg-emerald-500/30 selection:text-emerald-300"
      }`}
    >
      <AnimatedBackground variant={isSaas ? "saas" : "empresa"} />

      {/* Main Glassmorphic Container */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-black/80">
        
        {/* Left Column: Branding, Context & System Presentation */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/60 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-950/80">
          <div>
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div 
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg border ${
                  isSaas 
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-indigo-500/10" 
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10"
                }`}
              >
                {isSaas ? (
                  <Shield className="w-6 h-6" />
                ) : (
                  <MessageSquareShare className="w-6 h-6" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  JH7 Marketing
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    isSaas 
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" 
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  }`}>
                    {isSaas ? "Super Admin" : "Empresa"}
                  </span>
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  {isSaas 
                    ? "Plataforma de Gestão SaaS e Infraestrutura" 
                    : "Gerenciamento de Marketing em Grupos de WhatsApp"}
                </p>
              </div>
            </div>

            {/* Main Value Proposition */}
            <div className="mt-10 space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {isSaas ? (
                  <>
                    Controle total do ecossistema <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400 bg-clip-text text-transparent">SaaS Multi-Tenant</span>
                  </>
                ) : (
                  <>
                    Potencialize suas vendas automáticas em <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Grupos de WhatsApp</span>
                  </>
                )}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isSaas 
                  ? "Gerencie tenants, instâncias de WhatsApp, planos, monitoramento de saúde do sistema e métricas em tempo real em um único painel administrativo central."
                  : "Automatize ofertas, disparos inteligentes, rotatividade anti-bloqueio e gere leads qualificados através dos grupos mais lucrativos da sua operação."}
              </p>

              {/* Feature Highlights Grid */}
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isSaas ? (
                  <>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
                      <Layers className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">Multi-Empresas</h4>
                        <p className="text-[11px] text-slate-400">Isolamento seguro de dados</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
                      <Server className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">Instâncias & Filas</h4>
                        <p className="text-[11px] text-slate-400">BullMQ & Redis otimizados</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
                      <Users2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">Gestão de Contas</h4>
                        <p className="text-[11px] text-slate-400">Supervisão de assinantes</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
                      <Zap className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">Painel Operacional</h4>
                        <p className="text-[11px] text-slate-400">Métricas em tempo real</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
                      <Bot className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">Automação de Ofertas</h4>
                        <p className="text-[11px] text-slate-400">Disparos programados e loops</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
                      <Sparkles className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">Gestão de Grupos</h4>
                        <p className="text-[11px] text-slate-400">Organização e segmentação</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
                      <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">Alta Velocidade</h4>
                        <p className="text-[11px] text-slate-400">Envios com filas prioritárias</p>
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
          <div className="mt-12 pt-6 border-t border-slate-800/60 flex items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span>Desenvolvido por JH7</span>
              <DatabaseStatusIndicator />
            </div>
            <span className="text-slate-400">v2026.08.0007</span>
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

            {/* Error Message Box */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

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
                    placeholder={isSaas ? "admin@seusistema.com" : "exemplo@empresa.com"}
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