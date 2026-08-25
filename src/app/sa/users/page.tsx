"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Plus,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Lock,
  Edit2,
  Trash2,
  Power,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { SAAS_MODULES_DEFINITION, ACTION_LABELS } from "@/lib/permissions";

interface UserItem {
  id: number;
  name: string;
  email: string;
  whatsapp?: string | null;
  role: "SUPER_ADMIN" | "ADMIN";
  permissions: Record<string, Record<string, boolean>> | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

// Helper para gerar iniciais (primeiro e último nome)
function getUserInitials(name: string): string {
  if (!name) return "US";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function SaUsersPage() {
  const { showError, showSuccess } = useFeedbackModal();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  const [currentLoggedUser, setCurrentLoggedUser] = useState<{ id: number; email: string } | null>(null);

  // Modais de Governança
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search.trim()) params.append("search", search.trim());

      const [resUsers, resProfile] = await Promise.all([
        fetch(`/api/sa/users?${params.toString()}`),
        fetch("/api/sa/profile"),
      ]);

      const data = await resUsers.json();
      const profileData = await resProfile.json();

      if (profileData?.success && profileData.user) {
        setCurrentLoggedUser({ id: profileData.user.id, email: profileData.user.email });
      }

      if (data.success) {
        setUsers(data.users || []);
      } else {
        showError(data.message || "Erro ao carregar usuários.", "Falha ao Carregar");
      }
    } catch {
      showError("Falha ao comunicar com o servidor.", "Erro de Conexão");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, search, showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const nextStatus = selectedUser.status === "active" ? "inactive" : "active";
      const res = await fetch(`/api/sa/users/${selectedUser.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(data.message, "Status Atualizado");
        setIsStatusModalOpen(false);
        fetchUsers();
      } else {
        showError(data.message || "Erro ao alterar status.", "Falha ao Alterar Status");
      }
    } catch {
      showError("Falha ao processar solicitação.", "Erro de Conexão");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/sa/users/${selectedUser.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(data.message, "Usuário Excluído");
        setIsDeleteModalOpen(false);
        fetchUsers();
      } else {
        showError(data.message || "Erro ao excluir usuário.", "Falha ao Excluir");
      }
    } catch {
      showError("Falha ao excluir usuário.", "Erro de Conexão");
    } finally {
      setActionLoading(false);
    }
  };

  const countPerms = (perms: Record<string, Record<string, boolean>> | null) => {
    if (!perms) return 0;
    let count = 0;
    Object.values(perms).forEach((actions) => {
      Object.values(actions).forEach((allowed) => {
        if (allowed) count++;
      });
    });
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-indigo-400" />
              Usuários do Sistema
            </h1>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie operadores do SaaS. Super Admins têm acesso irrestrito, enquanto Admins possuem permissões granulares.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all focus:outline-none disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? "animate-spin" : ""}`} />
            <span className="whitespace-nowrap">Atualizar</span>
          </button>

          <Link
            href="/sa/users/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Novo Usuário</span>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 shadow-xl shadow-black/20 flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou whatsapp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Role Filter */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-950/70 border border-slate-800/90 text-xs">
            <button
              onClick={() => setRoleFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                roleFilter === "all"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              Todos Papéis
            </button>
            <button
              onClick={() => setRoleFilter("SUPER_ADMIN")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                roleFilter === "SUPER_ADMIN"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              Super Admin
            </button>
            <button
              onClick={() => setRoleFilter("ADMIN")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                roleFilter === "ADMIN"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              Admin
            </button>
          </div>

          {/* Status Filter */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-950/70 border border-slate-800/90 text-xs">
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === "active"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              Ativos
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === "inactive"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              Inativos
            </button>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === "all"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              Todos
            </button>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
          <p className="text-sm">Carregando usuários do sistema...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <Users className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-base font-semibold text-slate-300">Nenhum usuário encontrado</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tente ajustar os filtros de busca ou cadastre um novo usuário operador para o sistema.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {users.map((user) => {
            const isSuperAdmin = user.role === "SUPER_ADMIN";
            const allowedCount = countPerms(user.permissions);
            const isSelf =
              Boolean(currentLoggedUser) &&
              (Number(currentLoggedUser?.id) === Number(user.id) ||
                currentLoggedUser?.email.toLowerCase() === user.email.toLowerCase());

            return (
              <div
                key={user.id}
                className={`group relative rounded-2xl bg-slate-900/60 border p-5 backdrop-blur-sm transition-all duration-300 flex flex-col justify-between ${
                  isSelf ? "border-indigo-500/60 shadow-lg shadow-indigo-950/20" : "border-slate-800/80 hover:border-indigo-500/40"
                }`}
              >
                <div>
                  {/* Top Bar / Role & Status Badges */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isSuperAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          <Shield className="w-3.5 h-3.5 text-indigo-400" />
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Sliders className="w-3.5 h-3.5 text-amber-400" />
                          Admin ({allowedCount} regras)
                        </span>
                      )}
                      {isSelf && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white shadow-sm">
                          Você
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        user.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {user.status === "active" ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          Inativo
                        </>
                      )}
                    </span>
                  </div>

                  {/* User Profile Info */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/25 to-violet-500/25 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-sm shadow-inner group-hover:scale-105 transition-transform flex-shrink-0">
                      {getUserInitials(user.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                        {user.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.whatsapp && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>{user.whatsapp}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Permissions Summary Card */}
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 mb-4 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-semibold text-slate-300">Escopo de Acesso:</span>
                      {isSuperAdmin ? (
                        <span className="text-indigo-400 font-bold">100% Irrestrito</span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsPermissionsModalOpen(true);
                          }}
                          className="text-indigo-400 hover:text-indigo-300 underline font-medium"
                        >
                          Ver detalhes ({allowedCount} ações)
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {isSuperAdmin
                        ? "Possui permissão total para criar, editar, excluir e configurar todos os módulos e infraestrutura."
                        : allowedCount > 0
                        ? `Acesso liberado a recursos específicos configurados individualmente.`
                        : "Nenhuma permissão concedida no momento."}
                    </p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {!isSelf && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsStatusModalOpen(true);
                          }}
                          title={user.status === "active" ? "Inativar Usuário" : "Ativar Usuário"}
                          className={`p-2 rounded-lg text-xs transition-colors ${
                            user.status === "active"
                              ? "bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700/60"
                              : "bg-slate-800 hover:bg-emerald-950/40 text-slate-400 hover:text-emerald-400 border border-slate-700/60"
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Excluir Usuário"
                          className="p-2 rounded-lg text-xs bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors border border-slate-700/60"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {isSelf && (
                      <span className="text-[11px] text-slate-500 italic px-1">
                        Conta conectada
                      </span>
                    )}
                  </div>

                  <Link
                    href={isSelf ? "/sa/profile" : `/sa/users/${user.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all border border-slate-700/60 hover:border-indigo-500"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{isSelf ? "Meu Perfil" : "Editar & Permissões"}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Visualizar Permissões do Admin */}
      {isPermissionsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Permissões de {selectedUser.name}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPermissionsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 space-y-4">
              {SAAS_MODULES_DEFINITION.map((mod) => {
                const userModPerms = selectedUser.permissions?.[mod.id] || {};
                return (
                  <div
                    key={mod.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-xs font-bold text-white">{mod.name}</span>
                      <p className="text-[11px] text-slate-400">{mod.description}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {mod.actions.map((act) => {
                        const isGranted = Boolean(userModPerms[act]);
                        return (
                          <span
                            key={act}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                              isGranted
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : "bg-slate-900 text-slate-500 border-slate-800"
                            }`}
                          >
                            {ACTION_LABELS[act] || act}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <Link
                href={`/sa/users/${selectedUser.id}`}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all"
              >
                Alterar Permissões
              </Link>
              <button
                onClick={() => setIsPermissionsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mudança de Status */}
      {isStatusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl ${
                  selectedUser.status === "active"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                <Power className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedUser.status === "active" ? "Inativar Usuário" : "Ativar Usuário"}
                </h3>
                <p className="text-xs text-slate-400">Confirmação de alteração de acesso</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja {selectedUser.status === "active" ? "inativar" : "ativar"} o usuário{" "}
              <strong className="text-white">{selectedUser.name}</strong> ({selectedUser.email})?
              {selectedUser.status === "active" &&
                " O usuário perderá imediatamente a permissão de login no painel do SaaS."}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-lg transition-all ${
                  selectedUser.status === "active"
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                }`}
              >
                {actionLoading ? "Processando..." : "Confirmar Alteração"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Excluir Usuário */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Usuário</h3>
                <p className="text-xs text-rose-400 font-medium">Ação irreversível</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Você está prestes a excluir permanentemente o cadastro do usuário{" "}
              <strong className="text-white">{selectedUser.name}</strong> ({selectedUser.email}).
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-600/30 transition-all"
              >
                {actionLoading ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
