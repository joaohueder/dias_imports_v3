"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  X,
  RefreshCw,
} from "lucide-react";

type ModalType = "error" | "success" | "info" | "warning" | "confirm";

interface ModalOptions {
  title?: string;
  message: string;
  type?: ModalType;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => Promise<void> | void;
  onCancel?: () => void;
  destructive?: boolean;
}

interface FeedbackModalContextType {
  showModal: (options: ModalOptions) => void;
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showConfirm: (
    options: Omit<ModalOptions, "type"> & { onConfirm: () => Promise<void> | void }
  ) => void;
  closeModal: () => void;
}

const FeedbackModalContext = createContext<FeedbackModalContextType | undefined>(
  undefined
);

export function FeedbackModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [options, setOptions] = useState<ModalOptions | null>(null);

  const closeModal = useCallback(() => {
    if (isProcessing) return;
    setIsOpen(false);
    if (options?.onCancel) {
      options.onCancel();
    }
  }, [isProcessing, options]);

  const showModal = useCallback((opts: ModalOptions) => {
    setOptions(opts);
    setIsProcessing(false);
    setIsOpen(true);
  }, []);

  const showError = useCallback((message: string, title = "Ocorreu um Erro") => {
    showModal({ type: "error", title, message, destructive: true });
  }, [showModal]);

  const showSuccess = useCallback((message: string, title = "Sucesso!") => {
    showModal({ type: "success", title, message });
  }, [showModal]);

  const showInfo = useCallback((message: string, title = "Informação") => {
    showModal({ type: "info", title, message });
  }, [showModal]);

  const showWarning = useCallback((message: string, title = "Atenção") => {
    showModal({ type: "warning", title, message });
  }, [showModal]);

  const showConfirm = useCallback(
    (opts: Omit<ModalOptions, "type"> & { onConfirm: () => Promise<void> | void }) => {
      showModal({
        type: "confirm",
        title: opts.title || "Confirmar Ação",
        message: opts.message,
        confirmLabel: opts.confirmLabel || "Confirmar",
        cancelLabel: opts.cancelLabel || "Cancelar",
        destructive: opts.destructive ?? false,
        onConfirm: opts.onConfirm,
        onCancel: opts.onCancel,
      });
    },
    [showModal]
  );

  const handleConfirm = async () => {
    if (!options?.onConfirm) {
      closeModal();
      return;
    }
    try {
      setIsProcessing(true);
      await options.onConfirm();
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getModalConfig = () => {
    const type = options?.type || "info";

    switch (type) {
      case "error":
        return {
          icon: <AlertCircle className="w-6 h-6 text-rose-400" />,
          iconBg: "bg-rose-500/15 border-rose-500/30 text-rose-400",
          glow: "from-rose-500/20 via-transparent to-transparent",
          borderColor: "border-rose-500/30",
          btnColor: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30",
          titleDefault: "Ocorreu um Erro",
        };
      case "success":
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
          iconBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
          glow: "from-emerald-500/20 via-transparent to-transparent",
          borderColor: "border-emerald-500/30",
          btnColor: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30",
          titleDefault: "Sucesso!",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
          iconBg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
          glow: "from-amber-500/20 via-transparent to-transparent",
          borderColor: "border-amber-500/30",
          btnColor: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30",
          titleDefault: "Atenção",
        };
      case "confirm":
        return {
          icon: options?.destructive ? (
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          ) : (
            <Info className="w-6 h-6 text-indigo-400" />
          ),
          iconBg: options?.destructive
            ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
            : "bg-indigo-500/15 border-indigo-500/30 text-indigo-400",
          glow: options?.destructive
            ? "from-rose-500/20 via-transparent to-transparent"
            : "from-indigo-500/20 via-transparent to-transparent",
          borderColor: options?.destructive
            ? "border-rose-500/30"
            : "border-indigo-500/30",
          btnColor: options?.destructive
            ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30"
            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30",
          titleDefault: "Confirmar Ação",
        };
      case "info":
      default:
        return {
          icon: <Info className="w-6 h-6 text-cyan-400" />,
          iconBg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400",
          glow: "from-cyan-500/20 via-transparent to-transparent",
          borderColor: "border-cyan-500/30",
          btnColor: "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30",
          titleDefault: "Informação",
        };
    }
  };

  const config = getModalConfig();
  const isConfirmType = options?.type === "confirm";

  return (
    <FeedbackModalContext.Provider
      value={{
        showModal,
        showError,
        showSuccess,
        showInfo,
        showWarning,
        showConfirm,
        closeModal,
      }}
    >
      {children}

      {isOpen && options && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`relative w-full max-w-md bg-slate-900 border ${config.borderColor} rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}
            role="dialog"
            aria-modal="true"
          >
            {/* Top gradient glow */}
            <div
              className={`absolute top-0 left-0 right-0 h-28 bg-gradient-to-b ${config.glow} pointer-events-none`}
            />

            {/* Close button */}
            <button
              type="button"
              onClick={closeModal}
              disabled={isProcessing}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6">
              {/* Header with Icon */}
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${config.iconBg}`}
                >
                  {config.icon}
                </div>
                <div className="flex-1 pr-6">
                  <h3 className="text-base font-bold text-white tracking-wide">
                    {options.title || config.titleDefault}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed break-words whitespace-pre-line">
                    {options.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800/80">
                {isConfirmType ? (
                  <>
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={isProcessing}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {options.cancelLabel || "Cancelar"}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={isProcessing}
                      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 ${config.btnColor}`}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Processando...</span>
                        </>
                      ) : (
                        <span>{options.confirmLabel || "Confirmar"}</span>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={closeModal}
                    className={`px-5 py-2 text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer ${config.btnColor}`}
                  >
                    OK, Entendi
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </FeedbackModalContext.Provider>
  );
}

export function useFeedbackModal() {
  const context = useContext(FeedbackModalContext);
  if (!context) {
    throw new Error(
      "useFeedbackModal must be used within a FeedbackModalProvider"
    );
  }
  return context;
}
