export interface BadgeOption {
  id: string;
  text: string;
  category: string;
  tag: string;
  icon?: string;
}

export const BADGE_CATEGORIES = [
  "Urgência & Escassez",
  "Exclusividade & VIP",
  "Ofertas & Descontos",
  "Acesso & Novidades",
  "Comunidade & Confiança",
];

export const HIGH_CONVERSION_BADGES: BadgeOption[] = [
  // 1. Urgência & Escassez (10 opções)
  { id: "b1", text: "⚡ ÚLTIMAS VAGAS DISPONÍVEIS", category: "Urgência & Escassez", tag: "Vagas" },
  { id: "b2", text: "🔥 O GRUPO VAI FECHAR EM BREVE", category: "Urgência & Escassez", tag: "Fechamento" },
  { id: "b3", text: "⏳ ACESSO LIBERADO POR TEMPO LIMITADO", category: "Urgência & Escassez", tag: "Tempo" },
  { id: "b4", text: "🚨 APENAS 10 VAGAS RESTANTES", category: "Urgência & Escassez", tag: "Contador" },
  { id: "b5", text: "⚡ ENTRADA GRATUITA HOJE", category: "Urgência & Escassez", tag: "Hoje" },
  { id: "b6", text: "💥 LOTE PROMOCIONAL QUASE ESGOTADO", category: "Urgência & Escassez", tag: "Lote" },
  { id: "b7", text: "⏱️ ENTRADA EXPRESSA • ENCERRA HOJE", category: "Urgência & Escassez", tag: "Express" },
  { id: "b8", text: "🔥 ALTA PROCURA • ÚLTIMOS ACESSOS", category: "Urgência & Escassez", tag: "Procura" },
  { id: "b9", text: "🚨 LINK DE CONVITE EXPIRA EM BREVE", category: "Urgência & Escassez", tag: "Expiração" },
  { id: "b10", text: "⚡ NÃO PERCA SUA VAGA", category: "Urgência & Escassez", tag: "Atenção" },

  // 2. Exclusividade & VIP (10 opções)
  { id: "b11", text: "⚡ ACESSO ANTECIPADO & EXCLUSIVO", category: "Exclusividade & VIP", tag: "VIP" },
  { id: "b12", text: "👑 GRUPO VIP PRIVADO", category: "Exclusividade & VIP", tag: "Privado" },
  { id: "b13", text: "💎 COMUNIDADE VIP FECHADA", category: "Exclusividade & VIP", tag: "Fechada" },
  { id: "b14", text: "⭐ CONVITE VIP RESTRITO", category: "Exclusividade & VIP", tag: "Restrito" },
  { id: "b15", text: "🎯 CONTEÚDO 100% EXCLUSIVO", category: "Exclusividade & VIP", tag: "Exclusivo" },
  { id: "b16", text: "👑 CANAL VIP OFICIAL", category: "Exclusividade & VIP", tag: "Oficial" },
  { id: "b17", text: "💎 ACESSO VIP PARA MEMBROS SELECIONADOS", category: "Exclusividade & VIP", tag: "Selecionados" },
  { id: "b18", text: "🌟 EXPERIÊNCIA VIP PREMIUM", category: "Exclusividade & VIP", tag: "Premium" },
  { id: "b19", text: "👑 BASTIDORES & OFERTAS SECRETAS", category: "Exclusividade & VIP", tag: "Segredos" },
  { id: "b20", text: "💎 GRUPO DE ELITE NO WHATSAPP", category: "Exclusividade & VIP", tag: "Elite" },

  // 3. Ofertas & Descontos (10 opções)
  { id: "b21", text: "🏷️ DESCONTOS RELÂMPAGO EXCLUSIVOS", category: "Ofertas & Descontos", tag: "Descontos" },
  { id: "b22", text: "🎁 CUPONS E OFERTAS SECRETAS", category: "Ofertas & Descontos", tag: "Cupons" },
  { id: "b23", text: "💰 PREÇO DE CUSTO PARA MEMBROS", category: "Ofertas & Descontos", tag: "Custo" },
  { id: "b24", text: "🤑 AS MELHORES PROMOÇÕES ANTES DE TODOS", category: "Ofertas & Descontos", tag: "Promoções" },
  { id: "b25", text: "🏷️ CONDIÇÕES ESPECIAIS DIRETO DA FÁBRICA", category: "Ofertas & Descontos", tag: "Fábrica" },
  { id: "b26", text: "🎁 SORTEIOS E BRINDES DENTRO DO GRUPO", category: "Ofertas & Descontos", tag: "Sorteios" },
  { id: "b27", text: "💰 ECONOMIZE ATÉ 50% EM CADA COMPRA", category: "Ofertas & Descontos", tag: "Economia" },
  { id: "b28", text: "🏷️ ATACADO E VAREJO EXCLUSIVO", category: "Ofertas & Descontos", tag: "Atacado" },
  { id: "b29", text: "🔥 QUEIMA DE ESTOQUE VIP", category: "Ofertas & Descontos", tag: "Queima" },
  { id: "b30", text: "🎁 BÔNUS DE BOAS-VINDAS NO GRUPO", category: "Ofertas & Descontos", tag: "Boas-vindas" },

  // 4. Acesso & Novidades (10 opções)
  { id: "b31", text: "🚀 LANÇAMENTOS EM PRIMEIRA MÃO", category: "Acesso & Novidades", tag: "Lançamentos" },
  { id: "b32", text: "📦 REPOSIÇÃO DE ESTOQUE ANTECIPADA", category: "Acesso & Novidades", tag: "Estoque" },
  { id: "b33", text: "✨ NOVIDADES SEMANAIS GARANTIDAS", category: "Acesso & Novidades", tag: "Semanal" },
  { id: "b34", text: "⚡ ATENDIMENTO PRIORITÁRIO 24/7", category: "Acesso & Novidades", tag: "Suporte" },
  { id: "b35", text: "🚀 ACESSO ANTES DE IR PRO INSTAGRAM", category: "Acesso & Novidades", tag: "Instagram" },
  { id: "b36", text: "📲 ATUALIZAÇÕES DIÁRIAS NO WHATSAPP", category: "Acesso & Novidades", tag: "Diário" },
  { id: "b37", text: "✨ CATALOGO COMPLETO E ATUALIZADO", category: "Acesso & Novidades", tag: "Catálogo" },
  { id: "b38", text: "🚀 ALERTA DE COMPRAS RELÂMPAGO", category: "Acesso & Novidades", tag: "Alertas" },
  { id: "b39", text: "📲 NOTIFICAÇÕES INSTANTÂNEAS", category: "Acesso & Novidades", tag: "Push" },
  { id: "b40", text: "✨ LISTA DE ESPERA LIBERADA", category: "Acesso & Novidades", tag: "Espera" },

  // 5. Comunidade & Confiança (10 opções)
  { id: "b41", text: "🛡️ 100% GRATUITO E SEM SPAM", category: "Comunidade & Confiança", tag: "Sem Spam" },
  { id: "b42", text: "👥 MILHARES DE CLIENTES SATISFEITOS", category: "Comunidade & Confiança", tag: "Clientes" },
  { id: "b43", text: "🔒 GRUPO SEGURO E VERIFICADO", category: "Comunidade & Confiança", tag: "Verificado" },
  { id: "b44", text: "🤝 COMUNIDADE DIRETO COM A EQUIPE", category: "Comunidade & Confiança", tag: "Equipe" },
  { id: "b45", text: "⭐ AVALIAÇÃO MÁXIMA DOS MEMBROS", category: "Comunidade & Confiança", tag: "Avaliação" },
  { id: "b46", text: "🛡️ GRUPO SILENCIOSO • APENAS OFERTAS", category: "Comunidade & Confiança", tag: "Silencioso" },
  { id: "b47", text: "👥 CONECTE-SE COM COMPRADORES VIP", category: "Comunidade & Confiança", tag: "Networking" },
  { id: "b48", text: "🔒 PRIVACIDADE 100% GARANTIDA", category: "Comunidade & Confiança", tag: "Privacidade" },
  { id: "b49", text: "⭐ CANAL RECOMENDADO POR CLIENTES", category: "Comunidade & Confiança", tag: "Recomendado" },
  { id: "b50", text: "🛡️ CONVITE SEGURO DIRETO NO WHATSAPP", category: "Comunidade & Confiança", tag: "Direto" },
];
