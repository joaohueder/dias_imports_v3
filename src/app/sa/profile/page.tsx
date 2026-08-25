"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  KeyRound,
  ShieldAlert,
  Save,
  Clock,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { maskPhone } from "@/lib/validators";
import { FloatingActionBar } from "@/components/ui/FloatingActionBar";

export default function SuperAdminProfilePage() {
  const [initialData, setInitialData] = useState<{ name: string; whatsapp: string }>({ name: "", whatsapp: "" });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("joaohueder@gmail.com");
  const [whatsapp, setWhatsapp] = useState("");
  const [role, setRole] = useState("SUPER_ADMIN");
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // Alteração de Senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Carregar dados atuais
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch("/api/sa/profile");
        const data = await res.json();
        if (data.success && data.user) {
          const userName = data.user.name || "João Hueder";
          const userWhatsapp = data.user.whatsapp ? maskPhone(data.user.whatsapp) : "";
          setName(userName);
          setEmail(data.user.email || "joaohueder@gmail.com");
          setWhatsapp(userWhatsapp);
          setRole(data.user.role || "SUPER_ADMIN");
          setCreatedAt(data.user.created_at || null);
          setInitialData({ name: userName, whatsapp: userWhatsapp });
        }
      } catch {
        toast.error("Erro ao carregar dados do perfil.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleResetForm = () => {
    setName(initialData.name);
    setWhatsapp(initialData.whatsapp);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setIsDirty(false);
    toast.info("Alterações canceladas.");
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(maskPhone(e.target.value));
    setIsDirty(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Informe seu nome completo.");
      return;
    }

    if (newPassword || currentPassword) {
      if (!currentPassword) {
        toast.error("Informe a senha atual para validar a alteração.");
        return;
      }
      if (newPassword.length < 6) {
        toast.error("A nova senha deve ter pelo menos 6 caracteres.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        toast.error("A confirmação da nova senha não confere.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/sa/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          whatsapp,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
          confirmNewPassword: confirmNewPassword || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "Perfil atualizado com sucesso!");
        setInitialData({ name, whatsapp });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setIsDirty(false);
      } else {
        toast.error(data.error || "Erro ao salvar alterações no perfil.");
      }
    } catch {
      toast.error("Erro de conexão ao salvar perfil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <User className="w-4 h-4" />
            <span>Minha Conta Super Admin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Perfil do Usuário
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Gerencie seus dados pessoais, contato seguro e credenciais de acesso à governança SaaS.
          </p>
        </div>

        <Link
          href="/sa"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Dashboard</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs font-medium">Carregando dados do perfil...</p>
        </div>
      ) : (
        <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-6">
          {/* Card de Identidade & Avatar */}
          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-6 shadow-xl shadow-black/30">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-600/30 border border-indigo-400/40 shrink-0">
                {name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase() || "SA"}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-lg font-bold text-white">{name || "Super Admin"}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    SUPER ADMIN MASTER
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ativo
                  </span>
                </div>
                <p className="text-xs text-slate-400">{email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-4 text-[11px] text-slate-500 pt-1 font-mono">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Acesso Global Irrestrito
                  </span>
                  {createdAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Membro desde {new Date(createdAt).getFullYear()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dados Pessoais & Contato */}
          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-6 space-y-5 shadow-xl shadow-black/30">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
              <User className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Dados Cadastrais & Contato</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome Completo <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  E-mail de Acesso (Login)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-400 cursor-not-allowed font-mono"
                    title="E-mail principal do Super Admin é fixo e protegido"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">E-mail principal de governança master.</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  WhatsApp de Contato / Notificações
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={handleWhatsappChange}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Utilizado para avisos críticos de infraestrutura e recuperação de credenciais.
                </p>
              </div>
            </div>
          </div>

          {/* Segurança & Alteração de Senha */}
          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-6 space-y-5 shadow-xl shadow-black/30">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Alterar Senha de Acesso</h3>
                <p className="text-[11px] text-slate-400">
                  Preencha apenas caso deseje modificar sua senha de Super Admin.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Senha Atual
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Repita a nova senha"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Barra Flutuante Padrão do Sistema */}
      <FloatingActionBar
        isVisible={isDirty}
        isSubmitting={isSubmitting}
        onCancel={handleResetForm}
        formId="profile-form"
      />
    </div>
  );
}
