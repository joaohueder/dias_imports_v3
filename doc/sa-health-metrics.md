# Documentação e Memória: Métricas & Saúde do Ecossistema (/sa/health)

**Data:** 2026-08-25  
**Versão:** 2026.08.0004  
**Responsável Técnico:** JH7-DESENVOLVEDOR, JH7-DESIGNER, JH7-MESTRE-DOCUMENTACAO  

---

## 1. Visão Geral

A tela de telemetria e saúde em tempo real (`/sa/health`) fornece observabilidade completa da infraestrutura do SaaS:

- **API de Telemetria (`/api/sa/health`):**
  - Checagem síncrona do pool MySQL com cálculo de latência de query (`SELECT 1`).
  - Coleta de recursos do host: CPU (núcleos, modelo, arquitetura), Memória RAM (total, livre, usada em GB e %), Uptime do processo e versão do Node.js runtime.
  - Status dos microsserviços (Core API Gateway, Evolution API / Baileys Connector, BullMQ / Redis Queue).

- **Interface Realtime (`/sa/health`):**
  - Atualização automática contínua (polling configurável com botão de pausa/ativação).
  - Cards de KPIs para MySQL, CPU, Memória RAM (com barra de progresso gradiente) e Uptime.
  - Painel de status dos nós de processamento e serviços do cluster.
  - Indicador pulsar em tempo real e feedback com toasts.

- **Refinamento do Menu Lateral:**
  - Estilização aprimorada com ícones em containers dedicados, badges com micro-animações (`Realtime` pulsante) e indicador lateral em gradiente violeta/índigo.
