"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MessageSquareQuote,
  CheckCircle2,
  Tag,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Package,
  Smartphone,
  Sparkles,
  RefreshCw,
  Download,
} from "lucide-react";
import { IphoneMockupPreview } from "@/components/painel/IphoneMockupPreview";

interface Step3Props {
  onSaved?: () => void;
}

interface ProductItem {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  promo_price?: number | null;
  headline?: string;
  cover_image?: string | null;
  status: string;
}

const AVAILABLE_TAGS = [
  { tag: "{nome_produto}", label: "Nome do Produto", desc: "Ex: Fone Bluetooth Pro Max" },
  { tag: "{descricao_produto}", label: "Descrição", desc: "Ex: Cancelamento de ruído ativo..." },
  { tag: "{preco_de}", label: "Preço Original", desc: "Ex: R$ 299,90" },
  { tag: "{preco_por}", label: "Preço Promocional", desc: "Ex: R$ 149,90" },
  { tag: "{desconto_pct}", label: "% Desconto", desc: "Ex: 50%" },
  { tag: "{link_produto}", label: "Link da Oferta", desc: "URL da landing page gerada" },
  { tag: "{headline}", label: "Headline", desc: "Chamada atrativa configurada na oferta" },
  { tag: "{nome_empresa}", label: "Nome da Empresa", desc: "Nome cadastrado da sua empresa" },
];

export function WizardStep3Templates({ onSaved }: Step3Props) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("sample");
  const [companyName, setCompanyName] = useState<string>("Minha Empresa");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSelectTemplate = (tpl: any) => {
    setSelectedTemplateId(tpl.id || null);
    setTitle(tpl.title || "");
    setContent(tpl.content || "");
    setSavedSuccess(false);
  };

  const handleCreateNew = () => {
    setSelectedTemplateId(null);
    setTitle("");
    setContent("");
    setSavedSuccess(false);
  };

  const loadData = async (preserveSelectedId?: number | null) => {
    try {
      setLoading(true);
      const [resTemplates, resProducts, resCompany] = await Promise.all([
        fetch("/api/painel/configuracoes/modelos"),
        fetch("/api/painel/produtos"),
        fetch("/api/painel/empresa"),
      ]);

      if (resTemplates.ok) {
        const json = await resTemplates.json();
        if (json.success && Array.isArray(json.templates)) {
          setTemplates(json.templates);
          if (json.templates.length > 0) {
            const target = preserveSelectedId 
              ? json.templates.find((t: any) => t.id === preserveSelectedId) || json.templates[0]
              : json.templates[0];
            setSelectedTemplateId(target.id);
            setTitle(target.title);
            setContent(target.content);
          }
        }
      }

      if (resProducts.ok) {
        const json = await resProducts.json();
        if (json.success && Array.isArray(json.products)) {
          setProducts(json.products);
          if (json.products.length > 0) {
            setSelectedProductId(String(json.products[0].id));
          }
        }
      }

      if (resCompany.ok) {
        const json = await resCompany.json();
        if (json.success && json.company?.name) {
          setCompanyName(json.company.name);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados do step 3:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProductForPreview = useMemo(() => {
    if (!selectedProductId || selectedProductId === "sample") return null;
    return products.find((p) => String(p.id) === String(selectedProductId)) || null;
  }, [products, selectedProductId]);

  const handleInsertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? content.length;
      const end = textarea.selectionEnd ?? content.length;
      const currentText = content;
      const newText = currentText.substring(0, start) + tag + currentText.substring(end);

      setContent(newText);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + tag.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      setContent((prev) => (prev ? `${prev} ${tag}` : tag));
    }
  };

  const handleFormatText = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? 0;
      const currentText = content;
      const selectedText = currentText.substring(start, end);

      const replacement = `${prefix}${selectedText || "texto"}${suffix}`;
      const newText = currentText.substring(0, start) + replacement + currentText.substring(end);

      setContent(newText);

      setTimeout(() => {
        textarea.focus();
        if (selectedText) {
          textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        } else {
          textarea.setSelectionRange(start + prefix.length, start + prefix.length + 5);
        }
      }, 0);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSavedSuccess(false);
      const res = await fetch("/api/painel/configuracoes/modelos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          status: "active",
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        if (onSaved) onSaved();
      }
    } catch (err) {
      console.error("Erro ao salvar modelo:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleImportPresets = async () => {
    try {
      setImporting(true);
      setImportMessage(null);
      const res = await fetch("/api/painel/configuracoes/modelos/importar-padroes", {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setImportMessage(json.message);
        await loadData();
        if (onSaved) onSaved();
      } else {
        setImportMessage(json.message || "Erro ao importar modelos.");
      }
    } catch (err) {
      console.error("Erro ao importar modelos pré-configurados:", err);
      setImportMessage("Erro de conexão ao importar.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="bg-[#0b1222]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <MessageSquareQuote className="w-4 h-4 text-emerald-400" />
            <span>Configurar Modelo de Disparo</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleImportPresets}
              disabled={importing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-60 active:scale-95 whitespace-nowrap"
            >
              {importing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Importar Modelos Pré-Configurados</span>
            </button>

            {savedSuccess && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Modelo Salvo
              </span>
            )}
          </div>
        </div>

        {importMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
            <span>{importMessage}</span>
            <button
              type="button"
              onClick={() => setImportMessage(null)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Lista de Modelos Importados / Salvos */}
        {templates.length > 0 ? (
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Modelos de Mensagens Disponíveis ({templates.length})
              </span>
              <button
                type="button"
                onClick={handleCreateNew}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                + Criar Novo Modelo
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {templates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 text-xs relative ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500/60 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                        : "bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <span className="font-bold text-[11px] leading-tight line-clamp-1">
                        {tpl.title}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0 font-medium">
                          Usar
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed font-mono">
                      {tpl.content}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Nenhum modelo cadastrado ainda. Clique no botão acima para importar modelos prontos testados de alta conversão!
            </p>
            <button
              type="button"
              onClick={handleImportPresets}
              disabled={importing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Importar 4 Modelos Pré-Configurados Agora</span>
            </button>
          </div>
        )}

        {/* Grid com Formulário (Esquerda) e Mockup iPhone Realtime (Direita) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LADO ESQUERDO: Formulário com Toolbar e Tags */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Título do Modelo</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Oferta Padrão (Alta Conversão)"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Tags Dinâmicas */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  Variáveis Dinâmicas (Clique para inserir no texto)
                </label>
              </div>
              <div className="flex flex-wrap gap-1 p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                {AVAILABLE_TAGS.map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleInsertTag(item.tag)}
                    title={item.desc}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer active:scale-95"
                  >
                    <span>{item.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Editor de Texto com Formatações WhatsApp */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Texto da Mensagem
                </label>

                {/* Toolbar de Formatação */}
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleFormatText("*")}
                    title="Negrito (*texto*)"
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1 text-[10px] px-1.5 font-bold"
                  >
                    <Bold className="w-3 h-3" />
                    <span>Negrito</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText("_")}
                    title="Itálico (_texto_)"
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1 text-[10px] px-1.5"
                  >
                    <Italic className="w-3 h-3" />
                    <span>Itálico</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText("~")}
                    title="Tachado (~texto~)"
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1 text-[10px] px-1.5"
                  >
                    <Strikethrough className="w-3 h-3" />
                    <span>Tachado</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText("```")}
                    title="Monoespaçado"
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1 text-[10px] px-1.5"
                  >
                    <Code className="w-3 h-3" />
                    <span>Mono</span>
                  </button>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                rows={6}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite a mensagem do WhatsApp aqui..."
                className="w-full p-3 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed custom-scrollbar"
              />
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving || !title || !content}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-60 active:scale-95"
              >
                {saving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Salvar Modelo de Mensagem</span>
              </button>
            </div>
          </div>

          {/* LADO DIREITO: Preview Realtime no iPhone */}
          <div className="lg:col-span-5 flex flex-col items-center p-3 bg-slate-950/70 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="w-full flex items-center justify-between">
              <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                Preview em Tempo Real
              </div>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                WhatsApp
              </span>
            </div>

            {/* Seletor de Produto para Testar Tags */}
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-2 space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Package className="w-3 h-3 text-emerald-400" />
                Simular com Produto:
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-2 py-1 text-[11px] rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer truncate"
              >
                <option value="sample">✨ Dados de Exemplo Fictícios</option>
                {products.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    📦 {prod.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mockup iPhone Compacto */}
            <div className="w-full flex justify-center scale-90 sm:scale-95 origin-top">
              <IphoneMockupPreview
                content={content}
                senderName={companyName}
                companyName={companyName}
                product={selectedProductForPreview}
                compact={true}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default WizardStep3Templates;
