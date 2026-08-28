"use client";

import React, { useState } from "react";
import { X, Search, Check, Sparkles, Flame, Tag, ShieldCheck, Zap, Users2 } from "lucide-react";
import {
  HIGH_CONVERSION_BADGES,
  BADGE_CATEGORIES,
  BadgeOption,
} from "./badgeOptions";

interface BadgePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBadgeText?: string;
  onSelectBadge: (badgeText: string) => void;
  title?: string;
}

export const BadgePickerModal: React.FC<BadgePickerModalProps> = ({
  isOpen,
  onClose,
  selectedBadgeText = "",
  onSelectBadge,
  title = "Selecionar Badge / Chamada de Urgência",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  if (!isOpen) return null;

  const filteredBadges = HIGH_CONVERSION_BADGES.filter((item) => {
    const matchesSearch =
      item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = activeCategory === "all" || item.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Urgência & Escassez":
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case "Exclusividade & VIP":
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
      case "Ofertas & Descontos":
        return <Tag className="w-3.5 h-3.5 text-emerald-400" />;
      case "Acesso & Novidades":
        return <Zap className="w-3.5 h-3.5 text-indigo-400" />;
      case "Comunidade & Confiança":
        return <Users2 className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#0c101c] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {title}
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  50 Modelos
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Escolha uma frase de impacto organizada por categoria para destacar o topo da sua página.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories Combo */}
        <div className="p-4 border-b border-slate-800/60 bg-slate-950/40 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search bar */}
          <div className="relative sm:col-span-7">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por chamada, palavra-chave ou tema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Combo de Seleção de Categorias */}
          <div className="relative sm:col-span-5">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer font-medium"
            >
              <option value="all" className="bg-[#0f1422] text-white">
                Todas as Categorias ({HIGH_CONVERSION_BADGES.length})
              </option>
              {BADGE_CATEGORIES.map((category) => {
                const count = HIGH_CONVERSION_BADGES.filter((h) => h.category === category).length;
                return (
                  <option key={category} value={category} className="bg-[#0f1422] text-white">
                    {category} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* List of Badges */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredBadges.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Nenhuma chamada de impacto encontrada para esta busca.
            </div>
          ) : (
            filteredBadges.map((item: BadgeOption) => {
              const isSelected = selectedBadgeText === item.text;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectBadge(item.text);
                    onClose();
                  }}
                  className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50 shadow-sm"
                      : "bg-[#0f1422] border-slate-800/90 hover:border-indigo-500/50 hover:bg-slate-900/90"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800/80 text-slate-400 group-hover:text-indigo-300 group-hover:bg-slate-800"
                      }`}
                    >
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-800">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-semibold text-indigo-400">
                          #{item.tag}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white mt-1 group-hover:text-indigo-200 transition-colors">
                        {item.text}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                        <Check className="w-3.5 h-3.5" />
                        Selecionado
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 text-xs font-semibold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-all"
                      >
                        Usar Modelo
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>{filteredBadges.length} modelos disponíveis</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold border border-slate-800 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
