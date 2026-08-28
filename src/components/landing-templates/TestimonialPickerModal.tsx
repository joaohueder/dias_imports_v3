"use client";

import React, { useState } from "react";
import { X, Search, Check, Sparkles, Star, User, Dices, Tag } from "lucide-react";
import {
  HUMANIZED_TESTIMONIALS_POOL,
  TESTIMONIAL_CATEGORIES,
  TestimonialPreset,
} from "./testimonialOptions";

interface TestimonialPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeIds?: string[];
  onToggleActive?: (id: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  title?: string;
}

export const TestimonialPickerModal: React.FC<TestimonialPickerModalProps> = ({
  isOpen,
  onClose,
  activeIds,
  onToggleActive,
  onSelectAll,
  onDeselectAll,
  title = "Biblioteca de Depoimentos Humanizados",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  if (!isOpen) return null;

  // Se activeIds for fornecido (mesmo que seja array vazio []), usamos ele.
  // Caso activeIds seja undefined ou null, assumimos que todos estão ativos por padrão.
  const activeSet = new Set(
    activeIds !== undefined && activeIds !== null
      ? activeIds
      : HUMANIZED_TESTIMONIALS_POOL.map((t) => t.id)
  );

  const filtered = HUMANIZED_TESTIMONIALS_POOL.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "Todos" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#0c101c] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {title}
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {activeSet.size} Ativos de {HUMANIZED_TESTIMONIALS_POOL.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Clique nos depoimentos para ativar ou inativar no sorteio aleatório da página.
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

        {/* Busca e Categorias */}
        <div className="p-4 border-b border-slate-800/80 bg-[#080d18]/70 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome ou relato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              autoFocus
            />
          </div>

          <div className="w-full sm:w-60 shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-slate-900/90 border border-slate-800 text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
            >
              {TESTIMONIAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-slate-200">
                  {cat === "Todos" ? "Todas as Categorias" : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <p>Nenhum depoimento encontrado com os termos pesquisados.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const isActive = activeSet.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleActive && onToggleActive(item.id)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 group relative ${
                    isActive
                      ? "border-amber-500/40 bg-slate-900/90 hover:bg-slate-850"
                      : "border-slate-800/60 bg-slate-950/40 opacity-50 hover:opacity-80"
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                            isActive
                              ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                              : "bg-slate-800 border-slate-700 text-slate-400"
                          }`}
                        >
                          {item.name.charAt(0)}
                        </div>
                        <span
                          className={`text-xs font-bold transition-colors ${
                            isActive ? "text-slate-100 group-hover:text-amber-300" : "text-slate-400 line-through"
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.category && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-750">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(item.stars)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed italic">
                      &quot;{item.comment}&quot;
                    </p>
                  </div>

                  {/* Switch / Checkbox de Ativação */}
                  <div className="shrink-0 pt-1 flex items-center gap-1.5">
                    <div
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        isActive ? "bg-amber-500" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isActive ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#080d18] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-semibold">{activeSet.size} ativos</span>
            <span className="text-slate-600">•</span>
            {onSelectAll && (
              <button
                type="button"
                onClick={onSelectAll}
                className="text-[11px] text-amber-400 hover:underline cursor-pointer"
              >
                Ativar Todos
              </button>
            )}
            <span className="text-slate-600">•</span>
            {onDeselectAll && (
              <button
                type="button"
                onClick={onDeselectAll}
                className="text-[11px] text-slate-400 hover:underline cursor-pointer"
              >
                Inativar Todos
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition-all"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
