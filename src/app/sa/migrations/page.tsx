"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  Lock,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCode2,
  ShieldAlert,
  Clock,
  UserCheck,
  Code2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Zap,
  Key
} from "lucide-react";
import { toast } from "sonner";

interface MigrationItem {
  name: string;
  status: "applied" | "pending";
  executedAt: string | null;
  executedBy: string | null;
  version: string;
  sql: string;
}

export default function MigrationsPage() {
  const [migrations, setMigrations] = useState<MigrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [nextExecutableMigration, setNextExecutableMigration] = useState<string | null>(null);

  // Modal de Execução & Confirmação com Senha de Super Admin
  const [selectedMigration, setSelectedMigration] = useState<MigrationItem | null>(null);
  const [isApplyAllMode, setIsApplyAllMode] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  // Expanded SQL Viewers
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const fetchMigrations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sa/migrations");
      const data = await res.json();

      if (data.success) {
        setMigrations(data.migrations || []);
        setPendingCount(data.pendingCount || 0);
        setNextExecutableMigration(data.nextExecutableMigration || null);
      } else {
        toast.error(data.error || "Erro ao listar migrations");
      }
    } catch {
      toast.error("Erro ao comunicar com o servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMigrations();
  }, [fetchMigrations]);

  const handleOpenSingleExecution = (migration: MigrationItem) => {
    if (nextExecutableMigration && migration.name !== nextExecutableMigration) {
      toast.error(`A migration "${nextExecutableMigration}" precisa ser executada antes de "${migration.name}".`);
      return;
    }
    setSelectedMigration(migration);
    setIsApplyAllMode(false);
    setAdminPassword("");
    setAuthModalOpen(true);
  };

  const handleOpenApplyAllModal = () => {
    if (pendingCount === 0) {
      toast.info("Não há migrations pendentes para aplicar.");
      return;
    }
    setSelectedMigration(null);
    setIsApplyAllMode(true);
    setAdminPassword("");
    setAuthModalOpen(true);
  };

  const handleExecuteMigration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminPassword.trim()) {
      toast.error("Informe a senha do Super Admin para autorizar a operação.");
      return;
    }

    try {
      setIsExecuting(true);
      const res = await fetch("/api/sa/migrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applyAll: isApplyAllMode,
          migrationName: !isApplyAllMode ? selectedMigration?.name : undefined,
          superAdminPassword: adminPassword,
          executedBy: "joaohueder@gmail.com",
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "Migrations aplicadas com sucesso!");
        setAuthModalOpen(false);
        setSelectedMigration(null);
        setIsApplyAllMode(false);
        setAdminPassword("");
        fetchMigrations();
      } else {
        toast.error(data.error || "Falha ao executar migration.");
      }
    } catch {
      toast.error("Erro de conexão ao executar migration.");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>Governança do Banco de Dados</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Migrations & Esquema do Banco
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Gerencie e execute scripts incrementais com trava de segurança de Super Admin e ordem sequencial rígida.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          {pendingCount > 0 && (
            <button
              onClick={handleOpenApplyAllModal}
              disabled={loading || isExecuting}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-200 animate-pulse" />
              <span>Aplicar Todas ({pendingCount})</span>
            </button>
          )}

          <button
            onClick={() => fetchMigrations()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-semibold whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : "text-slate-400"}`} />
            <span>Verificar Novas</span>
          </button>
        </div>
      </div>

      {/* 2. ALERTA DE MIGRATIONS PENDENTES */}
      {pendingCount > 0 && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-300">
                {pendingCount} Migration{pendingCount > 1 ? "s" : ""} Pendente{pendingCount > 1 ? "s" : ""} de Execução
              </h3>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                As migrations pendentes são listadas no topo para execução imediata. O sistema bloqueia execuções fora de ordem para preservar a integridade referencial.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenApplyAllModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shrink-0 transition-transform active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Executar em Lote</span>
          </button>
        </div>
      )}

      {/* 3. RESUMO RÁPIDO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total de Scripts</p>
            <p className="text-2xl font-black text-white mt-1">{migrations.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileCode2 className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Aplicadas com Sucesso</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {migrations.filter((m) => m.status === "applied").length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pendentes de Execução</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. LISTA DE MIGRATIONS */}
      <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 shadow-2xl shadow-black/30 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              Linha do Tempo de Migrations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Arquivos registrados em <code className="text-indigo-300 font-mono text-[11px]">src/lib/migrations/</code>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-xs font-medium">Verificando status de migrations no banco...</p>
          </div>
        ) : migrations.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Nenhuma migration encontrada no repositório.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {migrations.map((m) => {
              const isApplied = m.status === "applied";
              const isExpanded = !!expandedItems[m.name];

              return (
                <div key={m.name} className="p-5 space-y-3 hover:bg-slate-900/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isApplied
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {isApplied ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-bold text-xs sm:text-sm text-white">
                            {m.name}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              isApplied
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse"
                            }`}
                          >
                            {isApplied ? "Aplicada" : "Pendente"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                          {isApplied ? (
                            <>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {m.executedAt ? new Date(m.executedAt).toLocaleString("pt-BR") : "Executada"}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="flex items-center gap-1 text-slate-300">
                                <UserCheck className="w-3 h-3 text-indigo-400" />
                                {m.executedBy}
                              </span>
                            </>
                          ) : (
                            <span className="text-amber-400/90 font-medium">
                              Aguardando autorização de Super Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => toggleExpand(m.name)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80 text-xs font-semibold transition-colors"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>{isExpanded ? "Ocultar SQL" : "Ver SQL"}</span>
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>

                      {!isApplied && (
                        <button
                          onClick={() => handleOpenSingleExecution(m)}
                          disabled={nextExecutableMigration !== m.name}
                          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all ${
                            nextExecutableMigration === m.name
                              ? "bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-amber-500/20 hover:scale-105 active:scale-95 cursor-pointer"
                              : "bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60"
                          }`}
                          title={
                            nextExecutableMigration === m.name
                              ? "Próxima migration da sequência pronta para execução"
                              : `Aguardando a execução prévia de "${nextExecutableMigration}"`
                          }
                        >
                          {nextExecutableMigration === m.name ? (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Lock className="w-3 h-3 text-slate-500" />
                          )}
                          <span>
                            {nextExecutableMigration === m.name ? "Executar" : "Bloqueada"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SQL Preview Accordion */}
                  {isExpanded && (
                    <div className="rounded-xl bg-[#060a12] border border-slate-800/90 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto">
                      <pre className="text-indigo-200/90 whitespace-pre-wrap">{m.sql}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. MODAL DE EXECUÇÃO COM TRAVA DE SUPER ADMIN */}
      {authModalOpen && (selectedMigration || isApplyAllMode) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
            onClick={() => !isExecuting && setAuthModalOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-2xl bg-[#0b1120] border border-amber-500/40 p-6 sm:p-7 shadow-2xl shadow-black space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Autorização de Super Admin
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isApplyAllMode
                    ? `Confirme a aplicação em lote de todas as ${pendingCount} migrations pendentes.`
                    : "Confirme a execução do script de migration individual no banco de dados."}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 space-y-1">
              <p className="text-[11px] text-slate-400 font-semibold uppercase">
                {isApplyAllMode ? "Modo de Aplicação:" : "Script Selecionado:"}
              </p>
              <p className="text-xs font-mono font-bold text-amber-300 break-all">
                {isApplyAllMode ? `Sequência de ${pendingCount} script(s) pendente(s)` : selectedMigration?.name}
              </p>
            </div>

            <form onSubmit={handleExecuteMigration} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Senha do Super Admin (joaohueder@gmail.com)</span>
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Digite a senha de Super Admin..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isExecuting}
                  onClick={() => setAuthModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isExecuting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Aplicando Migration(s)...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isApplyAllMode ? "Executar Todas em Lote" : "Confirmar & Executar"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
