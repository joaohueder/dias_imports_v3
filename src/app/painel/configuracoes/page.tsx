"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Smartphone,
  Building2,
  RefreshCw,
} from "lucide-react";
import { PainelLayoutClient } from "@/components/painel/PainelLayoutClient";
import { WhatsappSettingsTab } from "@/components/painel/WhatsappSettingsTab";
import { CompanySettingsTab } from "@/components/painel/CompanySettingsTab";

interface DashboardData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    company_id?: number | null;
  };
  company: {
    id: number;
    name: string;
    trade_name?: string;
    document?: string;
    email?: string;
    phone?: string;
    admin_whatsapp?: string;
    plan: string;
    status: string;
    max_instances: number;
    max_messages_day: number;
  };
}

export default function PainelConfiguracoesPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"whatsapp" | "empresa">("whatsapp");

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch("/api/painel/dashboard");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados da empresa:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 gap-4">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <span className="text-sm font-medium">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <PainelLayoutClient user={data?.user} company={data?.company}>
      <div className="space-y-8 animate-in fade-in duration-300">
        
        {/* CABEÇALHO DA PÁGINA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-white tracking-tight">Configurações</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  Preferências & Integrações
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Gerencie conexões do WhatsApp, dados cadastrais e parâmetros operacionais da sua empresa.
              </p>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE ABAS INTERNAS */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-px">
          <button
            type="button"
            onClick={() => setActiveTab("whatsapp")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "whatsapp"
                ? "border-emerald-500 text-emerald-300 bg-emerald-500/5 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850"
            }`}
          >
            <Smartphone className={`w-4 h-4 ${activeTab === "whatsapp" ? "text-emerald-400" : "text-slate-400"}`} />
            <span>WhatsApp & Conexão</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("empresa")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "empresa"
                ? "border-indigo-500 text-indigo-300 bg-indigo-500/5 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850"
            }`}
          >
            <Building2 className={`w-4 h-4 ${activeTab === "empresa" ? "text-indigo-400" : "text-slate-400"}`} />
            <span>Dados da Empresa</span>
          </button>
        </div>

        {/* CONTEÚDO DA ABA ATIVA */}
        {activeTab === "whatsapp" && (
          <div className="space-y-6">
            <WhatsappSettingsTab />
          </div>
        )}

        {activeTab === "empresa" && (
          <div className="space-y-6">
            <CompanySettingsTab onUpdated={fetchDashboardData} />
          </div>
        )}

      </div>
    </PainelLayoutClient>
  );
}
