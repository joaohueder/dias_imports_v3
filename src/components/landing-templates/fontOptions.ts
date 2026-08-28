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
    id: "plusjakarta_inter",
    name: "Plus Jakarta Sans + Inter",
    category: "Minimalista, clean, tech & moderno",
    badge: "Clean & Delicado",
    desc: "Harmonia clean e hipermoderna. Tipografia geométrica suave e arejada com leitura delicada e conversão refinada.",
    titleFont: "'Plus Jakarta Sans', sans-serif",
    bodyFont: "'Inter', sans-serif",
    cssClass: "font-sans",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    sampleText: "NOVA COLEÇÃO • R$ 189,90",
  },
  {
    id: "outfit_manrope",
    name: "Outfit + Manrope",
    category: "Design moderno, cosméticos, estética",
    badge: "Moderno & Suave",
    desc: "Linhas contemporâneas arredondadas e leves da Outfit combinadas com a elegância fluida da Manrope.",
    titleFont: "'Outfit', sans-serif",
    bodyFont: "'Manrope', sans-serif",
    cssClass: "font-sans",
    fontFamily: "'Outfit', sans-serif",
    sampleText: "EDIÇÃO EXCLUSIVA • R$ 249,00",
  },
  {
    id: "urbanist_dmsans",
    name: "Urbanist + DM Sans",
    category: "Moda clean, minimalista e premium",
    badge: "Minimalista & Chic",
    desc: "Elegância geométrica e delicada com a Urbanist, aliada à fluidez moderna e balanceada da DM Sans.",
    titleFont: "'Urbanist', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    cssClass: "font-sans",
    fontFamily: "'Urbanist', sans-serif",
    sampleText: "TENDÊNCIA • 30% OFF",
  },
  {
    id: "marcellus_dmsans",
    name: "Marcellus + DM Sans",
    category: "Boutique clássica, joalheria, elegância",
    badge: "Delicada & Romana",
    desc: "Inspirada em entalhes romanos elegantes e proporções clássicas suaves da Marcellus combinadas com a delicadeza moderna da DM Sans.",
    titleFont: "'Marcellus', serif",
    bodyFont: "'DM Sans', sans-serif",
    cssClass: "font-serif",
    fontFamily: "'Marcellus', serif",
    sampleText: "PEÇAS LIMITADAS • COMPRE JÁ",
  },
  {
    id: "italiana_manrope",
    name: "Italiana + Manrope",
    category: "Alta costura italiana, luxo & sofisticação",
    badge: "Alta Costura & Luxo",
    desc: "Inspirada na caligrafia da moda italiana clássica: títulos finos e elegantes combinados com a modernidade da Manrope.",
    titleFont: "'Italiana', serif",
    bodyFont: "'Manrope', sans-serif",
    cssClass: "font-serif",
    fontFamily: "'Italiana', serif",
    sampleText: "COLEÇÃO PREMIUM • R$ 589,00",
  },
  {
    id: "cormorant_manrope",
    name: "Cormorant Garamond + Manrope",
    category: "Luxo clássico, editorial e sofisticado",
    badge: "Luxo & Editorial",
    desc: "A nobreza e leveza clássica da Cormorant Garamond com a modernidade fluida da Manrope para grifes sofisticadas.",
    titleFont: "'Cormorant Garamond', serif",
    bodyFont: "'Manrope', sans-serif",
    cssClass: "font-serif",
    fontFamily: "'Manrope', sans-serif",
    sampleText: "DESIGN EXCLUSIVO • R$ 349,00",
  },
  {
    id: "playfair_inter",
    name: "Playfair Display + Inter",
    category: "Moda feminina, boutique clássica",
    badge: "Elegante & Boutique",
    desc: "Títulos com a sofisticação da Playfair Display combinados com a clareza e alta legibilidade da Inter.",
    titleFont: "'Playfair Display', serif",
    bodyFont: "'Inter', sans-serif",
    cssClass: "font-serif",
    fontFamily: "'Inter', sans-serif",
    sampleText: "NOVA COLEÇÃO • R$ 249,90",
  },
  {
    id: "dmserif_dmsans",
    name: "DM Serif Display + DM Sans",
    category: "Fashion moderno e revista",
    badge: "Fashion Editorial",
    desc: "Visual editorial contemporâneo de revista de moda, equilibrando presença marcante com leitura dinâmica e moderna.",
    titleFont: "'DM Serif Display', serif",
    bodyFont: "'DM Sans', sans-serif",
    cssClass: "font-serif",
    fontFamily: "'DM Sans', sans-serif",
    sampleText: "TENDÊNCIA FASHION • 30% OFF",
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
