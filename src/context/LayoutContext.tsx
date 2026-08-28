"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type LayoutPreset = "1200px" | "1440px" | "full" | "custom";

export interface LayoutSettings {
  preset: LayoutPreset;
  customWidth: number; // Mínimo 1200
}

interface LayoutContextType {
  // Configuração persistida / ativa
  savedSettings: LayoutSettings;
  // Configuração em preview temporário (ou salva se não houver preview)
  previewSettings: LayoutSettings;
  // Setar preview temporário (sem salvar)
  setPreviewSettings: (settings: LayoutSettings) => void;
  // Resetar preview para o que está salvo
  resetPreview: () => void;
  // Atualizar e salvar as configurações no servidor/storage
  saveSettings: (settings: LayoutSettings) => Promise<boolean>;
  // Retorna o valor CSS correspondente ao estado atual (preview ou salvo)
  containerMaxWidthStyle: React.CSSProperties;
  isLoading: boolean;
}

const DEFAULT_SETTINGS: LayoutSettings = {
  preset: "1200px",
  customWidth: 1200,
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [savedSettings, setSavedSettings] = useState<LayoutSettings>(DEFAULT_SETTINGS);
  const [previewSettings, setPreviewSettingsState] = useState<LayoutSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carregar configurações da API / LocalStorage
  const fetchSettings = useCallback(async () => {
    try {
      // Tentar localStorage primeiro para resposta instantânea
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("jh7_saas_layout_settings");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            setSavedSettings(parsed);
            setPreviewSettingsState(parsed);
          } catch {
            // Ignora erro de parse
          }
        }
      }

      // Buscar da API somente se estiver em ambiente Super Admin (/sa)
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/sa")) {
        const res = await fetch("/api/sa/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings?.layout) {
            const apiLayout: LayoutSettings = {
              preset: data.settings.layout.preset || "1200px",
              customWidth: Math.max(1200, Number(data.settings.layout.customWidth) || 1200),
            };
            setSavedSettings(apiLayout);
            setPreviewSettingsState(apiLayout);
            localStorage.setItem("jh7_saas_layout_settings", JSON.stringify(apiLayout));
          }
        }
      }
    } catch (err) {
      console.error("Erro ao carregar configurações de layout:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const setPreviewSettings = (settings: LayoutSettings) => {
    const sanitized: LayoutSettings = {
      preset: settings.preset,
      customWidth: Math.max(1200, Number(settings.customWidth) || 1200),
    };
    setPreviewSettingsState(sanitized);
  };

  const resetPreview = () => {
    setPreviewSettingsState(savedSettings);
  };

  const saveSettings = async (settings: LayoutSettings): Promise<boolean> => {
    const sanitized: LayoutSettings = {
      preset: settings.preset,
      customWidth: Math.max(1200, Number(settings.customWidth) || 1200),
    };

    try {
      const res = await fetch("/api/sa/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "layout",
          settings: sanitized,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao salvar configurações");
      }

      setSavedSettings(sanitized);
      setPreviewSettingsState(sanitized);

      if (typeof window !== "undefined") {
        localStorage.setItem("jh7_saas_layout_settings", JSON.stringify(sanitized));
      }

      return true;
    } catch (err) {
      console.error("Erro ao salvar layout:", err);
      return false;
    }
  };

  // Calcular estilo CSS baseado nas previewSettings ativas
  const containerMaxWidthStyle: React.CSSProperties = React.useMemo(() => {
    const { preset, customWidth } = previewSettings;
    if (preset === "1200px") {
      return { maxWidth: "1200px", width: "100%" };
    }
    if (preset === "1440px") {
      return { maxWidth: "1440px", width: "100%" };
    }
    if (preset === "full") {
      return { maxWidth: "100%", width: "100%" };
    }
    if (preset === "custom") {
      const w = Math.max(1200, customWidth || 1200);
      return { maxWidth: `${w}px`, width: "100%" };
    }
    return { maxWidth: "1200px", width: "100%" };
  }, [previewSettings]);

  return (
    <LayoutContext.Provider
      value={{
        savedSettings,
        previewSettings,
        setPreviewSettings,
        resetPreview,
        saveSettings,
        containerMaxWidthStyle,
        isLoading,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout deve ser usado dentro de um LayoutProvider");
  }
  return context;
}
