import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Users, Server, Activity, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Super Admin SaaS | JH7 Marketing",
  description: "Painel central de governança e controle SaaS",
};

export default function SuperAdminDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">Super Admin SaaS</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  /sa
                </span>
              </div>
              <p className="text-sm text-slate-400">Gestão global de empresas, instâncias e infraestrutura</p>
            </div>
          </div>

          <Link
            href="/sa/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sair</span>
          </Link>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total de Empresas</span>
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">1</div>
            <p className="text-xs text-slate-500">Tenants ativos na plataforma</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Instâncias WhatsApp</span>
              <Server className="w-5 h-5 text-violet-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">1</div>
            <p className="text-xs text-slate-500">Conectadas via Evolution API</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Status do Sistema</span>
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">100%</div>
            <p className="text-xs text-slate-500">Operacional</p>
          </div>
        </div>
      </div>
    </div>
  );
}
