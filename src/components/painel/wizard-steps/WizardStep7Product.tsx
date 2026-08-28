"use client";

import React, { useState, useEffect } from "react";
import { Package, Plus, Save, CheckCircle2, Loader2, DollarSign, Image as ImageIcon } from "lucide-react";

interface Step7Props {
  onSaved?: () => void;
}

export function WizardStep7Product({ onSaved }: Step7Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    promo_price: "",
    headline: "Super Oferta com Desconto Exclusivo",
    external_link: "",
    cover_image: "",
    description: "Produto de alta qualidade com garantia e envio rápido.",
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/painel/produtos");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.products)) {
          setProducts(json.products);
          if (json.products.length > 0 && onSaved) {
            onSaved();
          }
        }
      }
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSavedSuccess(false);

      const priceNum = parseFloat(formData.price.replace(",", ".")) || 0;
      const promoNum = formData.promo_price ? parseFloat(formData.promo_price.replace(",", ".")) : null;

      const res = await fetch("/api/painel/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          price: priceNum,
          promo_price: promoNum,
          headline: formData.headline,
          description: formData.description,
          external_link: formData.external_link,
          cover_image: formData.cover_image,
          status: "active",
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setShowForm(false);
        setFormData({
          name: "",
          price: "",
          promo_price: "",
          headline: "Super Oferta com Desconto Exclusivo",
          external_link: "",
          cover_image: "",
          description: "Produto de alta qualidade com garantia e envio rápido.",
        });
        await loadProducts();
        if (onSaved) onSaved();
      }
    } catch (err) {
      console.error("Erro ao cadastrar produto:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#0b1222]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
          <Package className="w-4 h-4 text-emerald-400" />
          <span>Catálogo & Primeiro Produto</span>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Produto</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-white">Cadastrar Produto Rápido:</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-300">Nome do Produto *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Fone de Ouvido Bluetooth Pro"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Preço De (R$) *</label>
              <input
                type="text"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="299,90"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Preço Promocional Por (R$)</label>
              <input
                type="text"
                value={formData.promo_price}
                onChange={(e) => setFormData({ ...formData, promo_price: e.target.value })}
                placeholder="149,90"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-300">Link de Checkout / Compra</label>
              <input
                type="url"
                value={formData.external_link}
                onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                placeholder="https://pay.hotmart.com/... ou https://checkout..."
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-300">URL da Foto de Capa (Opcional)</label>
              <input
                type="url"
                value={formData.cover_image}
                onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !formData.name || !formData.price}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm cursor-pointer disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Cadastrar Produto"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-500 flex justify-center items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Carregando produtos...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
            Nenhum produto cadastrado ainda. Clique no botão acima para adicionar seu primeiro produto com oferta!
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{p.name}</p>
                    <p className="text-[10px] text-emerald-400 font-semibold font-mono">
                      R$ {Number(p.promo_price || p.price).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shrink-0">
                  {p.status === "active" ? "Ativo" : "Rascunho"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
