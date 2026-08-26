"use client";

import React, { useState } from "react";
import { SaPageHeader } from "@/components/sa/SaPageHeader";
import { 
  KeyRound, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  Webhook, 
  Globe, 
  Terminal,
  Activity,
  CheckCircle2
} from "lucide-react";

interface ApiKeyItem {
  id: string;
  name: string;
  keyPreview: string;
  fullKey: string;
  type: "global" | "webhook" | "integration";
  createdAt: string;
  lastUsedAt: string | null;
  status: "active" | "revoked";
}

const INITIAL_KEYS: ApiKeyItem[] = [
  {
    id: "key_global",
    name: "Evolution API Global Key",
    keyPreview: "ev_live_****************9a2f",
    fullKey: "ev_live_7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a2f",
    type: "global",
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    status: "active",
  },
  {
    id: "key_webhook",
    name: "Webhook Ingestion Token",
    keyPreview: "wh_sec_****************84c1",
    fullKey: "wh_sec_99a88b77c66d55e44f33a22b11c00d99e88f77a66b55c44d33e22f11a00b84c1",
    type: "webhook",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: "active",
  },
];

export default function SaApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>(INITIAL_KEYS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((res) => setTimeout(res, 400));
    setIsRefreshing(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <SaPageHeader
        title="Chaves de API & Webhooks"
        subtitle="Gerenciamento central de tokens de integração, Evolution API e webhooks do SaaS"
        icon={KeyRound}
        badge="Autenticação M2M"
        badgeVariant="indigo"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Chaves Ativas</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">2</div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" /> Todas validadas
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Webhooks Globais</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Webhook className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">1 Endpoint</div>
          <span className="text-[11px] text-slate-400 mt-1">Status: Conectado</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Segurança de Acesso</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">HMAC-SHA256</div>
          <span className="text-[11px] text-slate-400 mt-1">Assinatura de requisição ativa</span>
        </div>
      </div>

      {/* Tabela de Chaves */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden backdrop-blur-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white">Chaves Registradas</h4>
            <p className="text-xs text-slate-400 mt-0.5">Tokens utilizados por microsserviços e pela Evolution API</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Nome / Tipo</th>
                <th className="px-5 py-3.5">Chave / Token</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Último Uso</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {keys.map((key) => {
                const isRevealed = Boolean(revealedIds[key.id]);
                const isCopied = copiedId === key.id;

                return (
                  <tr key={key.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{key.name}</div>
                      <span className="text-[10px] uppercase font-mono text-indigo-400">{key.type}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-mono text-slate-300">
                      {isRevealed ? key.fullKey : key.keyPreview}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Ativa
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleTimeString("pt-BR") : "Nunca"}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => toggleReveal(key.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                        title={isRevealed ? "Ocultar Chave" : "Mostrar Chave"}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(key.id, key.fullKey)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                        title="Copiar Chave"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
