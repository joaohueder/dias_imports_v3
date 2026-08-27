import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Gera o hash criptográfico seguro da senha via bcrypt.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compara a senha informada pelo usuário com o hash/senha armazenada no banco.
 * Suporta fallback suave caso a senha ainda esteja em texto puro durante migração legada.
 */
export async function verifyPassword(plainPassword: string, storedHashOrPlain: string): Promise<boolean> {
  if (!plainPassword || !storedHashOrPlain) return false;

  // Se já for hash bcrypt ($2a$, $2b$, $2y$)
  if (storedHashOrPlain.startsWith("$2a$") || storedHashOrPlain.startsWith("$2b$") || storedHashOrPlain.startsWith("$2y$")) {
    return bcrypt.compare(plainPassword, storedHashOrPlain);
  }

  // Fallback para senhas legadas que ainda não foram convertidas
  return plainPassword === storedHashOrPlain;
}

/**
 * Verifica se a senha armazenada precisa de upgrade para bcrypt
 */
export function isLegacyPlainPassword(storedPassword: string): boolean {
  if (!storedPassword) return false;
  return !(storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$"));
}
