import React from "react";
import {
  Check,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Headphones,
  MessageCircle,
  CreditCard,
  Zap,
  Sparkles,
  Star,
  Heart,
  Package,
  Clock,
  Award,
  Lock,
  Gift,
  Tag,
  Percent,
  RefreshCw,
  Flame,
  ThumbsUp,
  Box,
  MapPin,
  Smile,
  Shield,
  Send,
  LucideIcon,
} from "lucide-react";

export interface BenefitIconDef {
  id: string;
  name: string;
  category: string;
  icon: LucideIcon;
}

export const BENEFIT_ICONS: BenefitIconDef[] = [
  { id: "check", name: "Check Clássico", category: "Geral", icon: Check },
  { id: "check-circle", name: "Check Círculo", category: "Geral", icon: CheckCircle2 },
  { id: "truck", name: "Entrega / Frete", category: "Logística", icon: Truck },
  { id: "package", name: "Embalagem Segura", category: "Logística", icon: Package },
  { id: "box", name: "Pronta Entrega", category: "Logística", icon: Box },
  { id: "map-pin", name: "Envio Regional", category: "Logística", icon: MapPin },
  { id: "shield", name: "Garantia Total", category: "Confiança", icon: ShieldCheck },
  { id: "lock", name: "Compra Segura", category: "Confiança", icon: Lock },
  { id: "award", name: "Original / Certificado", category: "Confiança", icon: Award },
  { id: "headphones", name: "Suporte Dedicado", category: "Atendimento", icon: Headphones },
  { id: "whatsapp", name: "WhatsApp Oficial", category: "Atendimento", icon: MessageCircle },
  { id: "send", name: "Contato Direto", category: "Atendimento", icon: Send },
  { id: "card", name: "Cartão / PIX", category: "Pagamento", icon: CreditCard },
  { id: "percent", name: "Desconto Especial", category: "Pagamento", icon: Percent },
  { id: "tag", name: "Preço de Oferta", category: "Pagamento", icon: Tag },
  { id: "zap", name: "Envio Rápido", category: "Destaque", icon: Zap },
  { id: "sparkles", name: "Qualidade Premium", category: "Destaque", icon: Sparkles },
  { id: "star", name: "Estrela / Nota Máxima", category: "Destaque", icon: Star },
  { id: "heart", name: "Satisfação Garantida", category: "Destaque", icon: Heart },
  { id: "smile", name: "Cliente Feliz", category: "Destaque", icon: Smile },
  { id: "thumbs-up", name: "Mais Recomendado", category: "Destaque", icon: ThumbsUp },
  { id: "flame", name: "Mais Vendido", category: "Destaque", icon: Flame },
  { id: "clock", name: "Agilidade 24h", category: "Geral", icon: Clock },
  { id: "refresh", name: "Troca Facilitada", category: "Geral", icon: RefreshCw },
];

export function getBenefitIconComponent(iconId?: string): LucideIcon {
  if (!iconId) return Check;
  const found = BENEFIT_ICONS.find((item) => item.id.toLowerCase() === iconId.toLowerCase());
  return found ? found.icon : Check;
}
