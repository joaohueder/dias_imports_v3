"use client";

import React, { useEffect, useState } from "react";
import { Monitor, Smartphone, AlertTriangle, RefreshCw } from "lucide-react";

interface DesktopOnlyGuardProps {
  children: React.ReactNode;
  systemName?: string;
  minWidth?: number;
}

export function DesktopOnlyGuard({
  children,
  systemName = "JH7 Marketing",
  minWidth = 1200,
}: DesktopOnlyGuardProps) {
  const [isBelowMinWidth, setIsBelowMinWidth] = useState<boolean | null>(null);
  const [currentWidth, setCurrentWidth] = useState<number>(0);

  useEffect(() => {
    const checkViewportWidth = () => {
      const width = window.innerWidth;
      setCurrentWidth(width);
      setIsBelowMinWidth(width < minWidth);
    };

    checkViewportWidth();
    window.addEventListener("resize", checkViewportWidth);
    return () => window.removeEventListener("resize", checkViewportWidth);
  }, [minWidth]);

  // Enquanto avalia o viewport no primeiro render do client, exibe os filhos sem bloqueio abrupto
  if (isBelowMinWidth === null) {
    return <>{children}</>;
  }

  if (isBelowMinWidth) {
    return (
      <div className="min-h-screen w-full bg-[#060b13] text-slate-100 flex flex-col items-center justify-center p-6 sm:p-8 select-none relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-[#0a1120]/95 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 text-center flex flex-col items-center">
          {/* Ícones Comparativos */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Monitor className="w-10 h-10 animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>

          {/* Badge de Resolução */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <AlertTriangle className="w-3.5 h-3.5" />
            Dispositivo Incompatível
          </div>

          {/* Título & Mensagem */}
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
            Acesso Restrito a Computador
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            O painel <strong className="text-slate-200">{systemName}</strong> foi projetado para operações analíticas e de alta densidade de dados, exigindo uma tela de no mínimo{" "}
            <strong className="text-indigo-400">{minWidth}px</strong> de largura.
          </p>

          {/* Card com Detalhes da Tela */}
          <div className="w-full bg-[#070d18] border border-slate-800 rounded-2xl p-4 mb-6 flex items-center justify-between text-xs">
            <div className="text-left">
              <p className="text-slate-500 font-medium">Sua Resolução Atual</p>
              <p className="text-rose-400 font-bold font-mono text-sm">{currentWidth}px de largura</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-medium">Resolução Mínima</p>
              <p className="text-emerald-400 font-bold font-mono text-sm">{minWidth}px (Desktop)</p>
            </div>
          </div>

          {/* Ação / Dica */}
          <p className="text-xs text-slate-500 mb-6">
            Por favor, abra este link em um computador, notebook ou aumente a janela do seu navegador para continuar navegando.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" />
            Verificar Novamente
          </button>
        </div>

        {/* Rodapé institucional */}
        <p className="mt-8 text-xs text-slate-600 relative z-10 font-medium">
          {systemName} • Governança & Eficiência Operacional
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
