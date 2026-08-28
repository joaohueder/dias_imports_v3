export interface CtaTextOption {
  id: string;
  category: "👑 Grupo VIP & Exclusividade" | "⚡ Acesso Imediato & Rapidez" | "🎁 Grátis & Vantagens" | "🔥 Descontos & Ofertas" | "💬 WhatsApp & Comunidade";
  text: string;
  tag: string;
}

export const CTA_CATEGORIES = [
  "all",
  "👑 Grupo VIP & Exclusividade",
  "⚡ Acesso Imediato & Rapidez",
  "🎁 Grátis & Vantagens",
  "🔥 Descontos & Ofertas",
  "💬 WhatsApp & Comunidade",
] as const;

export const HIGH_CONVERSION_CTAS: CtaTextOption[] = [
  // 1. Grupo VIP & Exclusividade (10 modelos)
  {
    id: "vip_cta_1",
    category: "👑 Grupo VIP & Exclusividade",
    tag: "Acesso VIP",
    text: "Quero Entrar no Grupo VIP",
  },
  {
    id: "vip_cta_2",
    category: "👑 Grupo VIP & Exclusividade",
    tag: "Garantir Vaga VIP",
    text: "Garantir Minha Vaga no Grupo VIP",
  },
  {
    id: "vip_cta_3",
    category: "👑 Grupo VIP & Exclusividade",
    tag: "Acesso Exclusivo",
    text: "Liberar Meu Acesso VIP Agora",
  },
  {
    id: "vip_cta_4",
    category: "👑 Grupo VIP & Exclusividade",
    tag: "Lista Seleta",
    text: "Entrar Para a Lista VIP Exclusiva",
  },
  {
    id: "vip_cta_5",
    category: "👑 Grupo VIP & Exclusividade",
    tag: "Membro Oficial",
    text: "Quero Fazer Parte do Clube VIP",
  },
  {
    id: "vip_cta_6",
    category: "👑 Grupo VIP & Exclusividade",
    tag: "Acesso Privado",
    text: "Acessar Canal Privado de Ofertas",
  },
  {
    id: "vip_cta_7",
    category: "👑 Grupo VIP & Exclusividade",
    tag: "Primeira Fila",
    text: "Quero Acesso VIP Antecipado",
  },
  {
    id: "vip_cta_8",
    category: "👑 Grupo VIP & Exclusividade",
    tag: "Comunidade VIP",
    text: "Entrar no Grupo VIP de Clientes",
  },
  {
    id: "vip_cta_9",
    category: "👑 Grupo VIP & Exclusividade",
    tag: "Convite Reservado",
    text: "Aceitar Meu Convite VIP",
  },
  {
    id: "vip_cta_10",
    category: "👑 Grupo VIP & Exclusividade",
    tag: "Passe VIP",
    text: "Resgatar Meu Passe VIP",
  },

  // 2. Acesso Imediato & Rapidez (10 modelos)
  {
    id: "fast_cta_1",
    category: "⚡ Acesso Imediato & Rapidez",
    tag: "Imediato",
    text: "Quero Acesso Imediato Agora",
  },
  {
    id: "fast_cta_2",
    category: "⚡ Acesso Imediato & Rapidez",
    tag: "Entrar Agora",
    text: "Entrar no Grupo Agora Mesmo",
  },
  {
    id: "fast_cta_3",
    category: "⚡ Acesso Imediato & Rapidez",
    tag: "1 Clique",
    text: "Acessar com 1 Clique",
  },
  {
    id: "fast_cta_4",
    category: "⚡ Acesso Imediato & Rapidez",
    tag: "Acesso Rápido",
    text: "Quero Entrar Sem Espera",
  },
  {
    id: "fast_cta_5",
    category: "⚡ Acesso Imediato & Rapidez",
    tag: "Garantir Já",
    text: "Garantir Minha Vaga Antes Que Acabe",
  },
  {
    id: "fast_cta_6",
    category: "⚡ Acesso Imediato & Rapidez",
    tag: "Acelerar",
    text: "Quero Entrar Direto no Grupo",
  },
  {
    id: "fast_cta_7",
    category: "⚡ Acesso Imediato & Rapidez",
    tag: "Desbloquear Já",
    text: "Desbloquear Meu Acesso Agora",
  },
  {
    id: "fast_cta_8",
    category: "⚡ Acesso Imediato & Rapidez",
    tag: "Sem Burocracia",
    text: "Entrar Instantaneamente",
  },
  {
    id: "fast_cta_9",
    category: "⚡ Acesso Imediato & Rapidez",
    tag: "Tempo Recorde",
    text: "Acessar Agora em Menos de 1 Minuto",
  },
  {
    id: "fast_cta_10",
    category: "⚡ Acesso Imediato & Rapidez",
    tag: "Última Chamada",
    text: "Aproveitar e Entrar Agora",
  },

  // 3. Grátis & Vantagens (10 modelos)
  {
    id: "free_cta_1",
    category: "🎁 Grátis & Vantagens",
    tag: "100% Grátis",
    text: "Entrar no Grupo VIP Grátis",
  },
  {
    id: "free_cta_2",
    category: "🎁 Grátis & Vantagens",
    tag: "Acesso Gratuito",
    text: "Quero Minha Vaga Gratuita",
  },
  {
    id: "free_cta_3",
    category: "🎁 Grátis & Vantagens",
    tag: "Sem Custo",
    text: "Entrar Gratuitamente no Grupo",
  },
  {
    id: "free_cta_4",
    category: "🎁 Grátis & Vantagens",
    tag: "Com Bônus",
    text: "Quero Entrar e Ganhar Benefícios",
  },
  {
    id: "free_cta_5",
    category: "🎁 Grátis & Vantagens",
    tag: "Resgatar Bônus",
    text: "Resgatar Meu Acesso Grátis",
  },
  {
    id: "free_cta_6",
    category: "🎁 Grátis & Vantagens",
    tag: "Vantagens VIP",
    text: "Quero Todos os Benefícios Exclusivos",
  },
  {
    id: "free_cta_7",
    category: "🎁 Grátis & Vantagens",
    tag: "Sem Mensalidade",
    text: "Participar Sem Pagar Nada",
  },
  {
    id: "free_cta_8",
    category: "🎁 Grátis & Vantagens",
    tag: "Brinde Especial",
    text: "Entrar no Grupo e Pegar Meu Cupom",
  },
  {
    id: "free_cta_9",
    category: "🎁 Grátis & Vantagens",
    tag: "Aproveitar Grátis",
    text: "Aproveitar Minha Entrada VIP Gratuita",
  },
  {
    id: "free_cta_10",
    category: "🎁 Grátis & Vantagens",
    tag: "100% Livre",
    text: "Entrar no Grupo 100% Grátis",
  },

  // 4. Descontos & Ofertas (10 modelos)
  {
    id: "deal_cta_1",
    category: "🔥 Descontos & Ofertas",
    tag: "Desconto VIP",
    text: "Quero Receber as Melhores Ofertas",
  },
  {
    id: "deal_cta_2",
    category: "🔥 Descontos & Ofertas",
    tag: "Preço de Fábrica",
    text: "Acessar Ofertas Secretas com Desconto",
  },
  {
    id: "deal_cta_3",
    category: "🔥 Descontos & Ofertas",
    tag: "Cupons Diários",
    text: "Entrar Para Pegar Cupons Exclusivos",
  },
  {
    id: "deal_cta_4",
    category: "🔥 Descontos & Ofertas",
    tag: "Queima de Estoque",
    text: "Quero Aproveitar as Queimas de Estoque",
  },
  {
    id: "deal_cta_5",
    category: "🔥 Descontos & Ofertas",
    tag: "Economia Real",
    text: "Entrar no Grupo Para Economizar",
  },
  {
    id: "deal_cta_6",
    category: "🔥 Descontos & Ofertas",
    tag: "Ofertas Relâmpago",
    text: "Quero Ofertas Relâmpago no WhatsApp",
  },
  {
    id: "deal_cta_7",
    category: "🔥 Descontos & Ofertas",
    tag: "Menor Preço",
    text: "Ver Promoções Exclusivas do Grupo",
  },
  {
    id: "deal_cta_8",
    category: "🔥 Descontos & Ofertas",
    tag: "Corte de Preço",
    text: "Quero Comprar com os Maiores Descontos",
  },
  {
    id: "deal_cta_9",
    category: "🔥 Descontos & Ofertas",
    tag: "Lançamento",
    text: "Receber Lançamentos com Preço Especial",
  },
  {
    id: "deal_cta_10",
    category: "🔥 Descontos & Ofertas",
    tag: "Super Promoção",
    text: "Acessar o Grupo de Promoções",
  },

  // 5. WhatsApp & Comunidade (10 modelos)
  {
    id: "wpp_cta_1",
    category: "💬 WhatsApp & Comunidade",
    tag: "Direto no WhatsApp",
    text: "Entrar no Grupo de WhatsApp",
  },
  {
    id: "wpp_cta_2",
    category: "💬 WhatsApp & Comunidade",
    tag: "Participar",
    text: "Quero Participar da Comunidade",
  },
  {
    id: "wpp_cta_3",
    category: "💬 WhatsApp & Comunidade",
    tag: "Conectar",
    text: "Conectar ao Nosso Grupo Oficial",
  },
  {
    id: "wpp_cta_4",
    category: "💬 WhatsApp & Comunidade",
    tag: "Falar Conosco",
    text: "Receber Novidades Direto no WhatsApp",
  },
  {
    id: "wpp_cta_5",
    category: "💬 WhatsApp & Comunidade",
    tag: "Comunidade Oficial",
    text: "Fazer Parte da Nossa Comunidade VIP",
  },
  {
    id: "wpp_cta_6",
    category: "💬 WhatsApp & Comunidade",
    tag: "Canal de Avisos",
    text: "Entrar no Canal Exclusivo de WhatsApp",
  },
  {
    id: "wpp_cta_7",
    category: "💬 WhatsApp & Comunidade",
    tag: "Acompanhar",
    text: "Quero Acompanhar Tudo em Primeira Mão",
  },
  {
    id: "wpp_cta_8",
    category: "💬 WhatsApp & Comunidade",
    tag: "Junte-se a Nós",
    text: "Juntar-se ao Grupo VIP no WhatsApp",
  },
  {
    id: "wpp_cta_9",
    category: "💬 WhatsApp & Comunidade",
    tag: "Atendimento",
    text: "Entrar no Grupo com Suporte Prioritário",
  },
  {
    id: "wpp_cta_10",
    category: "💬 WhatsApp & Comunidade",
    tag: "Link Direto",
    text: "Abrir Grupo no WhatsApp Agora",
  },
];
