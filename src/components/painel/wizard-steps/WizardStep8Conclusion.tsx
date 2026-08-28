"use client";

import React from "react";
import { PartyPopper, CheckCircle2, ArrowRight, Zap, Users2, Package, Sparkles } from "lucide-react";
import Link from "next/link";

interface Step8Props {
  completedSteps: number[];
  onFinish: () => void;
}

export function WizardStep8Conclusion({ completedSteps, onFinish }: Step8Props) {
  const stepsList = [
    { num: 1, label: "Dados e Contato da Empresa" },
    { num: 2, label: "Conexão do WhatsApp" },
    { num: 3, label: "Modelos de Mensagem" },
    { num: 4, label: "Pixel da Meta Ads" },
    { num: 5, label: "Grupos Sincronizados" },
    { num: 6, label: "Link de Convite e Landing Page" },
    { num: 7, label: "Catálogo de Produtos" },
  ];

  return (
    <div className="bg-[#0b1222]/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-5 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
        <PartyPopper className="w-8 h-8" />
      </div>

      <div className="space-y-1 max-w-md mx-auto">
        <h3 className="text-base font-bold text-white tracking-tight">
          Tudo Pronto para Turbinar suas Vendas!
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Você configurou com sucesso as etapas essenciais do seu ambiente. Agora suas landing pages estão ativas e seus disparos prontos para conversão.
        </p>
      </div>

      {/* Checklist de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2 max-w-lg mx-auto">
        {stepsList.map((step) => {
          const isDone = completedSteps.includes(step.num);
          return (
            <div
              key={step.num}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs ${
                isDone
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-slate-900/60 border-slate-800 text-slate-400"
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDone ? "text-emerald-400" : "text-slate-600"}`} />
              <span className="truncate font-medium">{step.label}</span>
            </div>
          );
        })}
      </div>

      <div className="pt-3">
        <button
          type="button"
          onClick={onFinish}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Concluir e Ir para o Painel</span>
        </button>
      </div>
    </div>
  );
}
