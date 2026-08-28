"use client";

import React from "react";
import Link from "next/link";
import { Lock, Crown, AlertTriangle, ArrowRight, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";

interface SubscriptionBlockedBannerProps {
  status?: "expired" | "past_due" | "canceled" | "none" | string;
  planName?: string;
  isImpersonating?: boolean;
}

export function SubscriptionBlockedBanner({
  status = "none",
  planName,
  isImpersonating = false,
}: SubscriptionBlockedBannerProps) {
  const getStatusMessage = () => {
    switch (status) {
      case "expired":
        return "Sua assinatura expirou. Os recursos da sua conta e páginas promocionais estão temporariamente bloqueados.";
      case "past_due":
        return "Sua assinatura está aguardando confirmação de pagamento. Renove agora para manter seus acessos liberados.";
      case "canceled":
        return "Sua assinatura foi cancelada. Assine um plano para reativar todos os recursos imediatamente.";
      default:
        return "Sua empresa não possui uma assinatura ativa no momento. Contrate um plano para liberar os recursos da sua conta.";
    }
  };

  return (
    <div
      className={`fixed left-0 right-0 z-50 bg-gradient-to-r from-red-700 via-rose-700 to-amber-700 text-white shadow-2xl shadow-rose-950/80 border-b border-red-500/40 transition-all ${
        isImpersonating ? "top-8" : "top-0"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left min-h-[48px]">
        <div className="flex items-center gap-3">
          <span className="p-1.5 rounded-xl bg-black/30 text-amber-300 shrink-0 animate-bounce">
            <Lock className="w-4 h-4" />
          </span>
          <div className="text-xs sm:text-sm font-semibold text-white/95 leading-tight">
            <strong className="text-amber-200 font-extrabold uppercase tracking-wide mr-1.5">
              CONTA BLOQUEADA:
            </strong>
            <span>{getStatusMessage()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-center">
          <Link
            href="/painel/configuracoes/assinatura?tab=upgrade"
            className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl bg-white text-rose-800 hover:bg-amber-100 hover:text-rose-900 transition-all font-black text-xs shadow-lg shadow-black/30 hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Regularizar / Ativar Assinatura</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

interface SubscriptionBlockedCardProps {
  title?: string;
  description?: string;
  actionText?: string;
}

export function SubscriptionBlockedCard({
  title = "Recurso Bloqueado",
  description = "Este recurso está temporariamente bloqueado porque sua empresa não possui uma assinatura ativa.",
  actionText = "Ver Planos & Ativar Assinatura",
}: SubscriptionBlockedCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#090f1d]/90 border border-rose-500/30 p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-2xl shadow-black/40 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 via-transparent to-amber-500/5 pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Ícone de bloqueio */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-600 to-amber-600 p-0.5 shadow-xl shadow-rose-950/60">
          <div className="w-full h-full bg-[#090f1d] rounded-[22px] flex items-center justify-center text-rose-400">
            <Lock className="w-10 h-10 animate-pulse text-amber-400" />
          </div>
        </div>
        <span className="absolute -top-2 -right-2 flex h-6 w-6">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-6 w-6 bg-rose-500 text-xs font-black text-white items-center justify-center shadow-md">
            !
          </span>
        </span>
      </div>

      {/* Badges */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30 mb-3 shadow-inner">
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>Assinatura Inativa ou Expirada</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight max-w-lg mb-2">
        {title}
      </h2>

      <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
        {description}
      </p>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/painel/configuracoes/assinatura?tab=upgrade"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Crown className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>{actionText}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <Link
          href="/painel/configuracoes/assinatura?tab=historico"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-sm font-semibold transition-all cursor-pointer"
        >
          <span>Histórico de Faturas</span>
        </Link>
      </div>
    </div>
  );
}
