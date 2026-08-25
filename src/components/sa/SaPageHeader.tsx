import React from "react";
import { RefreshCw, LucideIcon } from "lucide-react";

interface SaPageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: LucideIcon;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  refreshLabel?: string;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  extraActions?: React.ReactNode;
}

export function SaPageHeader({
  title,
  subtitle,
  badge,
  icon: Icon,
  onRefresh,
  isRefreshing = false,
  refreshLabel = "Atualizar",
  primaryAction,
  extraActions,
}: SaPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
      <div>
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            {title}
          </h1>
          {badge && (
            <span className="relative flex h-3 w-3" title={badge}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {extraActions}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all focus:outline-none disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="whitespace-nowrap">{refreshLabel}</span>
          </button>
        )}

        {primaryAction && (
          primaryAction.href ? (
            <a
              href={primaryAction.href}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {primaryAction.icon && React.createElement(primaryAction.icon, { className: "w-3.5 h-3.5 shrink-0" })}
              <span className="whitespace-nowrap">{primaryAction.label}</span>
            </a>
          ) : (
            <button
              onClick={primaryAction.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {primaryAction.icon && React.createElement(primaryAction.icon, { className: "w-3.5 h-3.5 shrink-0" })}
              <span className="whitespace-nowrap">{primaryAction.label}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}
