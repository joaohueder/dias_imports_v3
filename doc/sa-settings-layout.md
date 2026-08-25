# Parâmetros do SaaS & Governança de Layout

## Visão Geral
Módulo de parametrização global do Super Admin com foco em governança de layout, design system e persistência de resolução.

## Funcionalidades
1. **Aba Layout**:
   - **Preset Mínimo**: `1200px` (Padrão de referência do sistema).
   - **Preset Médio**: `1440px`.
   - **Preset Full**: `100%` (Fluído).
   - **Largura Personalizada (Spinner & Slider)**: com valor numérico mínimo estrito de `1200px` e passos de `50px` ou livre digitação.
2. **Preview em Tempo Real**:
   - Ao clicar em qualquer preset ou alterar o spinner numérico, o container principal do painel ajusta sua largura imediatamente em tela sem persistir.
   - O usuário pode navegar, inspecionar e testar como as tabelas e grids se comportam.
3. **Persistência Controlada via FloatingActionBar**:
   - As alterações ativam o estado `isDirty`, exibindo a `FloatingActionBar`.
   - Clicar em "Descartar Preview" desfaz e restaura a configuração previamente salva.
   - Clicar em "Salvar Configuração" persiste via API `/api/sa/settings` na tabela `system_settings` e no `localStorage`.
4. **Migration de Banco de Dados**:
   - Migration `0010_create_system_settings_table.sql` criada para registrar as chaves de configuração do SaaS de forma dinâmica.
