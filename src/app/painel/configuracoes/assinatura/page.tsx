"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Zap,
  Crown,
  Sparkles,
  CheckCircle2,
  Calendar,
  History,
  CreditCard,
  Building2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Layers,
  MessageSquare,
  Package,
  Users,
  Users2,
  Eye,
  Send,
} from "lucide-react";
import { PainelLayoutClient } from "@/components/painel/PainelLayoutClient";
import { toast } from "sonner";

interface PlanItem {
  id: number;
  name: string;
  description: string;
  price: string | number;
  billing_cycle: string;
  max_groups: number;
  max_products: number;
  max_messages_day: number;
  max_views: number;
  max_leads: number;
  max_instances: number;
  is_featured: boolean | number;
  features: string[] | string | null;
}

interface SubscriptionItem {
  id: number;
  company_id: number;
  plan_id: number;
  plan_name?: string;
  plan_snapshot_name?: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "expired";
  current_period_start: string;
  current_period_end: string;
  payment_method?: string;
  price_at_subscription?: string | number;
  plan_snapshot_max_groups?: number;
  plan_snapshot_max_products?: number;
  plan_snapshot_max_messages_day?: number;
  plan_snapshot_max_views?: number;
  plan_snapshot_max_leads?: number;
  created_at: string;
}

function AssinaturaPageContent() {
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [activeSub, setActiveSub] = useState<SubscriptionItem | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upgrade" | "historico">("upgrade");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "historico") {
      setActiveTab("historico");
    } else if (tab === "upgrade") {
      setActiveTab("upgrade");
    }
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, subRes] = await Promise.all([
        fetch("/api/painel/dashboard"),
        fetch("/api/painel/assinatura"),
      ]);

      if (dashRes.ok) {
        const dJson = await dashRes.json();
        if (dJson.success) setDashboardData(dJson);
      }

      if (subRes.ok) {
        const sJson = await subRes.json();
        if (sJson.success) {
          setPlans(sJson.plans || []);
          setSubscriptions(sJson.subscriptions || []);
          setActiveSub(sJson.activeSubscription || null);
        }
      }
    } catch {
      toast.error("Erro ao carregar dados de assinatura.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const parseFeatures = (features: any): string[] => {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Ativa
          </span>
        );
      case "trialing":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            Período de Teste
          </span>
        );
      case "past_due":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Pendente
          </span>
        );
      case "expired":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Expirada
          </span>
        );
      case "canceled":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-500/15 text-slate-400 border border-slate-500/30">
            Cancelada
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <PainelLayoutClient user={dashboardData?.user} company={dashboardData?.company}>
      <div className="space-y-6 animate-in fade-in duration-200">
        
        {/* CABEÇALHO PADRONIZADO */}
        <div className="flex flex-col gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-white tracking-tight">Planos & Assinatura</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  Plano {dashboardData?.company?.plan || "Iniciante"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Gerencie seu plano, faça upgrades para liberar novos limites de envios e confira seu histórico de renovações.
              </p>
            </div>
          </div>

          {/* Abas e Ações na Linha de Baixo */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("upgrade")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "upgrade"
                    ? "bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md shadow-rose-600/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Fazer Upgrade de Plano</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("historico")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "historico"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-teal-600/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Histórico de Assinatura</span>
              </button>
            </div>

            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
            <span className="text-xs font-medium">Carregando informações da sua assinatura...</span>
          </div>
        ) : activeTab === "upgrade" ? (
          /* ABA: UPGRADE DE PLANO */
          <div className="space-y-6">
            
            {/* CARD DE ASSINATURA ATUAL */}
            {activeSub && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Assinatura Ativa</span>
                    {getStatusBadge(activeSub.status)}
                  </div>
                  <h3 className="text-lg font-black text-white">
                    {activeSub.plan_snapshot_name || activeSub.plan_name || dashboardData?.company?.plan}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Vigência válida até{" "}
                    <span className="font-mono text-emerald-400 font-semibold">
                      {new Date(activeSub.current_period_end).toLocaleDateString("pt-BR")}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Grupos</span>
                    <span className="font-bold text-white">
                      {activeSub.plan_snapshot_max_groups || "Ilimitado"}
                    </span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Produtos</span>
                    <span className="font-bold text-white">
                      {activeSub.plan_snapshot_max_products || "Ilimitado"}
                    </span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Disparos/dia</span>
                    <span className="font-bold text-white">
                      {activeSub.plan_snapshot_max_messages_day || "Ilimitado"}
                    </span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Views</span>
                    <span className="font-bold text-white">
                      {activeSub.plan_snapshot_max_views || "Ilimitado"}
                    </span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Leads</span>
                    <span className="font-bold text-white">
                      {activeSub.plan_snapshot_max_leads || "Ilimitado"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* GRID DE PLANOS PARA UPGRADE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => {
                const isCurrent =
                  (dashboardData?.company?.plan || "").toLowerCase() === p.name.toLowerCase() ||
                  (activeSub?.plan_id === p.id && activeSub?.status === "active");
                const featList = parseFeatures(p.features);

                return (
                  <div
                    key={p.id}
                    className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all ${
                      p.is_featured
                        ? "bg-gradient-to-b from-slate-900 via-slate-900/90 to-indigo-950/30 border-2 border-indigo-500/60 shadow-xl shadow-indigo-500/10"
                        : "bg-slate-900/60 border border-slate-800/90 hover:border-slate-700"
                    }`}
                  >
                    {p.is_featured ? (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-rose-500/30">
                        Mais Popular
                      </div>
                    ) : null}

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-black text-white">{p.name}</h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Plano Atual
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-2 min-h-[32px]">{p.description}</p>

                      <div className="mt-4 pt-4 border-t border-slate-800/80">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs text-slate-400 font-bold">R$</span>
                          <span className="text-3xl font-black text-white tracking-tight">
                            {Number(p.price).toFixed(2).replace(".", ",")}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">/mês</span>
                        </div>
                      </div>

                      <div className="mt-6 space-y-2.5 text-xs text-slate-300">
                        <div className="flex items-center gap-2 font-medium">
                          <Users2 className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>Até <strong>{p.max_groups || "Ilimitados"}</strong> grupos WhatsApp</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium">
                          <Package className="w-4 h-4 text-pink-400 shrink-0" />
                          <span>Até <strong>{p.max_products || "Ilimitados"}</strong> produtos no catálogo</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium">
                          <Send className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Até <strong>{p.max_messages_day || "Ilimitados"}</strong> disparos por dia</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium">
                          <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Até <strong>{p.max_views || "Ilimitadas"}</strong> visualizações mensais</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium">
                          <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span>Até <strong>{p.max_leads || "Ilimitados"}</strong> leads capturados</span>
                        </div>

                        {featList.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-slate-400">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-800/80">
                      {isCurrent ? (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-800/50 border border-slate-700/40 cursor-not-allowed"
                        >
                          Seu Plano Atual
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const wa = dashboardData?.company?.admin_whatsapp || "";
                            const cleanWa = wa.replace(/\D/g, "");
                            const msg = encodeURIComponent(
                              `Olá! Gostaria de fazer o upgrade do meu plano para o *${p.name}* no sistema Dias Imports.`
                            );
                            if (cleanWa) {
                              window.open(`https://wa.me/${cleanWa}?text=${msg}`, "_blank");
                            } else {
                              toast.info("Entre em contato com o suporte para concluir seu upgrade de plano.");
                            }
                          }}
                          className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black text-white transition-all cursor-pointer ${
                            p.is_featured
                              ? "bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 shadow-lg shadow-rose-600/30"
                              : "bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
                          }`}
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Migrar para {p.name}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ABA: HISTÓRICO DE ASSINATURA */
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Plano Contratado</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Início do Período</th>
                      <th className="py-3.5 px-4">Fim do Período</th>
                      <th className="py-3.5 px-4">Valor</th>
                      <th className="py-3.5 px-4">Pagamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {subscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          Nenhum registro de histórico de assinatura encontrado.
                        </td>
                      </tr>
                    ) : (
                      subscriptions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white">
                            {sub.plan_snapshot_name || sub.plan_name || "Plano Personalizado"}
                          </td>
                          <td className="py-3.5 px-4">
                            {getStatusBadge(sub.status)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {new Date(sub.current_period_start).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {new Date(sub.current_period_end).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-400">
                            R$ {Number(sub.price_at_subscription || 0).toFixed(2).replace(".", ",")}
                          </td>
                          <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-slate-400">
                            {sub.payment_method || "PIX"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </PainelLayoutClient>
  );
}

const AssinaturaPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Carregando assinatura...</div>}>
      <AssinaturaPageContent />
    </Suspense>
  );
};

export default AssinaturaPage;
