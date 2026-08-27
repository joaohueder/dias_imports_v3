"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Layers,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Edit2,
  Trash2,
  Users,
  MessageSquare,
  Package,
  Server,
  Sparkles,
  AlertTriangle,
  GripVertical,
  ArrowUpDown,
  Power,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { useSaAuth } from "@/context/SaAuthContext";

interface Plan {
  id: number;
  name: string;
  description: string | null;
  price: number | string;
  billing_cycle: "monthly" | "quarterly" | "semiannual" | "yearly";
  status: "active" | "inactive";
  max_groups: number;
  max_products: number;
  max_messages_day: number;
  max_instances: number;
  is_featured: boolean | number;
  sort_order?: number;
  subscriptions_count?: number;
  active_subscriptions_count?: number;
  created_at: string;
}

export default function PlansPage() {
  const { showError, showSuccess } = useFeedbackModal();
  const { can } = useSaAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [togglingPlanId, setTogglingPlanId] = useState<number | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [planToChangeStatus, setPlanToChangeStatus] = useState<Plan | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/sa/plans?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setPlans(data.plans || []);
      } else {
        showError(data.error || "Erro ao carregar planos", "Falha ao Carregar");
      }
    } catch {
      showError("Erro de conexão ao buscar planos", "Erro de Conexão");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, showError]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleDeletePlan = async () => {
    if (!planToDelete) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/sa/plans/${planToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        showSuccess("Plano excluído com sucesso!", "Plano Excluído");
        setDeleteModalOpen(false);
        setPlanToDelete(null);
        fetchPlans();
      } else {
        showError(data.error || "Erro ao excluir o plano.", "Falha na Exclusão");
      }
    } catch {
      showError("Erro de conexão ao excluir o plano.", "Erro de Conexão");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReorder = async (newOrder: Plan[]) => {
    setPlans(newOrder);

    try {
      setIsSavingOrder(true);
      const orderedIds = newOrder.map((p) => p.id);
      const res = await fetch("/api/sa/plans/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Ordem dos planos salva com sucesso!");
      } else {
        showError(data.error || "Erro ao salvar nova ordenação.", "Falha ao Reordenar");
        fetchPlans();
      }
    } catch {
      showError("Erro de conexão ao reordenar planos.", "Erro de Conexão");
      fetchPlans();
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!planToChangeStatus) return;
    const plan = planToChangeStatus;
    const nextStatus = plan.status === "active" ? "inactive" : "active";
    try {
      setTogglingPlanId(plan.id);
      const res = await fetch(`/api/sa/plans/${plan.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setPlans((prev) =>
          prev.map((p) => (p.id === plan.id ? { ...p, status: nextStatus } : p))
        );
        showSuccess(
          nextStatus === "active"
            ? `Plano "${plan.name}" ativado com sucesso!`
            : `Plano "${plan.name}" inativado com sucesso!`,
          "Status Atualizado"
        );
        setStatusModalOpen(false);
        setPlanToChangeStatus(null);
      } else {
        showError(data.error || "Erro ao alterar status do plano.", "Falha ao Atualizar");
      }
    } catch {
      showError("Erro de conexão ao alterar status do plano.", "Erro de Conexão");
    } finally {
      setTogglingPlanId(null);
    }
  };

  const cycleLabels: Record<string, string> = {
    monthly: "Mensal",
    quarterly: "Trimestral",
    semiannual: "Semestral",
    yearly: "Anual",
  };

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-indigo-400" />
              Planos Comerciais
            </h1>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie modelos comerciais, limites de grupos, produtos, envios diários e precificação.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 w-full pt-1">
          <button
            onClick={() => fetchPlans()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all focus:outline-none disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? "animate-spin" : ""}`} />
            <span className="whitespace-nowrap">Atualizar</span>
          </button>

          {can("plans", "create") && (
            <Link
              href="/sa/plans/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Novo Plano</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome do plano ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
              <option value="active" className="bg-slate-900 text-slate-200">Ativos</option>
              <option value="inactive" className="bg-slate-900 text-slate-200">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {!searchTerm && statusFilter === "all" && plans.length > 1 && (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/40 border border-slate-800/80 px-3.5 py-2 rounded-xl">
          <ArrowUpDown className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            Arraste os cards segurando pelo ícone para reorganizar a ordem de exibição comercial.
          </span>
          {isSavingOrder && (
            <span className="ml-auto text-indigo-400 font-semibold animate-pulse">
              Salvando ordem...
            </span>
          )}
        </div>
      )}

      {/* Grid de Planos */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Carregando planos...</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Nenhum plano encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Cadastre os planos do SaaS com os limites de operação e valores comerciais.
          </p>
          <Link
            href="/sa/plans/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <Plus className="w-4 h-4" />
            Criar Plano
          </Link>
        </div>
      ) : (
        <Reorder.Group
          axis="x"
          values={plans}
          onReorder={handleReorder}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0 m-0"
        >
          {plans.map((plan) => {
            const isPlanFeatured = Boolean(plan.is_featured);
            const isDragEnabled = !searchTerm && statusFilter === "all";
            const isInactive = plan.status === "inactive";

            return (
              <Reorder.Item
                key={plan.id}
                value={plan}
                dragListener={isDragEnabled}
                whileDrag={{
                  scale: 1.04,
                  rotate: 1.5,
                  zIndex: 50,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(99, 102, 241, 0.4)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                }}
                className={`relative flex flex-col justify-between rounded-2xl border transition-all p-6 cursor-default ${
                  isInactive
                    ? "bg-slate-900/30 border-slate-800/40 opacity-60 hover:opacity-85"
                    : isPlanFeatured
                    ? "bg-slate-900/60 border-indigo-500/50 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/20"
                    : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80"
                }`}
              >
                {isPlanFeatured && (
                  <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-md pointer-events-none">
                    <Sparkles className="w-3 h-3" />
                    Destaque
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-start gap-2.5">
                      {isDragEnabled && (
                        <div
                          className="mt-1 text-slate-500 hover:text-indigo-400 cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-slate-800 transition-colors"
                          title="Arraste para reordenar suavemente"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                              plan.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                            }`}
                          >
                            {plan.status === "active" ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        {plan.description && (
                          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                            {plan.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preço */}
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-semibold text-slate-400">R$</span>
                      <span className="text-3xl font-black text-white">
                        {Number(plan.price).toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">
                        / {cycleLabels[plan.billing_cycle] || "mês"}
                      </span>
                    </div>
                  </div>

                  {/* Limites */}
                  <div className="space-y-3 pt-1 mb-6">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Limites Inclusos
                    </div>

                    <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-400" />
                        Limite de Grupos:
                      </span>
                      <span className="font-bold text-white">
                        {plan.max_groups === 0 ? "Ilimitado" : `${plan.max_groups} grupos`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Package className="w-4 h-4 text-violet-400" />
                        Limite de Produtos:
                      </span>
                      <span className="font-bold text-white">
                        {plan.max_products === 0 ? "Ilimitado" : `${plan.max_products} produtos`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1.5">
                      <span className="text-slate-400 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        Limite de Envios:
                      </span>
                      <span className="font-bold text-white">
                        {plan.max_messages_day.toLocaleString("pt-BR")} / dia
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rodapé e Ações */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {plan.active_subscriptions_count || 0} ativa{Number(plan.active_subscriptions_count) === 1 ? "" : "s"}
                      {Number(plan.subscriptions_count || 0) > Number(plan.active_subscriptions_count || 0) && (
                        <span className="text-slate-500 ml-1">
                          ({plan.subscriptions_count} total)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {can("plans", "delete") && (
                      <button
                        type="button"
                        disabled={togglingPlanId === plan.id}
                        onClick={() => {
                          setPlanToChangeStatus(plan);
                          setStatusModalOpen(true);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          plan.status === "active"
                            ? "text-emerald-400 hover:text-rose-400 hover:bg-rose-500/10"
                            : "text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                        } disabled:opacity-50`}
                        title={plan.status === "active" ? "Inativar Plano" : "Ativar Plano"}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    )}
                    {can("plans", "edit") && (
                      <Link
                        href={`/sa/plans/${plan.id}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        title="Editar Plano"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                    )}
                    {can("plans", "delete") && (
                      <button
                        onClick={() => {
                          setPlanToDelete(plan);
                          setDeleteModalOpen(true);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Excluir Plano"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {!can("plans", "edit") && !can("plans", "delete") && (
                      <span className="text-[11px] text-slate-600 italic">Somente leitura</span>
                    )}
                  </div>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      )}

      {/* Modal de Confirmação de Mudança de Status */}
      {statusModalOpen && planToChangeStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  planToChangeStatus.status === "active"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}
              >
                <Power className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {planToChangeStatus.status === "active" ? "Inativar Plano" : "Ativar Plano"}
              </h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Deseja realmente {planToChangeStatus.status === "active" ? "inativar" : "ativar"} o plano{" "}
              <strong className="text-white font-bold">{planToChangeStatus.name}</strong>?
              {planToChangeStatus.status === "active"
                ? " Planos inativos não ficam visíveis para novas contratações no sistema."
                : " Planos ativos ficam imediatamente disponíveis para contratação e vinculação de empresas."}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStatusModalOpen(false);
                  setPlanToChangeStatus(null);
                }}
                disabled={togglingPlanId !== null}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={togglingPlanId !== null}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-lg flex items-center gap-2 ${
                  planToChangeStatus.status === "active"
                    ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/25"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25"
                }`}
              >
                {togglingPlanId !== null ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <span>
                    Confirmar {planToChangeStatus.status === "active" ? "Inativação" : "Ativação"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão de Plano */}
      {deleteModalOpen && planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Excluir Plano</h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir o plano{" "}
              <strong className="text-white font-bold">{planToDelete.name}</strong>?
            </p>

            {Number(planToDelete.subscriptions_count || planToDelete.active_subscriptions_count) > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Este plano possui {planToDelete.subscriptions_count || planToDelete.active_subscriptions_count} assinatura(s) vinculada(s)!
                </p>
                <p className="text-amber-300/85 leading-relaxed">
                  Não é permitida a exclusão deste plano para preservar o histórico e os dados das empresas.
                  {planToDelete.status === "active"
                    ? " Você pode inativá-lo para que não receba novas contratações."
                    : " O plano já se encontra inativo."}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {Number(planToDelete.subscriptions_count || planToDelete.active_subscriptions_count) > 0 ? "Fechar" : "Cancelar"}
              </button>

              {Number(planToDelete.subscriptions_count || planToDelete.active_subscriptions_count) > 0 ? (
                planToDelete.status === "active" ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = planToDelete;
                      setDeleteModalOpen(false);
                      setPlanToDelete(null);
                      setPlanToChangeStatus(target);
                      setStatusModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2"
                  >
                    <Power className="w-3.5 h-3.5" />
                    Inativar Plano
                  </button>
                ) : null
              ) : (
                <button
                  type="button"
                  onClick={handleDeletePlan}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
                >
                  {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
