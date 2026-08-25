"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  Check,
  RefreshCw,
  MapPin,
  Mail,
  Smartphone,
  ShieldCheck,
  FileText,
  Copy,
  Search,
  AlertCircle,
  X
} from "lucide-react";
import { toast } from "sonner";
import {
  maskCpfCnpj,
  maskPhone,
  maskZipcode,
  validateEmail,
  validateCpfCnpj,
} from "@/lib/validators";
import { FloatingActionBar } from "@/components/ui/FloatingActionBar";

export default function CompanyFormPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params?.id as string | undefined;
  const isEditing = Boolean(companyId && companyId !== "new");

  const [isLoadingData, setIsLoadingData] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Form State
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

  // Estado inicial carregado (para comparação de alterações)
  const [initialData, setInitialData] = useState({
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

  // Carregar dados da empresa se for edição
  useEffect(() => {
    if (!isEditing || !companyId) return;

    async function loadCompany() {
      try {
        setIsLoadingData(true);
        const res = await fetch(`/api/sa/companies/${companyId}`);
        const result = await res.json();

        if (result.success && result.company) {
          const c = result.company;
          const loaded = {
            name: c.name || "",
            trade_name: c.trade_name || "",
            document: c.document ? maskCpfCnpj(c.document) : "",
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
          setFormData(loaded);
          setInitialData(loaded);
        } else {
          toast.error("Empresa não encontrada.");
          router.push("/sa/companies");
        }
      } catch {
        toast.error("Erro ao carregar dados da empresa.");
      } finally {
        setIsLoadingData(false);
      }
    }

    loadCompany();
  }, [companyId, isEditing, router]);

  // Validation Errors on Blur
  const [errors, setErrors] = useState<{
    document?: string;
    email?: string;
    admin_whatsapp?: string;
  }>({});

  // Detecta se existem alterações reais em relação ao estado inicial
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  // Copiar Razão Social para Nome Fantasia
  const handleCopyNameToTradeName = () => {
    if (!formData.name.trim()) {
      toast.error("Preencha a Razão Social primeiro.");
      return;
    }
    setFormData((prev) => ({ ...prev, trade_name: prev.name }));
    toast.success("Razão Social copiada para Nome Fantasia!");
  };

  // Handlers com Máscara
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCpfCnpj(e.target.value);
    setFormData((prev) => ({ ...prev, document: masked }));
    if (errors.document) setErrors((prev) => ({ ...prev, document: undefined }));
  };

  const handleDocumentBlur = () => {
    if (!formData.document.trim()) return;
    if (!validateCpfCnpj(formData.document)) {
      setErrors((prev) => ({ ...prev, document: "CPF ou CNPJ inválido." }));
      toast.error("O CPF ou CNPJ digitado é inválido.");
    } else {
      setErrors((prev) => ({ ...prev, document: undefined }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, email: e.target.value }));
    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
  };

  const handleEmailBlur = () => {
    if (!formData.email.trim()) return;
    if (!validateEmail(formData.email)) {
      setErrors((prev) => ({ ...prev, email: "Formato de e-mail inválido." }));
      toast.error("O e-mail digitado é inválido.");
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

  const handleAdminWhatsappBlur = () => {
    if (!formData.admin_whatsapp.trim()) {
      setErrors((prev) => ({ ...prev, admin_whatsapp: "WhatsApp de Acesso Admin é obrigatório." }));
      return;
    }
    const clean = formData.admin_whatsapp.replace(/\D/g, "");
    if (clean.length < 10 || clean.length > 11) {
      setErrors((prev) => ({ ...prev, admin_whatsapp: "Informe um número com DDD (10 ou 11 dígitos)." }));
    } else {
      setErrors((prev) => ({ ...prev, admin_whatsapp: undefined }));
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
      toast.error("Digite um CEP completo com 8 dígitos.");
      return;
    }

    try {
      setIsLoadingCep(true);
      const res = await fetch(`/api/sa/cep?cep=${cepDigits}`);
      const result = await res.json();

      if (result.success && result.data) {
        const { street, complement, neighborhood, city, state } = result.data;
        setFormData((prev) => ({
          ...prev,
          address_street: street || prev.address_street,
          address_complement: complement || prev.address_complement,
          address_neighborhood: neighborhood || prev.address_neighborhood,
          address_city: city || prev.address_city,
          address_state: state || prev.address_state,
        }));
        toast.success("Endereço localizado com sucesso!");
      } else {
        toast.error(result.error || "CEP não encontrado.");
      }
    } catch {
      toast.error("Erro ao consultar serviço de CEP.");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleZipcodeBlur = () => {
    const clean = formData.address_zipcode.replace(/\D/g, "");
    if (clean.length === 8) {
      handleSearchCep(clean);
    }
  };

  // Submissão do Formulário (POST para criar ou PUT para editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("A Razão Social / Nome da Empresa é obrigatório.");
      return;
    }

    if (!formData.admin_whatsapp.trim()) {
      toast.error("O WhatsApp de Acesso Admin é obrigatório.");
      return;
    }

    const cleanAdmin = formData.admin_whatsapp.replace(/\D/g, "");
    if (cleanAdmin.length < 10 || cleanAdmin.length > 11) {
      toast.error("O WhatsApp de Acesso Admin deve ter DDD e número válido.");
      return;
    }

    if (formData.document && !validateCpfCnpj(formData.document)) {
      toast.error("Corrija o CPF ou CNPJ antes de salvar.");
      return;
    }

    if (formData.email && !validateEmail(formData.email)) {
      toast.error("Corrija o e-mail antes de salvar.");
      return;
    }

    try {
      setIsSubmitting(true);
      const endpoint = isEditing ? `/api/sa/companies/${companyId}` : "/api/sa/companies";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(isEditing ? "Empresa atualizada com sucesso!" : "Empresa cadastrada com sucesso!");
        router.push("/sa/companies");
      } else {
        toast.error(data.error || "Ocorreu um erro ao salvar a empresa.");
      }
    } catch {
      toast.error("Erro de conexão ao comunicar com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    if (isEditing) {
      router.push("/sa/companies");
    } else {
      setFormData({
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
      setErrors({});
      toast.info("Formulário limpo.");
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
        <span className="text-xs text-slate-400">Carregando dados da empresa...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">
      {/* Header com Navegação de Volta */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/sa/companies"
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            title="Voltar para listagem"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-0.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Gestão Multi-Tenancy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isEditing ? "Editar Empresa" : "Nova Empresa"}
            </h1>
          </div>
        </div>
      </div>

      {/* Formulário Principal */}
      <form id="new-company-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Seção 1: Dados Cadastrais */}
        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-6 shadow-xl shadow-black/20 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Dados Cadastrais</h2>
              <p className="text-xs text-slate-400">Informações jurídicas e identificação da organização.</p>
            </div>
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
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
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
                  className={`w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border ${
                    errors.admin_whatsapp
                      ? "border-rose-500 text-rose-200 focus:ring-rose-500/50"
                      : "border-emerald-500/40 text-emerald-100 focus:ring-emerald-500/50"
                  } placeholder-slate-500 focus:outline-none focus:ring-2 font-medium`}
                />
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
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center justify-center focus:outline-none"
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
        isSubmitting={isSubmitting}
        onCancel={handleResetForm}
        formId="new-company-form"
      />
    </div>
  );
}
