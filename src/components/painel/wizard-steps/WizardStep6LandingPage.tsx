"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Link2, CheckCircle2, Loader2, Users } from "lucide-react";

export interface WizardStep6Handle {
  saveAndValidate: () => Promise<boolean>;
}

interface Step6Props {
  onSaved?: () => void;
  onValidityChange?: (isValid: boolean) => void;
}

export const WizardStep6LandingPage = forwardRef<WizardStep6Handle, Step6Props>(function WizardStep6LandingPage(
  { onSaved, onValidityChange },
  ref
) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    id: 0,
    title: "Grupo VIP Exclusivo",
    headline: "Receba ofertas secretas, lançamentos e descontos antes de todo mundo!",
    slug: "vip",
    group_id: "",
    invite_link: "",
    badge_text: "⚡ ACESSO ANTECIPADO & EXCLUSIVO",
    layout_color: "#6366f1",
  });

  const checkValidity = (data: typeof formData) => {
    const isValid = Boolean(data.invite_link.trim() || data.group_id);
    onValidityChange?.(isValid);
    return isValid;
  };

  const saveLandingData = async (): Promise<boolean> => {
    try {
      setSaving(true);
      setSavedSuccess(false);

      const payload = {
        id: formData.id,
        title: formData.title || "Grupo VIP Exclusivo",
        headline: formData.headline || "Receba ofertas secretas, lançamentos e descontos antes de todo mundo!",
        slug: formData.slug || "vip",
        group_id: formData.group_id ? Number(formData.group_id) : null,
        invite_link: formData.invite_link.trim(),
        badge_text: formData.badge_text,
        layout_color: formData.layout_color,
      };

      const res = await fetch("/api/painel/landing-page-grupo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSavedSuccess(true);
        if (onSaved) onSaved();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Erro ao salvar link do grupo:", err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    saveAndValidate: saveLandingData,
  }));

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [resLanding, resGroups] = await Promise.all([
          fetch("/api/painel/landing-page-grupo"),
          fetch("/api/painel/grupos"),
        ]);

        let loadedGroups: any[] = [];
        if (resGroups.ok) {
          const gJson = await resGroups.json();
          if (gJson.success && Array.isArray(gJson.groups)) {
            loadedGroups = gJson.groups;
            setGroups(loadedGroups);
          }
        }

        if (resLanding.ok) {
          const lJson = await resLanding.json();
          if (lJson.success && lJson.landing_page) {
            const lp = lJson.landing_page;
            const updated = {
              id: lp.id || 0,
              title: lp.title || "Grupo VIP Exclusivo",
              headline: lp.headline || "Receba ofertas secretas, lançamentos e descontos antes de todo mundo!",
              slug: lp.slug || "vip",
              group_id: lp.group_id ? String(lp.group_id) : "",
              invite_link: lp.invite_link || "",
              badge_text: lp.badge_text || "⚡ ACESSO ANTECIPADO & EXCLUSIVO",
              layout_color: lp.layout_color || "#6366f1",
            };
            setFormData(updated);
            checkValidity(updated);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados do link de grupo:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleGroupSelect = (groupId: string) => {
    const selectedG = groups.find((g) => String(g.id) === groupId);
    const updated = {
      ...formData,
      group_id: groupId,
      invite_link: selectedG?.invite_link || formData.invite_link,
    };
    setFormData(updated);
    checkValidity(updated);
  };

  const handleLinkChange = (link: string) => {
    const updated = { ...formData, invite_link: link };
    setFormData(updated);
    checkValidity(updated);
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        <span className="text-xs">Carregando dados do grupo...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#0b1222]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Link2 className="w-4 h-4 text-emerald-400" />
            <span>Link do Grupo do WhatsApp</span>
          </div>
          {savedSuccess && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Salvo com sucesso
            </span>
          )}
        </div>

        <div className="space-y-3.5">
          {groups.length > 0 && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                Vincular a um Grupo Sincronizado (Opcional)
              </label>
              <select
                value={formData.group_id}
                onChange={(e) => handleGroupSelect(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Selecione um grupo ou preencha o link direto abaixo</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.participants_count || 0} membros)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">
              Link de Convite do Grupo do WhatsApp <span className="text-rose-400">*</span>
            </label>
            <input
              type="url"
              required
              value={formData.invite_link}
              onChange={(e) => handleLinkChange(e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-400 pt-0.5">
              Cole o link de convite do seu grupo (ex: https://chat.whatsapp.com/ExemploCodigo).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
