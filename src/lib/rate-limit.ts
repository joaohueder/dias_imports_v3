/**
 * Rate Limiter simples em memória por IP com sliding window ou bucket
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipStore = new Map<string, RateLimitRecord>();

// Limpeza automática periódica a cada 5 minutos
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of ipStore.entries()) {
      if (now > record.resetAt) {
        ipStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Verifica e consome uma tentativa para a chave/IP.
 * @param key Identificador (ex: IP ou IP+Rota)
 * @param maxAttempts Máximo de requisições permitidas na janela
 * @param windowMs Duração da janela em milissegundos (default: 1 minuto)
 * @returns { allowed: boolean, remaining: number, retryAfterSeconds: number }
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 10,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const record = ipStore.get(key);

  if (!record || now > record.resetAt) {
    ipStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  record.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    retryAfterSeconds,
  };
}
