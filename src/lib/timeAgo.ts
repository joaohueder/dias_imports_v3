/**
 * Formata um intervalo de tempo em texto amigável em português
 * Ex: "agora", "2 minutos", "6 horas", "3 dias", "2 semanas", "1 mês", "1 ano"
 */
export function formatTimeAgo(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "Nunca";

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Nunca";

  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffInSeconds < 60) {
    return "agora";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? "1 minuto" : `${diffInMinutes} minutos`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? "1 hora" : `${diffInHours} horas`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays === 1 ? "1 dia" : `${diffInDays} dias`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInDays < 30) {
    return diffInWeeks === 1 ? "1 semana" : `${diffInWeeks} semanas`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? "1 mês" : `${diffInMonths} meses`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? "1 ano" : `${diffInYears} anos`;
}
