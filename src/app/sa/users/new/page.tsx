"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Shield,
  Sliders,
  Mail,
  Lock,
  Phone,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Check,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { FloatingActionBar } from "@/components/ui/FloatingActionBar";
import { SAAS_MODULES_DEFINITION } from "@/lib/permissions";
import { PermissionMatrix } from "@/components/sa/PermissionMatrix";
import { maskPhone } from "@/lib/validators";

export default function NewSaUserPage() {
  const router = useRouter();
  const { showError, showSuccess } = useFeedbackModal();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    password: "",
    role: "ADMIN" as "SUPER_ADMIN" | "ADMIN",
    status: "active" as "active" | "inactive",
  });

  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(() => {
    const initial: Record<string, Record<string, boolean>> = {};
    SAAS_MODULES_DEFINITION.forEach((mod) => {
      initial[mod.id] = {};
      mod.actions.forEach((act) => {
        initial[mod.id][act] = false;
      });
    });
    return initial;
  });

  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados de verificação de e-mail ao sair do campo (blur)
  const [emailStatus, setEmailStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  const checkEmailAvailability = async (emailToCheck: string) => {
    const cleanEmail = emailToCheck.trim().toLowerCase();
    if (!cleanEmail) {
      setEmailStatus({ checking: false });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setEmailStatus({
        checking: false,
        available: false,
        message: "Formato de e-mail inválido",
      });
      return;
    }

    try {
      setEmailStatus({ checking: true });
      const res = await fetch(`/api/sa/users/check-email?email=${encodeURIComponent(cleanEmail)}`);
      const data = await res.json();

      if (data.success) {
        if (data.exists) {
          setEmailStatus({
            checking: false,
            available: false,
            message: `Este e-mail já está cadastrado para ${data.user?.name || "outro usuário"}.`,
          });
          showError(
            `O e-mail "${cleanEmail}" já está cadastrado para ${data.user?.name || "outro usuário"}. Utilize outro endereço de e-mail.`,
            "E-mail Já Cadastrado"
          );
        } else {
          setEmailStatus({
            checking: false,
            available: true,
            message: "E-mail disponível para cadastro.",
          });
        }
      } else {
        setEmailStatus({ checking: false });
      }
    } catch {
      setEmailStatus({ checking: false });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    let finalValue = value;
    if (field === "whatsapp") {
      finalValue = maskPhone(value);
    }
    if (field === "email") {
      setEmailStatus({ checking: false });
    }
    setFormData((prev) => ({ ...prev, [field]: finalValue }));
    setIsDirty(true);
  };

  const handleRoleChange = (newRole: "SUPER_ADMIN" | "ADMIN") => {
    setFormData((prev) => ({ ...prev, role: newRole }));
    setIsDirty(true);
  };

  const handlePermissionsChange = (newPerms: Record<string, any>) => {
    setPermissions(newPerms);
    setIsDirty(true);
  };

  const handleSave = async () => {
    setErrorMessage(null);
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      const msg = "Preencha todos os campos obrigatórios: Nome Completo, E-mail de Login e Senha de Acesso.";
      setErrorMessage(msg);
      showError(msg, "Campos Obrigatórios");
      return;
    }

    if (emailStatus.available === false) {
      const msg = emailStatus.message || "Este e-mail já está em uso por outro usuário.";
      setErrorMessage(msg);
      showError(msg, "E-mail Já Cadastrado");
      return;
    }

    try {
      setLoading(true);

      // Verificação de segurança pré-envio para e-mail
      const checkRes = await fetch(`/api/sa/users/check-email?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`);
      const checkData = await checkRes.json();

      if (checkData.success && checkData.exists) {
        const msg = `Este e-mail já está cadastrado para ${checkData.user?.name || "outro usuário"}.`;
        setEmailStatus({
          checking: false,
          available: false,
          message: msg,
        });
        setErrorMessage(msg);
        showError(msg, "E-mail Indisponível");
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        permissions: formData.role === "SUPER_ADMIN" ? null : permissions,
      };

      const res = await fetch("/api/sa/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsDirty(false);
        showSuccess(data.message || "Usuário cadastrado com sucesso!", "Operador Cadastrado");
        router.push("/sa/users");
      } else {
        const msg = data.message || "Erro ao cadastrar usuário.";
        setErrorMessage(msg);
        showError(msg, "Falha ao Cadastrar");
      }
    } catch {
      const msg = "Falha ao comunicar com o servidor. Tente novamente em instantes.";
      setErrorMessage(msg);
      showError(msg, "Erro de Conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/sa/users");
  };

  const isFormInvalid = useMemo(() => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) return true;
    if (errors.name || errors.email || errors.whatsapp || errors.password) return true;
    return false;
  }, [formData, errors]);

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/sa/users"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-1">
              <Users className="w-3.5 h-3.5" />
              Cadastro de Operador
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Novo Usuário do SaaS</h1>
          </div>
        </div>
      </div>

      {/* Banner de Erro em Destaque na Tela */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold block text-sm text-rose-200">Atenção ao salvar operador:</span>
            {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 text-rose-400 hover:text-white rounded-lg hover:bg-rose-500/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna 1: Dados Cadastrais & Papel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card de Dados Básicos */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-sm space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              Identificação & Acesso
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    E-mail de Login *
                  </label>
                  {emailStatus.checking && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Verificando...
                    </span>
                  )}
                  {!emailStatus.checking && emailStatus.available === true && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Disponível
                    </span>
                  )}
                  {!emailStatus.checking && emailStatus.available === false && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
                      <AlertCircle className="w-3 h-3" />
                      Já cadastrado
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="carlos@empresa.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={() => checkEmailAvailability(formData.email)}
                    className={`w-full pl-10 pr-9 py-2.5 bg-slate-950/60 border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all ${
                      emailStatus.available === false
                        ? "border-rose-500/80 focus:border-rose-500 ring-1 ring-rose-500/20"
                        : emailStatus.available === true
                        ? "border-emerald-500/80 focus:border-emerald-500 ring-1 ring-emerald-500/20"
                        : "border-slate-800 focus:border-indigo-500"
                    }`}
                  />
                  {emailStatus.checking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    </div>
                  )}
                  {!emailStatus.checking && emailStatus.available === true && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}
                  {!emailStatus.checking && emailStatus.available === false && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    </div>
                  )}
                </div>
                {emailStatus.message && (
                  <p
                    className={`mt-1.5 text-[11px] ${
                      emailStatus.available === false ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {emailStatus.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  WhatsApp (Notificações / 2FA)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Senha Inicial de Acesso *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Status da Conta
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="active">Ativo (Acesso Liberado)</option>
                  <option value="inactive">Inativo (Bloqueado)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seleção do Papel */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-sm space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              Papel no Sistema
            </h2>

            <div className="space-y-3">
              {/* Opção Super Admin */}
              <div
                onClick={() => handleRoleChange("SUPER_ADMIN")}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.role === "SUPER_ADMIN"
                    ? "bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500/50"
                    : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    Super Admin
                  </span>
                  {formData.role === "SUPER_ADMIN" && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Acesso total e irrestrito a todos os módulos, bancos de dados, migrations e configurações do SaaS.
                </p>
              </div>

              {/* Opção Admin */}
              <div
                onClick={() => handleRoleChange("ADMIN")}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.role === "ADMIN"
                    ? "bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/50"
                    : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    Admin (Permissões Granulares)
                  </span>
                  {formData.role === "ADMIN" && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Acesso restrito. É necessário definir exatamente quais módulos e ações este usuário pode executar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna 2 e 3: Matriz de Permissões (Granular) */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-sm">
            <PermissionMatrix
              role={formData.role}
              permissions={permissions}
              onChange={handlePermissionsChange}
            />
          </div>
        </div>
      </div>

      <FloatingActionBar
        isVisible={isDirty}
        isSubmitting={loading}
        disabled={isFormInvalid}
        onSave={handleSave}
        onCancel={handleCancel}
        saveLabel="Salvar Usuário"
        cancelLabel="Descartar"
      />
    </div>
  );
}
