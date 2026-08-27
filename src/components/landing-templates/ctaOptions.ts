import React from "react";
import {
  ArrowRight,
  MessageCircle,
  Sparkles,
  Zap,
  ShoppingBag,
  Send,
  Heart,
  Flame,
  CheckCircle2,
  Lock,
  Gift,
  Star,
  ThumbsUp,
  CreditCard,
  Truck,
  LucideIcon,
} from "lucide-react";

export interface CtaIconOption {
  id: string;
  name: string;
  category: string;
  icon: LucideIcon;
}

export const CTA_ICONS: CtaIconOption[] = [
  { id: "arrow-right", name: "Seta Direita", category: "Padrão", icon: ArrowRight },
  { id: "whatsapp", name: "WhatsApp / Chat", category: "Conversa", icon: MessageCircle },
  { id: "send", name: "Enviar / Chamar", category: "Conversa", icon: Send },
  { id: "shopping-bag", name: "Sacola de Compras", category: "Vendas", icon: ShoppingBag },
  { id: "zap", name: "Raio / Imediato", category: "Destaque", icon: Zap },
  { id: "flame", name: "Fogo / Oferta Quente", category: "Destaque", icon: Flame },
  { id: "sparkles", name: "Brilho / Especial", category: "Destaque", icon: Sparkles },
  { id: "star", name: "Estrela / VIP", category: "Destaque", icon: Star },
  { id: "check", name: "Check / Confirmado", category: "Confiança", icon: CheckCircle2 },
  { id: "lock", name: "Cadeado / Seguro", category: "Confiança", icon: Lock },
  { id: "gift", name: "Presente / Bônus", category: "Vendas", icon: Gift },
  { id: "heart", name: "Coração / Favorito", category: "Destaque", icon: Heart },
  { id: "card", name: "Cartão / Pagamento", category: "Pagamento", icon: CreditCard },
  { id: "truck", name: "Caminhão / Frete", category: "Logística", icon: Truck },
  { id: "thumbs-up", name: "Polegar / Aprovado", category: "Confiança", icon: ThumbsUp },
];

export interface CtaAnimationOption {
  id: string;
  name: string;
  desc: string;
  className: string;
}

export const CTA_ANIMATIONS: CtaAnimationOption[] = [
  {
    id: "none",
    name: "Estático (Padrão)",
    desc: "Botão clássico sem animação contínua",
    className: "",
  },
  {
    id: "pulse",
    name: "Pulsação Suave",
    desc: "Respiração sutil chamando atenção contínua",
    className: "animate-pulse",
  },
  {
    id: "bounce",
    name: "Salto / Destaque",
    desc: "Micro-salto vertical rítmico",
    className: "animate-bounce",
  },
  {
    id: "glow",
    name: "Brilho Pulsante (Glow)",
    desc: "Aura iluminada de alta conversão ao redor do botão",
    className: "animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite] shadow-lg shadow-current/30",
  },
];

export function getCtaIconComponent(iconId?: string): LucideIcon {
  if (!iconId) return ArrowRight;
  const found = CTA_ICONS.find((item) => item.id.toLowerCase() === iconId.toLowerCase());
  return found ? found.icon : ArrowRight;
}

export function getCtaAnimationClass(animationId?: string): string {
  if (!animationId || animationId === "none") return "";
  const found = CTA_ANIMATIONS.find((item) => item.id === animationId);
  return found ? found.className : "";
}
