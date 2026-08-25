"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  X
} from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: number;
  name: string;
  trade_name: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  plan: string;
  status: "active" | "inactive" | "suspended";
  max_instances: number;
  max_messages_day: number;
  address_city: string | null;
  address_state: string | null;
  user_count: number;
  created_at: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modais de Criação / Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Modal de Exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      } else {
        toast.error(data.error || "Erro ao carregar empresas");
      }
    } catch {
      toast.error("Erro de conexão ao buscar empresas");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

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
      toast.error("A Razão Social / Nome da Empresa é obrigatório.");
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
        toast.success(
          modalMode === "create"
            ? "Empresa criada com sucesso!"
            : "Empresa atualizada com sucesso!"
        );
        setModalOpen(false);
        fetchCompanies();
      } else {
        toast.error(data.error || "Ocorreu um erro ao salvar.");
      }
    } catch {
      toast.error("Erro de conexão ao salvar empresa.");
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
        toast.success(`Empresa "${companyToDelete.name}" excluída.`);
        setDeleteModalOpen(false);
        setCompanyToDelete(null);
        fetchCompanies();
      } else {
        toast.error(data.error || "Erro ao excluir empresa.");
      }
    } catch {
      toast.error("Falha ao comunicar com o servidor.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Summary Metrics
  const totalCompanies = companies.length;
  const totalActive = companies.filter((c) => c.status === "active").length;
  const totalSubscriptionActive = companies.filter((c) => c.status === "active").length;
  const totalSubscriptionExpired = companies.filter(
    (c) => c.status === "suspended" || c.status === "inactive"
  ).length;

  return (
    <div className="space-y-6">
      {/* 1. TOPO DA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Gestão Multi-Tenancy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Empresas & Clientes
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Cadastre, monitore e defina quotas operacionais para as empresas do ecossistema.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCompanies()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          </button>

          <Link
            href="/sa/companies/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Empresa</span>
          </Link>
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
                  <th className="px-5 py-3.5">Quotas (Instâncias / Msgs)</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {companies.map((company) => (
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

                    {/* Plano */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold text-[11px]">
                        <Layers className="w-3 h-3" />
                        {company.plan}
                      </span>
                    </td>

                    {/* Quotas */}
                    <td className="px-5 py-4">
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Max {company.max_instances} instâncias</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{company.max_messages_day.toLocaleString("pt-BR")} msgs/dia</span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
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
                              ? "bg-emerald-400 animate-pulse"
                              : company.status === "suspended"
                              ? "bg-rose-400"
                              : "bg-slate-500"
                          }`}
                        />
                        {company.status === "active"
                          ? "Ativa"
                          : company.status === "suspended"
                          ? "Suspensa"
                          : "Inativa"}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/sa/companies/${company.id}`}
                          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors inline-block"
                          title="Editar Empresa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
    </div>
  );
}
