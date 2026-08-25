import type { Metadata } from "next";
import Link from "next/link";
import { Building2, MessageSquareShare, Users2, Zap, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Painel da Empresa | JH7 Marketing",
  description: "Gerenciamento de marketing e campanhas em grupos de WhatsApp",
};

export default function CompanyDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">Painel da Empresa</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  /painel
                </span>
              </div>
              <p className="text-sm text-slate-400">Gerenciamento de campanhas e automações em grupos de WhatsApp</p>
            </div>
          </div>

          <Link
            href="/painel/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sair</span>
          </Link>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Grupos Monitorados</span>
              <Users2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">0</div>
            <p className="text-xs text-slate-500">Grupos ativos para disparos</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Campanhas Ativas</span>
              <Zap className="w-5 h-5 text-teal-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">0</div>
            <p className="text-xs text-slate-500">Automações em andamento</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Mensagens Enviadas</span>
              <MessageSquareShare className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">0</div>
            <p className="text-xs text-slate-500">Envios hoje</p>
          </div>
        </div>
      </div>
    </div>
  );
}
