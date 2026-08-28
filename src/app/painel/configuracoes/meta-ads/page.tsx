"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  RefreshCw,
  Eye,
  EyeOff,
  Radio,
  ShieldCheck,
  Zap,
  Activity,
  Play,
} from "lucide-react";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { FloatingActionBar } from "@/components/ui/FloatingActionBar";

interface MetaAdsSettings {
  meta_pixel_id: string;
  meta_pixel_access_token: string;
  meta_pixel_test_code: string;
  meta_pixel_active: boolean;
}

export default function PainelConfiguracoesMetaAdsPage() {
  const { showSuccess, showError } = useFeedbackModal();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [initialData, setInitialData] = useState<MetaAdsSettings>({
    meta_pixel_id: "",
    meta_pixel_access_token: "",
    meta_pixel_test_code: "",
    meta_pixel_active: false,
  });

  const [formData, setFormData] = useState<MetaAdsSettings>({
    meta_pixel_id: "",
    meta_pixel_access_token: "",
    meta_pixel_test_code: "",
    meta_pixel_active: false,
  });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/painel/configuracoes/meta-ads");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.meta_ads) {
          const loaded: MetaAdsSettings = {
            meta_pixel_id: json.meta_ads.meta_pixel_id || "",
            meta_pixel_access_token: json.meta_ads.meta_pixel_access_token || "",
            meta_pixel_test_code: json.meta_ads.meta_pixel_test_code || "",
            meta_pixel_active: Boolean(json.meta_ads.meta_pixel_active),
          };
          setInitialData(loaded);
          setFormData(loaded);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar configurações do Meta Ads:", err);
      showError("Não foi possível carregar as configurações do Meta Ads.", "Erro");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Identifica se há alterações pendentes de salvar
  const isDirty = useMemo(() => {
    return (
      formData.meta_pixel_id !== initialData.meta_pixel_id ||
      formData.meta_pixel_access_token !== initialData.meta_pixel_access_token ||
      formData.meta_pixel_test_code !== initialData.meta_pixel_test_code ||
      formData.meta_pixel_active !== initialData.meta_pixel_active
    );
  }, [formData, initialData]);

  const handleResetForm = () => {
    setFormData(initialData);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/painel/configuracoes/meta-ads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setInitialData(formData);
        showSuccess(json.message || "Configurações salvas com sucesso!", "Meta Ads Atualizado");
      } else {
        showError(json.message || "Erro ao salvar configurações.", "Falha ao Salvar");
      }
    } catch {
      showError("Ocorreu um erro ao comunicar com o servidor.", "Falha de Conexão");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.meta_pixel_id.trim()) {
      showError("Informe o ID do Pixel da Meta antes de testar a conexão.", "Campo Obrigatório");
      return;
    }
    if (!formData.meta_pixel_access_token.trim()) {
      showError("Informe o Token de Acesso da Conversions API (CAPI) antes de testar a conexão.", "Campo Obrigatório");
      return;
    }

    try {
      setTesting(true);
      const res = await fetch("/api/painel/configuracoes/meta-ads/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        showSuccess(json.message, "Conexão com a Meta OK!");
      } else {
        showError(json.message || "Falha ao comunicar com os servidores da Meta.", "Erro de Integração Meta");
      }
    } catch {
      showError("Erro inesperado ao conectar com a Meta Graph API.", "Falha de Conexão");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 gap-4">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        <span className="text-sm font-medium">Carregando configurações do Meta Ads...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">
        {/* CABEÇALHO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-white tracking-tight">Meta Ads & Pixel</h1>
                {formData.meta_pixel_active ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Rastreamento Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-slate-400 border border-slate-700">
                    Rastreamento Pausado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Configure o Pixel do Facebook/Instagram e a API de Conversões (CAPI) para rastrear visitantes e leads nas suas landing pages.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => fetchSettings()}
              disabled={loading || saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-all focus:outline-none disabled:opacity-50 cursor-pointer"
              title="Recarregar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* FORMULÁRIO DE CONFIGURAÇÃO */}
        <form id="meta-ads-form" onSubmit={handleSave} className="space-y-6">
          {/* CARD DE STATUS & ATIVAÇÃO GERAL */}
          <div className="rounded-2xl bg-[#090f1d] border border-slate-800/80 p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Status do Rastreamento Meta Ads</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Ative para injetar automaticamente o Pixel do Facebook e disparar eventos simultâneos via API de Conversões (CAPI) em todas as páginas públicas de produtos.
                </p>
              </div>

              {/* TOGGLE SWITCH */}
              <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={formData.meta_pixel_active}
                  onChange={(e) => setFormData({ ...formData, meta_pixel_active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-500 border border-slate-700"></div>
                <span className="ml-3 text-xs font-extrabold text-slate-200">
                  {formData.meta_pixel_active ? "ATIVO" : "INATIVO"}
                </span>
              </label>
            </div>
          </div>

          {/* CARD PRINCIPAL: PIXEL ID & TOKEN DA API DE CONVERSÕES */}
          <div className="rounded-2xl bg-[#090f1d] border border-slate-800/80 p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white">Credenciais do Meta Business</h2>
              </div>

              {/* BOTÃO TESTAR CONEXÃO NO CABEÇALHO DO CARD */}
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {testing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                )}
                <span>{testing ? "Testando..." : "Testar Conexão"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* PIXEL ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>ID do Pixel do Facebook / Meta</span>
                  <span className="text-[10px] text-slate-500 font-mono">Dataset ID</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 123456789012345"
                  value={formData.meta_pixel_id}
                  onChange={(e) => setFormData({ ...formData, meta_pixel_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500">
                  Encontrado no Gerenciador de Eventos da Meta em Configurações do Conjunto de Dados.
                </p>
              </div>

              {/* CÓDIGO DE TESTE CAPI (OPCIONAL) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Código de Eventos de Teste (Opcional)</span>
                  <span className="text-[10px] text-amber-400 font-mono">Para Testes CAPI</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: TEST12345"
                  value={formData.meta_pixel_test_code}
                  onChange={(e) => setFormData({ ...formData, meta_pixel_test_code: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500">
                  Use durante a depuração na aba &quot;Testar Eventos&quot; do Gerenciador de Eventos da Meta.
                </p>
              </div>
            </div>

            {/* TOKEN DA API DE CONVERSÕES */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Token de Acesso da API de Conversões (CAPI)</span>
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showToken ? "Ocultar" : "Mostrar"} Token</span>
                </button>
              </label>
              <textarea
                rows={3}
                placeholder="Ex: EAAB..."
                value={formData.meta_pixel_access_token}
                onChange={(e) => setFormData({ ...formData, meta_pixel_access_token: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 ${
                  !showToken ? "filter blur-[3px] focus:filter-none transition-all" : ""
                }`}
              />
              <p className="text-[11px] text-slate-500">
                Gere um token permanente em: Gerenciador de Eventos &gt; Configurações &gt; API de Conversões &gt; Gerar Token de Acesso.
              </p>
            </div>
          </div>

          {/* CARD EXPLICATIVO DOS EVENTOS RASTREADOS */}
          <div className="rounded-2xl bg-[#090f1d]/70 border border-slate-800/80 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Eventos Rastreabilidade Automática</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  PageView
                </span>
                <p className="text-[11px] text-slate-300 font-medium pt-1">Carregamento da Página</p>
                <p className="text-[10px] text-slate-500">Disparado no navegador do usuário quando a landing page abre.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  ViewContent
                </span>
                <p className="text-[11px] text-slate-300 font-medium pt-1">Visualização do Produto</p>
                <p className="text-[10px] text-slate-500">Enviado via Pixel e CAPI com ID do produto, nome e valor em BRL.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Lead
                </span>
                <p className="text-[11px] text-slate-300 font-medium pt-1">Clique no WhatsApp / CTA</p>
                <p className="text-[10px] text-slate-500">Disparado quando o visitante clica no botão para comprar no WhatsApp.</p>
              </div>
            </div>
          </div>
        </form>

        {/* BARRA FLUTUANTE DE SALVAR (PADRÃO DO SISTEMA) */}
        <FloatingActionBar
          isVisible={isDirty}
          isSubmitting={saving}
          onCancel={handleResetForm}
          formId="meta-ads-form"
          saveLabel="Salvar Configurações"
          savingLabel="Salvando Alterações..."
        />
      </div>
  );
}
