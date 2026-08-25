export function formatCurrencyBRL(value: number | string): string {
  const numeric = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, "")) || 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numeric);
}

export function maskCurrencyInput(value: string): string {
  // Mantém apenas dígitos
  const digits = value.replace(/\D/g, "");
  if (!digits) return "0,00";

  const num = (parseInt(digits, 10) / 100).toFixed(2);
  const parts = num.split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decPart = parts[1];

  return `${intPart},${decPart}`;
}

export function parseCurrencyInput(value: string): number {
  if (!value) return 0;
  const clean = value.replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}
