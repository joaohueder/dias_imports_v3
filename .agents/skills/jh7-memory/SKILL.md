---
name: jh7-memory
description: "Guardiã da memória técnica e funcional do projeto. Use para consultar e manter o conhecimento centralizado (visão geral, arquitetura, regras de negócio, banco, APIs, diretórios, decisões e problemas conhecidos), reduzindo alucinações, retrabalho e consumo de tokens."
---

# JH7-MEMORY

Essa skill é a **guardiã da memória técnica e funcional do projeto**. Sua missão é assegurar que todo conhecimento essencial, decisões arquiteturais e regras do sistema estejam registrados de forma estruturada, confiável e acessível, evitando que fiquem retidos apenas no contexto temporário do chat.

---

## 1. OBJETIVO E ESCOPO
- **Fonte de Verdade:** Centralizar a base de conhecimento viva do projeto.
- **Eficiência e Assertividade:** Reduzir alucinações, retrabalho, decisões inconsistentes e consumo excessivo de tokens.
- **Escopo Exclusivo:** Esta skill **não implementa funcionalidades de código**. Ela apenas organiza, mantém, valida e fornece conhecimento confiável para todas as demais skills.

---

## 2. REGRAS FUNDAMENTAIS

### 2.1. Consulta Obrigatória Pré-Implementação
- Sempre consultar a memória antes de qualquer implementação ou refatoração.
- Se uma informação ou decisão já estiver documentada, reutilize-a diretamente.
- Evite ler dezenas de arquivos no repositório quando a resposta já estiver consolidada na memória.

### 2.2. Organização Modular do Conhecimento
A memória técnica deve ser dividida em seções modulares e bem delimitadas:
1. **Visão Geral do Projeto:** Objetivo, contexto de negócio e escopo geral.
2. **Arquitetura do Sistema:** Padrões, fluxo de dados e integrações.
3. **Regras de Negócio:** Políticas, restrições e lógicas centrais de domínio.
4. **Banco de Dados & Modelagem:** Schemas, tabelas, relacionamentos e convenções.
5. **APIs & Contratos:** Endpoints, formatos de requisição/resposta e autenticação.
6. **Estrutura de Diretórios & Padrões:** Mapa de pastas e papéis de cada módulo.
7. **Decisões Técnicas & ADRs:** Registro histórico de escolhas técnicas fundamentadas.
8. **Problemas Conhecidos & Soluções (Troubleshooting):** Edge cases, bugs mapeados e contornos.

### 2.3. Imutabilidade e Depreciação de Decisões
- **Nunca apague decisões passadas:** Ao substituir uma diretriz ou decisão, não exclua o histórico; marque a decisão anterior como `[OBSOLETA]` / `[DEPRECIADA]` e referencie a nova decisão com sua devida justificativa.

### 2.4. Atualização Incremental e Foco
- Após concluir qualquer implementação, verifique se houve alteração técnica ou funcional relevante.
- Atualize **apenas a seção afetada**, sem reescrever ou duplicar dados não relacionados.
- Mantenha a documentação enxuta, clara e sem redundâncias.

### 2.5. Tratamento de Conflitos de Informação
- Se for identificada qualquer divergência entre o código existente, a documentação ou novas instruções:
  - **Não tome decisões arbitrárias ou isoladas.**
  - Interrompa a execução e sinalize imediatamente a inconsistência para alinhamento.

### 2.6. Princípios de Redação
- Priorizar sempre clareza, objetividade técnica, síntese precisa e consistência terminológica.
