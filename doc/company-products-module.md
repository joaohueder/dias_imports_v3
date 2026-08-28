# Módulo de Produtos & Catálogo (`/painel/produtos`)

**Versão:** 2026.08.0414  

## Visão Geral
O módulo de **Produtos & Catálogo** do `/painel` possibilita às empresas cadastradas no SaaS gerenciar seu inventário de produtos, configurar landing pages de alta conversão para vendas diretas e campanhas de envio automático para grupos de WhatsApp.

- **Seletor de Headline de Alta Conversão (`HeadlinePickerModal.tsx`)**:
  - Catálogo modal com **50 modelos de headlines persuasivas**, divididas em 5 categorias estratégicas (*Urgência & Escassez*, *Desconto & Preço*, *Exclusividade & VIP*, *Garantia & Confiança*, *Chamada Direta & Ação*), com busca em tempo real e inserção com 1 clique.
  - Utilizada tanto no topo das landing pages quanto na tag `{headline}` dos disparos de WhatsApp.

---

## Estrutura do Banco de Dados
Tabela: `company_products`
Migration: `0018_create_company_products_table.sql` e `0019_add_sends_count_to_company_products.sql`

Campos:
- `id` (INT AUTO_INCREMENT PRIMARY KEY)
- `company_id` (INT)
- `name` (VARCHAR 255)
- `slug` (VARCHAR 255)
- `description` (TEXT)
- `price` (DECIMAL 10, 2)
- `promo_price` (DECIMAL 10, 2 NULL)
- `status` (ENUM: 'active', 'inactive')
- `images` (JSON)
- `cover_image` (TEXT)
- `whatsapp_destination` (VARCHAR 50)
- `layout_color` (VARCHAR 50)
- `layout_theme` (VARCHAR 50)
- `cta_text` (VARCHAR 100)
- `headline` (VARCHAR 255)
- `guarantee_text` (VARCHAR 255)
- `benefits` (JSON)
- `external_link` (TEXT)
- `sends_count` (INT: Total de envios para grupos de WhatsApp)
- `views_count` (INT: Total de visualizações da página do produto)
- `clicks_count` (INT: Total de cliques no botão de conversão WhatsApp)
- `created_at`, `updated_at` (TIMESTAMP)

---

## Rotas e Endpoints da API
- `GET /api/painel/produtos`: Listagem com filtros, paginação e métricas.
- `POST /api/painel/produtos`: Cadastro de novos produtos com geração de slug automático.
- `GET /api/painel/produtos/[id]`: Detalhes completos do produto.
- `PUT /api/painel/produtos/[id]`: Atualização completa do produto.
- `DELETE /api/painel/produtos/[id]`: Exclusão de produto com confirmação via modal.
- `PATCH /api/painel/produtos/[id]/status`: Ativação e inativação rápida de status.
- `POST /api/painel/produtos/upload`: Upload de fotos para o catálogo.
- `GET /api/public/produtos/[slug]`: Endpoint público para exibição da landing page de vendas.
- `POST /api/public/produtos/[id]/click`: Rastreamento de cliques no CTA de conversão.

---

## Telas do Frontend
1. **Listagem (`/painel/produtos`)**:
   - Header vertical com SaPageHeader / Layout padrão.
   - Cards de métricas (`Total de Produtos`, `Total de Envios`, `Total de Visualizações`, `Total de Cliques`).
   - Filtros de status e busca textual.
   - Tabela responsiva com limite de 10 itens por página (`Pagination`).
   - Ações rápidas: copiar link público, editar, ativar/inativar e excluir.

2. **Cadastro & Edição em Abas (`/painel/produtos/novo` e `/painel/produtos/[id]`)**:
   - **Exibição Condicional de Abas & Permanência na Tela**: No cadastro de novo produto (`/painel/produtos/novo`), as abas adicionais (Imagens, Layout, Estatísticas) ficam ocultas. Ao clicar em "Salvar Produto", o sistema persiste o registro e redireciona automaticamente para a rota de edição do produto recém-criado (`/painel/produtos/[id]`) sem voltar para a listagem, mantendo o usuário na tela e exibindo imediatamente todas as abas (Imagens, Layout e Estatísticas).
   - **Aba 1 (Dados do produto)**: Nome, descrição, preço e preço promocional.
   - **Aba 2 (Imagens)**: Galeria de fotos com ordenação via arrastar e soltar (*drag & drop*), indicador de posição `#N`, upload com modal interativo de recorte/crop (`ImageCropperModal.tsx`), visualização com trava obrigatória de enquadramento (sem sobras vazias), quadro guia 1:1, suporte a rotação em 90° (+/-), zoom, reposicionamento e compressão inteligente automática em WebP de altíssima nitidez limitada a no máximo 300 KB por imagem.
   - **Aba 3 (Layout)**: Cor de destaque, tema visual (Dark/Light), texto do botão CTA, headline de impacto, garantia, diferenciais/benefícios e link externo.
   - **Aba 4 (Estatísticas)**: Visualização de envios para grupos de WhatsApp, visualizações da landing page, cliques no botão WhatsApp e cálculo de taxa de conversão.
   - `FloatingActionBar` para controle de alterações (`isDirty`) e validações de campos obrigatórios.

3. **Landing Page Pública (`/p/[slug]`)**:
   - Visual responsivo mobile-first nos temas Dark ou Light.
   - Carrossel / seletor de galeria de fotos.
   - Preço regular e preço promocional com tachado.
   - Botão direto para WhatsApp com mensagem personalizada e contadores de conversão.
