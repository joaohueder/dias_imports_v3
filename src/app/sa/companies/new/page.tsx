"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  Check,
  RefreshCw,
  MapPin,
  Mail,
  Smartphone,
  ShieldCheck,
  FileText,
  Copy,
  Search,
  AlertCircle,
  X,
  CreditCard,
  CheckCircle2,
  Clock,
  Plus,
  History,
  Sparkles,
  Users,
  Package,
  MessageSquare,
  Ban,
  Pencil,
  Save,
  Server,
  Radio,
  Power,
  RotateCw,
  QrCode,
  Key,
  Globe,
  Trash2,
  Edit2,
  XCircle,
  ExternalLink,
  Send,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useFeedbackModal } from "@/components/ui/FeedbackModal";
import {
  maskCpfCnpj,
  maskPhone,
  maskZipcode,
  validateEmail,
  validateCpfCnpj,
} from "@/lib/validators";
import { FloatingActionBar } from "@/components/ui/FloatingActionBar";
import { useSaAuth } from "@/context/SaAuthContext";

interface Subscription {
  id: number;
  plan_name: string;
  plan_snapshot_name?: string;
  max_groups: number;
  max_products: number;
  max_messages_day: number;
  max_views?: number;
  max_leads?: number;
  max_instances: number;
  billing_cycle: string;
  price_at_subscription: number | string;
  status: "active" | "past_due" | "canceled" | "expired";
  current_period_start: string;
  current_period_end: string;
  payment_method: string;
  created_at: string;
}

interface PlanOption {
  id: number;
  name: string;
  price: number | string;
  max_groups: number;
  max_products: number;
  max_messages_day: number;
  max_views?: number;
  max_leads?: number;
  billing_cycle: string;
}

interface Instance {
  id: number;
  company_id: number;
  company_name: string;
  name: string;
  whatsapp_number: string | null;
  server_url: string | null;
  instance_key: string;
  status: "connected" | "connecting" | "disconnected" | "banned" | "qrcode";
  phone_connected: string | null;
  profile_name: string | null;
  profile_picture_url: string | null;
  battery_level: number | null;
  is_charging: boolean | null;
  total_messages_sent: number;
  total_messages_received: number;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

// Mapeamento visual e amigável em português dos status de assinatura
const SUBSCRIPTION_STATUS_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
  active: { label: "Ativo", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  past_due: { label: "Atrasado", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  canceled: { label: "Cancelado", bg: "bg-slate-800", text: "text-slate-400", border: "border-slate-700" },
  expired: { label: "Expirado", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
};

function CompanyFormContent({ companyIdProp }: { companyIdProp?: string }) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useFeedbackModal();
  const companyId = companyIdProp || (params?.id as string | undefined);
  const isEditing = Boolean(companyId && companyId !== "new");

  const [isLoadingData, setIsLoadingData] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    trade_name: "",
    document: "",
    email: "",
    whatsapp: "",
    admin_whatsapp: "",
    address_zipcode: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
  });

  // Assinaturas e Planos
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [availablePlans, setAvailablePlans] = useState<PlanOption[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [isAssigningPlan, setIsAssigningPlan] = useState(false);
  const [isExpiringPlan, setIsExpiringPlan] = useState(false);
  const [expireModalOpen, setExpireModalOpen] = useState(false);
  const [subToExpireId, setSubToExpireId] = useState<number | null>(null);

  // Edição Manual de Limites da Assinatura
  const [editingLimitType, setEditingLimitType] = useState<"groups" | "products" | "messages" | null>(null);
  const [limitInputValue, setLimitInputValue] = useState<string>("");
  const [isSavingLimit, setIsSavingLimit] = useState(false);

  // Instâncias WhatsApp da Empresa
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);

  // Modais de Instância (Criar / Editar / Deletar / Ação / QRCode)
  const [instanceModalOpen, setInstanceModalOpen] = useState(false);
  const [instanceModalMode, setInstanceModalMode] = useState<"create" | "edit">("create");
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [instanceFormData, setInstanceFormData] = useState({
    name: "",
    whatsapp_number: "",
    server_url: "http://localhost:8084",
    api_key: "",
  });
  const [isSubmittingInstance, setIsSubmittingInstance] = useState(false);

  const [deleteInstanceModalOpen, setDeleteInstanceModalOpen] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState<Instance | null>(null);
  const [isDeletingInstance, setIsDeletingInstance] = useState(false);

  // Modal de Confirmação para Reiniciar Instância
  const [restartInstanceModalOpen, setRestartInstanceModalOpen] = useState(false);
  const [instanceToRestart, setInstanceToRestart] = useState<Instance | null>(null);
  const [isRestartingInstance, setIsRestartingInstance] = useState(false);

  // Modal de Confirmação para Desconectar Instância
  const [disconnectInstanceModalOpen, setDisconnectInstanceModalOpen] = useState(false);
  const [instanceToDisconnect, setInstanceToDisconnect] = useState<Instance | null>(null);
  const [isDisconnectingInstance, setIsDisconnectingInstance] = useState(false);

  // Modal de QR Code para Conectar WhatsApp
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrInstance, setQrInstance] = useState<Instance | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number>(30);
  const [loadingQr, setLoadingQr] = useState<boolean>(false);

  // Modal de Envio de Mensagem de Teste
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testInstance, setTestInstance] = useState<Instance | null>(null);
  const [testNumber, setTestNumber] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Controle de Abas (suporte a query param ?tab=subscription | ?tab=instances)
  const getInitialTab = () => {
    const t = searchParams?.get("tab");
    if (t === "subscription") return "subscription";
    if (t === "instances" || t === "instance") return "instances";
    return "company";
  };
  const [activeTab, setActiveTab] = useState<"company" | "subscription" | "instances">(getInitialTab());
  const { can, user: authUser } = useSaAuth();

  // Atualizar aba ativa se a URL mudar (por exemplo navegação direta com query param)
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam === "subscription" && isEditing) {
      setActiveTab("subscription");
    } else if ((tabParam === "instances" || tabParam === "instance") && isEditing) {
      setActiveTab("instances");
    } else if (tabParam === "company") {
      setActiveTab("company");
    }
  }, [searchParams, isEditing]);

  // Estado inicial carregado (para comparação de alterações)
  const [initialData, setInitialData] = useState({
    name: "",
    trade_name: "",
    document: "",
    email: "",
    whatsapp: "",
    admin_whatsapp: "",
    address_zipcode: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
  });

  // Carregar dados da empresa se for edição
  useEffect(() => {
    if (!isEditing || !companyId) return;

    async function loadCompany() {
      try {
        setIsLoadingData(true);
        const res = await fetch(`/api/sa/companies/${companyId}`);
        const result = await res.json();

        if (result.success && result.company) {
          const c = result.company;
          const loaded = {
            name: c.name || "",
            trade_name: c.trade_name || "",
            document: c.document ? maskCpfCnpj(c.document) : "",
            email: c.email || "",
            whatsapp: c.whatsapp ? maskPhone(c.whatsapp) : "",
            admin_whatsapp: c.admin_whatsapp ? maskPhone(c.admin_whatsapp) : "",
            address_zipcode: c.address_zipcode ? maskZipcode(c.address_zipcode) : "",
            address_street: c.address_street || "",
            address_number: c.address_number || "",
            address_complement: c.address_complement || "",
            address_neighborhood: c.address_neighborhood || "",
            address_city: c.address_city || "",
            address_state: c.address_state || "",
          };
          setFormData(loaded);
          setInitialData(loaded);
        } else {
          showError("Empresa não encontrada no sistema.", "Não Encontrado");
          router.push("/sa/companies");
        }
      } catch {
        showError("Erro ao carregar dados da empresa.", "Erro de Conexão");
      } finally {
        setIsLoadingData(false);
      }
    }

    async function loadSubscriptions() {
      if (!can("subscriptions", "view") && !can("plans", "view")) return;
      try {
        setLoadingSubscriptions(true);
        const fetches: Promise<any>[] = [];
        if (can("subscriptions", "view")) {
          fetches.push(fetch(`/api/sa/subscriptions?company_id=${companyId}`).then(r => r.ok ? r.json() : null));
        } else {
          fetches.push(Promise.resolve(null));
        }

        if (can("plans", "view")) {
          fetches.push(fetch("/api/sa/plans?status=active").then(r => r.ok ? r.json() : null));
        } else {
          fetches.push(Promise.resolve(null));
        }

        const [subData, planData] = await Promise.all(fetches);

        if (subData && subData.success) {
          setSubscriptions(subData.subscriptions || []);
        }
        if (planData && planData.success) {
          setAvailablePlans(planData.plans || []);
          if (planData.plans?.length > 0) {
            setSelectedPlanId(String(planData.plans[0].id));
          }
        }
      } catch {
        console.error("Erro ao buscar histórico de assinaturas da empresa.");
      } finally {
        setLoadingSubscriptions(false);
      }
    }

    async function loadInstances() {
      if (!can("instances", "view")) return;
      try {
        setLoadingInstances(true);
        const res = await fetch(`/api/sa/instances?company_id=${companyId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          setInstances(data.instances || []);
        }
      } catch {
        console.error("Erro ao buscar instâncias da empresa.");
      } finally {
        setLoadingInstances(false);
      }
    }

    loadCompany();
    loadSubscriptions();
    loadInstances();
  }, [companyId, isEditing, router, authUser?.id]);

  // Validation Errors on Blur
  const [errors, setErrors] = useState<{
    document?: string;
    email?: string;
    admin_whatsapp?: string;
  }>({});

  // Detecta se existem alterações reais em relação ao estado inicial
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  // Copiar Razão Social para Nome Fantasia
  const handleCopyNameToTradeName = () => {
    if (!formData.name.trim()) {
      showError("Preencha a Razão Social primeiro antes de copiar.", "Campo Vazio");
      return;
    }
    setFormData((prev) => ({ ...prev, trade_name: prev.name }));
    toast.success("Razão Social copiada para Nome Fantasia!");
  };

  // Handlers com Máscara
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCpfCnpj(e.target.value);
    setFormData((prev) => ({ ...prev, document: masked }));
    if (errors.document) setErrors((prev) => ({ ...prev, document: undefined }));
  };

  const handleDocumentBlur = () => {
    if (!formData.document.trim()) return;
    if (!validateCpfCnpj(formData.document)) {
      setErrors((prev) => ({ ...prev, document: "CPF ou CNPJ inválido." }));
      showError("O CPF ou CNPJ digitado é inválido. Verifique os dígitos informados.", "Documento Inválido");
    } else {
      setErrors((prev) => ({ ...prev, document: undefined }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, email: e.target.value }));
    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
  };

  const handleEmailBlur = () => {
    if (!formData.email.trim()) return;
    if (!validateEmail(formData.email)) {
      setErrors((prev) => ({ ...prev, email: "Formato de e-mail inválido." }));
      showError("O e-mail digitado possui formato inválido.", "E-mail Inválido");
    } else {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value);
    setFormData((prev) => ({ ...prev, whatsapp: masked }));
  };

  const handleAdminWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value);
    setFormData((prev) => ({ ...prev, admin_whatsapp: masked }));
    if (errors.admin_whatsapp) setErrors((prev) => ({ ...prev, admin_whatsapp: undefined }));
  };

  const [isCheckingAdminWa, setIsCheckingAdminWa] = useState(false);

  const handleAdminWhatsappBlur = async () => {
    if (!formData.admin_whatsapp.trim()) {
      setErrors((prev) => ({ ...prev, admin_whatsapp: "WhatsApp de Acesso Admin é obrigatório." }));
      return;
    }
    const clean = formData.admin_whatsapp.replace(/\D/g, "");
    if (clean.length < 10 || clean.length > 11) {
      setErrors((prev) => ({ ...prev, admin_whatsapp: "Informe um número com DDD (10 ou 11 dígitos)." }));
      return;
    }

    try {
      setIsCheckingAdminWa(true);
      const res = await fetch(
        `/api/sa/companies/check-admin-whatsapp?phone=${encodeURIComponent(clean)}&exclude_id=${isEditing ? companyId : "new"}`
      );
      const data = await res.json();
      if (!data.available) {
        setErrors((prev) => ({
          ...prev,
          admin_whatsapp: data.message || "Este WhatsApp já está vinculado a outra empresa.",
        }));
      } else {
        setErrors((prev) => ({ ...prev, admin_whatsapp: undefined }));
      }
    } catch {
      console.error("Erro ao verificar disponibilidade do WhatsApp Admin");
    } finally {
      setIsCheckingAdminWa(false);
    }
  };

  const handleZipcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskZipcode(e.target.value);
    setFormData((prev) => ({ ...prev, address_zipcode: masked }));
  };

  // Busca automática por CEP
  const handleSearchCep = async (zipcodeToSearch?: string) => {
    const cepDigits = (zipcodeToSearch || formData.address_zipcode).replace(/\D/g, "");
    if (cepDigits.length !== 8) {
      showError("Digite um CEP completo contendo exatamente 8 dígitos.", "CEP Incompleto");
      return;
    }

    try {
      setIsLoadingCep(true);
      const res = await fetch(`/api/sa/cep?cep=${cepDigits}`);
      const result = await res.json();

      if (result.success && result.data) {
        const { street, complement, neighborhood, city, state } = result.data;
        setFormData((prev) => ({
          ...prev,
          address_street: street || prev.address_street,
          address_complement: complement || prev.address_complement,
          address_neighborhood: neighborhood || prev.address_neighborhood,
          address_city: city || prev.address_city,
          address_state: state || prev.address_state,
        }));
        toast.success("Endereço localizado com sucesso!");
      } else {
        showError(result.error || "CEP não encontrado.", "Consulta de CEP");
      }
    } catch {
      showError("Erro ao consultar serviço de CEP.", "Falha de Conexão");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleZipcodeBlur = () => {
    const clean = formData.address_zipcode.replace(/\D/g, "");
    if (clean.length === 8) {
      handleSearchCep(clean);
    }
  };

  // Contratação / Troca de Plano da Empresa
  const handleAssignPlan = async () => {
    if (!selectedPlanId || !companyId) return;

    try {
      setIsAssigningPlan(true);
      const res = await fetch("/api/sa/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: Number(companyId),
          plan_id: Number(selectedPlanId),
          status: "active",
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          activeSubscription
            ? "Plano alterado com sucesso! O plano anterior foi finalizado."
            : "Plano vinculado com sucesso!"
        );
        setAssignModalOpen(false);
        // Recarregar histórico
        const subRes = await fetch(`/api/sa/subscriptions?company_id=${companyId}`);
        const subData = await subRes.json();
        if (subData.success) {
          setSubscriptions(subData.subscriptions || []);
        }
      } else {
        showError(data.error || "Erro ao atribuir plano à empresa.", "Falha ao Atribuir Plano");
      }
    } catch {
      showError("Erro de conexão ao atribuir plano.", "Erro de Conexão");
    } finally {
      setIsAssigningPlan(false);
    }
  };

  // Expirar Assinatura Vigente
  const handleConfirmExpireSubscription = async () => {
    if (!subToExpireId) return;

    try {
      setIsExpiringPlan(true);
      const res = await fetch(`/api/sa/subscriptions/${subToExpireId}/expire`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        showSuccess("Assinatura expirada com sucesso!", "Assinatura Finalizada");
        setExpireModalOpen(false);
        setSubToExpireId(null);
        // Recarregar histórico
        const subRes = await fetch(`/api/sa/subscriptions?company_id=${companyId}`);
        const subData = await subRes.json();
        if (subData.success) {
          setSubscriptions(subData.subscriptions || []);
        }
      } else {
        showError(data.error || "Erro ao expirar assinatura.", "Falha na Operação");
      }
    } catch {
      showError("Erro de conexão ao expirar assinatura.", "Erro de Conexão");
    } finally {
      setIsExpiringPlan(false);
    }
  };

  // Abrir edição de limite manual
  const handleStartEditLimit = (type: "groups" | "products" | "messages", currentValue: number) => {
    setEditingLimitType(type);
    setLimitInputValue(String(currentValue));
  };

  // Cancelar edição de limite
  const handleCancelEditLimit = () => {
    setEditingLimitType(null);
    setLimitInputValue("");
  };

  // Salvar alteração de limite
  const handleSaveLimit = async () => {
    if (!activeSubscription || !editingLimitType) return;
    const numVal = parseInt(limitInputValue, 10);
    if (isNaN(numVal) || numVal < 0) {
      showError("Informe um valor numérico válido (0 ou maior).", "Valor Inválido");
      return;
    }

    try {
      setIsSavingLimit(true);
      const payload: Record<string, number> = {};
      if (editingLimitType === "groups") payload.max_groups = numVal;
      if (editingLimitType === "products") payload.max_products = numVal;
      if (editingLimitType === "messages") payload.max_messages_day = numVal;
      if (editingLimitType === "views") payload.max_views = numVal;
      if (editingLimitType === "leads") payload.max_leads = numVal;

      const res = await fetch(`/api/sa/subscriptions/${activeSubscription.id}/limits`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Limite atualizado com sucesso!");
        setEditingLimitType(null);
        setLimitInputValue("");
        // Recarregar assinaturas
        const subRes = await fetch(`/api/sa/subscriptions?company_id=${companyId}`);
        const subData = await subRes.json();
        if (subData.success) {
          setSubscriptions(subData.subscriptions || []);
        }
      } else {
        showError(data.error || "Erro ao atualizar limite.", "Falha ao Atualizar");
      }
    } catch {
      showError("Erro de conexão ao atualizar limite.", "Erro de Conexão");
    } finally {
      setIsSavingLimit(false);
    }
  };

  // Funções de Gestão de Instâncias na aba "Instância"
  const refreshCompanyInstances = async () => {
    if (!companyId || !can("instances", "view")) return;
    try {
      setLoadingInstances(true);
      const res = await fetch(`/api/sa/instances?company_id=${companyId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setInstances(data.instances || []);
      }
    } catch {
      showError("Erro ao recarregar instâncias da empresa.", "Erro de Conexão");
    } finally {
      setLoadingInstances(false);
    }
  };

  const handleOpenCreateInstance = () => {
    if (instances.length >= 1) {
      showError("Esta empresa já possui uma instância cadastrada. Limite máximo de 1 instância atingido.", "Limite Atingido");
      return;
    }
    setInstanceModalMode("create");
    setSelectedInstance(null);
    
    // Gerar nome amigável automático: Nome da Empresa + código randômico (ex: DIAS-IMPORTS-A7F2)
    const baseName = (formData.trade_name || formData.name || "EMPRESA")
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 20)
      .replace(/-$/, "");
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const autoInstanceName = `${baseName || "INSTANCIA"}-${randomCode}`;

    setInstanceFormData({
      name: autoInstanceName,
      whatsapp_number: "",
      server_url: "http://localhost:8084",
      api_key: "",
    });
    setInstanceModalOpen(true);
  };

  const handleOpenEditInstance = (instance: Instance) => {
    setInstanceModalMode("edit");
    setSelectedInstance(instance);
    setInstanceFormData({
      name: instance.name,
      whatsapp_number: instance.whatsapp_number || "",
      server_url: instance.server_url || "",
      api_key: "",
    });
    setInstanceModalOpen(true);
  };

  const handleSaveInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceFormData.name.trim()) {
      showError("O nome da instância é obrigatório.", "Validação");
      return;
    }

    try {
      setIsSubmittingInstance(true);
      const endpoint = instanceModalMode === "create" ? "/api/sa/instances" : `/api/sa/instances/${selectedInstance?.id}`;
      const method = instanceModalMode === "create" ? "POST" : "PUT";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...instanceFormData,
          company_id: Number(companyId),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInstanceModalOpen(false);
        showSuccess(
          instanceModalMode === "create" ? "Instância Criada" : "Instância Atualizada",
          data.message || "Instância salva com sucesso!"
        );
        refreshCompanyInstances();
      } else {
        showError(data.error || "Não foi possível salvar a instância.", "Aviso");
      }
    } catch {
      showError("Erro de conexão ao salvar instância.", "Erro");
    } finally {
      setIsSubmittingInstance(false);
    }
  };

  const handleDeleteInstance = async () => {
    if (!instanceToDelete) return;
    try {
      setIsDeletingInstance(true);
      const res = await fetch(`/api/sa/instances/${instanceToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setDeleteInstanceModalOpen(false);
        setInstanceToDelete(null);
        showSuccess("Instância Removida", data.message || "A instância foi excluída com sucesso.");
        refreshCompanyInstances();
      } else {
        showError(data.error || "Não foi possível excluir a instância.", "Aviso");
      }
    } catch {
      showError("Erro ao comunicar com o servidor para excluir.", "Erro");
    } finally {
      setIsDeletingInstance(false);
    }
  };

  const handleInstanceAction = async (instance: Instance, action: "connect" | "disconnect" | "restart") => {
    try {
      if (action === "restart") {
        setIsRestartingInstance(true);
      }
      if (action === "disconnect") {
        setIsDisconnectingInstance(true);
      }
      const res = await fetch(`/api/sa/instances/${instance.id}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("Ação Executada", data.message);
        if (action === "restart") {
          setRestartInstanceModalOpen(false);
          setInstanceToRestart(null);
        }
        if (action === "disconnect") {
          setDisconnectInstanceModalOpen(false);
          setInstanceToDisconnect(null);
        }
        refreshCompanyInstances();
      } else {
        showError(data.error || "Não foi possível executar a ação.", "Falha na Ação");
      }
    } catch {
      showError("Erro ao enviar comando para a instância.", "Erro");
    } finally {
      if (action === "restart") {
        setIsRestartingInstance(false);
      }
      if (action === "disconnect") {
        setIsDisconnectingInstance(false);
      }
    }
  };

  // Buscar novo QRCode (reiniciando ciclo e atualizando a cada 30 segundos)
  const fetchQrCode = useCallback(async (inst: Instance, isInitial: boolean = false) => {
    try {
      setLoadingQr(true);
      if (isInitial) {
        // Ao abrir o modal, reinicia a instância na Evolution API
        await fetch(`/api/sa/instances/${inst.id}/action`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "restart" }),
        });
      }

      const res = await fetch(`/api/sa/instances/${inst.id}/qrcode?restart=${isInitial ? "true" : "false"}`);
      const data = await res.json();

      if (data.success) {
        if (data.connected) {
          setQrModalOpen(false);
          showSuccess("WhatsApp Conectado", "A instância foi autenticada com sucesso!");
          refreshCompanyInstances();
          return;
        }
        setQrCodeData(data.qrcode_base64);
        setQrSecondsLeft(30);
      } else {
        showError(data.error || "Não foi possível gerar o QR Code.", "Erro no QR Code");
      }
    } catch {
      showError("Erro de comunicação ao carregar QR Code.", "Erro");
    } finally {
      setLoadingQr(false);
    }
  }, [showSuccess, showError, refreshCompanyInstances]);

  // Abrir Modal de Envio de Teste
  const handleOpenTestModal = (inst: Instance) => {
    setTestInstance(inst);
    setTestNumber("");
    setTestMessage("Olá! Esta é uma mensagem de teste enviada pela instância do WhatsApp no JH7 Marketing.");
    setTestModalOpen(true);
  };

  // Executar disparo da mensagem de teste
  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInstance) return;

    const rawNum = testNumber.replace(/\D/g, "");
    if (!rawNum || rawNum.length < 10) {
      showError("Por favor, informe um número de WhatsApp válido com DDD.", "Número Inválido");
      return;
    }

    try {
      setIsSendingTest(true);
      const res = await fetch(`/api/sa/instances/${testInstance.id}/send-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: rawNum,
          message: testMessage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestModalOpen(false);
        showSuccess("Mensagem Enviada", "A mensagem de teste foi enviada com sucesso para o WhatsApp informado!");
        refreshCompanyInstances();
      } else {
        showError(data.error || "Não foi possível enviar a mensagem de teste.", "Erro no Envio");
      }
    } catch {
      showError("Erro de comunicação ao tentar enviar o teste.", "Erro");
    } finally {
      setIsSendingTest(false);
    }
  };

  // Abrir Modal de QR Code
  const handleOpenQrModal = (inst: Instance) => {
    setQrInstance(inst);
    setQrCodeData(null);
    setQrSecondsLeft(30);
    setQrModalOpen(true);
    fetchQrCode(inst, true);
  };

  // Timer de 30 segundos para renovação do QR Code e polling rápido de status de conexão
  useEffect(() => {
    if (!qrModalOpen || !qrInstance) return;

    // 1. Contador regressivo de 30 segundos para renovar o QR Code
    const timer = setInterval(() => {
      setQrSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchQrCode(qrInstance, false);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    // 2. Polling a cada 3 segundos para detectar instantaneamente a leitura do QR Code e conexão
    const pollConnection = setInterval(async () => {
      try {
        const res = await fetch(`/api/sa/instances/${qrInstance.id}/status`);
        const data = await res.json();
        if (data.success && data.connected) {
          setQrModalOpen(false);
          showSuccess("WhatsApp Conectado", "A instância foi autenticada com sucesso no WhatsApp!");
          refreshCompanyInstances();
        }
      } catch (err) {
        console.warn("Polling de conexão da instância:", err);
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(pollConnection);
    };
  }, [qrModalOpen, qrInstance, fetchQrCode, showSuccess, refreshCompanyInstances]);

  // Polling em tempo real para sincronização contínua do card da instância
  useEffect(() => {
    if (!companyId || activeTab !== "instances" || !can("instances", "view")) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sa/instances?company_id=${companyId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.instances) {
          setInstances(data.instances);
        }
      } catch (err) {
        console.warn("Polling de instâncias em tempo real:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [companyId, activeTab, authUser?.id]);

  // Separação de Assinatura Ativa vs Histórico/Vencidas
  // Apenas assinaturas ativas são consideradas vigentes
  const activeSubscription = subscriptions.find(
    (s) => s.status === "active"
  );
  const pastSubscriptions = subscriptions.filter(
    (s) => s.id !== activeSubscription?.id && s.status !== "active"
  );

  // Validação geral do formulário para desabilitar o botão salvar
  const isFormInvalid = useMemo(() => {
    // Campos obrigatórios vazios
    if (!formData.name.trim()) return true;
    if (!formData.admin_whatsapp.trim()) return true;

    // Erros já identificados
    if (errors.admin_whatsapp || errors.document || errors.email) return true;

    // Validação de formato
    const cleanAdmin = formData.admin_whatsapp.replace(/\D/g, "");
    if (cleanAdmin.length < 10 || cleanAdmin.length > 11) return true;

    if (formData.document && !validateCpfCnpj(formData.document)) return true;
    if (formData.email && !validateEmail(formData.email)) return true;

    if (isCheckingAdminWa) return true;

    return false;
  }, [formData, errors, isCheckingAdminWa]);

  // Submissão do Formulário (POST para criar ou PUT para editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError("A Razão Social / Nome da Empresa é obrigatório.", "Campo Obrigatório");
      return;
    }

    if (!formData.admin_whatsapp.trim()) {
      showError("O WhatsApp de Acesso Admin é obrigatório.", "Campo Obrigatório");
      return;
    }

    const cleanAdmin = formData.admin_whatsapp.replace(/\D/g, "");
    if (cleanAdmin.length < 10 || cleanAdmin.length > 11) {
      showError("O WhatsApp de Acesso Admin deve ter DDD e número válido.", "Telefone Inválido");
      return;
    }

    if (formData.document && !validateCpfCnpj(formData.document)) {
      showError("Corrija o CPF ou CNPJ antes de salvar.", "Documento Inválido");
      return;
    }

    if (formData.email && !validateEmail(formData.email)) {
      showError("Corrija o e-mail antes de salvar.", "E-mail Inválido");
      return;
    }

    try {
      setIsSubmitting(true);
      const endpoint = isEditing ? `/api/sa/companies/${companyId}` : "/api/sa/companies";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        showSuccess(
          isEditing ? "Empresa atualizada com sucesso!" : "Empresa cadastrada com sucesso!",
          "Salvo com Sucesso"
        );
        router.push("/sa/companies");
      } else {
        showError(data.error || "Ocorreu um erro ao salvar a empresa.", "Falha ao Salvar");
      }
    } catch {
      showError("Erro de conexão ao comunicar com o servidor.", "Erro de Conexão");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    if (isEditing) {
      router.push("/sa/companies");
    } else {
      setFormData({
        name: "",
        trade_name: "",
        document: "",
        email: "",
        whatsapp: "",
        admin_whatsapp: "",
        address_zipcode: "",
        address_street: "",
        address_number: "",
        address_complement: "",
        address_neighborhood: "",
        address_city: "",
        address_state: "",
      });
      setErrors({});
      toast.info("Formulário limpo.");
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
        <span className="text-xs text-slate-400">Carregando dados da empresa...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">
      {/* Header com Navegação de Volta */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/sa/companies"
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            title="Voltar para listagem"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-0.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Gestão Multi-Tenancy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isEditing ? "Editar Empresa" : "Nova Empresa"}
            </h1>
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab("company")}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "company"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Dados da Empresa</span>
        </button>

        {isEditing && (
          <>
            {can("subscriptions", "view") && (
              <button
                type="button"
                onClick={() => setActiveTab("subscription")}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "subscription"
                    ? "border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-xl"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Assinatura</span>
                {activeSubscription && (
                  <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/30">
                    Ativa
                  </span>
                )}
              </button>
            )}

            {can("instances", "view") && (
              <button
                type="button"
                onClick={() => setActiveTab("instances")}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "instances"
                    ? "border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-xl"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <Server className="w-4 h-4" />
                <span>Instância</span>
                {instances.length > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-500/30">
                    {instances.length}
                  </span>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Conteúdo da Aba: Dados da Empresa */}
      {activeTab === "company" && (
        <form id="new-company-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Seção 1: Dados Cadastrais */}
          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-6 shadow-xl shadow-black/20 space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800/80">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Dados Cadastrais</h2>
                <p className="text-xs text-slate-400">Informações jurídicas e identificação da organização.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Razão Social / Nome Oficial <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: JH7 Soluções Digitais Ltda"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Nome Fantasia
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyNameToTradeName}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    title="Copiar Razão Social"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar Razão Social</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.trade_name}
                  onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                  placeholder="Ex: JH7 Marketing"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  CNPJ ou CPF
                </label>
                <input
                  type="text"
                  value={formData.document}
                  onChange={handleDocumentChange}
                  onBlur={handleDocumentBlur}
                  placeholder="00.000.000/0001-00"
                  maxLength={18}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border ${
                    errors.document
                      ? "border-rose-500 text-rose-200 focus:ring-rose-500/50"
                      : "border-slate-800 text-slate-100 focus:ring-indigo-500/50"
                  } placeholder-slate-500 focus:outline-none focus:ring-2 font-mono`}
                />
                {errors.document && (
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-rose-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.document}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    placeholder="contato@empresa.com"
                    className={`w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border ${
                      errors.email
                        ? "border-rose-500 text-rose-200 focus:ring-rose-500/50"
                        : "border-slate-800 text-slate-100 focus:ring-indigo-500/50"
                    } placeholder-slate-500 focus:outline-none focus:ring-2`}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-rose-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contatos de WhatsApp e Acesso OTP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  WhatsApp da Empresa (Atendimento / Notificações)
                </label>
                <div className="relative">
                  <Smartphone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={handleWhatsappChange}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Número de contato geral e alertas da empresa.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1.5 flex items-center justify-between">
                  <span>WhatsApp de Acesso Admin <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Único no SaaS
                  </span>
                </label>
                <div className="relative">
                  <ShieldCheck className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                  <input
                    type="text"
                    required
                    value={formData.admin_whatsapp}
                    onChange={handleAdminWhatsappChange}
                    onBlur={handleAdminWhatsappBlur}
                    placeholder="(11) 99999-8888"
                    maxLength={15}
                    className={`w-full pl-9 pr-9 py-2.5 text-xs rounded-xl bg-slate-900/90 border ${
                      errors.admin_whatsapp
                        ? "border-rose-500 text-rose-200 focus:ring-rose-500/50"
                        : "border-emerald-500/40 text-emerald-100 focus:ring-emerald-500/50"
                    } placeholder-slate-500 focus:outline-none focus:ring-2 font-medium`}
                  />
                  {isCheckingAdminWa && (
                    <RefreshCw className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 animate-spin" />
                  )}
                </div>
                {errors.admin_whatsapp ? (
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-rose-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.admin_whatsapp}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Número exclusivo usado para autenticação e envio do código OTP de 6 dígitos.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Seção 2: Endereço & Localização */}
          <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-6 shadow-xl shadow-black/20 space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800/80">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Endereço & Localização</h2>
                <p className="text-xs text-slate-400">Preenchimento automático do endereço pelo CEP.</p>
              </div>
            </div>

            {/* CEP com Busca Automática */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  CEP (Busca Automática)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.address_zipcode}
                    onChange={handleZipcodeChange}
                    onBlur={handleZipcodeBlur}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleSearchCep()}
                    disabled={isLoadingCep}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center justify-center focus:outline-none"
                    title="Buscar CEP"
                  >
                    <Search className={`w-4 h-4 ${isLoadingCep ? "animate-spin text-indigo-400" : ""}`} />
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Logradouro / Endereço
                </label>
                <input
                  type="text"
                  value={formData.address_street}
                  onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                  placeholder="Ex: Av. Paulista, Rua das Flores"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Número
                </label>
                <input
                  type="text"
                  value={formData.address_number}
                  onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                  placeholder="Ex: 1000, S/N"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Complemento
                </label>
                <input
                  type="text"
                  value={formData.address_complement}
                  onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                  placeholder="Ex: Sala 42, Bloco B"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bairro
                </label>
                <input
                  type="text"
                  value={formData.address_neighborhood}
                  onChange={(e) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                  placeholder="Ex: Centro, Bela Vista"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.address_city}
                  onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                  placeholder="Ex: São Paulo"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Estado (UF)
                </label>
                <input
                  type="text"
                  value={formData.address_state}
                  onChange={(e) => setFormData({ ...formData, address_state: e.target.value.toUpperCase() })}
                  placeholder="SP"
                  maxLength={2}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 uppercase"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Conteúdo da Aba: Assinatura */}
      {activeTab === "subscription" && isEditing && (
        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-6 space-y-6 shadow-xl shadow-black/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Plano e Assinatura</h3>
                <p className="text-xs text-slate-400">
                  Acompanhamento do plano vigente e histórico de assinaturas anteriores com snapshot imutável.
                </p>
              </div>
            </div>

            {can("subscriptions", "create") && (
              <button
                type="button"
                onClick={() => setAssignModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{activeSubscription ? "Alterar / Renovar Plano" : "Vincular Plano"}</span>
              </button>
            )}
          </div>

          {loadingSubscriptions ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-indigo-400" />
              Carregando dados da assinatura...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Assinatura Atual Vigente */}
              <div>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Assinatura Atual Vigente</span>
                </div>

                {activeSubscription ? (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-indigo-950/20 border border-emerald-500/30 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg font-black text-white">
                            {activeSubscription.plan_name}
                          </span>
                          {(() => {
                            const badge = SUBSCRIPTION_STATUS_MAP[activeSubscription.status] || {
                              label: activeSubscription.status,
                              bg: "bg-slate-800",
                              text: "text-slate-300",
                              border: "border-slate-700",
                            };
                            return (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${badge.bg} ${badge.text} border ${badge.border} uppercase tracking-wider`}>
                                {badge.label}
                              </span>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Snapshot do plano gravado na contratação (não afetado por alterações futuras de catálogo).
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black text-white">
                          R$ {Number(activeSubscription.price_at_subscription).toFixed(2).replace(".", ",")}
                        </div>
                        <span className="text-xs text-slate-400">/ mês</span>
                      </div>
                    </div>

                    {/* Limites Operacionais do Snapshot */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
                      {/* Limite de Grupos */}
                      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-slate-400 block text-[11px]">Limite de Grupos</span>
                            {editingLimitType === "groups" ? (
                              <div className="flex items-center gap-1.5 mt-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={limitInputValue}
                                  onChange={(e) => setLimitInputValue(e.target.value)}
                                  className="w-20 px-2 py-0.5 rounded bg-slate-900 border border-indigo-500/50 text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  disabled={isSavingLimit}
                                  onClick={handleSaveLimit}
                                  className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                                  title="Salvar"
                                >
                                  {isSavingLimit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  disabled={isSavingLimit}
                                  onClick={handleCancelEditLimit}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="font-bold text-white block truncate">
                                {activeSubscription.max_groups === 0 ? "Ilimitado" : `${activeSubscription.max_groups} grupos`}
                              </span>
                            )}
                          </div>
                        </div>
                        {editingLimitType !== "groups" && can("subscriptions", "edit") && (
                          <button
                            type="button"
                            onClick={() => handleStartEditLimit("groups", activeSubscription.max_groups)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 text-slate-400 hover:text-indigo-300 border border-slate-700/60 transition-all shrink-0"
                            title="Alterar limite de grupos"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Limite de Produtos */}
                      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Package className="w-4 h-4 text-violet-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-slate-400 block text-[11px]">Limite de Produtos</span>
                            {editingLimitType === "products" ? (
                              <div className="flex items-center gap-1.5 mt-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={limitInputValue}
                                  onChange={(e) => setLimitInputValue(e.target.value)}
                                  className="w-20 px-2 py-0.5 rounded bg-slate-900 border border-violet-500/50 text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  disabled={isSavingLimit}
                                  onClick={handleSaveLimit}
                                  className="p-1 rounded bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                                  title="Salvar"
                                >
                                  {isSavingLimit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  disabled={isSavingLimit}
                                  onClick={handleCancelEditLimit}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="font-bold text-white block truncate">
                                {activeSubscription.max_products === 0 ? "Ilimitado" : `${activeSubscription.max_products} produtos`}
                              </span>
                            )}
                          </div>
                        </div>
                        {editingLimitType !== "products" && can("subscriptions", "edit") && (
                          <button
                            type="button"
                            onClick={() => handleStartEditLimit("products", activeSubscription.max_products)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-violet-600/30 text-slate-400 hover:text-violet-300 border border-slate-700/60 transition-all shrink-0"
                            title="Alterar limite de produtos"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Envios Diários */}
                      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-slate-400 block text-[11px]">Envios Diários</span>
                            {editingLimitType === "messages" ? (
                              <div className="flex items-center gap-1.5 mt-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={limitInputValue}
                                  onChange={(e) => setLimitInputValue(e.target.value)}
                                  className="w-24 px-2 py-0.5 rounded bg-slate-900 border border-emerald-500/50 text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  disabled={isSavingLimit}
                                  onClick={handleSaveLimit}
                                  className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                                  title="Salvar"
                                >
                                  {isSavingLimit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  disabled={isSavingLimit}
                                  onClick={handleCancelEditLimit}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="font-bold text-white block truncate">
                                {Number(activeSubscription.max_messages_day).toLocaleString("pt-BR")} / dia
                              </span>
                            )}
                          </div>
                        </div>
                        {editingLimitType !== "messages" && can("subscriptions", "edit") && (
                          <button
                            type="button"
                            onClick={() => handleStartEditLimit("messages", activeSubscription.max_messages_day)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-emerald-600/30 text-slate-400 hover:text-emerald-300 border border-slate-700/60 transition-all shrink-0"
                            title="Alterar envios diários"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Limite de Visualizações */}
                      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-slate-400 block text-[11px]">Limite de Views</span>
                            {editingLimitType === "views" ? (
                              <div className="flex items-center gap-1.5 mt-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={limitInputValue}
                                  onChange={(e) => setLimitInputValue(e.target.value)}
                                  className="w-24 px-2 py-0.5 rounded bg-slate-900 border border-cyan-500/50 text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  disabled={isSavingLimit}
                                  onClick={handleSaveLimit}
                                  className="p-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                                  title="Salvar"
                                >
                                  {isSavingLimit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  disabled={isSavingLimit}
                                  onClick={handleCancelEditLimit}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="font-bold text-white block truncate">
                                {Number(activeSubscription.max_views) === 0 ? "Ilimitado" : `${Number(activeSubscription.max_views).toLocaleString("pt-BR")} views`}
                              </span>
                            )}
                          </div>
                        </div>
                        {editingLimitType !== "views" && can("subscriptions", "edit") && (
                          <button
                            type="button"
                            onClick={() => handleStartEditLimit("views", activeSubscription.max_views ?? 0)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-600/30 text-slate-400 hover:text-cyan-300 border border-slate-700/60 transition-all shrink-0"
                            title="Alterar limite de views"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Limite de Leads */}
                      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Users className="w-4 h-4 text-amber-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-slate-400 block text-[11px]">Limite de Leads</span>
                            {editingLimitType === "leads" ? (
                              <div className="flex items-center gap-1.5 mt-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={limitInputValue}
                                  onChange={(e) => setLimitInputValue(e.target.value)}
                                  className="w-24 px-2 py-0.5 rounded bg-slate-900 border border-amber-500/50 text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  disabled={isSavingLimit}
                                  onClick={handleSaveLimit}
                                  className="p-1 rounded bg-amber-600 hover:bg-amber-500 text-white transition-colors disabled:opacity-50"
                                  title="Salvar"
                                >
                                  {isSavingLimit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  disabled={isSavingLimit}
                                  onClick={handleCancelEditLimit}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="font-bold text-white block truncate">
                                {Number(activeSubscription.max_leads) === 0 ? "Ilimitado" : `${Number(activeSubscription.max_leads).toLocaleString("pt-BR")} leads`}
                              </span>
                            )}
                          </div>
                        </div>
                        {editingLimitType !== "leads" && can("subscriptions", "edit") && (
                          <button
                            type="button"
                            onClick={() => handleStartEditLimit("leads", activeSubscription.max_leads ?? 0)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-amber-600/30 text-slate-400 hover:text-amber-300 border border-slate-700/60 transition-all shrink-0"
                            title="Alterar limite de leads"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 pt-4 mt-4 border-t border-slate-800/60">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span>
                            Vigência: <strong>{new Date(activeSubscription.current_period_start).toLocaleDateString("pt-BR")}</strong> até <strong>{new Date(activeSubscription.current_period_end).toLocaleDateString("pt-BR")}</strong>
                          </span>
                        </div>
                        <div className="text-slate-400">
                          Método de Pagamento: <strong className="text-white uppercase">{activeSubscription.payment_method}</strong>
                        </div>
                      </div>

                      {can("subscriptions", "delete") && (
                        <button
                          type="button"
                          onClick={() => {
                            setSubToExpireId(activeSubscription.id);
                            setExpireModalOpen(true);
                          }}
                          disabled={isExpiringPlan}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
                          title="Expirar imediatamente esta assinatura"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Expirar Assinatura</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-2xl bg-slate-950/30 border border-dashed border-slate-800 text-xs text-slate-400">
                    Nenhuma assinatura ativa vinculada a esta empresa no momento.
                  </div>
                )}
              </div>

              {/* Histórico / Assinaturas Vencidas */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Histórico de Assinaturas Anteriores / Vencidas</span>
                </div>

                {pastSubscriptions.length === 0 ? (
                  <div className="p-4 text-center rounded-xl bg-slate-950/20 border border-slate-800/40 text-xs text-slate-500">
                    Nenhuma assinatura anterior registrada.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800/60">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800/60">
                        <tr>
                          <th className="py-2.5 px-3.5">Plano Contratado</th>
                          <th className="py-2.5 px-3.5">Limites no Snapshot</th>
                          <th className="py-2.5 px-3.5">Valor Pago</th>
                          <th className="py-2.5 px-3.5">Status</th>
                          <th className="py-2.5 px-3.5">Período</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-slate-300">
                        {pastSubscriptions.map((past) => (
                          <tr key={past.id} className="hover:bg-slate-800/20">
                            <td className="py-2.5 px-3.5 font-bold text-white">
                              {past.plan_name}
                            </td>
                            <td className="py-2.5 px-3.5 text-slate-400 text-[11px]">
                              {past.max_groups === 0 ? "Ilimitado" : `${past.max_groups} grupos`} • {past.max_products === 0 ? "Ilimitado" : `${past.max_products} prods`} • {past.max_messages_day} envios
                            </td>
                            <td className="py-2.5 px-3.5 font-semibold text-slate-200">
                              R$ {Number(past.price_at_subscription).toFixed(2).replace(".", ",")}
                            </td>
                            <td className="py-2.5 px-3.5">
                              {(() => {
                                const badge = SUBSCRIPTION_STATUS_MAP[past.status] || {
                                  label: past.status,
                                  bg: "bg-slate-800",
                                  text: "text-slate-400",
                                  border: "border-slate-700",
                                };
                                return (
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text} border ${badge.border} uppercase`}>
                                    {badge.label}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-2.5 px-3.5 text-slate-400 text-[11px]">
                              {new Date(past.current_period_start).toLocaleDateString("pt-BR")} a {new Date(past.current_period_end).toLocaleDateString("pt-BR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba: Instância */}
      {activeTab === "instances" && isEditing && (
        <div className="rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-6 space-y-6 shadow-xl shadow-black/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Instâncias WhatsApp da Empresa</h3>
                <p className="text-xs text-slate-400">
                  Gerencie as instâncias, servidores de conexão Evolution API e status de sockets vinculados a este tenant.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refreshCompanyInstances}
                disabled={loadingInstances}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
                title="Atualizar lista"
              >
                <RefreshCw className={`w-4 h-4 ${loadingInstances ? "animate-spin text-indigo-400" : ""}`} />
              </button>
              {instances.length === 0 && can("instances", "create") && (
                <button
                  type="button"
                  onClick={handleOpenCreateInstance}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Nova Instância</span>
                </button>
              )}
            </div>
          </div>

          {loadingInstances ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
              Carregando instâncias da empresa...
            </div>
          ) : instances.length === 0 ? (
            <div className="py-12 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
                <Server className="w-6 h-6 text-indigo-400" />
              </div>
              <h4 className="text-sm font-bold text-white">Nenhuma instância cadastrada</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
                Esta empresa ainda não possui instâncias de WhatsApp configuradas no ecossistema.
              </p>
              {can("instances", "create") && (
                <button
                  type="button"
                  onClick={handleOpenCreateInstance}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Cadastrar Primeira Instância</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {instances.map((inst) => {
                const isConnected = inst.status === "connected";
                const isConnecting = inst.status === "connecting" || inst.status === "qrcode";
                return (
                  <div
                    key={inst.id}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg shadow-black/20"
                  >
                    <div>
                      {/* Topo do Card */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">
                              {inst.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {inst.instance_key}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isConnected ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Conectada
                          </span>
                        ) : isConnecting ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <RotateCw className="w-3 h-3 animate-spin" />
                            Aguardando
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            Desconectada
                          </span>
                        )}
                      </div>

                      {/* Informações de Perfil WhatsApp Conectado ou Mensagem NÃO CONECTADO */}
                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs">
                        {isConnected ? (
                          <div className="flex items-center gap-3">
                            {inst.profile_picture_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={inst.profile_picture_url}
                                alt={inst.profile_name || "WhatsApp Perfil"}
                                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/50 shrink-0 shadow-md shadow-emerald-950/40"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0 shadow-inner">
                                {inst.profile_name ? inst.profile_name.slice(0, 2).toUpperCase() : <Smartphone className="w-6 h-6" />}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-white text-sm block truncate">
                                {inst.profile_name || "WhatsApp Conectado"}
                              </span>
                              <span className="font-mono text-xs text-emerald-400 font-medium block mt-0.5">
                                {maskPhone(inst.phone_connected || inst.whatsapp_number || "") || "Número ativo"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-2.5 px-3 rounded-lg bg-slate-900/50 border border-dashed border-slate-800 text-center">
                            <span className="font-bold text-xs tracking-wider text-rose-400/90 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-rose-500/80 animate-pulse" />
                              NÃO CONECTADO
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações da Instância */}
                    <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-800/60">
                      <div className="flex items-center gap-2">
                        {can("instances", "edit") && (
                          <>
                            {isConnected ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenTestModal(inst)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-all cursor-pointer whitespace-nowrap"
                                  title="Testar Envio de Mensagem no WhatsApp"
                                >
                                  <Send className="w-3.5 h-3.5 shrink-0" />
                                  <span>Testar Envio</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInstanceToDisconnect(inst);
                                    setDisconnectInstanceModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer whitespace-nowrap"
                                  title="Desconectar WhatsApp"
                                >
                                  <Power className="w-3.5 h-3.5 shrink-0" />
                                  <span>Desconectar</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenQrModal(inst)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer whitespace-nowrap"
                                title="Gerar QR Code para Leitura"
                              >
                                <QrCode className="w-3.5 h-3.5 shrink-0" />
                                <span>Gerar QRCode</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setInstanceToRestart(inst);
                                setRestartInstanceModalOpen(true);
                              }}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors cursor-pointer"
                              title="Reiniciar Instância"
                            >
                              <RotateCw className="w-3.5 h-3.5 shrink-0" />
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {can("instances", "delete") && (
                          <button
                            type="button"
                            onClick={() => {
                              setInstanceToDelete(inst);
                              setDeleteInstanceModalOpen(true);
                            }}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                            title="Excluir Instância"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Criação / Edição de Instância */}
      {instanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {instanceModalMode === "create" ? "Nova Instância WhatsApp" : "Instância WhatsApp"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {instanceModalMode === "create" ? "Identificador gerado automaticamente para a empresa." : "Identificador da instância."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInstanceModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInstance} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome Amigável da Instância
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={instanceFormData.name}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-indigo-300 font-mono font-bold select-all cursor-not-allowed focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Automático
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Identificador exclusivo gerado com base no nome da empresa e código randômico.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setInstanceModalOpen(false)}
                  disabled={isSubmittingInstance}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInstance}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingInstance ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{instanceModalMode === "create" ? "Criando Instância..." : "Salvando..."}</span>
                    </>
                  ) : (
                    <span>{instanceModalMode === "create" ? "Criar Instância" : "Salvar"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão de Instância */}
      {deleteInstanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Excluir Instância</h3>
                  <p className="text-xs text-slate-400">Confirmação de remoção permanente.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteInstanceModalOpen(false);
                  setInstanceToDelete(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Deseja realmente excluir a instância <strong className="text-white font-bold">{instanceToDelete?.name}</strong>? Esta ação desconectará o WhatsApp e removerá as configurações.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteInstanceModalOpen(false);
                  setInstanceToDelete(null);
                }}
                disabled={isDeletingInstance}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteInstance}
                disabled={isDeletingInstance}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isDeletingInstance ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Confirmar Exclusão</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Reiniciar Instância */}
      {restartInstanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <RotateCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reiniciar Instância</h3>
                  <p className="text-xs text-slate-400">Reconexão de socket da Evolution API.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRestartInstanceModalOpen(false);
                  setInstanceToRestart(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Deseja reiniciar a conexão da instância <strong className="text-white font-bold">{instanceToRestart?.name}</strong>? A sessão e as credenciais permanecerão salvas.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRestartInstanceModalOpen(false);
                  setInstanceToRestart(null);
                }}
                disabled={isRestartingInstance}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => instanceToRestart && handleInstanceAction(instanceToRestart, "restart")}
                disabled={isRestartingInstance}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isRestartingInstance ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Reiniciando...</span>
                  </>
                ) : (
                  <span>Confirmar Reinicialização</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Desconectar Instância */}
      {disconnectInstanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Desconectar WhatsApp</h3>
                  <p className="text-xs text-slate-400">Encerrar sessão ativa do WhatsApp.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDisconnectInstanceModalOpen(false);
                  setInstanceToDisconnect(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Tem certeza que deseja desconectar o WhatsApp da instância <strong className="text-white font-bold">{instanceToDisconnect?.name}</strong>? Para reconectar posteriormente, será necessário ler um novo QR Code.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDisconnectInstanceModalOpen(false);
                  setInstanceToDisconnect(null);
                }}
                disabled={isDisconnectingInstance}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => instanceToDisconnect && handleInstanceAction(instanceToDisconnect, "disconnect")}
                disabled={isDisconnectingInstance}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isDisconnectingInstance ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Desconectando...</span>
                  </>
                ) : (
                  <span>Confirmar Desconexão</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conexão com QR Code WhatsApp */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-left">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Conectar WhatsApp</h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                    {qrInstance?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQrModalOpen(false);
                  setQrInstance(null);
                  refreshCompanyInstances();
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Container do QRCode */}
            <div className="py-2 flex flex-col items-center justify-center">
              <div className="relative p-4 rounded-2xl bg-white shadow-xl shadow-black/40 border-4 border-slate-800 flex items-center justify-center min-h-[210px] min-w-[210px]">
                {loadingQr ? (
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-700">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                    <span className="text-[11px] font-bold text-slate-600">Reiniciando & Gerando...</span>
                  </div>
                ) : qrCodeData ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrCodeData}
                    alt="WhatsApp QR Code"
                    className="w-48 h-48 rounded-lg object-contain"
                  />
                ) : (
                  <div className="text-slate-600 text-xs font-medium">
                    Aguardando geração do QR Code...
                  </div>
                )}
              </div>

              {/* Indicador de Validade e Renovação */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  <RotateCw className={`w-3 h-3 ${loadingQr ? "animate-spin" : ""}`} />
                  <span>Novo QRCode em <strong>{qrSecondsLeft}s</strong></span>
                </span>
                <button
                  type="button"
                  onClick={() => qrInstance && fetchQrCode(qrInstance, false)}
                  disabled={loadingQr}
                  className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Atualizar QRCode Agora"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingQr ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed px-2">
              Abra o WhatsApp no seu celular, vá em <strong>Aparelhos Conectados</strong> e aponte a câmera para o código acima.
            </p>

            <div className="pt-2 border-t border-slate-800 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setQrModalOpen(false);
                  setQrInstance(null);
                  refreshCompanyInstances();
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Teste de Envio de Mensagem WhatsApp */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Testar Envio de Mensagem</h3>
                  <p className="text-xs text-slate-400">
                    Instância: <strong className="text-white">{testInstance?.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTestModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendTestMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Número do WhatsApp de Destino: <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-9999"
                    value={testNumber}
                    onChange={(e) => setTestNumber(maskPhone(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Informe o DDD e o número completo para onde o teste será enviado.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Mensagem de Teste:
                </label>
                <textarea
                  rows={3}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="Texto da mensagem..."
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  disabled={isSendingTest}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSendingTest ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Teste Agora</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Atribuição / Renovação de Plano */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {activeSubscription ? "Alterar / Renovar Plano" : "Vincular Novo Plano"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeSubscription
                      ? "Ao confirmar, o plano atual será encerrado/cancelado e substituído imediatamente."
                      : "Gera um snapshot comercial imutável para a empresa."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alerta explicativo se já houver assinatura ativa */}
            {activeSubscription && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <span className="font-bold block text-amber-200">Atenção sobre a troca de plano:</span>
                  A assinatura atual do plano <strong className="text-white font-bold">{activeSubscription.plan_name}</strong> será cancelada e arquivada no histórico retroativo. A nova assinatura assumirá a vigência a partir de hoje com novo snapshot de regras.
                </div>
              </div>
            )}

            <div className="space-y-3 py-1">
              <label className="block text-xs font-semibold text-slate-300">
                Selecione o Novo Plano
              </label>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {availablePlans.map((plan) => {
                  const isSelected = selectedPlanId === String(plan.id);
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(String(plan.id))}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-indigo-950/40 border-indigo-500 text-white ring-1 ring-indigo-500/50"
                          : "bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          <span>{plan.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {plan.max_groups === 0 ? "Grupos Ilimitados" : `${plan.max_groups} Grupos`} • {plan.max_products === 0 ? "Produtos Ilimitados" : `${plan.max_products} Produtos`} • {Number(plan.max_messages_day).toLocaleString("pt-BR")} Envios/dia
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-white">
                          R$ {Number(plan.price).toFixed(2).replace(".", ",")}
                        </span>
                        <span className="text-[10px] text-slate-500 block">/ mês</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                disabled={isAssigningPlan}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAssignPlan}
                disabled={isAssigningPlan || !selectedPlanId}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isAssigningPlan ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processando e Cancelando Anterior...</span>
                  </>
                ) : (
                  <span>{activeSubscription ? "Confirmar Troca de Plano" : "Confirmar Atribuição"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Expirar Assinatura */}
      {expireModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Expirar Assinatura</h3>
                  <p className="text-xs text-slate-400">Confirmação de expiração contratual.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setExpireModalOpen(false);
                  setSubToExpireId(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs text-slate-300 space-y-2">
              <p>
                Você está prestes a expirar a assinatura do plano <strong className="text-white font-bold">{activeSubscription?.plan_name}</strong> para esta empresa.
              </p>
              <p className="text-rose-300 font-medium">
                • O status passará para <strong>Expirada</strong> imediatamente.
                <br />
                • A assinatura será transferida para a tabela de assinaturas vencidas/anteriores.
                <br />
                • A empresa ficará sem plano ativo até que um novo seja atribuído.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setExpireModalOpen(false);
                  setSubToExpireId(null);
                }}
                disabled={isExpiringPlan}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmExpireSubscription}
                disabled={isExpiringPlan}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isExpiringPlan ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Expirando...</span>
                  </>
                ) : (
                  <span>Confirmar Expiração</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra Flutuante Padrão do Sistema */}
      <FloatingActionBar
        isVisible={isDirty}
        isSubmitting={isSubmitting}
        disabled={isFormInvalid}
        onCancel={handleResetForm}
        formId="new-company-form"
      />
    </div>
  );
}

export default function CompanyFormPage({ companyIdProp }: { companyIdProp?: string }) {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-sm font-medium text-slate-400">Carregando dados da empresa...</span>
        </div>
      }
    >
      <CompanyFormContent companyIdProp={companyIdProp} />
    </Suspense>
  );
}
