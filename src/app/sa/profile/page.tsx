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
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { maskPhone } from "@/lib/validators";
import { FloatingActionBar } from "@/components/ui/FloatingActionBar";

export default function SuperAdminProfilePage() {
  const { showError, showSuccess } = useFeedbackModal();
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
        showError("Erro ao carregar dados do perfil.", "Erro de Conexão");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [showError]);

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
      showError("Informe seu nome completo.", "Nome Obrigatório");
      return;
    }

    if (newPassword || currentPassword) {
      if (!currentPassword) {
        showError("Informe a senha atual para validar a alteração.", "Senha Atual Obrigatória");
        return;
      }
      if (newPassword.length < 6) {
        showError("A nova senha deve ter pelo menos 6 caracteres.", "Senha Curta");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        showError("A confirmação da nova senha não confere.", "Senhas Diferentes");
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
        showSuccess(data.message || "Perfil atualizado com sucesso!", "Perfil Salvo");
        setInitialData({ name, whatsapp });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setIsDirty(false);
      } else {
        showError(data.error || "Erro ao salvar alterações no perfil.", "Falha ao Salvar");
      }
    } catch {
      showError("Erro de conexão ao salvar perfil.", "Erro de Conexão");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <User className="w-6 h-6 text-indigo-400" />
              Perfil do Usuário
            </h1>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie seus dados pessoais, contato seguro e credenciais de acesso à governança SaaS.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 w-full pt-1">
          <Link
            href="/sa"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Voltar ao Dashboard</span>
          </Link>
        </div>
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
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/25 to-violet-500/25 border border-indigo-500/40 flex items-center justify-center text-indigo-300 text-2xl font-black shadow-inner shrink-0">
                {name
                  ? (() => {
                      const parts = name.trim().split(/\s+/);
                      return parts.length === 1
                        ? parts[0].substring(0, 2).toUpperCase()
                        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                    })()
                  : "SA"}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-lg font-bold text-white">{name || "Usuário"}</h2>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      role === "SUPER_ADMIN"
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                        : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                    }`}
                  >
                    {role === "SUPER_ADMIN" ? "SUPER ADMIN MASTER" : "ADMINISTRADOR"}
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
                    {role === "SUPER_ADMIN" ? "Acesso Global Irrestrito" : "Acesso Restrito por Permissões"}
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
                  Preencha apenas caso deseje modificar sua senha de acesso.
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
