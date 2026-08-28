"use client";

import React, { useState, useEffect } from "react";
import { Radio, Save, CheckCircle2, Loader2, Zap, ShieldCheck } from "lucide-react";

interface Step4Props {
  onSaved?: () => void;
}

export function WizardStep4MetaAds({ onSaved }: Step4Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [formData, setFormData] = useState({
    meta_pixel_id: "",
    meta_pixel_access_token: "",
    meta_pixel_test_code: "",
    meta_pixel_active: true,
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/painel/configuracoes/meta-ads");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.meta_ads) {
            setFormData({
              meta_pixel_id: json.meta_ads.meta_pixel_id || "",
              meta_pixel_access_token: json.meta_ads.meta_pixel_access_token || "",
              meta_pixel_test_code: json.meta_ads.meta_pixel_test_code || "",
              meta_pixel_active: json.meta_ads.meta_pixel_active !== undefined ? Boolean(json.meta_ads.meta_pixel_active) : true,
            });
          }
        }
      } catch (err) {
        console.error("Erro ao carregar Meta Ads:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSavedSuccess(false);
      const res = await fetch("/api/painel/configuracoes/meta-ads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSavedSuccess(true);
        if (onSaved) onSaved();
      }
    } catch (err) {
      console.error("Erro ao salvar Meta Ads:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        <span className="text-xs">Carregando dados do Meta Ads...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="bg-[#0b1222]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Pixel da Meta & Conversões</span>
          </div>
          {savedSuccess && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Salvo
            </span>
          )}
        </div>

        <div className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">ID do Pixel da Meta (Dataset ID)</label>
            <input
              type="text"
              value={formData.meta_pixel_id}
              onChange={(e) => setFormData({ ...formData, meta_pixel_id: e.target.value })}
              placeholder="Ex: 123456789012345"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Token de Acesso da API de Conversões (CAPI)</label>
            <textarea
              rows={2}
              value={formData.meta_pixel_access_token}
              onChange={(e) => setFormData({ ...formData, meta_pixel_access_token: e.target.value })}
              placeholder="EAA..."
              className="w-full p-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Código de Teste de Eventos (Opcional)</label>
            <input
              type="text"
              value={formData.meta_pixel_test_code}
              onChange={(e) => setFormData({ ...formData, meta_pixel_test_code: e.target.value })}
              placeholder="Ex: TEST12345"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={formData.meta_pixel_active}
                onChange={(e) => setFormData({ ...formData, meta_pixel_active: e.target.checked })}
                className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 bg-slate-900 border-slate-700"
              />
              <span>Ativar rastreamento de eventos em todas as páginas</span>
            </label>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Salvar Configuração do Pixel</span>
          </button>
        </div>
      </div>
    </form>
  );
}
