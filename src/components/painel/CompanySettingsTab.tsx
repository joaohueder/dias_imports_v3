"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Building2,
  RefreshCw,
  MapPin,
  Mail,
  FileText,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Copy,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { FloatingActionBar } from "@/components/ui/FloatingActionBar";
import {
  maskCnpjCpf,
  maskPhone,
  maskZipcode,
  unmask,
  validateCpfCnpj,
  validateEmail,
} from "@/lib/validators";

interface CompanyData {
  id: number;
  name: string;
  trade_name?: string | null;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  admin_whatsapp?: string | null;
  plan?: string | null;
  status?: string | null;
  current_plan_name?: string | null;
  address_zipcode?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  address_neighborhood?: string | null;
  address_city?: string | null;
  address_state?: string | null;
}

interface CompanySettingsTabProps {
  onUpdated?: () => void;
}

export function CompanySettingsTab({ onUpdated }: CompanySettingsTabProps) {
  const { showSuccess, showError } = useFeedbackModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    trade_name: "",
    document: "",
    email: "",
    whatsapp: "",
    admin_whatsapp: "",
    address_zipcode: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
  });

  const [initialData, setInitialData] = useState<typeof formData | null>(null);
  const [companyPlan, setCompanyPlan] = useState("Iniciante");
  const [isCheckingAdminWa, setIsCheckingAdminWa] = useState(false);
  const [errors, setErrors] = useState<{
    document?: string;
    admin_whatsapp?: string;
    email?: string;
  }>({});

  const isDirty = useMemo(() => {
    if (!initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const isFormInvalid = useMemo(() => {
    if (!formData.name.trim()) return true;
    if (errors.document || errors.admin_whatsapp || errors.email) return true;
    if (formData.document.trim() && !validateCpfCnpj(formData.document)) return true;
    if (formData.email.trim() && !validateEmail(formData.email)) return true;
    if (formData.admin_whatsapp.trim()) {
      const clean = unmask(formData.admin_whatsapp);
      if (clean.length < 10 || clean.length > 11) return true;
    }
    return false;
  }, [formData, errors]);

  const handleResetForm = () => {
    if (initialData) {
      setFormData(initialData);
      setErrors({});
      toast.info("Alterações descartadas.");
    }
  };

  const handleCopyNameToTradeName = () => {
    if (!formData.name.trim()) {
      showError("Preencha a Razão Social primeiro antes de copiar.", "Campo Vazio");
      return;
    }
    setFormData((prev) => ({ ...prev, trade_name: prev.name }));
    toast.success("Razão Social copiada para Nome Fantasia!");
  };

  const fetchCompanyData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/painel/empresa", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success && data.company) {
        const c: CompanyData = data.company;
        setCompanyPlan(c.current_plan_name || c.plan || "Iniciante");
        const loadedData = {
          name: c.name || "",
          trade_name: c.trade_name || "",
          document: c.document ? maskCnpjCpf(c.document) : "",
          email: c.email || "",
          whatsapp: c.whatsapp ? maskPhone(c.whatsapp) : "",
          admin_whatsapp: c.admin_whatsapp ? maskPhone(c.admin_whatsapp) : "",
          address_zipcode: c.address_zipcode ? maskZipcode(c.address_zipcode) : "",
          address_street: c.address_street || "",
          address_number: c.address_number || "",
          address_complement: c.address_complement || "",
          address_neighborhood: c.address_neighborhood || "",
          address_city: c.address_city || "",
          address_state: c.address_state || "",
        };
        setFormData(loadedData);
        setInitialData(loadedData);
      }
    } catch (err) {
      console.error("Erro ao carregar dados da empresa:", err);
      toast.error("Erro ao buscar dados cadastrais da empresa.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  // Handlers com Máscara e Validação
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCnpjCpf(e.target.value);
    setFormData((prev) => ({ ...prev, document: masked }));
    if (errors.document) setErrors((prev) => ({ ...prev, document: undefined }));
  };

  const handleDocumentBlur = () => {
    if (!formData.document.trim()) {
      setErrors((prev) => ({ ...prev, document: undefined }));
      return;
    }
    if (!validateCpfCnpj(formData.document)) {
      setErrors((prev) => ({ ...prev, document: "CPF ou CNPJ inválido." }));
      showError("O CPF ou CNPJ digitado é inválido. Verifique os dígitos informados.", "Documento Inválido");
    } else {
      setErrors((prev) => ({ ...prev, document: undefined }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, email: e.target.value }));
    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
  };

  const handleEmailBlur = () => {
    if (!formData.email.trim()) {
      setErrors((prev) => ({ ...prev, email: undefined }));
      return;
    }
    if (!validateEmail(formData.email)) {
      setErrors((prev) => ({ ...prev, email: "Formato de e-mail inválido." }));
      showError("O e-mail digitado possui formato inválido.", "E-mail Inválido");
    } else {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value);
    setFormData((prev) => ({ ...prev, whatsapp: masked }));
  };

  const handleAdminWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value);
    setFormData((prev) => ({ ...prev, admin_whatsapp: masked }));
    if (errors.admin_whatsapp) setErrors((prev) => ({ ...prev, admin_whatsapp: undefined }));
  };

  const handleAdminWhatsappBlur = async () => {
    if (!formData.admin_whatsapp.trim()) {
      setErrors((prev) => ({ ...prev, admin_whatsapp: undefined }));
      return;
    }
    const clean = unmask(formData.admin_whatsapp);
    if (clean.length < 10 || clean.length > 11) {
      setErrors((prev) => ({
        ...prev,
        admin_whatsapp: "Informe um número com DDD (10 ou 11 dígitos).",
      }));
      showError("Informe um número de WhatsApp completo com DDD (10 ou 11 dígitos).", "WhatsApp Inválido");
      return;
    }

    try {
      setIsCheckingAdminWa(true);
      const res = await fetch(
        `/api/painel/empresa/check-admin-whatsapp?phone=${encodeURIComponent(clean)}`
      );
      const data = await res.json();
      if (!data.available) {
        setErrors((prev) => ({
          ...prev,
          admin_whatsapp: data.message || "Este WhatsApp já está vinculado a outra empresa.",
        }));
        showError(data.message || "Este WhatsApp já está vinculado a outra empresa.", "WhatsApp em Uso");
      } else {
        setErrors((prev) => ({ ...prev, admin_whatsapp: undefined }));
      }
    } catch {
      console.error("Erro ao verificar disponibilidade do WhatsApp Admin");
    } finally {
      setIsCheckingAdminWa(false);
    }
  };

  const handleZipcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskZipcode(e.target.value);
    setFormData((prev) => ({ ...prev, address_zipcode: masked }));
  };

  // Busca automática por CEP
  const handleSearchCep = async (zipcodeToSearch?: string) => {
    const cepDigits = (zipcodeToSearch || formData.address_zipcode).replace(/\D/g, "");
    if (cepDigits.length !== 8) {
      showError("Digite um CEP completo contendo exatamente 8 dígitos.", "CEP Incompleto");
      return;
    }

    try {
      setIsLoadingCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await res.json();

      if (data.erro) {
        showError("O CEP informado não foi encontrado na base dos Correios.", "CEP Não Encontrado");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        address_street: data.logradouro || prev.address_street,
        address_neighborhood: data.bairro || prev.address_neighborhood,
        address_city: data.localidade || prev.address_city,
        address_state: data.uf || prev.address_state,
        address_complement: data.complemento || prev.address_complement,
      }));

      toast.success("Endereço preenchido automaticamente!");
    } catch {
      showError("Não foi possível consultar o CEP automaticamente. Tente novamente.", "Falha de Conexão");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleZipcodeBlur = () => {
    const cepDigits = formData.address_zipcode.replace(/\D/g, "");
    if (cepDigits.length === 8) {
      handleSearchCep(cepDigits);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError("A Razão Social / Nome da Empresa é obrigatório.", "Campo Obrigatório");
      return;
    }

    if (formData.document.trim() && !validateCpfCnpj(formData.document)) {
      setErrors((prev) => ({ ...prev, document: "CPF ou CNPJ inválido." }));
      showError("O CPF ou CNPJ digitado é inválido.", "Documento Inválido");
      return;
    }

    if (formData.admin_whatsapp.trim()) {
      const cleanWa = unmask(formData.admin_whatsapp);
      if (cleanWa.length < 10 || cleanWa.length > 11) {
        setErrors((prev) => ({
          ...prev,
          admin_whatsapp: "Informe um número com DDD (10 ou 11 dígitos).",
        }));
        showError("WhatsApp do administrador incompleto ou inválido.", "WhatsApp Inválido");
        return;
      }
    }

    if (formData.email.trim() && !validateEmail(formData.email)) {
      setErrors((prev) => ({ ...prev, email: "Formato de e-mail inválido." }));
      showError("O e-mail digitado possui formato inválido.", "E-mail Inválido");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/painel/empresa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setInitialData(formData);
        showSuccess(data.message || "Dados da empresa atualizados com sucesso!", "Empresa Atualizada");
        if (onUpdated) onUpdated();
      } else {
        showError(data.message || "Falha ao salvar dados da empresa.", "Erro ao Salvar");
      }
    } catch (err: any) {
      showError(err.message || "Erro de conexão com o servidor.", "Falha de Comunicação");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-xs font-medium">Carregando dados da empresa...</p>
      </div>
    );
  }

  return (
    <>
      <form id="company-settings-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Seção 1: Dados Cadastrais */}
        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-6 shadow-xl shadow-black/20 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Dados Cadastrais</h2>
                <p className="text-xs text-slate-400">Informações jurídicas e identificação da organização.</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
              Plano {companyPlan}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Razão Social / Nome Oficial <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: JH7 Soluções Digitais Ltda"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Nome Fantasia
                </label>
                <button
                  type="button"
                  onClick={handleCopyNameToTradeName}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                  title="Copiar Razão Social"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar Razão Social</span>
                </button>
              </div>
              <input
                type="text"
                value={formData.trade_name}
                onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                placeholder="Ex: JH7 Marketing"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                CNPJ ou CPF
              </label>
              <input
                type="text"
                value={formData.document}
                onChange={handleDocumentChange}
                onBlur={handleDocumentBlur}
                placeholder="00.000.000/0001-00"
                maxLength={18}
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border ${
                  errors.document
                    ? "border-rose-500 text-rose-200 focus:ring-rose-500/50"
                    : "border-slate-800 text-slate-100 focus:ring-indigo-500/50"
                } placeholder-slate-500 focus:outline-none focus:ring-2 font-mono`}
              />
              {errors.document && (
                <div className="flex items-center gap-1 mt-1 text-[11px] text-rose-400">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.document}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  placeholder="contato@empresa.com"
                  className={`w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border ${
                    errors.email
                      ? "border-rose-500 text-rose-200 focus:ring-rose-500/50"
                      : "border-slate-800 text-slate-100 focus:ring-indigo-500/50"
                  } placeholder-slate-500 focus:outline-none focus:ring-2`}
                />
              </div>
              {errors.email && (
                <div className="flex items-center gap-1 mt-1 text-[11px] text-rose-400">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contatos de WhatsApp e Acesso OTP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                WhatsApp da Empresa (Atendimento / Notificações)
              </label>
              <div className="relative">
                <Smartphone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={handleWhatsappChange}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Número de contato geral e alertas da empresa.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-400 mb-1.5 flex items-center justify-between">
                <span>WhatsApp de Acesso Admin <span className="text-rose-400">*</span></span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Único no SaaS
                </span>
              </label>
              <div className="relative">
                <ShieldCheck className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                <input
                  type="text"
                  required
                  value={formData.admin_whatsapp}
                  onChange={handleAdminWhatsappChange}
                  onBlur={handleAdminWhatsappBlur}
                  placeholder="(11) 99999-8888"
                  maxLength={15}
                  className={`w-full pl-9 pr-9 py-2.5 text-xs rounded-xl bg-slate-900/90 border ${
                    errors.admin_whatsapp
                      ? "border-rose-500 text-rose-200 focus:ring-rose-500/50"
                      : "border-emerald-500/40 text-emerald-100 focus:ring-emerald-500/50"
                  } placeholder-slate-500 focus:outline-none focus:ring-2 font-medium`}
                />
                {isCheckingAdminWa && (
                  <RefreshCw className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 animate-spin" />
                )}
              </div>
              {errors.admin_whatsapp ? (
                <div className="flex items-center gap-1 mt-1 text-[11px] text-rose-400">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.admin_whatsapp}</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">
                  Número exclusivo usado para autenticação e envio do código OTP de 6 dígitos.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Seção 2: Endereço & Localização */}
        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-6 shadow-xl shadow-black/20 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Endereço & Localização</h2>
              <p className="text-xs text-slate-400">Preenchimento automático do endereço pelo CEP.</p>
            </div>
          </div>

          {/* CEP com Busca Automática */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                CEP (Busca Automática)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.address_zipcode}
                  onChange={handleZipcodeChange}
                  onBlur={handleZipcodeBlur}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleSearchCep()}
                  disabled={isLoadingCep}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center justify-center focus:outline-none cursor-pointer"
                  title="Buscar CEP"
                >
                  <Search className={`w-4 h-4 ${isLoadingCep ? "animate-spin text-indigo-400" : ""}`} />
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Logradouro / Endereço
              </label>
              <input
                type="text"
                value={formData.address_street}
                onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                placeholder="Ex: Av. Paulista, Rua das Flores"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Número
              </label>
              <input
                type="text"
                value={formData.address_number}
                onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                placeholder="Ex: 1000, S/N"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Complemento
              </label>
              <input
                type="text"
                value={formData.address_complement}
                onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                placeholder="Ex: Sala 42, Bloco B"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bairro
              </label>
              <input
                type="text"
                value={formData.address_neighborhood}
                onChange={(e) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                placeholder="Ex: Centro, Bela Vista"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cidade
              </label>
              <input
                type="text"
                value={formData.address_city}
                onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                placeholder="Ex: São Paulo"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Estado (UF)
              </label>
              <input
                type="text"
                value={formData.address_state}
                onChange={(e) => setFormData({ ...formData, address_state: e.target.value.toUpperCase() })}
                placeholder="SP"
                maxLength={2}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 uppercase"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Barra Flutuante Padrão do Sistema */}
      <FloatingActionBar
        isVisible={isDirty}
        isSubmitting={saving}
        disabled={isFormInvalid}
        onCancel={handleResetForm}
        formId="company-settings-form"
      />
    </>
  );
}
