"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Layers,
  Plus,
  Search,
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
} from "lucide-react";
import { toast } from "sonner";

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
  active_subscriptions_count?: number;
  created_at: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        toast.error(data.error || "Erro ao carregar planos");
      }
    } catch {
      toast.error("Erro de conexão ao buscar planos");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

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
        toast.success("Plano excluído com sucesso!");
        setDeleteModalOpen(false);
        setPlanToDelete(null);
        fetchPlans();
      } else {
        toast.error(data.error || "Erro ao excluir o plano.");
      }
    } catch {
      toast.error("Erro de conexão ao excluir o plano.");
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
        toast.error(data.error || "Erro ao salvar nova ordenação.");
        fetchPlans();
      }
    } catch {
      toast.error("Erro de conexão ao reordenar planos.");
      fetchPlans();
    } finally {
      setIsSavingOrder(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Planos</h1>
            <p className="text-sm text-slate-400">
              Gerencie modelos comerciais, limites de grupos, produtos, envios diários e precificação.
            </p>
          </div>
        </div>

        <Link
          href="/sa/plans/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Plano</span>
        </Link>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome do plano ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
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
                className={`relative flex flex-col justify-between rounded-2xl bg-slate-900/60 border transition-colors p-6 cursor-default ${
                  isPlanFeatured
                    ? "border-indigo-500/50 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/20"
                    : "border-slate-800/80 hover:border-slate-700/80"
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
                  <span className="text-[11px] text-slate-500 font-medium">
                    {plan.active_subscriptions_count || 0} empresa{plan.active_subscriptions_count === 1 ? "" : "s"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/sa/plans/${plan.id}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      title="Editar Plano"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
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
                  </div>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
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
              Esta ação só será permitida se não existirem assinaturas vinculadas a ele.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeletePlan}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
              >
                {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
