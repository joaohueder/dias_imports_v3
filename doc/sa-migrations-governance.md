# Documentação & Memória: Governança de Migrations (/sa/migrations)

**Data:** 2026-08-25  
**Versão:** 2026.08.0005  
**Responsável Técnico:** JH7-DESENVOLVEDOR, JH7-DESIGNER, JH7-SECURITY-GUARDIAN, JH7-MESTRE-DOCUMENTACAO  

---

## 1. Visão Geral

Conforme especificado em [regras.md](../regras.md), todas as alterações de esquema no banco MySQL geram scripts incrementais que não podem sofrer perda de dados.

A rota `/sa/migrations` disponibiliza o painel operacional de visualização e aplicação de scripts:
- **Tabela de Controle:** `_migrations` (guarda histórico de execução, timestamps e responsável).
- **Diretório dos Scripts:** `src/lib/migrations/*.sql`.
- **Ordenação Prioritária:** Exibe sempre as migrations pendentes primeiro no topo, em ordem cronológica de execução.
- **Validação Sequencial Rígida:** O sistema impede que qualquer migration seja executada fora de ordem (apenas a próxima da fila é desbloqueada).
- **Execução em Lote:** Botão "Aplicar Todas as Pendentes" para execução segura e sequencial de múltiplos scripts de uma só vez.
- **Trava de Segurança:** Modal de autorização com checagem de senha do Super Admin antes de executar qualquer instrução DDL/DML.
- **Preview de SQL:** Visualizador interativo de queries de cada migration.
