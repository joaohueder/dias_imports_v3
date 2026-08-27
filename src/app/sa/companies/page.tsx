"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Users,
  MessageSquare,
  Smartphone,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  MoreVertical,
  Layers,
  MapPin,
  Mail,
  Phone,
  ArrowUpDown,
  ShieldCheck,
  Check,
  X,
  Package,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { maskPhone } from "@/lib/validators";
import { useSaAuth } from "@/context/SaAuthContext";
import { Pagination } from "@/components/ui/Pagination";

interface Company {
  id: number;
  name: string;
  trade_name: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  plan: string;
  current_plan_name?: string;
  subscription_status?: "active" | "past_due" | "canceled" | "expired" | null;
  active_subscription_id?: number | null;
  quota_max_groups?: number;
  quota_max_products?: number;
  quota_max_messages_day?: number;
  quota_max_instances?: number;
  status: "active" | "inactive" | "suspended";
  max_instances: number;
  max_messages_day: number;
  address_city: string | null;
  address_state: string | null;
  user_count: number;
  created_at: string;
}

export default function CompaniesPage() {
  const { showError, showSuccess } = useFeedbackModal();
  const { can } = useSaAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Modais de Criação / Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Modal de Exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal de Mudança de Status
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [companyToChangeStatus, setCompanyToChangeStatus] = useState<Company | null>(null);
  const [newStatus, setNewStatus] = useState<"active" | "inactive" | "suspended">("active");
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Impersonação
  const [impersonatingId, setImpersonatingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    trade_name: "",
    document: "",
    email: "",
    phone: "",
    plan: "Pro",
    status: "active" as "active" | "inactive" | "suspended",
    max_instances: 5,
    max_messages_day: 5000,
    address_city: "",
    address_state: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Companies
  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/sa/companies?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setCompanies(data.companies || []);
        setCurrentPage(1);
      } else {
        showError(data.error || "Erro ao carregar empresas", "Falha ao Carregar");
      }
    } catch {
      showError("Erro de conexão ao buscar empresas", "Erro de Conexão");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, showError]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCompanies();
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [fetchCompanies]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode("create");
    setSelectedCompany(null);
    setFormData({
      name: "",
      trade_name: "",
      document: "",
      email: "",
      phone: "",
      plan: "Pro",
      status: "active",
      max_instances: 5,
      max_messages_day: 5000,
      address_city: "",
      address_state: "",
    });
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (company: Company) => {
    setModalMode("edit");
    setSelectedCompany(company);
    setFormData({
      name: company.name || "",
      trade_name: company.trade_name || "",
      document: company.document || "",
      email: company.email || "",
      phone: company.phone || "",
      plan: company.plan || "Pro",
      status: company.status || "active",
      max_instances: company.max_instances || 5,
      max_messages_day: company.max_messages_day || 5000,
      address_city: company.address_city || "",
      address_state: company.address_state || "",
    });
    setModalOpen(true);
  };

  // Submit Create or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError("A Razão Social / Nome da Empresa é obrigatório.", "Campo Obrigatório");
      return;
    }

    try {
      setIsSubmitting(true);
      const url =
        modalMode === "create"
          ? "/api/sa/companies"
          : `/api/sa/companies/${selectedCompany?.id}`;

      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        showSuccess(
          modalMode === "create"
            ? "Empresa criada com sucesso!"
            : "Empresa atualizada com sucesso!",
          "Sucesso"
        );
        setModalOpen(false);
        fetchCompanies();
      } else {
        showError(data.error || "Ocorreu um erro ao salvar.", "Falha ao Salvar");
      }
    } catch {
      showError("Erro de conexão ao salvar empresa.", "Erro de Conexão");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!companyToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/sa/companies/${companyToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        showSuccess(`Empresa "${companyToDelete.name}" excluída.`, "Exclusão Concluída");
        setDeleteModalOpen(false);
        setCompanyToDelete(null);
        fetchCompanies();
      } else {
        showError(data.error || "Erro ao excluir empresa.", "Falha na Exclusão");
      }
    } catch {
      showError("Falha ao comunicar com o servidor.", "Erro de Conexão");
    } finally {
      setIsDeleting(false);
    }
  };

  // Abrir Modal de Status
  const handleOpenStatusModal = (company: Company) => {
    setCompanyToChangeStatus(company);
    setNewStatus(company.status);
    setStatusModalOpen(true);
  };

  // Confirmar Mudança de Status
  const handleConfirmChangeStatus = async () => {
    if (!companyToChangeStatus) return;

    try {
      setIsChangingStatus(true);
      const res = await fetch(`/api/sa/companies/${companyToChangeStatus.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (data.success) {
        showSuccess(`Status da empresa "${companyToChangeStatus.name}" atualizado com sucesso!`, "Status Atualizado");
        setStatusModalOpen(false);
        setCompanyToChangeStatus(null);
        fetchCompanies();
      } else {
        showError(data.error || "Erro ao atualizar status da empresa.", "Falha ao Atualizar");
      }
    } catch {
      showError("Erro de conexão ao alterar status.", "Erro de Conexão");
    } finally {
      setIsChangingStatus(false);
    }
  };

  // Impersonalizar Empresa
  const handleImpersonate = async (company: Company) => {
    try {
      setImpersonatingId(company.id);
      const res = await fetch(`/api/sa/companies/${company.id}/impersonate`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success && data.redirectTo) {
        toast.success(`Acessando painel de "${company.name}" em nova janela...`);
        window.open(data.redirectTo, "_blank", "noopener,noreferrer");
      } else {
        showError(data.error || "Não foi possível impersonalizar esta empresa.", "Acesso Negado");
      }
    } catch {
      showError("Erro de comunicação ao solicitar impersonação.", "Falha de Conexão");
    } finally {
      setImpersonatingId(null);
    }
  };

  // Summary Metrics
  const totalCompanies = companies.length;
  const totalActive = companies.filter((c) => c.status === "active").length;
  const totalSubscriptionActive = companies.filter(
    (c) => c.subscription_status === "active"
  ).length;
  const totalSubscriptionExpired = companies.filter(
    (c) => c.subscription_status === "expired" || c.subscription_status === "canceled" || !c.subscription_status
  ).length;

  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * 10;
    return companies.slice(start, start + 10);
  }, [companies, currentPage]);

  return (
    <div className="space-y-6">
      {/* 1. TOPO DA PÁGINA */}
      <div className="flex flex-col gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-indigo-400" />
              Empresas & Clientes
            </h1>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre, monitore e defina quotas operacionais para as empresas do ecossistema.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 w-full pt-1">
          <button
            onClick={() => fetchCompanies()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all focus:outline-none disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? "animate-spin" : ""}`} />
            <span className="whitespace-nowrap">Atualizar</span>
          </button>

          {can("companies", "create") && (
            <Link
              href="/sa/companies/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Nova Empresa</span>
            </Link>
          )}
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Empresas */}
        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total de Empresas</p>
            <p className="text-2xl font-black text-white mt-1">{totalCompanies}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Empresas Ativas */}
        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Empresas Ativas</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{totalActive}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Assinatura Ativa */}
        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Assinatura Ativa</p>
            <p className="text-2xl font-black text-cyan-400 mt-1">{totalSubscriptionActive}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Assinatura Expirada */}
        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 shadow-xl shadow-black/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Assinatura Expirada</p>
            <p className="text-2xl font-black text-rose-400 mt-1">{totalSubscriptionExpired}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS & PESQUISA */}
      <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, CNPJ/CPF, e-mail..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer w-full"
            >
              <option value="all" className="bg-slate-900 text-slate-200">Todos os Status</option>
              <option value="active" className="bg-slate-900 text-slate-200">Ativas</option>
              <option value="inactive" className="bg-slate-900 text-slate-200">Inativas</option>
              <option value="suspended" className="bg-slate-900 text-slate-200">Suspensas</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. TABELA / LISTA DE EMPRESAS */}
      <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 shadow-2xl shadow-black/30 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-xs font-medium">Carregando empresas cadastradas...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-center text-slate-400">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nenhuma empresa encontrada</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Não localizamos nenhuma empresa correspondente aos critérios de busca ou filtros aplicados.
              </p>
            </div>
            <Link
              href="/sa/companies/new"
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Primeira Empresa</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1222] border-b border-slate-800/90 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Empresa / Razão Social</th>
                  <th className="px-5 py-3.5">Documento / Contato</th>
                  <th className="px-5 py-3.5">Plano</th>
                  <th className="px-5 py-3.5">Limites Operacionais</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedCompanies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-slate-900/40 transition-colors group"
                  >
                    {/* Nome & Fantasia */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
                          {company.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                            {company.name}
                          </div>
                          {company.trade_name && (
                            <div className="text-[11px] text-slate-400">
                              {company.trade_name}
                            </div>
                          )}
                          {company.address_city && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span>{company.address_city} - {company.address_state || "BR"}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Documento & Contato */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="font-mono text-slate-300 text-[11px]">
                          {company.document || "Sem documento"}
                        </div>
                        {company.email && (
                          <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{company.email}</span>
                          </div>
                        )}
                        {company.phone && (
                          <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{company.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Plano / Assinatura Atual */}
                    <td className="px-5 py-4">
                      {company.active_subscription_id ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold text-[11px]">
                            <Layers className="w-3 h-3" />
                            {company.current_plan_name || company.plan}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Assinatura Ativa</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold text-[11px]">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>Sem Assinatura</span>
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Limites Operacionais */}
                    <td className="px-5 py-4">
                      {company.active_subscription_id && company.subscription_status === "active" ? (
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>
                              {company.quota_max_groups === 0 ? "Grupos: Ilimitado" : `${company.quota_max_groups ?? 0} grupos`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Package className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            <span>
                              {company.quota_max_products === 0 ? "Produtos: Ilimitado" : `${company.quota_max_products ?? 0} produtos`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>
                              {(company.quota_max_messages_day ?? company.max_messages_day).toLocaleString("pt-BR")} msgs/dia
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-500 text-[11px] italic flex items-center gap-1.5">
                          <span>Sem limites definidos</span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {can("companies", "delete") ? (
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(company)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 cursor-pointer ${
                            company.status === "active"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                              : company.status === "suspended"
                              ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25"
                              : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                          }`}
                          title="Clique para alterar status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              company.status === "active"
                                ? "bg-emerald-400 animate-pulse"
                                : company.status === "suspended"
                                ? "bg-rose-400"
                                : "bg-slate-500"
                            }`}
                          />
                          <span>
                            {company.status === "active"
                              ? "Ativa"
                              : company.status === "suspended"
                              ? "Suspensa"
                              : "Inativa"}
                          </span>
                          <ArrowUpDown className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            company.status === "active"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : company.status === "suspended"
                              ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              company.status === "active"
                                ? "bg-emerald-400"
                                : company.status === "suspended"
                                ? "bg-rose-400"
                                : "bg-slate-500"
                            }`}
                          />
                          <span>
                            {company.status === "active"
                              ? "Ativa"
                              : company.status === "suspended"
                              ? "Suspensa"
                              : "Inativa"}
                          </span>
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {can("companies", "impersonate") && (
                          <button
                            type="button"
                            onClick={() => handleImpersonate(company)}
                            disabled={impersonatingId === company.id}
                            className="p-2 rounded-xl text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
                            title={`Impersonalizar painel de "${company.name}"`}
                          >
                            {impersonatingId === company.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                            ) : (
                              <ExternalLink className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {can("companies", "edit") && (
                          <Link
                            href={`/sa/companies/${company.id}`}
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors inline-block"
                            title="Editar Empresa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        )}
                        {can("companies", "delete") && (
                          <button
                            onClick={() => {
                              setCompanyToDelete(company);
                              setDeleteModalOpen(true);
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Excluir Empresa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {!can("companies", "impersonate") && !can("companies", "edit") && !can("companies", "delete") && (
                          <span className="text-[11px] text-slate-600 italic">Somente leitura</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginação Padrão de 10 Itens */}
            {!loading && companies.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={companies.length}
                pageSize={10}
                onPageChange={(page) => setCurrentPage(page)}
              />
            )}
          </div>
        )}
      </div>

      {/* 5. MODAL DE CRIAÇÃO / EDIÇÃO */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => !isSubmitting && setModalOpen(false)}
          />

          <div className="relative w-full max-w-2xl rounded-2xl bg-[#0b1120] border border-slate-800 p-6 sm:p-7 shadow-2xl shadow-black space-y-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {modalMode === "create" ? "Nova Empresa" : "Editar Empresa"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalMode === "create"
                      ? "Preencha os dados e quotas do novo cliente tenant."
                      : `Editando dados de ${selectedCompany?.name}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                disabled={isSubmitting}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dados Básicos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={formData.trade_name}
                    onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                    placeholder="Ex: JH7 Marketing"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CNPJ ou CPF
                  </label>
                  <input
                    type="text"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@empresa.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    maxLength={15}
                    onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              {/* Localização */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
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

              {/* Configuração de Plano & Quotas */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-4">
                <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Plano & Limites Operacionais
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Plano Contratado
                    </label>
                    <select
                      value={formData.plan}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      <option value="Starter">Starter</option>
                      <option value="Pro">Pro</option>
                      <option value="Enterprise">Enterprise</option>
                      <option value="Custom">Custom / Ilimitado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Status da Conta
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" | "suspended" })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      <option value="active">Ativa</option>
                      <option value="inactive">Inativa</option>
                      <option value="suspended">Suspensa</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Limite de Instâncias WhatsApp
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formData.max_instances}
                      onChange={(e) => setFormData({ ...formData, max_instances: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Limite de Mensagens / Dia
                    </label>
                    <input
                      type="number"
                      min={100}
                      step={500}
                      value={formData.max_messages_day}
                      onChange={(e) => setFormData({ ...formData, max_messages_day: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Botões do Formulário */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{modalMode === "create" ? "Criar Empresa" : "Salvar Alterações"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteModalOpen && companyToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => !isDeleting && setDeleteModalOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-2xl bg-[#0b1120] border border-slate-800 p-6 shadow-2xl shadow-black space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Excluir Empresa</h3>
                <p className="text-xs text-slate-400">
                  Tem certeza que deseja excluir a empresa <span className="font-semibold text-white font-mono">"{companyToDelete.name}"</span>?
                </p>
                <p className="text-[11px] text-rose-400/90 pt-1">
                  Atenção: Os usuários vinculados serão desassociados. Esta ação não poderá ser desfeita.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL DE ALTERAÇÃO DE STATUS */}
      {statusModalOpen && companyToChangeStatus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => !isChangingStatus && setStatusModalOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-2xl bg-[#0b1120] border border-slate-800 p-6 shadow-2xl shadow-black space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <ArrowUpDown className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Alterar Status da Empresa</h3>
                <p className="text-xs text-slate-400">
                  Defina o novo status operacional para a empresa <span className="font-semibold text-white">"{companyToChangeStatus.name}"</span>:
                </p>
              </div>
            </div>

            {/* Opções de Status */}
            <div className="space-y-2.5 pt-1">
              <label
                onClick={() => setNewStatus("active")}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  newStatus === "active"
                    ? "bg-emerald-500/10 border-emerald-500/50 text-white"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <div>
                    <div className="font-bold text-xs">Ativa</div>
                    <div className="text-[11px] text-slate-400">Acesso liberado e disparos normais</div>
                  </div>
                </div>
                {newStatus === "active" && <Check className="w-4 h-4 text-emerald-400" />}
              </label>

              <label
                onClick={() => setNewStatus("suspended")}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  newStatus === "suspended"
                    ? "bg-rose-500/10 border-rose-500/50 text-white"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div>
                    <div className="font-bold text-xs">Suspensa</div>
                    <div className="text-[11px] text-slate-400">Bloqueio de painel e suspensão de envios</div>
                  </div>
                </div>
                {newStatus === "suspended" && <Check className="w-4 h-4 text-rose-400" />}
              </label>

              <label
                onClick={() => setNewStatus("inactive")}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  newStatus === "inactive"
                    ? "bg-slate-700/30 border-slate-500/50 text-white"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <div>
                    <div className="font-bold text-xs">Inativa</div>
                    <div className="text-[11px] text-slate-400">Empresa desativada pelo Super Admin</div>
                  </div>
                </div>
                {newStatus === "inactive" && <Check className="w-4 h-4 text-slate-300" />}
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                disabled={isChangingStatus}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmChangeStatus}
                disabled={isChangingStatus}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-60"
              >
                {isChangingStatus ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirmar Status</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
