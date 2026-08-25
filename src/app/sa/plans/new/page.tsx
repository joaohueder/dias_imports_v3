"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  ArrowLeft,
  DollarSign,
  Package,
  Users,
  MessageSquare,
  Server,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { FloatingActionBar } from "@/components/ui/FloatingActionBar";
import { maskCurrencyInput, parseCurrencyInput } from "@/lib/formatters";

interface PlanFormPageProps {
  params?: Promise<{ id?: string }>;
}

export default function PlanFormPage({ params }: PlanFormPageProps) {
  const router = useRouter();
  const { showError, showSuccess } = useFeedbackModal();
  const resolvedParams = params ? use(params) : undefined;
  const planId = resolvedParams?.id;
  const isEditing = Boolean(planId);

  const [loading, setLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "0,00",
    billing_cycle: "monthly",
    status: "active" as "active" | "inactive",
    max_groups: "10",
    max_products: "100",
    max_messages_day: "1000",
    is_featured: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carregar dados se for edição
  useEffect(() => {
    if (!isEditing || !planId) return;

    async function fetchPlan() {
      try {
        setLoading(true);
        const res = await fetch(`/api/sa/plans/${planId}`);
        const data = await res.json();

        if (data.success && data.plan) {
          const rawPrice = Number(data.plan.price || 0).toFixed(2);
          const formattedPrice = maskCurrencyInput(rawPrice.replace(".", ""));
          const loaded = {
            name: data.plan.name || "",
            description: data.plan.description || "",
            price: formattedPrice,
            billing_cycle: data.plan.billing_cycle || "monthly",
            status: data.plan.status || "active",
            max_groups: String(data.plan.max_groups ?? "10"),
            max_products: String(data.plan.max_products ?? "100"),
            max_messages_day: String(data.plan.max_messages_day ?? "1000"),
            is_featured: Boolean(data.plan.is_featured),
          };
          setFormData(loaded);
          setInitialData(JSON.stringify(loaded));
        } else {
          showError(data.error || "Erro ao carregar dados do plano.", "Plano Não Encontrado");
          router.push("/sa/plans");
        }
      } catch {
        showError("Erro ao comunicar com o servidor.", "Erro de Conexão");
        router.push("/sa/plans");
      } finally {
        setLoading(false);
      }
    }

    fetchPlan();
  }, [isEditing, planId, router, showError]);

  // Se não estiver editando, inicializa o initialData na primeira renderização
  useEffect(() => {
    if (!isEditing && !initialData) {
      setInitialData(JSON.stringify(formData));
    }
  }, [isEditing, initialData, formData]);

  const isDirty = initialData !== "" && JSON.stringify(formData) !== initialData;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "price") {
      const masked = maskCurrencyInput(value);
      setFormData((prev) => ({ ...prev, price: masked }));
      if (errors.price) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.price;
          return next;
        });
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Nome do plano é obrigatório";
    const numericPrice = parseCurrencyInput(formData.price);
    if (numericPrice < 0) {
      newErrors.price = "Preço inválido";
    }
    if (isNaN(Number(formData.max_groups)) || Number(formData.max_groups) < 0) {
      newErrors.max_groups = "Informe um limite válido (0 para ilimitado)";
    }
    if (isNaN(Number(formData.max_products)) || Number(formData.max_products) < 0) {
      newErrors.max_products = "Informe um limite válido (0 para ilimitado)";
    }
    if (isNaN(Number(formData.max_messages_day)) || Number(formData.max_messages_day) < 0) {
      newErrors.max_messages_day = "Informe um limite válido";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      showError("Preencha corretamente os campos destacados no formulário.", "Campos Inválidos");
      return;
    }

    try {
      setIsSubmitting(true);
      const endpoint = isEditing ? `/api/sa/plans/${planId}` : "/api/sa/plans";
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        ...formData,
        price: parseCurrencyInput(formData.price),
        max_instances: 1, // Sempre 1 instância por padrão para todos os planos
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        showSuccess(
          isEditing ? "Plano atualizado com sucesso!" : "Plano cadastrado com sucesso!",
          "Salvo com Sucesso"
        );
        router.push("/sa/plans");
      } else {
        showError(data.error || "Ocorreu um erro ao salvar o plano.", "Falha ao Salvar");
      }
    } catch {
      showError("Erro de conexão ao comunicar com o servidor.", "Erro de Conexão");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    if (isEditing) {
      router.push("/sa/plans");
    } else {
      setFormData({
        name: "",
        description: "",
        price: "0,00",
        billing_cycle: "monthly",
        status: "active",
        max_groups: "10",
        max_products: "100",
        max_messages_day: "1000",
        is_featured: false,
      });
      setErrors({});
      toast.info("Formulário limpo.");
    }
  };

  const isFormInvalid = useMemo(() => {
    if (!formData.name.trim()) return true;
    if (errors.name || errors.price || errors.max_groups || errors.max_products || errors.max_messages_day) return true;
    return false;
  }, [formData, errors]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-medium">Carregando dados do plano...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/sa/plans"
            className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {isEditing ? "Editar Plano" : "Novo Plano de Assinatura"}
            </h1>
            <p className="text-xs text-slate-400">
              {isEditing
                ? "Atualize os valores, limites operacionais e status do plano."
                : "Defina um novo pacote comercial com limites de grupos, produtos e envios."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Identificação do Plano */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Dados Comerciais do Plano
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome do Plano <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: Profissional, Starter, Scale..."
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                    errors.name
                      ? "border-rose-500/80 focus:border-rose-500"
                      : "border-slate-800 focus:border-indigo-500/50"
                  }`}
                />
                {errors.name && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Preço (R$) <span className="text-indigo-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-400">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0,00"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border text-sm font-semibold text-white placeholder-slate-500 focus:outline-none transition-all ${
                      errors.price
                        ? "border-rose-500/80 focus:border-rose-500"
                        : "border-slate-800 focus:border-indigo-500/50"
                    }`}
                  />
                </div>
                {errors.price && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.price}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ciclo de Cobrança
                </label>
                <select
                  name="billing_cycle"
                  value={formData.billing_cycle}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="monthly">Mensal</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="semiannual">Semestral</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Descrição Comercial
                </label>
                <textarea
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Breve resumo dos benefícios ou público-alvo deste plano..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div>
                  <span className="text-xs font-bold text-white block">Plano em Destaque</span>
                  <span className="text-[11px] text-slate-400">
                    Exibe selo de recomendado e destaque visual na contratação.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Card: Limites Técnicos e Operacionais */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Package className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Limites do Plano (Operação)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Limite de Grupos
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="max_groups"
                    value={formData.max_groups}
                    onChange={handleChange}
                    placeholder="10"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  0 = ilimitado.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Limite de Produtos
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="max_products"
                    value={formData.max_products}
                    onChange={handleChange}
                    placeholder="100"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  0 = ilimitado.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Envios Diários
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="max_messages_day"
                    value={formData.max_messages_day}
                    onChange={handleChange}
                    placeholder="1000"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Msgs/dia somando grupos.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Lateral: Status & Resumo Visual */}
        <div className="space-y-6">
          {/* Card: Status da Publicação */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800">
              Disponibilidade
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Status do Plano
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, status: "active" }))}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    formData.status === "active"
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Ativo
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, status: "inactive" }))}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    formData.status === "inactive"
                      ? "bg-slate-700/30 border-slate-600 text-slate-300"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Inativo
                </button>
              </div>
            </div>
          </div>

          {/* Card: Preview em Tempo Real */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/40 border border-indigo-500/30 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                Preview Comercial
              </span>
              {formData.is_featured && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                  Destaque
                </span>
              )}
            </div>

            <div>
              <h4 className="text-lg font-black text-white">{formData.name || "Nome do Plano"}</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {formData.description || "Descrição de prévia do plano."}
              </p>
            </div>

            <div className="py-2">
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-slate-400">R$</span>
                <span className="text-2xl font-black text-white">
                  {formData.price || "0,00"}
                </span>
                <span className="text-xs text-slate-400">/ mês</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>{formData.max_groups === "0" ? "Grupos Ilimitados" : `${formData.max_groups || 0} Grupos`}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-violet-400" />
                <span>{formData.max_products === "0" ? "Produtos Ilimitados" : `${formData.max_products || 0} Produtos`}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>{Number(formData.max_messages_day || 0).toLocaleString("pt-BR")} Envios/dia</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                <span>1 Instância WhatsApp (Padrão)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra Flutuante Padrão do Sistema */}
      <FloatingActionBar
        isVisible={isDirty}
        isSubmitting={isSubmitting}
        disabled={isFormInvalid}
        onSave={handleSave}
        onCancel={handleResetForm}
        saveLabel={isEditing ? "Salvar Alterações" : "Criar Plano"}
        cancelLabel={isEditing ? "Descartar" : "Limpar"}
      />
    </div>
  );
}
