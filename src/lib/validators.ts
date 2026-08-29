/**
 * Utilitários de validação e formatação de máscaras para formulários
 */

// --- MÁSCARAS ---

export function maskCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    // CNPJ: 00.000.000/0000-00
    return digits
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
}

export function maskPhone(value: string): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  
  // Tratamento para números com DDI do Brasil (55) com 12 ou 13 dígitos
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    const ddi = "+55";
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    if (rest.length === 9) {
      return `${ddi} (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    } else {
      return `${ddi} (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    }
  }

  // Tratamento para números de outros países com DDI (> 11 dígitos)
  if (digits.length > 11) {
    return `+${digits}`;
  }

  // Tratamento padrão Brasil sem DDI (10 ou 11 dígitos)
  const localDigits = digits.slice(0, 11);
  if (localDigits.length <= 10) {
    // (00) 0000-0000
    return localDigits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  } else {
    // (00) 00000-0000
    return localDigits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }
}

export function maskZipcode(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
}

export const maskCep = maskZipcode;
export const maskCnpjCpf = maskCpfCnpj;
export const maskDocument = maskCpfCnpj;

export function unmask(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

export function formatDocumentWithLabel(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const masked = maskCpfCnpj(digits);
  return digits.length <= 11 ? `CPF: ${masked}` : `CNPJ: ${masked}`;
}

// --- VALIDAÇÕES ---

export function validateEmail(email: string): boolean {
  if (!email || !email.trim()) return true;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1+$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(clean.charAt(10));
}

export function validateCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14) return false;
  if (/^(\d)\1+$/.test(clean)) return false;

  let size = clean.length - 2;
  let numbers = clean.substring(0, size);
  const digits = clean.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = clean.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
}

export function validateCpfCnpj(val: string): boolean {
  if (!val || !val.trim()) return true;
  const clean = val.replace(/\D/g, "");
  if (clean.length === 11) {
    return validateCPF(clean);
  } else if (clean.length === 14) {
    return validateCNPJ(clean);
  }
  return false;
}
