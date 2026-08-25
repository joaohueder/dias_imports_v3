import Link from "next/link";
import {
  Shield,
  Users,
  Server,
  Activity,
  ArrowUpRight,
  Database,
  KeyRound,
  CheckCircle2,
  HardDrive,
  Cpu,
} from "lucide-react";

export default function SuperAdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/60 border border-indigo-500/20 p-6 sm:p-8 backdrop-blur-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              Ambiente de Super Administrador
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Governança Central & Infraestrutura
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Monitore os tenants do ecossistema, o estado de execução das migrações do banco de dados e os nós de processamento das instâncias de WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sa/migrations"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Database className="w-4 h-4" />
              <span>Gerenciar Migrations</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total de Tenants</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">1</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% ativos e operacionais</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Instâncias WhatsApp</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">0</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Aguardando conexões Baileys/Evolution</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Banco de Dados</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-emerald-400">Sincronizado</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>MySQL 8.x / Migrations em dia</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Saúde do Sistema</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">99.9%</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span>Latência média: 24ms</span>
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenants List Preview */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Tenants Registrados</h2>
              <p className="text-xs text-slate-400">Empresas clientes com instâncias alocadas</p>
            </div>
            <Link
              href="/sa/tenants"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              <span>Ver todos</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            <div className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs">
                  DI
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Dias Imports</h3>
                  <p className="text-xs text-slate-400">diasimports@gmail.com • Plano Enterprise</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ativo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Node & Service Status */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white">Estado dos Serviços</h2>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-200 font-medium">Node / Next.js Engine</span>
              </div>
              <span className="text-emerald-400 font-semibold">Online</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-violet-400" />
                <span className="text-slate-200 font-medium">MySQL Pool</span>
              </div>
              <span className="text-emerald-400 font-semibold">Conectado</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-amber-400" />
                <span className="text-slate-200 font-medium">Redis Cache & Queues</span>
              </div>
              <span className="text-slate-400 font-semibold">Standby</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
