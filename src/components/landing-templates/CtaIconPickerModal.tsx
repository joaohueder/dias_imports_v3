"use client";

import React, { useState } from "react";
import { X, Search } from "lucide-react";
import { CTA_ICONS } from "./ctaOptions";

interface CtaIconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIconId?: string;
  onSelectIcon: (iconId: string) => void;
}

export const CtaIconPickerModal: React.FC<CtaIconPickerModalProps> = ({
  isOpen,
  onClose,
  selectedIconId = "arrow-right",
  onSelectIcon,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  if (!isOpen) return null;

  const categories = ["all", "Padrão", "Conversa", "Vendas", "Destaque", "Confiança", "Pagamento", "Logística"];

  const filteredIcons = CTA_ICONS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = activeCategory === "all" || item.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#0c101c] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Escolher Ícone do Botão de Ação (CTA)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Selecione o ícone que acompanhará o texto de compra/chamada no WhatsApp.
            </p>
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
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar ícone (ex: whatsapp, seta, raio, sacola, fogo)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80"
                }`}
              >
                {cat === "all" ? "Todos" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Ícones */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredIcons.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-500">
              Nenhum ícone encontrado para a busca.
            </div>
          ) : (
            filteredIcons.map((item) => {
              const IconComp = item.icon;
              const isSelected = selectedIconId.toLowerCase() === item.id.toLowerCase();

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectIcon(item.id);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all cursor-pointer group relative ${
                    isSelected
                      ? "bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/30 text-white"
                      : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850/80 text-slate-300"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-300 group-hover:bg-indigo-500/20 group-hover:text-indigo-300"
                    }`}
                  >
                    <IconComp className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate leading-tight">{item.name}</p>
                    <span className="text-[10px] text-slate-500 leading-tight block">{item.category}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
