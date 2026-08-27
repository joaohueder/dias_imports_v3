"use client";

import React from "react";
import { Lock, ShieldAlert, Sparkles, SmilePlus, Ghost } from "lucide-react";

interface LockedCardProps {
  title: string;
  description?: string;
  className?: string;
  iconVariant?: "ghost" | "smile" | "lock";
}

export function LockedCard({
  title,
  description = "Você não possui permissão para visualizar este bloco.",
  className = "",
  iconVariant = "smile",
}: LockedCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#090f1d]/70 border border-slate-800/80 p-6 flex flex-col items-center justify-center text-center shadow-xl shadow-black/20 backdrop-blur-md min-h-[160px] group transition-all hover:border-rose-500/30 select-none ${className}`}
    >
      {/* Background glow sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.03] via-transparent to-amber-500/[0.02] pointer-events-none" />

      {/* Ícone Animado e Engraçado */}
      <div className="relative mb-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-md shadow-rose-950/40">
          {iconVariant === "ghost" ? (
            <Ghost className="w-6 h-6 animate-bounce" />
          ) : (
            <SmilePlus className="w-6 h-6 animate-pulse" />
          )}
        </div>
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] font-black text-white items-center justify-center">
            !
          </span>
        </span>
      </div>

      {/* Badge SEM ACESSO */}
      <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-950/50">
        SEM ACESSO 🚫
      </span>

      {/* Título & Descrição */}
      <p className="text-xs font-bold text-slate-300 mt-2.5 line-clamp-1">{title}</p>
      <p className="text-[11px] text-slate-500 mt-0.5 max-w-[220px] line-clamp-2 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
