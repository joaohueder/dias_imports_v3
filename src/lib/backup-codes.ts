import crypto from "crypto";

export interface BackupCodeItem {
  code: string; // Ex: "A7B9-4C2D"
  usage_count?: number;
  last_used_at?: string | null;
  used?: boolean;
  used_at?: string | null;
  created_at: string;
}

/**
 * Gera uma lista de códigos reservas no formato "XXXX-XXXX"
 * @param count Quantidade de códigos (padrão 10)
 */
export function generateBackupCodes(count: number = 10): BackupCodeItem[] {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0, O, 1, I para evitar confusão
  const codes: BackupCodeItem[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < count; i++) {
    let part1 = "";
    let part2 = "";
    for (let j = 0; j < 4; j++) {
      part1 += characters.charAt(crypto.randomInt(0, characters.length));
      part2 += characters.charAt(crypto.randomInt(0, characters.length));
    }
    codes.push({
      code: `${part1}-${part2}`,
      usage_count: 0,
      last_used_at: null,
      used: false,
      used_at: null,
      created_at: now,
    });
  }

  return codes;
}

/**
 * Normaliza o código digitado pelo usuário (uppercase, remove hífens e formata XXXX-XXXX)
 */
export function normalizeBackupCode(code: string): string {
  let clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length === 8) {
    clean = `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return clean;
}
