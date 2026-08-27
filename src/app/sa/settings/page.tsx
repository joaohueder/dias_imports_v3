"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Monitor,
  Maximize2,
  Minimize2,
  Sliders,
  CheckCircle2,
  RotateCcw,
  Eye,
} from "lucide-react";
import { SaPageHeader } from "@/components/sa/SaPageHeader";
import { FloatingActionBar } from "@/components/ui/FloatingActionBar";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { useLayout, LayoutPreset } from "@/context/LayoutContext";
import { useSaAuth } from "@/context/SaAuthContext";

export default function SaSettingsPage() {
  const { can } = useSaAuth();
  const {
    savedSettings,
    setPreviewSettings,
    resetPreview,
    saveSettings,
  } = useLayout();

  const { showSuccess, showError, showWarning } = useFeedbackModal();

  // Estado de formulário local para o Layout
  const [selectedPreset, setSelectedPreset] = useState<LayoutPreset>(savedSettings.preset);
  const [customWidth, setCustomWidth] = useState<number>(savedSettings.customWidth || 1200);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sincronizar estado local quando savedSettings carregar ou mudar
  useEffect(() => {
    setSelectedPreset(savedSettings.preset);
    setCustomWidth(savedSettings.customWidth || 1200);
  }, [savedSettings]);

  // Verificar se há alterações não salvas no Layout
  const isDirty =
    selectedPreset !== savedSettings.preset ||
    (selectedPreset === "custom" && customWidth !== savedSettings.customWidth);

  // Aplicar preview instantâneo ao mudar o preset ou spinner
  const handlePresetChange = (preset: LayoutPreset) => {
    setSelectedPreset(preset);
    setPreviewSettings({
      preset,
      customWidth: Math.max(1200, customWidth),
    });
  };

  const handleCustomWidthChange = (val: number) => {
    const safeVal = isNaN(val) ? 1200 : Math.max(1200, val);
    setCustomWidth(safeVal);
    setSelectedPreset("custom");
    setPreviewSettings({
      preset: "custom",
      customWidth: safeVal,
    });
  };

  const handleCustomWidthStep = (delta: number) => {
    const nextVal = Math.max(1200, (customWidth || 1200) + delta);
    setCustomWidth(nextVal);
    setSelectedPreset("custom");
    setPreviewSettings({
      preset: "custom",
      customWidth: nextVal,
    });
  };

  // Descartar alterações (Cancelar na barra flutuante)
  const handleCancel = () => {
    setSelectedPreset(savedSettings.preset);
    setCustomWidth(savedSettings.customWidth || 1200);
    resetPreview();
  };

  // Salvar alterações permanentemente
  const handleSave = async () => {
    if (selectedPreset === "custom" && customWidth < 1200) {
      showWarning(
        "Largura Mínima Inválida",
        "A largura personalizada mínima permitida pelo sistema é de 1200px."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await saveSettings({
        preset: selectedPreset,
        customWidth: Math.max(1200, customWidth),
      });

      if (ok) {
        showSuccess(
          "Configuração de Layout Salva",
          "A largura máxima do sistema foi aplicada e gravada com sucesso nas diretrizes do SaaS."
        );
      } else {
        showError(
          "Falha ao Salvar",
          "Não foi possível persistir as configurações de layout no banco de dados."
        );
      }
    } catch (err: any) {
      showError("Erro Inesperado", err.message || "Ocorreu um erro ao salvar os parâmetros.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Cabeçalho Unificado */}
      <SaPageHeader
        title="Parâmetros do SaaS"
        icon={Settings}
        statusBadge="Configurações Globais"
        statusType="active"
        description="Controle e parametrize diretrizes operacionais, layout, design system e governança do ecossistema."
        actions={
          <button
            type="button"
            onClick={resetPreview}
            disabled={!isDirty || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão Salvo</span>
          </button>
        }
      />

      {/* CONTEÚDO DE LAYOUT */}
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Banner Explicativo e Live Preview Alert */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                Preview em Tempo Real Ativo
                {isDirty && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Não efetivado
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Ao selecionar qualquer preset ou alterar o spinner numérico, o layout de todo o painel expande ou contrai instantaneamente para você testar a visualização. As alterações só serão efetivadas ao clicar em{" "}
                <strong className="text-white font-semibold">Salvar</strong>.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="text-slate-400">Largura em tela:</span>
            <span className="text-indigo-300 font-bold">
              {selectedPreset === "1200px" && "1200px (Padrão)"}
              {selectedPreset === "1440px" && "1440px (Médio)"}
              {selectedPreset === "full" && "100% (Full Fluid)"}
              {selectedPreset === "custom" && `${customWidth}px (Custom)`}
            </span>
          </div>
        </div>

        {/* Grid de Presets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5 text-indigo-400" />
              Presets de Largura Máxima do Sistema
            </label>
            <span className="text-[10px] text-slate-400">
              Padrão desktop base: 1200px
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Preset 1: Mínimo (1200px) */}
            <div
              onClick={() => handlePresetChange("1200px")}
              className={`relative cursor-pointer p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                selectedPreset === "1200px"
                  ? "bg-indigo-600/15 border-indigo-500/50 shadow-lg shadow-indigo-600/10 ring-1 ring-indigo-500/40"
                  : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        selectedPreset === "1200px"
                          ? "bg-indigo-500/20 text-indigo-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Minimize2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white">Mínimo (1200px)</span>
                  </div>
                  {selectedPreset === "1200px" && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Resolução desktop padrão e compacta. Excelente para monitores 1080p e foco absoluto em densidade de dados.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-800/80 font-mono">max-w: 1200px</span>
                <span className="text-indigo-300 font-medium">Recomendado</span>
              </div>
            </div>

            {/* Preset 2: Médio (1440px) */}
            <div
              onClick={() => handlePresetChange("1440px")}
              className={`relative cursor-pointer p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                selectedPreset === "1440px"
                  ? "bg-indigo-600/15 border-indigo-500/50 shadow-lg shadow-indigo-600/10 ring-1 ring-indigo-500/40"
                  : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        selectedPreset === "1440px"
                          ? "bg-indigo-500/20 text-indigo-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white">Médio (1440px)</span>
                  </div>
                  {selectedPreset === "1440px" && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Largura intermediária ampla. Ideal para monitores QHD/2K e visualização de tabelas com mais colunas sem rolagem horizontal.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-800/80 font-mono">max-w: 1440px</span>
                <span className="text-slate-300 font-medium">Equilibrado</span>
              </div>
            </div>

            {/* Preset 3: Full (100%) */}
            <div
              onClick={() => handlePresetChange("full")}
              className={`relative cursor-pointer p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                selectedPreset === "full"
                  ? "bg-indigo-600/15 border-indigo-500/50 shadow-lg shadow-indigo-600/10 ring-1 ring-indigo-500/40"
                  : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        selectedPreset === "full"
                          ? "bg-indigo-500/20 text-indigo-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white">Full (100%)</span>
                  </div>
                  {selectedPreset === "full" && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Aproveitamento total da largura da tela do navegador (100% fluído), preenchendo todo o espaço disponível.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-800/80 font-mono">max-w: 100%</span>
                <span className="text-slate-300 font-medium">Fluído</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco de Largura Personalizada com Spinner */}
        <div
          className={`p-5 rounded-2xl border transition-all duration-200 space-y-4 ${
            selectedPreset === "custom"
              ? "bg-indigo-950/20 border-indigo-500/40 ring-1 ring-indigo-500/30"
              : "bg-slate-900/40 border-slate-800/80"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Largura Personalizada (Custom Spinner)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Defina manualmente a largura exata em pixels. O limite mínimo aceito pelas diretrizes é de <strong className="text-indigo-300">1200px</strong>.
              </p>
            </div>

            {/* Spinner Numérico de Controle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 focus-within:border-indigo-500 p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => handleCustomWidthStep(-50)}
                  disabled={customWidth <= 1200}
                  className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-center font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Diminuir 50px"
                >
                  -
                </button>

                <div className="flex items-center px-3">
                  <input
                    type="number"
                    min={1200}
                    step={10}
                    value={customWidth}
                    onChange={(e) => handleCustomWidthChange(parseInt(e.target.value, 10))}
                    className="w-20 bg-transparent text-center text-xs font-mono font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">px</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCustomWidthStep(50)}
                  className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
                  title="Aumentar 50px"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => handlePresetChange("custom")}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedPreset === "custom"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                }`}
              >
                {selectedPreset === "custom" ? "Ativo no Preview" : "Ativar Custom"}
              </button>
            </div>
          </div>

          {/* Slider de Apoio Visual */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1200px (Mínimo)</span>
              <span>1600px</span>
              <span>1920px (Full HD)</span>
              <span>2560px (2K)</span>
            </div>
            <input
              type="range"
              min={1200}
              max={2560}
              step={20}
              value={customWidth}
              onChange={(e) => handleCustomWidthChange(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Barra Flutuante de Ações */}
      {can("settings", "edit") && (
        <FloatingActionBar
          isVisible={isDirty}
          onSave={handleSave}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          saveLabel="Salvar Largura"
        />
      )}
    </div>
  );
}

