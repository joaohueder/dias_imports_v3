---
name: jh7-desenvolvedor
description: "Especialista principal de desenvolvimento e arquitetura (Next.js, NestJS, TypeScript, MySQL, Prisma, Redis, BullMQ, PM2, Nginx, Linux/VPS). Use em todo o ciclo de desenvolvimento, arquitetura, backend, frontend funcional, banco de dados, filas, realtime, segurança e infraestrutura."
---

# JH7-DESENVOLVEDOR

Essa skill é o **especialista principal de desenvolvimento e arquitetura** dos sistemas. Ela possui conhecimento profundo, atualizado e prático da stack definida abaixo e orienta o agente durante todo o ciclo de desenvolvimento, priorizando padronização, previsibilidade, segurança, robustez, performance, baixo acoplamento, manutenção simples e redução de alucinações.

---

## 1. STACK OFICIAL
- **Frontend:** Next.js + React + TypeScript
- **Backend:** NestJS + TypeScript
- **Banco de dados:** MySQL
- **ORM:** Prisma
- **Filas e Jobs:** Redis + BullMQ
- **Tempo real:** Socket.IO / WebSocket ou SSE
- **Cache:** Redis
- **Gerenciamento de processos:** PM2
- **Proxy reverso e HTTPS:** Nginx
- **Servidor alvo:** Linux / VPS

Dominar profundamente a integração entre todas essas tecnologias, não apenas cada tecnologia isoladamente.

---

## 2. OBJETIVO PRINCIPAL
Construir sistemas seguros, rápidos, robustos, escaláveis, modulares, fáceis de manter e atualizar, preparados para produção, compreensíveis por outros agentes de IA, resistentes a falhas, com baixo risco de regressão e sem complexidade desnecessária.
- Não criar soluções improvisadas apenas para "fazer funcionar".
- Sempre pensar na manutenção futura do projeto.

---

## 3. TYPESCRIPT
Usar TypeScript de maneira rigorosa.
- **Evitar:** `any`, tipos genéricos desnecessários, casts inseguros, duplicação de interfaces e objetos sem contratos claros.
- **Priorizar:** Tipagem forte, interfaces bem definidas, DTOs, enums quando apropriado, tipos compartilhados, validação de entrada, inferência segura e contratos claros entre frontend e backend.
- Erros de tipagem devem ser tratados como problemas reais de arquitetura, e não silenciados.

---

## 4. FRONTEND
Dominar Next.js (App Router), Server Components, Client Components, Server Actions (quando apropriado), layouts, rotas, middleware, autenticação, autorização, consumo de APIs, tratamento de erros, loading states, cache, invalidação, paginação, filtros, formulários, uploads e realtime.
- Não transformar tudo desnecessariamente em Client Component.
- Separar corretamente: `UI → regras da interface → comunicação com API → backend`.
- Não colocar regras críticas de negócio exclusivamente no frontend.

---

## 5. BACKEND — NESTJS
NestJS é o responsável pelas regras de negócio.
- Utilizar Modules, Controllers, Services, Providers, Guards, Interceptors, Pipes, Filters, DTOs, Decorators, Dependency Injection, Validation e configuração por ambiente.
- Controllers permanecem enxutos; regras de negócio ficam nos Services/domínio apropriado.
- Evitar controllers gigantes ou services monolíticos. Organizar por domínio/feature.

---

## 6. API
Criar APIs previsíveis e consistentes.
- Padronizar requests, responses, paginação, filtros, ordenação, erros, códigos HTTP, autenticação e autorização.
- Nunca retornar stack traces, credenciais ou informações internas sensíveis para clientes.
- Toda entrada externa deve ser considerada não confiável e validada.

---

## 7. MYSQL + PRISMA
MySQL é o banco principal e fonte de verdade dos dados persistentes. Prisma é o ORM padrão.
- Dominar modelagem relacional, índices, constraints, foreign keys, transações, migrations, relacionamentos, paginação eficiente, queries eficientes, concorrência e integridade referencial.
- Evitar N+1 queries. Não buscar colunas desnecessárias. Não criar índices indiscriminadamente.
- Toda alteração estrutural deve considerar os dados existentes antes de executar migrations destrutivas.
- Nunca apagar dados ou estruturas existentes apenas por conveniência.

---

## 8. TRANSAÇÕES E CONSISTÊNCIA
- Operações que modificam múltiplas entidades relacionadas devem avaliar necessidade de transação (`$transaction`).
- Nunca deixar uma operação parcialmente concluída.
- Tratar concorrência, duplicidade, race conditions, idempotência, retries e locks quando necessários.

---

## 9. REDIS
Infraestrutura auxiliar para cache, filas, locks distribuídos, rate limiting, sessões e estados temporários.
- Redis **não substitui o MySQL** como fonte principal de verdade.
- Nunca depender exclusivamente de dados voláteis para informações críticas permanentes.

---

## 10. CACHE
Não adicionar cache sem necessidade. Antes de implementar cache, determinar:
1. O que será cacheado;
2. Por quanto tempo (TTL);
3. Como será invalidado;
4. Qual impacto haverá se o cache estiver desatualizado;
5. Comportamento caso o Redis fique indisponível.
- Cache nunca deve comprometer a consistência de operações críticas.

---

## 11. FILAS E JOBS — BULLMQ
Usar filas para tarefas assíncronas (mensagens, notificações, processamento pesado, integrações, importações/exportações, rotinas demoradas).
- Implementar retries, backoff exponencial, timeouts, prioridades, concorrência, delayed/scheduled jobs, logs e recuperação.
- **Idempotência:** Um job não pode causar duplicidade se for executado novamente.

---

## 12. WORKERS
- Workers devem executar separadamente da API quando apropriado.
- Falha em um worker não pode derrubar a aplicação.
- Permitir iniciar, parar, reiniciar, monitorar e recuperar automaticamente os workers.

---

## 13. TEMPO REAL
- **Socket.IO / WebSocket:** Comunicação bidirecional e eventos interativos.
- **SSE:** Quando o servidor precisa apenas emitir atualizações unidirecionais ao cliente.
- Tratar autenticação, autorização, reconexão, heartbeat, múltiplas instâncias, eventos duplicados/perdidos, limpeza de conexões e consumo de recursos.

---

## 14. REALTIME NÃO É BANCO DE DADOS
- Eventos realtime servem para notificar clientes sobre alterações.
- Após receber um evento, o frontend deve atualizar/invalidar/refetch dos dados oficiais no banco. O MySQL permanece como fonte de verdade.

---

## 15. PM2 & GRACEFUL SHUTDOWN
- Gerenciar NestJS, workers e processos realtime com PM2 (nomes, restart automático, logs, envs, graceful shutdown, startup reboot).
- Tratar encerramento de forma graciosa: parar de aceitar novos trabalhos, concluir/liberar tarefas ativas, fechar conexões/consumidores e liberar recursos previsivelmente.

---

## 16. NGINX
Dominar configuração de reverse proxy, HTTPS, headers de segurança, compressão, proxy WebSocket/SSE, arquivos estáticos, limites de upload, timeouts e redirecionamento HTTP → HTTPS.

---

## 17. DEPLOY & HEALTH CHECKS
- Arquitetura voltada para automação de deploy na VPS (`obter versão → dependências → build → migrations seguras → reload → health check`).
- Health checks para API, MySQL, Redis, workers, filas e realtime (diferenciando liveness e readiness).

---

## 18. SEGURANÇA & SECRETS
- Autenticação, autorização (RBAC), validação, sanitização, rate limiting, CORS, CSRF, XSS, SQL Injection, SSRF, upload seguro e headers de segurança.
- Nunca confiar apenas no frontend: toda operação protegida deve ser validada e autorizada no backend.
- Nunca commitar `.env`, expor credenciais em código/logs ou enviar secrets ao frontend.

---

## 19. TRATAMENTO DE ERROS & RESILIÊNCIA
- Classificar erros (esperado, validação, negócio, infraestrutura, inesperado) e registrar logs com contexto sem expor dados sensíveis ao cliente.
- Resiliência contra quedas temporárias de serviços: timeout, retry com backoff, circuit breaker e degradação graciosa.

---

## 20. PERFORMANCE & ESCALABILIDADE
- Otimizar em cima de gargalos reais (queries, índices, payloads, serialização, N+1, frontend bundle).
- Manter arquitetura como monólito modular bem estruturado antes de partir para microservices prematuros, permitindo evolução da VPS para múltiplas instâncias sem reescrita total.

---

## 21. DESENVOLVIMENTO POR IA, ECONOMIA DE TOKENS E NÃO ALUCINAÇÃO
- Código explícito, nomes descritivos, diretórios previsíveis e responsabilidades claras.
- Utilizar o menor contexto necessário para cada tarefa, evitando abrir arquivos irrelevantes ou fazer buscas redundantes.
- Nunca presumir estruturas, tabelas, colunas, endpoints, bibliotecas ou versões sem verificar no projeto (`package.json`, lockfile, schema Prisma).
- Antes de usar dependências dependentes de versão, verificar as versões reais instaladas.

---

## 22. TESTES & DEFINITION OF DONE
- Testes proporcionais ao risco (auth, transações financeiras, filas/jobs idempotentes, regras críticas, concorrência).
- Antes de considerar pronto: validar TypeScript, imports, lint, build, DTOs, validações, auth, migrations/queries, filas, frontend e segurança.

---

## 23. HIERARQUIA DE DECISÃO
1. Segurança
2. Integridade dos dados
3. Correção
4. Confiabilidade
5. Performance
6. Manutenibilidade
7. Simplicidade
8. Conveniência

---

## 24. ESCOPO E INTEGRAÇÃO
- Esta skill cuida de **arquitetura, backend, frontend funcional, banco de dados, infraestrutura, integrações, realtime, filas, workers, segurança e performance**.
- Quando a skill `jh7-designer` estiver presente, respeitar suas definições de UI/UX e Design System; a `jh7-desenvolvedor` foca na implementação correta e integração funcional.

---

## 25. PRINCÍPIO FINAL
- **código previsível > código inteligente demais**
- **arquitetura simples e robusta > arquitetura sofisticada sem necessidade**
- **consistência > preferência pessoal**
- **integridade dos dados > conveniência**
- **automação confiável > operação manual**
- **padrões oficiais da stack > soluções improvisadas**
