"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize = 10,
  onPageChange,
  className = "",
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems <= pageSize && currentPage === 1) {
    return null;
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-[#0b1222]/80 border-t border-slate-800/80 text-xs text-slate-400 ${className}`}
    >
      <div className="text-slate-400 text-xs flex items-center gap-1.5 whitespace-nowrap">
        <span>Mostrando</span>
        <span className="font-semibold text-white">{startItem}</span>
        <span>a</span>
        <span className="font-semibold text-white">{endItem}</span>
        <span>de</span>
        <span className="font-semibold text-white">{totalItems}</span>
        <span>registros</span>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Primeira Página */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80 hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-sm"
          title="Primeira Página"
          aria-label="Primeira Página"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Página Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80 hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-sm"
          title="Página Anterior"
          aria-label="Página Anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Números de Página */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="w-7 h-8 flex items-center justify-center text-slate-600 font-bold"
                >
                  ...
                </span>
              );
            }

            const pageNumber = page as number;
            const isActive = pageNumber === currentPage;

            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                  isActive
                    ? "bg-indigo-600 text-white font-bold border border-indigo-500 shadow-indigo-600/30"
                    : "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-slate-700"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        {/* Próxima Página */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80 hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-sm"
          title="Próxima Página"
          aria-label="Próxima Página"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Última Página */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80 hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-sm"
          title="Última Página"
          aria-label="Última Página"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
