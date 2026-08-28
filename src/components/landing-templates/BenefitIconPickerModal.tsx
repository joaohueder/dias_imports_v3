"use client";

import React, { useState } from "react";
import { X, Search, Check } from "lucide-react";
import { BENEFIT_ICONS, BenefitIconDef } from "./benefitIcons";

interface BenefitIconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIconId?: string;
  onSelectIcon: (iconId: string) => void;
  title?: string;
}

export const BenefitIconPickerModal: React.FC<BenefitIconPickerModalProps> = ({
  isOpen,
  onClose,
  selectedIconId = "check",
  onSelectIcon,
  title = "Escolher Ícone dos Benefícios",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  if (!isOpen) return null;

  const categories = ["all", "Geral", "Logística", "Confiança", "Atendimento", "Pagamento", "Destaque"];

  const filteredIcons = BENEFIT_ICONS.filter((item) => {
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
              {title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Selecione o ícone que será exibido ao lado de cada item na lista de benefícios.
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
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="relative sm:col-span-7">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar ícone (ex: frete, garantia, pix)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                autoFocus
              />
            </div>

            <div className="relative sm:col-span-5">
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-indigo-300 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-slate-200">
                    {cat === "all" ? "Todos os Grupos / Categorias" : `Grupo: ${cat}`}
                  </option>
                ))}
              </select>
            </div>
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
                        : "bg-slate-800 text-indigo-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-300"
                    }`}
                  >
                    <IconComp className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate leading-tight">
                      {item.name}
                    </p>
                    <span className="text-[10px] text-slate-500 capitalize">
                      {item.category}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-indigo-400 absolute top-2 right-2" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer do Modal */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#080d18] flex items-center justify-between text-xs text-slate-400">
          <span>{filteredIcons.length} ícones disponíveis</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
