"use client";

import React, { useState, useEffect } from "react";
import { Smartphone, QrCode, RefreshCw, CheckCircle2, AlertCircle, Loader2, Zap, Wifi, WifiOff } from "lucide-react";

interface Step2Props {
  onSaved?: () => void;
}

export function WizardStep2Whatsapp({ onSaved }: Step2Props) {
  const [instance, setInstance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  const loadInstance = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/painel/whatsapp/instance");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.instance) {
          setInstance(json.instance);
          if (json.instance.status === "connected" && onSaved) {
            onSaved();
          }
        }
      }
    } catch (err) {
      console.error("Erro ao carregar instância:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstance();
  }, []);

  const handleFetchQrCode = async () => {
    if (!instance?.id) return;
    try {
      setLoadingQr(true);
      const res = await fetch(`/api/painel/whatsapp/qrcode?instance_id=${instance.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && (json.qrcode || json.base64)) {
          setQrCode(json.base64 || json.qrcode);
        }
      }
    } catch (err) {
      console.error("Erro ao gerar QR Code:", err);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleReconnect = async () => {
    if (!instance?.id) return;
    try {
      setReconnecting(true);
      await fetch(`/api/painel/whatsapp/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restart",
          instance_id: instance.id,
        }),
      });
      await loadInstance();
    } catch (err) {
      console.error("Erro ao reconectar:", err);
    } finally {
      setReconnecting(false);
    }
  };

  if (loading && !instance) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        <span className="text-xs">Verificando conexão do WhatsApp...</span>
      </div>
    );
  }

  const isConnected = instance?.status === "connected" || instance?.status === "open";

  return (
    <div className="bg-[#0b1222]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>Status da Conexão WhatsApp</span>
        </div>
        <button
          type="button"
          onClick={loadInstance}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-white cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Atualizar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Card de Status */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Instância Atribuída:</span>
            <span className="text-xs font-bold text-white font-mono">{instance?.name || "Instância Principal"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Estado da Conexão:</span>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <Wifi className="w-3 h-3 text-emerald-400" /> Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                <WifiOff className="w-3 h-3 text-amber-400" /> Aguardando Leitura
              </span>
            )}
          </div>

          {instance?.phone_connected && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Número Conectado:</span>
              <span className="text-xs font-mono text-emerald-400 font-bold">{instance.phone_connected}</span>
            </div>
          )}

          <div className="pt-2 flex flex-wrap gap-2">
            {!isConnected && (
              <button
                type="button"
                onClick={handleFetchQrCode}
                disabled={loadingQr}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-60"
              >
                {loadingQr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
                <span>Gerar QR Code</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReconnect}
              disabled={reconnecting}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700 cursor-pointer disabled:opacity-60"
            >
              {reconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>Reconectar</span>
            </button>
          </div>
        </div>

        {/* Card do QR Code */}
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/60 border border-slate-800 min-h-[170px] text-center">
          {isConnected ? (
            <div className="space-y-2 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="text-xs font-bold text-white">WhatsApp 100% Conectado!</p>
              <p className="text-[11px] text-slate-400 max-w-[220px]">
                Sua instância está operando normalmente e pronta para disparar mensagens.
              </p>
            </div>
          ) : qrCode ? (
            <div className="space-y-2">
              <div className="bg-white p-2 rounded-xl inline-block shadow-lg">
                <img src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`} alt="QR Code WhatsApp" className="w-36 h-36" />
              </div>
              <p className="text-[11px] text-slate-400">Abra o WhatsApp &gt; Aparelhos Conectados &gt; Conectar um Aparelho</p>
            </div>
          ) : (
            <div className="space-y-2 text-slate-500 py-6">
              <QrCode className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-xs">Clique em &ldquo;Gerar QR Code&rdquo; para escanear</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
