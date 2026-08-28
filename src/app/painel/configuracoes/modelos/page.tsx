"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  MessageSquareQuote,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Copy,
  Sparkles,
  RefreshCw,
  AlertCircle,
  FileText,
  Tag,
  Check,
  Search,
  SlidersHorizontal,
  X,
  Smartphone,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Package,
  Eye,
  Calendar,
  Star,
  CheckCircle,
  Download,
} from "lucide-react";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import { IphoneMockupPreview } from "@/components/painel/IphoneMockupPreview";
import { toast } from "sonner";

interface TemplateItem {
  id: number;
  company_id: number;
  title: string;
  content: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
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

interface DashboardData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    company_id?: number | null;
  };
  company: {
    id: number;
    name: string;
    plan: string;
    status: string;
  };
}

const AVAILABLE_TAGS = [
  { tag: "{nome_produto}", label: "Nome do Produto", desc: "Ex: Fone Bluetooth Pro Max" },
  { tag: "{descricao_produto}", label: "Descrição do Produto", desc: "Ex: Cancelamento de ruído ativo, bateria de 40h..." },
  { tag: "{preco_de}", label: "Preço Original (De)", desc: "Ex: R$ 299,90" },
  { tag: "{preco_por}", label: "Preço Promocional (Por)", desc: "Ex: R$ 149,90" },
  { tag: "{desconto_pct}", label: "% de Desconto", desc: "Ex: 50%" },
  { tag: "{link_produto}", label: "Link do Produto/Oferta", desc: "URL da landing page gerada" },
  { tag: "{headline}", label: "Headline / Chamada", desc: "Chamada atrativa configurada na oferta" },
  { tag: "{nome_empresa}", label: "Nome da Empresa", desc: "Nome cadastrado da sua empresa" },
];

export default function PainelConfiguracoesModelosPage() {
  const { showSuccess, showError, showConfirm } = useFeedbackModal();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  // Produtos cadastrados para preview no editor
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("sample");

  // Filtros e Busca
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Modal de Preview dedicado
  const [previewModalTemplate, setPreviewModalTemplate] = useState<TemplateItem | null>(null);
  const [previewModalProductId, setPreviewModalProductId] = useState<string>("sample");
  const [importingPresets, setImportingPresets] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    status: "active" | "inactive";
  }>({
    title: "",
    content: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Referência do textarea para inserção precisa no cursor
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch("/api/painel/dashboard");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch("/api/painel/configuracoes/modelos");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setTemplates(json.templates || []);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar modelos:", error);
      toast.error("Erro ao carregar modelos de mensagem.");
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/painel/produtos");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.products)) {
          setProducts(json.products);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchTemplates();
    fetchProducts();
  }, [fetchDashboardData, fetchTemplates, fetchProducts]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: "",
      content: "",
      status: "active",
    });
    setSelectedProductId(products.length > 0 ? String(products[0].id) : "sample");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tpl: TemplateItem) => {
    setEditingId(tpl.id);
    setFormData({
      title: tpl.title,
      content: tpl.content,
      status: tpl.status || "active",
    });
    setSelectedProductId(products.length > 0 ? String(products[0].id) : "sample");
    setIsModalOpen(true);
  };

  const handleOpenPreviewModal = (tpl: TemplateItem) => {
    setPreviewModalTemplate(tpl);
    setPreviewModalProductId(products.length > 0 ? String(products[0].id) : "sample");
  };

  const handleImportPresets = async () => {
    try {
      setImportingPresets(true);
      const res = await fetch("/api/painel/configuracoes/modelos/importar-padroes", {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        fetchTemplates();
      } else {
        toast.error(json.message || "Erro ao importar modelos.");
      }
    } catch (error) {
      console.error("Erro ao importar modelos pré-configurados:", error);
      toast.error("Erro de conexão ao importar modelos.");
    } finally {
      setImportingPresets(false);
    }
  };

  const handleInsertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? formData.content.length;
      const end = textarea.selectionEnd ?? formData.content.length;
      const currentText = formData.content;
      const newText = currentText.substring(0, start) + tag + currentText.substring(end);

      setFormData((prev) => ({
        ...prev,
        content: newText,
      }));

      // Reposiciona o cursor logo após a tag inserida
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + tag.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      setFormData((prev) => ({
        ...prev,
        content: prev.content ? `${prev.content} ${tag}` : tag,
      }));
    }
  };

  const handleFormatText = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? 0;
      const currentText = formData.content;
      const selectedText = currentText.substring(start, end);

      const replacement = `${prefix}${selectedText || "texto"}${suffix}`;
      const newText = currentText.substring(0, start) + replacement + currentText.substring(end);

      setFormData((prev) => ({
        ...prev,
        content: newText,
      }));

      // Seleciona o texto formatado para edição imediata
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Digite o título do modelo.");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("Digite o texto da mensagem.");
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/painel/configuracoes/modelos/${editingId}`
        : `/api/painel/configuracoes/modelos`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(editingId ? "Modelo atualizado com sucesso!" : "Modelo criado com sucesso!");
        setIsModalOpen(false);
        fetchTemplates();
      } else {
        toast.error(json.message || "Erro ao salvar modelo.");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro de conexão ao salvar modelo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (tpl: TemplateItem) => {
    showConfirm({
      title: "Excluir Modelo de Mensagem?",
      message: `Tem certeza que deseja excluir o modelo "${tpl.title}"? Esta ação é irreversível e o modelo deixará de estar disponível para disparos.`,
      confirmLabel: "Sim, Excluir",
      cancelLabel: "Cancelar",
      destructive: true,
      onConfirm: async () => {
        setDeletingId(tpl.id);
        try {
          const res = await fetch(`/api/painel/configuracoes/modelos/${tpl.id}`, {
            method: "DELETE",
          });
          const json = await res.json();
          if (json.success) {
            showSuccess(json.message || "Modelo excluído com sucesso!", "Modelo Removido");
            fetchTemplates();
          } else {
            showError(json.message || "Erro ao excluir modelo.", "Erro ao Excluir");
          }
        } catch (error) {
          showError("Falha de comunicação ao excluir modelo.", "Erro de Conexão");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleToggleStatus = (tpl: TemplateItem) => {
    const isCurrentlyActive = tpl.status === "active";
    const newStatus = isCurrentlyActive ? "inactive" : "active";

    showConfirm({
      title: isCurrentlyActive ? "Desativar Modelo de Mensagem?" : "Ativar Modelo de Mensagem?",
      message: isCurrentlyActive
        ? `Deseja desativar o modelo "${tpl.title}"? Modelos inativos não ficam disponíveis para envio em disparos e campanhas.`
        : `Deseja ativar o modelo "${tpl.title}"? Ele ficará imediatamente disponível para seleção em envios e campanhas.`,
      confirmLabel: isCurrentlyActive ? "Sim, Desativar" : "Sim, Ativar",
      cancelLabel: "Cancelar",
      destructive: isCurrentlyActive,
      onConfirm: async () => {
        setUpdatingStatusId(tpl.id);
        try {
          const res = await fetch(`/api/painel/configuracoes/modelos/${tpl.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
          const json = await res.json();
          if (json.success) {
            showSuccess(json.message || `Modelo ${newStatus === "active" ? "ativado" : "desativado"} com sucesso!`, "Status Atualizado");
            fetchTemplates();
          } else {
            showError(json.message || "Não foi possível alterar o status do modelo.", "Erro");
          }
        } catch (error) {
          showError("Falha ao comunicar com o servidor.", "Erro de Conexão");
        } finally {
          setUpdatingStatusId(null);
        }
      },
    });
  };

  // Produto selecionado no editor para preview em tempo real
  const selectedProductForPreview = useMemo(() => {
    if (selectedProductId === "sample" || !selectedProductId) {
      return null;
    }
    const found = products.find((p) => String(p.id) === String(selectedProductId));
    return found || null;
  }, [products, selectedProductId]);

  // Produto selecionado no modal de visualização/preview dedicado
  const selectedProductForPreviewModal = useMemo(() => {
    if (previewModalProductId === "sample" || !previewModalProductId) {
      return null;
    }
    const found = products.find((p) => String(p.id) === String(previewModalProductId));
    return found || null;
  }, [products, previewModalProductId]);

  // Filtragem dos modelos
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      // Busca textual no título ou conteúdo
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = tpl.title.toLowerCase().includes(query);
        const matchContent = tpl.content.toLowerCase().includes(query);
        if (!matchTitle && !matchContent) return false;
      }

      // Filtro por status
      if (filterStatus === "active" && tpl.status !== "active") {
        return false;
      }
      if (filterStatus === "inactive" && tpl.status !== "inactive") {
        return false;
      }

      return true;
    });
  }, [templates, searchTerm, filterStatus]);

  const hasActiveFilters = searchTerm.trim() !== "" || filterStatus !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 gap-4">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        <span className="text-sm font-medium">Carregando modelos de mensagens...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
        
        {/* CABEÇALHO DA PÁGINA */}
        <div className="flex flex-col gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <MessageSquareQuote className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-white tracking-tight">Modelos de Mensagens</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  WhatsApp Marketing
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Crie e gerencie templates de texto inteligentes com variáveis dinâmicas para disparos em massa.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 w-full pt-1">
            <button
              onClick={handleImportPresets}
              disabled={importingPresets}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {importingPresets ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Importar Modelos Pré-Configurados
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Novo Modelo
            </button>
          </div>
        </div>

        {/* BARRA DE BUSCA E FILTROS */}
        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-3.5 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="flex-1 flex flex-wrap items-center gap-2.5">
            {/* Campo de Busca */}
            <div className="relative w-full sm:w-72 md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por título ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtro por Status (Ativo / Inativo) */}
            <div className="w-full sm:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-36 px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all cursor-pointer"
              >
                <option value="all">Status: Todos</option>
                <option value="active">🟢 Ativos</option>
                <option value="inactive">⚪ Inativos</option>
              </select>
            </div>

            {/* Limpar Filtros */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5" />
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* LISTAGEM DE MODELOS EM FORMATO DE LISTA */}
        {loadingTemplates ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
            <span className="text-xs font-medium">Carregando modelos de mensagens...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              {hasActiveFilters ? <Search className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            </div>
            <h3 className="text-base font-bold text-white">
              {hasActiveFilters ? "Nenhum modelo encontrado com os filtros aplicados" : "Nenhum modelo cadastrado"}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {hasActiveFilters
                ? "Tente ajustar ou limpar seus filtros para visualizar mais resultados."
                : "Crie modelos personalizados com tags dinâmicas para agilizar os envios das suas campanhas de WhatsApp."}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all cursor-pointer"
              >
                Limpar Filtros
              </button>
            ) : (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Modelo
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-3xl bg-slate-900/50 border border-slate-800/80 overflow-hidden shadow-xl">
            <div className="divide-y divide-slate-800/60">
              {filteredTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="group relative p-4 sm:p-5 hover:bg-slate-800/30 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Informações Principais (Sem o corpo de texto na listagem) */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Badge de Status Ativo / Inativo Interativo */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(tpl)}
                        disabled={updatingStatusId === tpl.id}
                        title={tpl.status === "active" ? "Clique para desativar este modelo" : "Clique para ativar este modelo"}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                          tpl.status === "active"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.12)]"
                            : "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-500/10"
                        }`}
                      >
                        {updatingStatusId === tpl.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                        ) : tpl.status === "active" ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Ativo</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            <span>Inativo</span>
                          </>
                        )}
                      </button>

                      {/* Título */}
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                        {tpl.title}
                      </h3>
                    </div>

                    {/* Metadados */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Atualizado em {new Date(tpl.updated_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="text-slate-300 font-semibold">{tpl.content.length}</span>
                        <span>caracteres</span>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {/* Botão para Alterar Status (Ativar / Desativar) */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(tpl)}
                      disabled={updatingStatusId === tpl.id}
                      title={tpl.status === "active" ? "Desativar este modelo" : "Ativar este modelo"}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        tpl.status === "active"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-500/10"
                      }`}
                    >
                      {updatingStatusId === tpl.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      ) : tpl.status === "active" ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300 font-bold">Ativo</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-slate-500" />
                          <span>Inativo</span>
                        </>
                      )}
                    </button>

                    {/* Botão de Preview do iPhone */}
                    <button
                      onClick={() => handleOpenPreviewModal(tpl)}
                      title="Visualizar modelo no iPhone"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-amber-300 bg-slate-800/80 hover:bg-amber-500/10 border border-slate-700/60 hover:border-amber-500/30 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    {/* Botão de Edição */}
                    <button
                      onClick={() => handleOpenEditModal(tpl)}
                      title="Editar modelo"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-md shadow-amber-500/10 transition-all active:scale-95 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    {/* Botão de Exclusão */}
                    <button
                      onClick={() => handleDelete(tpl)}
                      disabled={deletingId === tpl.id}
                      title="Excluir modelo"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <MessageSquareQuote className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      {editingId ? "Editar Modelo de Mensagem" : "Novo Modelo de Mensagem"}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Defina o modelo com formatação do WhatsApp (*negrito*, _itálico_) e veja o preview em tempo real no iPhone 15 Pro Max.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* FORMULÁRIO DE EDIÇÃO */}
                <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Título do Modelo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 🔥 Oferta Relâmpago com Link"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>

                  {/* TAGS DINÂMICAS DISPONÍVEIS */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-amber-400" />
                        Variáveis Dinâmicas (Clique para inserir)
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-2.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                      {AVAILABLE_TAGS.map((item) => (
                        <button
                          key={item.tag}
                          type="button"
                          onClick={() => handleInsertTag(item.tag)}
                          title={item.desc}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer active:scale-95"
                        >
                          <span>{item.tag}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TEXTAREA DO CONTEÚDO COM TOOLBAR DE FORMATAÇÃO */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">
                        Conteúdo da Mensagem *
                      </label>

                      {/* BOTÕES DE FORMATAÇÃO WHATSAPP */}
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleFormatText("*")}
                          title="Negrito (*texto*)"
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1 text-[11px] px-1.5"
                        >
                          <Bold className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">Negrito</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormatText("_")}
                          title="Itálico (_texto_)"
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1 text-[11px] px-1.5"
                        >
                          <Italic className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-medium">Itálico</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormatText("~")}
                          title="Tachado (~texto~)"
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1 text-[11px] px-1.5"
                        >
                          <Strikethrough className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Tachado</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormatText("```")}
                          title="Monoespaçado (```texto```)"
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1 text-[11px] px-1.5"
                        >
                          <Code className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Mono</span>
                        </button>
                      </div>
                    </div>

                    <textarea
                      ref={textareaRef}
                      required
                      rows={6}
                      placeholder="Digite a mensagem aqui... Use as tags acima para preenchimento automático."
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all leading-relaxed"
                    />
                  </div>

                  {/* SELECT DE STATUS (ATIVO / INATIVO) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Status do Modelo</label>
                    <select
                      value={formData.status}
                      onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 transition-all"
                    >
                      <option value="active">🟢 Ativo (Disponível para envios)</option>
                      <option value="inactive">⚪ Inativo (Oculto nos disparos)</option>
                    </select>
                  </div>

                  {/* BOTÕES DE AÇÃO */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      {editingId ? "Salvar Alterações" : "Criar Modelo"}
                    </button>
                  </div>
                </form>

                {/* COLUNA DO PREVIEW REALTIME IPHONE 15 PRO MAX */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950/50 rounded-3xl border border-slate-800/80 space-y-3 w-full">
                  <div className="w-full flex items-center justify-between">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                      Preview Real (iPhone 15 Pro Max)
                    </div>
                  </div>

                  {/* SELETOR DE PRODUTO EXEMPLO */}
                  <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                      Produto de Exemplo para Teste
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer truncate"
                    >
                      <option value="sample">✨ Dados de Exemplo Fictícios (Padrão)</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          📦 {prod.name} ({prod.price ? Number(prod.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Sem preço"})
                        </option>
                      ))}
                    </select>
                    <div className="text-[10px] text-slate-500 px-0.5">
                      {selectedProductForPreview ? (
                        <span>Simulando com dados reais de: <strong className="text-amber-300/90">{selectedProductForPreview.name}</strong></span>
                      ) : (
                        <span>Nenhum produto selecionado ou cadastrado: usando dados genéricos.</span>
                      )}
                    </div>
                  </div>

                  <IphoneMockupPreview
                    content={formData.content}
                    senderName={data?.company.name || "JH7 Marketing"}
                    companyName={data?.company.name}
                    product={selectedProductForPreview}
                    compact={false}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE PREVIEW DEDICADO DO MODELO */}
        {previewModalTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white leading-tight">
                      {previewModalTemplate.title}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Visualização exata de como o cliente receberá no WhatsApp
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewModalTemplate(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Seletor de Produto para Simulação */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  Simular com dados do produto:
                </label>
                <select
                  value={previewModalProductId}
                  onChange={(e) => setPreviewModalProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/60 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer truncate"
                >
                  <option value="sample">✨ Dados de Exemplo Fictícios (Padrão)</option>
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      📦 {prod.name} ({prod.price ? Number(prod.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Sem preço"})
                    </option>
                  ))}
                </select>
              </div>

              {/* iPhone Mockup Container */}
              <div className="flex justify-center p-3 bg-gradient-to-b from-slate-950/90 to-[#080d19] rounded-2xl border border-slate-800/70 shadow-inner">
                <IphoneMockupPreview
                  content={previewModalTemplate.content}
                  senderName={data?.company.name || "Dias Imports"}
                  companyName={data?.company.name}
                  product={selectedProductForPreviewModal}
                  compact={false}
                />
              </div>

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleCopyContent(previewModalTemplate)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-emerald-300 bg-slate-800 hover:bg-emerald-500/10 border border-slate-700 hover:border-emerald-500/30 transition-all cursor-pointer"
                >
                  {copiedId === previewModalTemplate.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Texto</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const tpl = previewModalTemplate;
                      setPreviewModalTemplate(null);
                      handleOpenEditModal(tpl);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-md shadow-amber-500/10 transition-all cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Modelo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
  );
}
