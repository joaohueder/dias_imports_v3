"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Send,
  Sparkles,
  Shuffle,
  ListFilter,
  CheckCircle2,
  Users,
  MessageSquareQuote,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Check,
  Eye,
  Crown,
  Lock,
} from "lucide-react";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { IphoneMockupPreview } from "@/components/painel/IphoneMockupPreview";

interface TemplateItem {
  id: number;
  title: string;
  content: string;
  status: "active" | "inactive";
}

interface GroupItem {
  id: number;
  whatsapp_group_id?: string | null;
  name: string;
  group_type: string;
  can_send_messages: "all" | "admin_only";
  participants_count: number;
  status: "active" | "paused";
}

interface ProductItem {
  id: number | string;
  name: string;
  slug?: string;
  price?: number | string;
  promo_price?: number | string | null;
  description?: string | null;
  headline?: string | null;
  cover_image?: string | null;
}

interface SendProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  onSuccess?: () => void;
}

const LOCAL_STORAGE_KEY = "jh7_product_send_preferences";

interface StoredPreferences {
  mode: "random" | "select";
  templateId?: number | null;
  selectedGroupIds: number[];
}

export function SendProductModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: SendProductModalProps) {
  const { showSuccess, showError } = useFeedbackModal();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);

  // Limites de envios da assinatura
  const [sendLimits, setSendLimits] = useState<{
    sendsToday: number;
    limitDaily: number;
    limitReached: boolean;
  }>({
    sendsToday: 0,
    limitDaily: 0,
    limitReached: false,
  });

  // Preferências
  const [modelMode, setModelMode] = useState<"random" | "select">("random");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Carregar dados e recuperar preferências do LocalStorage
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [tplRes, grpRes, prodRes] = await Promise.all([
          fetch("/api/painel/configuracoes/modelos"),
          fetch("/api/painel/grupos?status=active"),
          fetch("/api/painel/produtos"),
        ]);

        const tplData = await tplRes.json();
        const grpData = await grpRes.json();
        const prodData = await prodRes.json();

        if (prodData.success && prodData.metrics) {
          const { sends_today, limit_daily } = prodData.metrics;
          const reached = limit_daily > 0 && sends_today >= limit_daily;
          setSendLimits({
            sendsToday: sends_today || 0,
            limitDaily: limit_daily || 0,
            limitReached: reached,
          });
        }

        const activeTemplates: TemplateItem[] = (tplData.templates || []).filter(
          (t: TemplateItem) => t.status === "active"
        );

        // Apenas grupos ativos e que permitam envio de mensagens (não fechados / que não sejam admin_only)
        const validGroups: GroupItem[] = (grpData.groups || []).filter((g: GroupItem) => {
          const isActive = g.status === "active";
          const isClosed =
            g.group_type === "closed" ||
            g.can_send_messages === "admin_only" ||
            (g.can_send_messages as any) === "admin";
          return isActive && !isClosed;
        });

        setTemplates(activeTemplates);
        setGroups(validGroups);

        // Recuperar preferências salvas
        try {
          const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (raw) {
            const parsed: StoredPreferences = JSON.parse(raw);
            if (parsed.mode) setModelMode(parsed.mode);
            if (parsed.templateId && activeTemplates.some((t) => t.id === parsed.templateId)) {
              setSelectedTemplateId(parsed.templateId);
            } else if (activeTemplates.length > 0) {
              setSelectedTemplateId(activeTemplates[0].id);
            }

            if (Array.isArray(parsed.selectedGroupIds) && parsed.selectedGroupIds.length > 0) {
              // Filtrar somente IDs que ainda existem nos grupos válidos
              const validSelected = parsed.selectedGroupIds.filter((id) =>
                validGroups.some((g) => g.id === id)
              );
              setSelectedGroupIds(validSelected.length > 0 ? validSelected : validGroups.map((g) => g.id));
            } else {
              setSelectedGroupIds(validGroups.map((g) => g.id));
            }
          } else {
            if (activeTemplates.length > 0) {
              setSelectedTemplateId(activeTemplates[0].id);
            }
            setSelectedGroupIds(validGroups.map((g) => g.id));
          }
        } catch {
          if (activeTemplates.length > 0) {
            setSelectedTemplateId(activeTemplates[0].id);
          }
          setSelectedGroupIds(validGroups.map((g) => g.id));
        }
      } catch (err) {
        console.error("Erro ao carregar dados do modal de envio:", err);
        showError("Não foi possível carregar os modelos e grupos.", "Erro de Conexão");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen]);

  // Grupos filtrados por busca
  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups;
    const q = groupSearch.toLowerCase();
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, groupSearch]);

  const handleToggleGroup = (id: number) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((gId) => gId !== id) : [...prev, id]
    );
  };

  const handleSelectAllGroups = () => {
    if (selectedGroupIds.length === filteredGroups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(filteredGroups.map((g) => g.id));
    }
  };

  const handleSend = async () => {
    if (!product) return;

    if (templates.length === 0) {
      showError("Nenhum modelo de mensagem ativo encontrado. Ative ou crie um modelo antes de disparar.", "Sem Modelos Ativos");
      return;
    }

    if (modelMode === "select" && !selectedTemplateId) {
      showError("Por favor, selecione um modelo de mensagem para o envio.", "Selecione o Modelo");
      return;
    }

    if (selectedGroupIds.length === 0) {
      showError("Selecione pelo menos 1 grupo ativo para receber o disparo.", "Nenhum Grupo Selecionado");
      return;
    }

    // Salvar preferências no LocalStorage (localshare)
    try {
      const prefsToSave: StoredPreferences = {
        mode: modelMode,
        templateId: selectedTemplateId,
        selectedGroupIds,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prefsToSave));
    } catch (err) {
      console.warn("Não foi possível salvar no localStorage:", err);
    }

    setSending(true);
    try {
      const res = await fetch(`/api/painel/produtos/${product.id}/enviar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_mode: modelMode,
          template_id: modelMode === "select" ? selectedTemplateId : null,
          group_ids: selectedGroupIds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showSuccess(data.message || "Disparo enfileirado com sucesso!", "Envio Iniciado");
        onSuccess?.();
        onClose();
      } else {
        showError(data.message || "Falha ao enfileirar o disparo.", "Erro no Envio");
      }
    } catch {
      showError("Falha na comunicação com o servidor ao disparar.", "Erro de Rede");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#090f1d] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* CABEÇALHO DO MODAL */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                Disparar Campanha de WhatsApp
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
                Produto: <span className="text-amber-400 font-bold">{product?.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CORPO COM SCROLL */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Banner de Limite de Envios Atingido */}
          {sendLimits.limitReached && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/90 via-amber-950/90 to-purple-950/90 border-2 border-rose-500/80 shadow-[0_0_25px_rgba(244,63,94,0.3)] animate-pulse p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-rose-500/30">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white">
                      Limite de Envios Atingido
                    </span>
                    <span className="text-xs font-bold text-rose-300">
                      {sendLimits.sendsToday} de {sendLimits.limitDaily} envios hoje
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">
                    Sua cota diária de disparos foi alcançada.
                  </h4>
                  <p className="text-xs text-rose-200/80 mt-0.5 leading-relaxed">
                    Você atingiu o limite diário de mensagens do seu plano. Para realizar novos disparos agora mesmo sem esperar até amanhã, faça upgrade do seu plano.
                  </p>
                  <div className="mt-2.5">
                    <a
                      href="/painel/configuracoes/assinatura?tab=upgrade"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Fazer Upgrade de Plano</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
              <span className="text-xs font-medium">Carregando modelos ativos e grupos...</span>
            </div>
          ) : (
            <>
              {/* ETAPA 1: ESCOLHA DO MODELO (SELEÇÃO OU ALEATÓRIO) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <MessageSquareQuote className="w-4 h-4 text-emerald-400" />
                    1. Modo de Seleção do Modelo
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {templates.length} modelo(s) ativo(s)
                  </span>
                </div>

                {templates.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Nenhum modelo de mensagem ativo encontrado. Por favor, ative modelos em Configurações &gt; Modelos.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Opção 1: Modelo Aleatório */}
                    <div
                      onClick={() => setModelMode("random")}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        modelMode === "random"
                          ? "bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${modelMode === "random" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                        <Shuffle className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">Modelo Aleatório</h4>
                          {modelMode === "random" && <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" />}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          Alterna automaticamente entre todos os {templates.length} modelos ativos a cada grupo (Anti-Spam).
                        </p>
                      </div>
                    </div>

                    {/* Opção 2: Selecionar Modelo Específico */}
                    <div
                      onClick={() => setModelMode("select")}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        modelMode === "select"
                          ? "bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${modelMode === "select" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                        <ListFilter className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">Selecionar Modelo</h4>
                          {modelMode === "select" && <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" />}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          Escolha um modelo ativo específico fixo para ser enviado a todos os grupos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Seletor do Modelo Específico quando modo "select" */}
                {modelMode === "select" && templates.length > 0 && (
                  <div className="pt-2 animate-in fade-in duration-200">
                    <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block">
                      Escolha o modelo ativo:
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedTemplateId || ""}
                        onChange={(e) => setSelectedTemplateId(Number(e.target.value))}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer truncate"
                      >
                        {templates.map((tpl) => (
                          <option key={tpl.id} value={tpl.id}>
                            {tpl.title} ({tpl.content.slice(0, 40)}...)
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowPreviewModal(true)}
                        className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
                        title="Ver Preview da Mensagem"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Preview</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ETAPA 2: ESCOLHA DOS GRUPOS DESTINATÁRIOS */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      2. Grupos de Destino (Ativos)
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Mostrando apenas grupos ativos aptos para envio de mensagens.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllGroups}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap"
                    >
                      {selectedGroupIds.length === filteredGroups.length ? "Desmarcar Todos" : "Selecionar Todos"}
                    </button>
                    <span className="text-[11px] text-slate-400 font-semibold px-1">
                      {selectedGroupIds.length} de {groups.length}
                    </span>
                  </div>
                </div>

                {/* Input de Filtro Rápido dos Grupos */}
                {groups.length > 5 && (
                  <input
                    type="text"
                    placeholder="Filtrar grupos pelo nome..."
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                )}

                {/* Lista de Grupos Selecionáveis */}
                {groups.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Nenhum grupo ativo encontrado. Ative grupos no menu lateral &quot;Grupos&quot; para enviar.</span>
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-1.5 p-1 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    {filteredGroups.map((grp) => {
                      const isSelected = selectedGroupIds.includes(grp.id);
                      return (
                        <div
                          key={grp.id}
                          onClick={() => handleToggleGroup(grp.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? "bg-emerald-950/30 border-emerald-500/50 text-white"
                              : "bg-slate-900/40 border-slate-800/60 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                                isSelected
                                  ? "bg-emerald-500 border-emerald-400 text-slate-950"
                                  : "border-slate-700 bg-slate-800"
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className="text-xs font-semibold truncate">
                              {grp.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              <Users className="w-3 h-3 text-slate-500" />
                              {grp.participants_count || 0}
                            </span>
                            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Ativo
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* RODAPÉ COM AÇÕES */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 truncate">
            {selectedGroupIds.length} grupo(s) selecionado(s)
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={
                sending ||
                loading ||
                sendLimits.limitReached ||
                templates.length === 0 ||
                selectedGroupIds.length === 0
              }
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-emerald-950/50"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Enfileirando...</span>
                </>
              ) : sendLimits.limitReached ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Limite de Envios Atingido</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirmar & Disparar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SUB-MODAL DE PREVIEW DO MODELO */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-[#090f1d] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white">Preview da Mensagem no WhatsApp</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="w-7 h-7 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex justify-center bg-slate-950/50">
              {(() => {
                const currentTpl = templates.find((t) => t.id === selectedTemplateId) || templates[0];
                return (
                  <IphoneMockupPreview
                    content={currentTpl ? currentTpl.content : ""}
                    product={
                      product
                        ? {
                            name: product.name,
                            description: product.description || undefined,
                            price: product.price,
                            promo_price: product.promo_price,
                            slug: product.slug,
                            id: product.id,
                            headline: product.headline || undefined,
                            cover_image: product.cover_image,
                          }
                        : null
                    }
                    imageUrl={product?.cover_image || undefined}
                    compact={true}
                  />
                );
              })()}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                Fechar Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
