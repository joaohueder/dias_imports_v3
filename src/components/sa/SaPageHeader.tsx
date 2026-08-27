import React from "react";
import { RefreshCw, LucideIcon } from "lucide-react";

interface SaPageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  badgeText?: string;
  badgeVariant?: string;
  statusBadge?: string;
  statusType?: string;
  icon?: LucideIcon;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  loading?: boolean;
  refreshLabel?: string;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  actions?: React.ReactNode;
  extraActions?: React.ReactNode;
}

export function SaPageHeader({
  title,
  subtitle,
  description,
  badge,
  badgeText,
  statusBadge,
  icon: Icon,
  onRefresh,
  isRefreshing = false,
  loading = false,
  refreshLabel = "Atualizar",
  primaryAction,
  actions,
  extraActions,
}: SaPageHeaderProps) {
  const displaySubtitle = subtitle || description;
  const displayBadge = badge || badgeText || statusBadge;
  const isCurrentlyRefreshing = isRefreshing || loading;
  const allExtraActions = extraActions || actions;
  return (
    <div className="flex flex-col gap-4 pb-4 border-b border-slate-800/80">
      <div className="w-full">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            {title}
          </h1>
          {displayBadge && (
            <span className="relative flex h-3 w-3" title={displayBadge}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          )}
        </div>
        {displaySubtitle && (
          <p className="text-xs text-slate-400 mt-1 max-w-4xl leading-relaxed">
            {displaySubtitle}
          </p>
        )}
      </div>

      {(allExtraActions || onRefresh || primaryAction) && (
        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full pt-1">
          {allExtraActions}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isCurrentlyRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all focus:outline-none disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isCurrentlyRefreshing ? "animate-spin" : ""}`} />
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
      )}
    </div>
  );
}
