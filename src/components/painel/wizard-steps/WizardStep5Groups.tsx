"use client";

import React, { useState, useEffect } from "react";
import { Users2, Plus, RefreshCw, CheckCircle2, Save, Loader2, Link2, ExternalLink } from "lucide-react";

interface Step5Props {
  onSaved?: () => void;
}

export function WizardStep5Groups({ onSaved }: Step5Props) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [newGroup, setNewGroup] = useState({
    name: "",
    whatsapp_group_id: "",
    invite_link: "",
    participants_count: 1,
  });

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/painel/grupos");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.groups)) {
          setGroups(json.groups);
          if (json.groups.length > 0 && onSaved) {
            onSaved();
          }
        }
      }
    } catch (err) {
      console.error("Erro ao carregar grupos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleSyncFromWhatsapp = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/painel/grupos/sync", { method: "POST" });
      if (res.ok) {
        await loadGroups();
        if (onSaved) onSaved();
      }
    } catch (err) {
      console.error("Erro ao sincronizar grupos:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingManual(true);
      const res = await fetch("/api/painel/grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroup.name,
          whatsapp_group_id: newGroup.whatsapp_group_id || `${Date.now()}@g.us`,
          invite_link: newGroup.invite_link,
          participants_count: Number(newGroup.participants_count) || 1,
          status: "active",
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setShowAddForm(false);
        setNewGroup({ name: "", whatsapp_group_id: "", invite_link: "", participants_count: 1 });
        await loadGroups();
        if (onSaved) onSaved();
      }
    } catch (err) {
      console.error("Erro ao cadastrar grupo:", err);
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <div className="bg-[#0b1222]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
          <Users2 className="w-4 h-4 text-emerald-400" />
          <span>Grupos de WhatsApp</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncFromWhatsapp}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>Sincronizar do WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Grupo</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateGroup} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-white">Cadastrar Grupo Manualmente:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Nome do Grupo *</label>
              <input
                type="text"
                required
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder="Ex: VIP Ofertas Secretas"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Link de Convite *</label>
              <input
                type="url"
                required
                value={newGroup.invite_link}
                onChange={(e) => setNewGroup({ ...newGroup, invite_link: e.target.value })}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingManual || !newGroup.name}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm cursor-pointer disabled:opacity-60"
            >
              {savingManual ? "Salvando..." : "Salvar Grupo"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-500 flex justify-center items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Carregando grupos...</span>
          </div>
        ) : groups.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
            Nenhum grupo cadastrado ainda. Sincronize com sua instância ou adicione manualmente acima.
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {groups.map((g) => (
              <div key={g.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                    <Users2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{g.name}</p>
                    <p className="text-[10px] text-slate-500 truncate font-mono">{g.invite_link || g.whatsapp_group_id}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 shrink-0">
                  {g.participants_count} membros
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
