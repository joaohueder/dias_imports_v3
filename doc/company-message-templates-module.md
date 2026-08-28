# Módulo de Modelos de Mensagens da Empresa (WhatsApp Marketing)

**Versão:** 2026.08.0413  
**Módulo:** `src/app/painel/configuracoes/modelos` e `src/components/painel/IphoneMockupPreview.tsx`

---

## 1. Visão Geral
Interface de gerenciamento de templates de mensagens inteligentes para campanhas e disparos no WhatsApp com visualização em tempo real no simulador/mockup de iPhone 15 Pro Max.

---

## 2. Componentes e Funcionalidades

- **Mockup iPhone 15 Pro Max (`IphoneMockupPreview.tsx`)**:
  - Exibe pré-visualização realista de mensagem enviada com foto de produto.
  - Formatação inteligente do WhatsApp (*negrito*, _itálico_, ~tachado~).
  - Substituição dinâmica em tempo de preview de variáveis (`{nome_produto}`, `{descricao_produto}`, `{preco_de}`, `{preco_por}`, `{desconto_pct}`, `{link_produto}`, `{headline}`, `{nome_empresa}`) por dados do produto selecionado ou genéricos realistas.
  - **Seletor de Produto de Exemplo**: Permite selecionar qualquer produto já cadastrado pela empresa para testar a renderização do modelo ao vivo, com fallback transparente para dados genéricos.
  - Imagem do produto com fallback seguro.
  - Balão estilo WhatsApp com hora e duplo check azul.
