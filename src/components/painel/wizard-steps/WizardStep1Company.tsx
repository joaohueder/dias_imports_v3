"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Building2, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { maskPhone, maskDocument, unmask } from "@/lib/validators";

export interface WizardStep1Handle {
  saveAndValidate: () => Promise<boolean>;
}

interface Step1Props {
  onSaved?: () => void;
  onValidityChange?: (isValid: boolean) => void;
}

export const WizardStep1Company = forwardRef<WizardStep1Handle, Step1Props>(function WizardStep1Company(
  { onSaved, onValidityChange },
  ref
) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [checkingWhatsapp, setCheckingWhatsapp] = useState(false);
  const [whatsappConflict, setWhatsappConflict] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    trade_name: "",
    document: "",
    email: "",
    whatsapp: "",
    admin_whatsapp: "",
  });

  const checkValidity = (data: typeof formData, conflict: string | null) => {
    const rawDoc = unmask(data.document);
    const rawWhatsapp = unmask(data.whatsapp);
    const rawAdminWhatsapp = unmask(data.admin_whatsapp);
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim());

    const isComplete =
      Boolean(data.name.trim()) &&
      Boolean(data.trade_name.trim()) &&
      rawDoc.length >= 11 &&
      emailValid &&
      rawWhatsapp.length >= 10 &&
      rawAdminWhatsapp.length >= 10 &&
      !conflict;

    onValidityChange?.(isComplete);
    return isComplete;
  };

  const saveCompanyData = async (): Promise<boolean> => {
    if (!checkValidity(formData, whatsappConflict)) return false;

    try {
      setSaving(true);
      setSavedSuccess(false);
      const res = await fetch("/api/painel/empresa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          trade_name: formData.trade_name.trim(),
          document: unmask(formData.document),
          email: formData.email.trim(),
          whatsapp: unmask(formData.whatsapp),
          admin_whatsapp: unmask(formData.admin_whatsapp),
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        if (onSaved) onSaved();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Erro ao salvar dados da empresa:", err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    saveAndValidate: saveCompanyData,
  }));

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/painel/empresa");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.company) {
            const loaded = {
              name: json.company.name || "",
              trade_name: json.company.trade_name || "",
              document: json.company.document ? maskDocument(json.company.document) : "",
              email: json.company.email || "",
              whatsapp: json.company.whatsapp ? maskPhone(json.company.whatsapp) : (json.company.phone ? maskPhone(json.company.phone) : ""),
              admin_whatsapp: json.company.admin_whatsapp ? maskPhone(json.company.admin_whatsapp) : "",
            };
            setFormData(loaded);
            checkValidity(loaded, null);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados da empresa:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAdminWhatsappBlur = async () => {
    const raw = unmask(formData.admin_whatsapp);
    if (raw.length < 10) {
      setWhatsappConflict(null);
      checkValidity(formData, null);
      return;
    }

    try {
      setCheckingWhatsapp(true);
      const res = await fetch(`/api/painel/empresa/check-admin-whatsapp?phone=${encodeURIComponent(raw)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.available === false) {
          const msg = json.message || "Número já vinculado a outra empresa.";
          setWhatsappConflict(msg);
          checkValidity(formData, msg);
        } else {
          setWhatsappConflict(null);
          checkValidity(formData, null);
        }
      }
    } catch {
      setWhatsappConflict(null);
      checkValidity(formData, null);
    } finally {
      setCheckingWhatsapp(false);
    }
  };

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    if (field === "admin_whatsapp") {
      setWhatsappConflict(null);
    }
    checkValidity(updated, field === "admin_whatsapp" ? null : whatsappConflict);
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        <span className="text-xs">Carregando dados da empresa...</span>
      </div>
    );
  }

  const isValid = checkValidity(formData, whatsappConflict);

  return (
    <div className="space-y-4">
      <div className="bg-[#0b1222]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Identificação e Contato da Empresa</span>
          </div>
          {savedSuccess && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Salvo com sucesso
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">
              Razão Social / Nome da Empresa <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder="Ex: Minha Loja Digital LTDA"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">
              Nome Fantasia / Marca <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.trade_name}
              onChange={(e) => handleFieldChange("trade_name", e.target.value)}
              placeholder="Ex: Minha Loja"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">
              CNPJ ou CPF <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.document}
              onChange={(e) => handleFieldChange("document", maskDocument(e.target.value))}
              placeholder="00.000.000/0000-00"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">
              E-mail Corporativo <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              placeholder="contato@minhaloja.com"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">
              WhatsApp da Empresa <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.whatsapp}
              onChange={(e) => handleFieldChange("whatsapp", maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300">
                WhatsApp de Login / Administrador <span className="text-rose-400">*</span>
              </label>
              {checkingWhatsapp && (
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Verificando...
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={formData.admin_whatsapp}
              onBlur={handleAdminWhatsappBlur}
              onChange={(e) => handleFieldChange("admin_whatsapp", maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              className={`w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 ${
                whatsappConflict
                  ? "border-rose-500 focus:ring-rose-500 focus:border-rose-500"
                  : "border-slate-800 focus:ring-emerald-500 focus:border-emerald-500"
              }`}
            />
            {whatsappConflict && (
              <p className="text-[10px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {whatsappConflict}
              </p>
            )}
          </div>
        </div>

        {!isValid && (
          <div className="pt-2">
            <p className="text-[11px] text-amber-400/90 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Preencha todos os campos obrigatórios (*) para avançar ao próximo passo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
