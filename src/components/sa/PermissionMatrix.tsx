"use client";

import React, { useMemo, useState } from "react";
import {
  Shield,
  Check,
  Eye,
  Plus,
  Pencil,
  Trash2,
  CheckCheck,
  XCircle,
  BookOpen,
  Search,
  Sliders,
  Sparkles,
  LayoutDashboard,
  Activity,
  Building2,
  Layers,
  CreditCard,
  Users,
  Database,
  Server,
  Cpu,
  Key,
  FileText,
  Settings,
  LucideIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  SAAS_MODULES_DEFINITION,
  ACTION_LABELS,
  SystemUserPermissions,
  ModuleActionPermission,
} from "@/lib/permissions";

interface PermissionMatrixProps {
  role: "SUPER_ADMIN" | "ADMIN";
  permissions: Record<string, any>;
  onChange: (newPermissions: Record<string, any>) => void;
}

const MODULE_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  health: Activity,
  companies: Building2,
  plans: Layers,
  subscriptions: CreditCard,
  users: Users,
  migrations: Database,
  instances: Server,
  workers: Cpu,
  api_keys: Key,
  logs: FileText,
  settings: Settings,
};

const ACTION_CONFIG: Record<
  string,
  {
    icon: LucideIcon;
    activeBg: string;
    activeBorder: string;
    activeText: string;
    activeBadge: string;
  }
> = {
  view: {
    icon: Eye,
    activeBg: "bg-sky-500/15",
    activeBorder: "border-sky-500/50",
    activeText: "text-sky-300",
    activeBadge: "bg-sky-500/20 text-sky-300",
  },
  create: {
    icon: Plus,
    activeBg: "bg-emerald-500/15",
    activeBorder: "border-emerald-500/50",
    activeText: "text-emerald-300",
    activeBadge: "bg-emerald-500/20 text-emerald-300",
  },
  edit: {
    icon: Pencil,
    activeBg: "bg-amber-500/15",
    activeBorder: "border-amber-500/50",
    activeText: "text-amber-300",
    activeBadge: "bg-amber-500/20 text-amber-300",
  },
  delete: {
    icon: Trash2,
    activeBg: "bg-rose-500/15",
    activeBorder: "border-rose-500/50",
    activeText: "text-rose-300",
    activeBadge: "bg-rose-500/20 text-rose-300",
  },
};

export function PermissionMatrix({
  role,
  permissions,
  onChange,
}: PermissionMatrixProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Group modules by category
  const categories = useMemo(() => {
    const map = new Map<string, typeof SAAS_MODULES_DEFINITION[number][]>();
    SAAS_MODULES_DEFINITION.forEach((mod) => {
      if (!map.has(mod.category)) {
        map.set(mod.category, []);
      }
      map.get(mod.category)!.push(mod);
    });
    return Array.from(map.entries()).map(([categoryName, modules]) => ({
      categoryName,
      modules,
    }));
  }, []);

  // Total stats calculations
  const stats = useMemo(() => {
    let totalPossible = 0;
    let totalGranted = 0;

    SAAS_MODULES_DEFINITION.forEach((mod) => {
      const currentMod = permissions[mod.id] || {};
      mod.actions.forEach((act) => {
        totalPossible += 1;
        if (currentMod[act]) {
          totalGranted += 1;
        }
      });
    });

    const percentage = totalPossible > 0 ? Math.round((totalGranted / totalPossible) * 100) : 0;

    return { totalPossible, totalGranted, percentage };
  }, [permissions]);

  // Toggle single action
  const handleToggleAction = (moduleId: string, action: string) => {
    const currentMod = { ...(permissions[moduleId] || {}) };
    const nextVal = !currentMod[action];

    const updated = {
      ...permissions,
      [moduleId]: {
        ...currentMod,
        [action]: nextVal,
      },
    };
    onChange(updated);
  };

  // Toggle all actions of a single module
  const handleToggleModule = (moduleId: string, actions: readonly string[]) => {
    const currentMod = permissions[moduleId] || {};
    const isAllActive = actions.every((act) => currentMod[act]);

    const newModState: Record<string, boolean> = {};
    actions.forEach((act) => {
      newModState[act] = !isAllActive;
    });

    const updated = {
      ...permissions,
      [moduleId]: newModState,
    };
    onChange(updated);
  };

  // Toggle all actions of a whole category
  const handleToggleCategory = (categoryModules: typeof SAAS_MODULES_DEFINITION[number][]) => {
    const isAllCategoryActive = categoryModules.every((mod) => {
      const currentMod = permissions[mod.id] || {};
      return mod.actions.every((act) => currentMod[act]);
    });

    const updated = { ...permissions };
    categoryModules.forEach((mod) => {
      const newModState: Record<string, boolean> = {};
      mod.actions.forEach((act) => {
        newModState[act] = !isAllCategoryActive;
      });
      updated[mod.id] = newModState;
    });

    onChange(updated);
  };

  // Presets
  const handleGrantAll = () => {
    const full: Record<string, any> = {};
    SAAS_MODULES_DEFINITION.forEach((mod) => {
      const modObj: Record<string, boolean> = {};
      mod.actions.forEach((act) => {
        modObj[act] = true;
      });
      full[mod.id] = modObj;
    });
    onChange(full);
  };

  const handleRevokeAll = () => {
    const empty: Record<string, any> = {};
    SAAS_MODULES_DEFINITION.forEach((mod) => {
      const modObj: Record<string, boolean> = {};
      mod.actions.forEach((act) => {
        modObj[act] = false;
      });
      empty[mod.id] = modObj;
    });
    onChange(empty);
  };

  const handleGrantViewOnly = () => {
    const viewOnly: Record<string, any> = {};
    SAAS_MODULES_DEFINITION.forEach((mod) => {
      const modObj: Record<string, boolean> = {};
      mod.actions.forEach((act) => {
        modObj[act] = act === "view";
      });
      viewOnly[mod.id] = modObj;
    });
    onChange(viewOnly);
  };

  const handleToggleCollapseCategory = (catName: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  if (role === "SUPER_ADMIN") {
    return (
      <div className="p-8 text-center rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
          <Shield className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Privilégios Máximos & Irrestritos</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Como este usuário possui o papel <strong>Super Admin</strong>, ele possui acesso total a todos os módulos atuais e futuros do ecossistema SaaS sem necessidade de parametrização manual de permissões.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Acesso Global Habilitado
        </div>
      </div>
    );
  }

  // Filter modules based on search
  const filteredCategories = categories
    .map((cat) => {
      const filteredMods = cat.modules.filter((m) => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return true;
        return (
          m.name.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query) ||
          cat.categoryName.toLowerCase().includes(query)
        );
      });
      return {
        ...cat,
        modules: filteredMods,
      };
    })
    .filter((cat) => cat.modules.length > 0);

  return (
    <div className="space-y-6">
      {/* Header & Presets Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                  Matriz de Permissões Granulares
                </h2>
                <p className="text-xs text-slate-400">
                  Configure o nível de privilégio por módulo operacional e tipo de ação.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGrantAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Habilita todas as permissões de todos os módulos"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              Acesso Total
            </button>

            <button
              type="button"
              onClick={handleGrantViewOnly}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Habilita apenas ações de visualização"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              Apenas Leitura
            </button>

            <button
              type="button"
              onClick={handleRevokeAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 transition-all cursor-pointer active:scale-95"
              title="Remove todas as permissões"
            >
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
              Limpar
            </button>
          </div>
        </div>

        {/* Global Stats Counter & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Progress / Status Badge */}
          <div className="md:col-span-6 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs border ${
                  stats.percentage === 100
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                    : stats.percentage > 0
                    ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                    : "bg-slate-800/50 border-slate-700 text-slate-400"
                }`}
              >
                {stats.percentage}%
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Permissões Concedidas
                </span>
                <span className="text-[11px] text-slate-400">
                  {stats.totalGranted} de {stats.totalPossible} privilégios ativos
                </span>
              </div>
            </div>

            {/* Mini visual bar */}
            <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  stats.percentage === 100
                    ? "bg-emerald-500"
                    : stats.percentage > 0
                    ? "bg-indigo-500"
                    : "bg-slate-700"
                }`}
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>

          {/* Search Filter */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar módulo ou ação (ex: Empresas, Migrations, etc)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modules List by Category */}
      <div className="space-y-6">
        {filteredCategories.map(({ categoryName, modules }) => {
          const isCollapsed = collapsedCategories[categoryName];

          // Check category stats
          let categoryGranted = 0;
          let categoryPossible = 0;
          modules.forEach((mod) => {
            const currentMod = permissions[mod.id] || {};
            mod.actions.forEach((act) => {
              categoryPossible += 1;
              if (currentMod[act]) categoryGranted += 1;
            });
          });

          const isAllCategoryGranted = categoryPossible > 0 && categoryGranted === categoryPossible;

          return (
            <div
              key={categoryName}
              className="rounded-2xl bg-slate-950/40 border border-slate-800/80 overflow-hidden transition-all shadow-sm"
            >
              {/* Category Header */}
              <div className="p-3.5 sm:px-4 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleCollapseCategory(categoryName)}
                  className="flex items-center gap-2.5 text-left cursor-pointer group"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  )}
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors uppercase tracking-wider">
                    {categoryName}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      isAllCategoryGranted
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : categoryGranted > 0
                        ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    {categoryGranted}/{categoryPossible} ativas
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleCategory(modules)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-slate-800/60 transition-all"
                  >
                    {isAllCategoryGranted ? "Desmarcar Grupo" : "Marcar Grupo"}
                  </button>
                </div>
              </div>

              {/* Modules in this category */}
              {!isCollapsed && (
                <div className="p-4 space-y-3">
                  {modules.map((mod) => {
                    const currentMod = permissions[mod.id] || {};
                    const activeCount = mod.actions.filter((act) => currentMod[act]).length;
                    const isAllModuleActive = activeCount === mod.actions.length;
                    const ModuleIcon = MODULE_ICONS[mod.id] || Sliders;

                    return (
                      <div
                        key={mod.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isAllModuleActive
                            ? "bg-slate-900/60 border-slate-700/80 shadow-sm"
                            : activeCount > 0
                            ? "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                            : "bg-slate-950/40 border-slate-900 hover:border-slate-800"
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Module Info */}
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                                activeCount > 0
                                  ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                                  : "bg-slate-900 border-slate-800 text-slate-500"
                              }`}
                            >
                              <ModuleIcon className="w-4 h-4" />
                            </div>

                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">
                                  {mod.name}
                                </span>
                                {activeCount > 0 && (
                                  <span
                                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                      isAllModuleActive
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-indigo-500/10 text-indigo-300"
                                    }`}
                                  >
                                    {activeCount}/{mod.actions.length}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">
                                {mod.description}
                              </p>
                            </div>
                          </div>

                          {/* Module Actions Chips */}
                          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto pl-12 lg:pl-0">
                            {mod.actions.map((action) => {
                              const active = Boolean(currentMod[action]);
                              const cfg = ACTION_CONFIG[action] || ACTION_CONFIG.view;
                              const ActionIcon = cfg.icon;

                              return (
                                <button
                                  key={action}
                                  type="button"
                                  onClick={() => handleToggleAction(mod.id, action)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
                                    active
                                      ? `${cfg.activeBg} ${cfg.activeBorder} ${cfg.activeText} shadow-sm ring-1 ring-white/5`
                                      : "bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                                  }`}
                                >
                                  <ActionIcon
                                    className={`w-3.5 h-3.5 ${
                                      active ? cfg.activeText : "text-slate-500"
                                    }`}
                                  />
                                  <span>{ACTION_LABELS[action] || action}</span>
                                  {active && (
                                    <Check className="w-3 h-3 ml-0.5 text-current opacity-80" />
                                  )}
                                </button>
                              );
                            })}

                            {mod.actions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleToggleModule(mod.id, mod.actions)}
                                className="text-[11px] text-slate-400 hover:text-indigo-300 font-semibold px-2 py-1 rounded hover:bg-slate-800/80 transition-all ml-1 cursor-pointer"
                              >
                                {isAllModuleActive ? "Desmarcar" : "Marcar Todos"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredCategories.length === 0 && (
          <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-400 text-xs">
            Nenhum módulo encontrado para a busca &quot;{searchTerm}&quot;.
          </div>
        )}
      </div>
    </div>
  );
}