# Documentação & Memória: Módulo de Assinaturas (/sa/subscriptions)

**Data:** 2026-08-27  
**Versão:** 2026.08.0481  
**Responsável Técnico:** JH7-DESENVOLVEDOR, JH7-DESIGNER, JH7-MESTRE-DOCUMENTACAO, JH7-SECURITY-GUARDIAN  

---

## 1. Visão Geral do Módulo

O módulo **Assinaturas** no painel do Super Admin ([src/app/sa/subscriptions/page.tsx](../src/app/sa/subscriptions/page.tsx)) centraliza a listagem, acompanhamento de vigências contratuais, recorrência e gestão de contratos vinculados aos tenants do sistema.

### Principais Recursos
1. **Filtro Padrão Inicial em "Ativas":**
   - A listagem carrega por padrão filtrando as assinaturas com status `active` (ativas).
   - Menu rápido com abas segmentadas por status: `Ativas`, `Inadimplentes`, `Canceladas`, `Expiradas` e `Todas` (sem opção de degustação/trialing).
   - Botão dinâmico de **Limpar Filtros** na barra de busca e no estado vazio.

2. **Organização Visual & UX Aprimorada:**
   - Alinhamento vertical centralizado (`align-middle`) com larguras de colunas proporcionais equilibradas.
   - Bloco de Tenant com Razão Social em destaque, Nome Fantasia e identificação inteligente de documento via `formatDocumentWithLabel` (`CPF: 000.000.000-00` ou `CNPJ: 00.000.000/0000-00`).
   - Detalhamento de vigência com labels cinzas (`Início:` e `Término:`) alinhadas e datas em branco/destaque, sem quebras desordenadas.
   - **Exibição de Limites em Linha Dedicada**: Os limites operacionais são exibidos em linha dedicada no formato `uso / limite` para cada recurso contratado (`Grupos`, `Produtos`, `Envios/dia`, `Visualizações` e `Leads`).
   - Botão **Gerenciar** com redirecionamento direto para a aba de assinatura da empresa (`/sa/companies/[id]?tab=subscription`).

3. **Controle de Vigência (Início, Término e Dias Restantes):**
   - Exibe a data em que o contrato/ciclo iniciou (`Início: DD/MM/AAAA`).
   - Exibe a data de término prevista para assinaturas ativas (`Término: DD/MM/AAAA`) ou data em que encerrou (`Encerrou: DD/MM/AAAA`).
   - Contador de dias restantes ou indicador de vencimento próximo/vencido.

---

## 2. Endpoints REST da API

- `GET /api/sa/subscriptions?status=active` — Lista assinaturas com filtros por status e empresa.
- `POST /api/sa/subscriptions` — Criação ou renovação de contrato com snapshot de plano.
- `PATCH /api/sa/subscriptions/[id]/expire` — Encerramento imediato de vigência.
- `PATCH /api/sa/subscriptions/[id]/limits` — Ajuste personalizado de quotas do snapshot.
