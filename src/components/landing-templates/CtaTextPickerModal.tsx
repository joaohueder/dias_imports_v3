"use client";

import React, { useState } from "react";
import { X, Search, Check, Sparkles, Flame, Tag, Gift, Zap, MessageCircle } from "lucide-react";
import {
  HIGH_CONVERSION_CTAS,
  CTA_CATEGORIES,
  CtaTextOption,
} from "./ctaTextOptions";

interface CtaTextPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCtaText?: string;
  onSelectCta: (ctaText: string) => void;
  title?: string;
}

export const CtaTextPickerModal: React.FC<CtaTextPickerModalProps> = ({
  isOpen,
  onClose,
  selectedCtaText = "",
  onSelectCta,
  title = "Modelos de Botão de Ação (CTA)",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  if (!isOpen) return null;

  const filteredCtas = HIGH_CONVERSION_CTAS.filter((item) => {
    const matchesSearch =
      item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = activeCategory === "all" || item.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    if (category.includes("Exclusividade")) return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    if (category.includes("Rapidez")) return <Zap className="w-3.5 h-3.5 text-indigo-400" />;
    if (category.includes("Grátis")) return <Gift className="w-3.5 h-3.5 text-emerald-400" />;
    if (category.includes("Ofertas")) return <Flame className="w-3.5 h-3.5 text-rose-400" />;
    if (category.includes("WhatsApp")) return <MessageCircle className="w-3.5 h-3.5 text-teal-400" />;
    return <Sparkles className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#0c101c] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {title}
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  50 Modelos
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Escolha um texto de alta conversão para o botão de entrada no seu grupo VIP.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Busca e Filtros */}
        <div className="p-4 border-b border-slate-800/80 space-y-3 bg-[#080d18]/70">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* Campo de Busca */}
            <div className="relative sm:col-span-7">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por chamada (ex: vip, grátis, agora, ofertas)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                autoFocus
              />
            </div>

            {/* Combo Seletor de Categorias */}
            <div className="relative sm:col-span-5">
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-emerald-300 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
              >
                {CTA_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-slate-200">
                    {cat === "all" ? "Todos os Grupos / Modelos (50)" : `Grupo: ${cat}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Modelos */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredCtas.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <p>Nenhum botão encontrado com os termos pesquisados.</p>
            </div>
          ) : (
            filteredCtas.map((item) => {
              const isSelected = selectedCtaText.trim() === item.text.trim();

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectCta(item.text);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group relative ${
                    isSelected
                      ? "bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/40 text-white"
                      : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850/80 text-slate-200"
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/60 text-slate-300 flex items-center gap-1">
                        {getCategoryIcon(item.category)}
                        <span>{item.category}</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white">
                      {item.text}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center pl-2">
                    {isSelected ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center font-bold shadow-sm">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 group-hover:text-emerald-300 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10 flex items-center justify-center transition-colors">
                        <Check className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#080d18] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>{filteredCtas.length} modelos exibidos</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
