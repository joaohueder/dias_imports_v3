# Memória do Projeto - Telas de Autenticação

## 1. Dados do Projeto
- **Nome do Sistema:** JH7 Marketing
- **Descrição:** Gerenciamento de Marketing em Grupos de WhatsApp
- **Versão Atual:** `2026.08.0001`
- **Rodapé:** Desenvolvido por JH7

## 2. Visão Geral
Telas de autenticação desenvolvidas com estética moderna/glassmorphism dark mode, partículas e gradientes animados no fundo, divididas em duas colunas responsivas com distinção de identidade visual e conteúdo:

### A. Portal da Empresa (`/painel/login`)
- **Paleta de Cores:** Tons esmeralda / teal / slate escuro.
- **Coluna Esquerda:** Focada no usuário final e marketing em grupos de WhatsApp (automação de ofertas, disparos programados, proteção anti-bloqueio).
- **Coluna Direita:** Login com formulário com e-mail, senha e botão "Entrar no Painel".

### B. Super Admin SaaS (`/sa/login`)
- **Paleta de Cores:** Tons índigo / violeta / roxo profundo.
- **Coluna Esquerda:** Focada na gestão da plataforma SaaS (visão geral do ecossistema, controle central & multi-tenant, gestão de empresas, instâncias e filas).
- **Coluna Direita:** Login administrativo com botão "Entrar no Painel Super Admin".

## 2. Rotas
- `/sa/login`: Tela de login do Super Admin do SaaS (Paleta Índigo/Violeta).
- `/painel/login`: Tela de login do Portal da Empresa / Cliente (Paleta Esmeralda/Teal).
- `/`: Redirecionamento padrão para `/painel/login`.

## 3. Componentes
- `src/components/auth/AnimatedBackground.tsx`: Suporta paletas dinâmicas (`emerald` e `indigo`) com gradientes animados e partículas.
- `src/components/auth/AuthFormLayout.tsx`: Configuração adaptável por tipo (`sa` vs `painel`) para textos, badges, ícones e esquemas de cores.
