"use client";

import React from "react";
import { Check, RefreshCw, X } from "lucide-react";

interface FloatingActionBarProps {
  isVisible: boolean;
  isSubmitting: boolean;
  disabled?: boolean;
  onCancel: () => void;
  formId?: string;
  onSave?: () => void;
  saveLabel?: string;
  savingLabel?: string;
  cancelLabel?: string;
  label?: string;
}

export function FloatingActionBar({
  isVisible,
  isSubmitting,
  disabled = false,
  onCancel,
  formId,
  onSave,
  saveLabel = "Salvar",
  savingLabel = "Salvando...",
  cancelLabel = "Cancelar",
  label = "Alterações não salvas",
}: FloatingActionBarProps) {
  if (!isVisible) return null;

  const isSaveDisabled = isSubmitting || disabled;

  return (
    <div className="fixed bottom-14 left-0 right-0 z-40 px-4 sm:px-8 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-3">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#090f1d]/95 backdrop-blur-xl border border-indigo-500/30 shadow-xl shadow-black/80 pointer-events-auto">
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{label}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer disabled:opacity-50"
          >
            <X className="w-3 h-3" />
            <span>{cancelLabel}</span>
          </button>

          <button
            type={formId ? "submit" : "button"}
            form={formId}
            onClick={!formId ? onSave : undefined}
            disabled={isSaveDisabled}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold rounded-lg ${
              isSaveDisabled
                ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-60 border border-slate-700"
                : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            } transition-all`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>{savingLabel}</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                <span>{saveLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
