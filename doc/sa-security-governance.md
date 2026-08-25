# Auditoria e Arquitetura de Segurança do Sistema

**Versão do Sistema:** 2026.08.0073  
**Data:** 25/08/2026  
**Responsável Técnico:** JH7 Security Guardian & DevSecOps  

---

## 1. Visão Geral de Segurança (Zero Trust & Secure by Design)

O sistema **JH7 Marketing** adota as melhores práticas recomendadas pela **OWASP Top 10**, **OWASP ASVS** e **CWE/SANS Top 25**, aplicando camadas de defesa em profundidade (*Defense in Depth*) no frontend, backend, APIs, banco de dados e cookies de sessão.

---

## 2. Camadas de Proteção Implementadas

### 2.1. Middleware de Borda & Roteamento Seguro (`src/middleware.ts`)
- **Proteção de Rotas:** Bloqueio e redirecionamento de usuários não autenticados que tentarem acessar rotas restritas `/sa/*` e `/painel/*`.
- **Prevenção de Acesso Não Autorizado:** Verificação antecipada de tokens e cookies de sessão do Super Admin e de Operadores.

### 2.2. Segurança e Integridade de Sessões (`src/lib/session.ts`)
- **Assinatura Criptográfica HMAC-SHA256:** O cookie de autenticação `sa_auth_token` é assinado criptograficamente com segredo do servidor, impedindo adulteração (*tampering*), falsificação de identidade (*session forgery*) e IDOR via alteração manual de IDs no navegador.
- **Cookies Seguros:**
  - `HttpOnly: true` para o token criptografado de autenticação (mitigação de roubo via XSS).
  - `SameSite: Lax` (mitigação de CSRF).
  - `Secure: true` em ambiente de produção (força transmissão estritamente via HTTPS).

### 2.3. Headers HTTP de Segurança (`next.config.ts`)
- `X-Frame-Options: DENY` (Proteção contra Clickjacking e iframes maliciosos).
- `X-Content-Type-Options: nosniff` (Proteção contra MIME type sniffing).
- `Referrer-Policy: strict-origin-when-cross-origin` (Proteção de privacidade de tráfego e referrers).
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` (Restrição de APIs sensíveis do navegador).
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS estrito para forçar HTTPS).

### 2.4. Proteção de Autenticação OTP WhatsApp (`/api/auth/otp/send`)
- **Sanitização de Número:** Limpeza e validação de tamanho de número telefônico.
- **Expiração Rápida:** Códigos de 6 dígitos numéricos com validade de 10 minutos no banco de dados.
- **Ocultação de Preview em Produção:** O campo `devOtpPreview` é exposto estritamente em ambiente de desenvolvimento local (`NODE_ENV !== 'production'`), garantindo sigilo absoluto em produção.

### 2.5. Governança e Execução de Migrations Segura (`/api/sa/migrations`)
- **Autenticação Dinâmica de Super Admin:** A senha informada para aplicar migrations é validada diretamente contra o hash/registro ativo do Super Admin no banco de dados MySQL, eliminando credenciais estáticas fixas no código-fonte.
- **Proteção Transacional e Logs:** Registro de executor (`executed_by`), data e versão a cada migration executada.

---

## 3. Checklist de Auditoria Contínua

- [x] Middleware global ativo em `/sa` e `/painel`
- [x] Cookies com flags `HttpOnly`, `SameSite=Lax` e HMAC tokens
- [x] Headers de segurança HTTP ativados no `next.config.ts`
- [x] Validação dinâmica de credenciais de Super Admin em operações críticas
- [x] Prevenção de vazamento de credenciais e OTPs em ambiente de produção
