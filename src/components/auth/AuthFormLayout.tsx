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
  AlertCircle,
  Smartphone,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  Key,
  HelpCircle
} from "lucide-react";
import { AnimatedBackground } from "./AnimatedBackground";
import { DatabaseStatusIndicator } from "./DatabaseStatusIndicator";
import { RedisStatusIndicator } from "./RedisStatusIndicator";
import { WhatsappDefaultStatusIndicator } from "./WhatsappDefaultStatusIndicator";
import { maskPhone } from "@/lib/validators";
import { SYSTEM_VERSION } from "@/lib/config";

interface AuthLayoutProps {
  type: "sa" | "painel";
}

export function AuthFormLayout({ type }: AuthLayoutProps) {
  const router = useRouter();
  
  // Super Admin Form State (E-mail + Senha)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Painel Empresa Form State (WhatsApp + OTP ou Código Reserva)
  const [whatsapp, setWhatsapp] = useState("");
  const [authMode, setAuthMode] = useState<"otp" | "backup_code">("otp");
  const [otpStep, setOtpStep] = useState<"whatsapp" | "code">("whatsapp");
  const [otpCode, setOtpCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [devOtpPreview, setDevOtpPreview] = useState<string | null>(null);
  const [instanceDisconnectedNotice, setInstanceDisconnectedNotice] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isSaas = type === "sa";

  // Login Super Admin (E-mail e Senha)
  const handleSaasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, portalType: type }),
      });

      const data = await response.json().catch(() => {
        return { success: false, message: "Resposta inválida do servidor." };
      });

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Falha na autenticação.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Login autorizado! Redirecionando...");
      window.location.href = data.redirectTo || "/sa/inicio";
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      setErrorMessage(`Erro ao conectar: ${errMsg}`);
      setIsLoading(false);
    }
  };

  // Solicitar envio do código OTP via WhatsApp
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setInstanceDisconnectedNotice(false);
    
    const cleanWa = whatsapp.replace(/\D/g, "");
    if (cleanWa.length < 10) {
      setErrorMessage("Informe um número de WhatsApp válido com DDD.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.instanceDisconnected) {
          setInstanceDisconnectedNotice(true);
          setAuthMode("backup_code");
          setErrorMessage(data.message || "WhatsApp central desconectado. Use seu código reserva.");
        } else {
          setErrorMessage(data.message || "Não foi possível enviar o código OTP.");
        }
        setIsLoading(false);
        return;
      }

      setOtpStep("code");
      setSuccessMessage(data.message || "Código enviado com sucesso via WhatsApp!");
      if (data.devOtpPreview) {
        setDevOtpPreview(data.devOtpPreview);
      }
    } catch {
      setErrorMessage("Erro ao solicitar código de verificação.");
    } finally {
      setIsLoading(false);
    }
  };

  // Validar código OTP e autenticar
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (otpCode.trim().length !== 6) {
      setErrorMessage("Digite o código de verificação de 6 dígitos.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp, code: otpCode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Código incorreto ou expirado.");
        setIsLoading(false);
        return;
      }

      router.push(data.redirectTo || "/painel");
    } catch {
      setErrorMessage("Erro de conexão ao validar o código.");
      setIsLoading(false);
    }
  };

  // Validar código reserva de emergência e autenticar
  const handleVerifyBackupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanWa = whatsapp.replace(/\D/g, "");
    if (cleanWa.length < 10) {
      setErrorMessage("Informe o número de WhatsApp cadastrado na empresa.");
      return;
    }

    if (!backupCode.trim()) {
      setErrorMessage("Digite o código reserva (ex: ABCD-1234).");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/backup-code/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp, code: backupCode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Código reserva inválido.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message || "Autenticado com sucesso via código reserva!");
      const targetUrl = data.redirectTo || "/painel";
      window.location.href = targetUrl;
    } catch {
      setErrorMessage("Erro ao autenticar com o código reserva.");
      setIsLoading(false);
    }
  };

  const handleBackupCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    setBackupCode(val);
    if (errorMessage) setErrorMessage("");
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(maskPhone(e.target.value));
    if (errorMessage) setErrorMessage("");
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtpCode(val);
    if (errorMessage) setErrorMessage("");
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
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
                <Sparkles className={`w-3.5 h-3.5 ${isSaas ? "text-indigo-400" : "text-emerald-400"}`} />
                <span>{isSaas ? "Console Master de Infraestrutura" : "Automação Segura via OTP WhatsApp"}</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                {isSaas ? (
                  <>Controle completo sobre o ecossistema SaaS.</>
                ) : (
                  <>Acesso sem senhas, seguro e direto no seu WhatsApp.</>
                )}
              </h2>
              
              <p className="text-slate-400 text-sm leading-relaxed">
                {isSaas 
                  ? "Gerencie tenants, instâncias de WhatsApp, filas em tempo real e parâmetros globais do servidor com governança centralizada."
                  : "Digite seu número de WhatsApp corporativo cadastrado para receber instantaneamente um código de uso único (OTP) de 6 dígitos."}
              </p>
            </div>

            {/* Feature Badges */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {isSaas ? (
                <>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-300">
                    <Server className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Monitoramento Realtime</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-300">
                    <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Multi-Tenancy Isolado</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Autenticação OTP 100% Segura</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-300">
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Acesso Imediato sem Senhas</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Database & Redis Health Badges on Bottom Left */}
          <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <DatabaseStatusIndicator />
              <RedisStatusIndicator />
              <WhatsappDefaultStatusIndicator />
            </div>
            <span className="text-[11px] text-slate-500 font-mono">v{SYSTEM_VERSION}</span>
          </div>
        </div>

        {/* Right Column: Form Container */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center bg-slate-900/40">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Form Title & Description */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {isSaas ? "Acesso Super Admin" : "Acesso à Empresa"}
                </h3>
                {!isSaas && (
                  <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("otp");
                        setErrorMessage("");
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        authMode === "otp"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Via OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("backup_code");
                        setErrorMessage("");
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        authMode === "backup_code"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Via Código
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isSaas 
                  ? "Credenciais restritas de administração SaaS"
                  : authMode === "backup_code"
                    ? "Acesse informando seu WhatsApp e um dos Códigos Reservas da empresa"
                    : otpStep === "whatsapp" 
                      ? "Informe o WhatsApp de acesso para receber o código OTP" 
                      : "Insira o código de 6 dígitos recebido no seu WhatsApp"}
              </p>
            </div>

            {/* Warning if central WhatsApp is disconnected */}
            {instanceDisconnectedNotice && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-300 text-xs animate-in fade-in">
                <Key className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div className="flex-1">
                  <span className="font-bold block mb-0.5">WhatsApp Central Desconectado</span>
                  O envio de SMS/WhatsApp OTP está temporariamente indisponível. Utilize um dos seus <strong>Códigos Reservas</strong> para efetuar o login imediatamente.
                </div>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-400 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-emerald-400 text-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{successMessage}</div>
              </div>
            )}

            {/* FORM: SAAS LOGIN (E-mail + Senha) */}
            {isSaas && (
              <form onSubmit={handleSaasSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    E-mail do Administrador
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@saas.com"
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Senha de Acesso
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar no Super Admin</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* FORM: PAINEL EMPRESA (WhatsApp -> OTP Code) */}
            {!isSaas && authMode === "otp" && otpStep === "whatsapp" && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    WhatsApp de Acesso da Empresa
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                    <input
                      type="text"
                      required
                      value={whatsapp}
                      onChange={handleWhatsappChange}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      className="w-full pl-10 pr-4 py-3 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-medium"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                    <span>Informe o número cadastrado no sistema.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("backup_code");
                        setErrorMessage("");
                      }}
                      className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
                    >
                      Usar Código Reserva
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enviando código...</span>
                    </>
                  ) : (
                    <>
                      <span>Receber Código OTP via WhatsApp</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* FORM: PAINEL EMPRESA - DIGITAÇÃO DO CÓDIGO OTP */}
            {!isSaas && authMode === "otp" && otpStep === "code" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Código de Verificação (6 Dígitos)
                    </label>
                    <span className="text-[11px] text-emerald-400 font-medium font-mono">
                      {whatsapp}
                    </span>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={otpCode}
                      onChange={handleOtpChange}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full pl-10 pr-4 py-3 text-center text-lg tracking-[0.4em] font-mono font-bold rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                    />
                  </div>
                  {devOtpPreview && (
                    <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <span className="text-[11px] text-emerald-400 font-mono">
                        Código de Teste: <strong>{devOtpPreview}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Validando código...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar no Painel</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep("whatsapp");
                      setOtpCode("");
                      setErrorMessage("");
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    ← Alterar número
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={isLoading}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    Reenviar código
                  </button>
                </div>
              </form>
            )}

            {/* FORM: PAINEL EMPRESA - CÓDIGO RESERVA */}
            {!isSaas && authMode === "backup_code" && (
              <form onSubmit={handleVerifyBackupCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    WhatsApp de Acesso da Empresa
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" />
                    <input
                      type="text"
                      required
                      value={whatsapp}
                      onChange={handleWhatsappChange}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Código Reserva de Emergência
                    </label>
                    <span className="text-[10px] text-amber-400 font-medium">
                      Ex: ABCD-1234
                    </span>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={backupCode}
                      onChange={handleBackupCodeChange}
                      placeholder="XXXX-XXXX"
                      maxLength={10}
                      className="w-full pl-10 pr-4 py-2.5 text-center text-base tracking-widest font-mono font-bold rounded-xl bg-slate-900/90 border border-slate-800 text-amber-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 uppercase"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-tight">
                    Utilize qualquer um dos códigos gerados no cadastro da sua empresa. Os códigos não expiram e podem ser reutilizados sempre que necessário.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !backupCode.trim()}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-600/30 hover:shadow-amber-600/50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Validando código reserva...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar com Código Reserva</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("otp");
                      setErrorMessage("");
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    ← Voltar para login via WhatsApp (OTP)
                  </button>
                </div>
              </form>
            )}

            {/* Alternar entre Portais */}
            <div className="pt-4 border-t border-slate-800/80 text-center">
              {isSaas ? (
                <Link
                  href="/painel/login"
                  className="text-xs text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Acesso de Empresas & Clientes (via OTP WhatsApp)</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <Link
                  href="/sa/login"
                  className="text-xs text-slate-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Acesso Super Administrador SaaS</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}