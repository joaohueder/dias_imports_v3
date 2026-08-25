# Documentação & Memória: Módulo de Edição de Perfil do Super Admin (/sa/profile)

**Data:** 2026-08-25  
**Versão:** 2026.08.0010  
**Responsável Técnico:** JH7-DESENVOLVEDOR, JH7-DESIGNER, JH7-SECURITY-GUARDIAN, JH7-MESTRE-DOCUMENTACAO  

---

## 1. Visão Geral

O módulo `/sa/profile` disponibiliza a interface completa de gestão e atualização de dados da conta do usuário autenticado no painel Super Admin:
- **Rota Visual:** `/sa/profile`
- **Endpoints de API:** `/api/sa/profile` (GET e PUT)

## 2. Funcionalidades

1. **Dados Pessoais:**
   - Edição de nome completo.
   - Atualização de número de WhatsApp de contato/notificações com máscara interativa e validação de duplicidade global.
   - Exibição de e-mail de acesso institucional protegido.

2. **Segurança & Credenciais:**
   - Alteração segura de senha de acesso com validação da senha atual.
   - Verificação de confirmação de senha e comprimento mínimo de 6 caracteres.

3. **Integração de Interface:**
   - Acesso direto a partir do menu do usuário no topo (`SaLayoutClient.tsx`).
