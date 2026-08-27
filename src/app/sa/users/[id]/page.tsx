"use client";

import React, { useState, useEffect, useCallback, use } from "react";
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
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { FloatingActionBar } from "@/components/ui/FloatingActionBar";
import { SAAS_MODULES_DEFINITION } from "@/lib/permissions";
import { PermissionMatrix } from "@/components/sa/PermissionMatrix";
import { maskPhone } from "@/lib/validators";

interface EditSaUserPageProps {
  params: Promise<{ id: string }>;
}

export default function EditSaUserPage({ params }: EditSaUserPageProps) {
  const { showError, showSuccess } = useFeedbackModal();
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const router = useRouter();

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

  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSelf, setIsSelf] = useState(false);

  // Estados de verificação de WhatsApp ao sair do campo (blur)
  const [whatsappStatus, setWhatsappStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  const checkWhatsappAvailability = async (phoneToCheck: string) => {
    const cleanPhone = (phoneToCheck || "").replace(/\D/g, "");
    if (!cleanPhone) {
      setWhatsappStatus({ checking: false });
      return;
    }

    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      setWhatsappStatus({
        checking: false,
        available: false,
        message: "O WhatsApp deve conter DDD + 8 ou 9 dígitos.",
      });
      return;
    }

    try {
      setWhatsappStatus({ checking: true });
      const res = await fetch(`/api/sa/users/check-whatsapp?whatsapp=${encodeURIComponent(cleanPhone)}&excludeUserId=${userId}`);
      const data = await res.json();

      if (data.success) {
        if (data.exists) {
          setWhatsappStatus({
            checking: false,
            available: false,
            message: data.message || "Este WhatsApp já está em uso por outro usuário.",
          });
          showError(
            data.message || `O WhatsApp informado já está cadastrado para ${data.user?.name || "outro usuário"}.`,
            "WhatsApp Já Cadastrado"
          );
        } else {
          setWhatsappStatus({
            checking: false,
            available: true,
            message: "WhatsApp disponível para cadastro.",
          });
        }
      } else {
        setWhatsappStatus({ checking: false });
      }
    } catch {
      setWhatsappStatus({ checking: false });
    }
  };

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const [resUser, resProfile] = await Promise.all([
        fetch(`/api/sa/users/${userId}`),
        fetch("/api/sa/profile"),
      ]);

      const data = await resUser.json();
      const profileData = await resProfile.json();

      if (data.success && data.user) {
        const u = data.user;
        const selfMatch =
          profileData?.success &&
          profileData.user &&
          (Number(profileData.user.id) === Number(u.id) ||
            profileData.user.email?.toLowerCase() === u.email?.toLowerCase());

        setIsSelf(Boolean(selfMatch));

        setFormData({
          name: u.name || "",
          email: u.email || "",
          whatsapp: u.whatsapp ? maskPhone(u.whatsapp) : "",
          password: "",
          role: u.role || "ADMIN",
          status: u.status || "active",
        });

        // Montar permissões mesclando com o padrão
        const userPerms = u.permissions || {};
        const mergedPerms: Record<string, Record<string, boolean>> = {};
        SAAS_MODULES_DEFINITION.forEach((mod) => {
          mergedPerms[mod.id] = {};
          mod.actions.forEach((act) => {
            mergedPerms[mod.id][act] = Boolean(userPerms[mod.id]?.[act]);
          });
        });
        setPermissions(mergedPerms);
        setInitialDataLoaded(true);
      } else {
        showError(data.message || "Usuário não encontrado.", "Falha ao Carregar");
        router.push("/sa/users");
      }
    } catch {
      showError("Falha ao carregar dados do usuário.", "Erro de Conexão");
    } finally {
      setLoading(false);
    }
  }, [userId, router, showError]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleInputChange = (field: string, value: string) => {
    let finalValue = value;
    if (field === "whatsapp") {
      finalValue = maskPhone(value);
      setWhatsappStatus({ checking: false });
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
    if (!formData.name.trim()) {
      showError("Preencha o nome do usuário.", "Campo Obrigatório");
      return;
    }

    if (whatsappStatus.available === false) {
      showError(whatsappStatus.message || "Este WhatsApp já está em uso por outro usuário.", "WhatsApp Já Cadastrado");
      return;
    }

    try {
      setSaving(true);

      // Verificação pré-envio
      if (formData.whatsapp && formData.whatsapp.trim()) {
        const cleanPhone = formData.whatsapp.replace(/\D/g, "");
        const checkWppRes = await fetch(`/api/sa/users/check-whatsapp?whatsapp=${encodeURIComponent(cleanPhone)}&excludeUserId=${userId}`);
        const checkWppData = await checkWppRes.json();

        if (checkWppData.success && checkWppData.exists) {
          showError(checkWppData.message || "Este WhatsApp já está cadastrado para outro usuário.", "WhatsApp Indisponível");
          setSaving(false);
          return;
        }
      }

      const payload = {
        ...formData,
        permissions: formData.role === "SUPER_ADMIN" ? null : permissions,
      };

      const res = await fetch(`/api/sa/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showSuccess(data.message, "Alterações Salvas");
        setIsDirty(false);
        // Atualiza a senha limpa caso tenha sido digitada
        setFormData((prev) => ({ ...prev, password: "" }));
      } else {
        showError(data.message || "Erro ao salvar alterações.", "Falha ao Salvar");
      }
    } catch {
      showError("Falha ao comunicar com o servidor.", "Erro de Conexão");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/sa/users");
  };

  if (loading && !initialDataLoaded) {
    return (
      <div className="p-16 text-center text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
        <p className="text-sm">Carregando dados do usuário...</p>
      </div>
    );
  }

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
              Edição de Operador
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Editar Usuário: {formData.name}
            </h1>
          </div>
        </div>
      </div>

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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  E-mail de Login
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    readOnly
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-slate-400 cursor-not-allowed select-none opacity-80"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  O e-mail é o identificador único do operador e não pode ser alterado após o cadastro.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    WhatsApp (Notificações / 2FA)
                  </label>
                  {whatsappStatus.checking && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Verificando...
                    </span>
                  )}
                  {!whatsappStatus.checking && whatsappStatus.available === true && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Disponível
                    </span>
                  )}
                  {!whatsappStatus.checking && whatsappStatus.available === false && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
                      <AlertCircle className="w-3 h-3" />
                      Já cadastrado
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                    onBlur={() => checkWhatsappAvailability(formData.whatsapp)}
                    className={`w-full pl-10 pr-9 py-2.5 bg-slate-950/60 border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all ${
                      whatsappStatus.available === false
                        ? "border-rose-500/80 focus:border-rose-500 ring-1 ring-rose-500/20"
                        : whatsappStatus.available === true
                        ? "border-emerald-500/80 focus:border-emerald-500 ring-1 ring-emerald-500/20"
                        : "border-slate-800 focus:border-indigo-500"
                    }`}
                  />
                  {whatsappStatus.checking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    </div>
                  )}
                  {!whatsappStatus.checking && whatsappStatus.available === true && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}
                  {!whatsappStatus.checking && whatsappStatus.available === false && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    </div>
                  )}
                </div>
                {whatsappStatus.message && (
                  <p
                    className={`mt-1.5 text-[11px] ${
                      whatsappStatus.available === false ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {whatsappStatus.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nova Senha (deixe em branco para manter a atual)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    placeholder="Digite apenas para alterar..."
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
                  disabled={isSelf}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 ${
                    isSelf ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="active">Ativo (Acesso Liberado)</option>
                  <option value="inactive">Inativo (Bloqueado)</option>
                </select>
                {isSelf && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    Não é permitido inativar a sua própria conta conectada.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Seleção do Papel */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                Papel no Sistema
              </h2>
              {isSelf && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Papel Bloqueado
                </span>
              )}
            </div>

            {isSelf && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                Por questões de segurança, você não pode alterar seu próprio papel. Solicite a outro Super Admin caso precise de alteração.
              </div>
            )}

            <div className={`space-y-3 ${isSelf ? "opacity-60 pointer-events-none" : ""}`}>
              {/* Opção Super Admin */}
              <div
                onClick={() => !isSelf && handleRoleChange("SUPER_ADMIN")}
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
        isSubmitting={saving}
        onSave={handleSave}
        onCancel={handleCancel}
        saveLabel="Salvar Alterações"
        cancelLabel="Descartar"
      />
    </div>
  );
}
