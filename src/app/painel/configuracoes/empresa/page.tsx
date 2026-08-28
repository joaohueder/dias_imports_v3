"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  RefreshCw,
} from "lucide-react";
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

export default function PainelConfiguracoesEmpresaPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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
      console.error("Erro ao carregar dados:", error);
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
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        <span className="text-sm font-medium">Carregando Dados da Empresa...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-white tracking-tight">Dados da Empresa</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  Perfil & Endereço
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Mantenha as informações cadastrais, contatos oficiais e endereço da sua empresa sempre atualizados.
              </p>
            </div>
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <CompanySettingsTab />
      </div>
  );
}
