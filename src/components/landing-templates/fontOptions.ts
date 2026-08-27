export interface FontOption {
  id: string;
  name: string;
  category: string;
  badge: string;
  desc: string;
  titleFont: string;
  bodyFont: string;
  cssClass: string;
  fontFamily: string;
  sampleText: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "playfair_inter",
    name: "Playfair Display + Inter",
    category: "Moda feminina, boutique, elegante",
    badge: "Elegante & Boutique",
    desc: "Títulos com a sofisticação da Playfair Display combinados com a clareza e alta legibilidade da Inter para botões e descrições.",
    titleFont: "'Playfair Display', serif",
    bodyFont: "'Inter', sans-serif",
    cssClass: "font-serif",
    fontFamily: "'Inter', sans-serif",
    sampleText: "NOVA COLEÇÃO • R$ 249,90",
  },
  {
    id: "cormorant_manrope",
    name: "Cormorant Garamond + Manrope",
    category: "Luxo, moda premium, sofisticado",
    badge: "Luxo & Sofisticado",
    desc: "A nobreza clássica da Cormorant Garamond com a modernidade fluida da Manrope. Perfeito para alta costura e grifes.",
    titleFont: "'Cormorant Garamond', serif",
    bodyFont: "'Manrope', sans-serif",
    cssClass: "font-serif",
    fontFamily: "'Manrope', sans-serif",
    sampleText: "EDIÇÃO EXCLUSIVA • R$ 589,00",
  },
  {
    id: "dmserif_dmsans",
    name: "DM Serif Display + DM Sans",
    category: "Fashion moderno e editorial",
    badge: "Fashion Editorial",
    desc: "Visual editorial contemporâneo de revista de moda, equilibrando presença marcante com leitura dinâmica e moderna.",
    titleFont: "'DM Serif Display', serif",
    bodyFont: "'DM Sans', sans-serif",
    cssClass: "font-serif",
    fontFamily: "'DM Sans', sans-serif",
    sampleText: "TENDÊNCIA FASHION • 30% OFF",
  },
  {
    id: "bodoni_montserrat",
    name: "Bodoni Moda + Montserrat",
    category: "Alta moda, joias, roupas premium",
    badge: "Alta Costura & Joias",
    desc: "Estilo imponente de passarela e joalherias finas com a Bodoni Moda e estrutura sólida e comercial da Montserrat.",
    titleFont: "'Bodoni Moda', serif",
    bodyFont: "'Montserrat', sans-serif",
    cssClass: "font-serif",
    fontFamily: "'Montserrat', sans-serif",
    sampleText: "PEÇAS LIMITADAS • COMPRE JÁ",
  },
  {
    id: "poppins_inter",
    name: "Poppins + Inter",
    category: "Loja moderna, jovem, e-commerce",
    badge: "Moderno & E-commerce",
    desc: "Combinação campeã para e-commerce moderno: títulos geométricos amigáveis da Poppins e leitura ultra limpa da Inter.",
    titleFont: "'Poppins', sans-serif",
    bodyFont: "'Inter', sans-serif",
    cssClass: "font-sans",
    fontFamily: "'Inter', sans-serif",
    sampleText: "SUPER OFERTA • FRETE GRÁTIS",
  },
  {
    id: "bebas_roboto",
    name: "Bebas Neue + Roboto / Inter",
    category: "Streetwear, masculino, promoções",
    badge: "Streetwear & Promoções",
    desc: "Títulos impactantes, altos e em caixa alta com a Bebas Neue, combinados com Roboto e Inter para conversão direta.",
    titleFont: "'Bebas Neue', sans-serif",
    bodyFont: "'Roboto', 'Inter', sans-serif",
    cssClass: "font-sans uppercase",
    fontFamily: "'Roboto', 'Inter', sans-serif",
    sampleText: "DROP EXCLUSIVO • GARANTA O SEU",
  },
];

export function getFontFamilyCss(fontId?: string): string {
  const found = FONT_OPTIONS.find((f) => f.id === fontId);
  return found ? found.bodyFont : FONT_OPTIONS[0].bodyFont;
}

export function getFontTitleFamilyCss(fontId?: string): string {
  const found = FONT_OPTIONS.find((f) => f.id === fontId);
  return found ? found.titleFont : FONT_OPTIONS[0].titleFont;
}
