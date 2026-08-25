---
name: jh7-evolution-2.3.7
description: "Especialista sênior na Evolution API v2.3.7 e integração com WhatsApp (Baileys/Typebot/Webhooks/Chatwoot/SQS/Redis/RabbitMQ). Use sempre ao falar, integrar, gerenciar instâncias, enviar mensagens, grupos, webhooks, eventos, status e automações de WhatsApp."
---

# JH7-EVOLUTION-2.3.7

Esta skill é a **especialista sênior oficial em Evolution API (v2.3.7)** e arquitetura de integração com o **WhatsApp**.
Ela orienta o desenvolvimento de integrações, gestão de instâncias, mensageria, eventos via Webhook/WebSocket, automações de grupos, segurança de credenciais, tratamento de rate limiting e resiliência operacional.

---

## 1. ESCOPO DE ATUAÇÃO E IDENTIDADE
- **Versão Alvo:** Evolution API v2.3.7
- **Mecanismos Suportados:** Baileys (padrão principal), Typebot, Chatwoot, Dify, OpenAI/Agents.
- **Camadas de Integração:** 
  - Criação e ciclo de vida de Instâncias (`/instance/*`)
  - Conexão e leitura de QR Code / Pairing Code (`/instance/connect/*`)
  - Envio de Mensagens de Texto, Mídia, Áudio/PTT, Documentos, Enquetes, Botões e Listas (`/message/*`)
  - Gestão e Administração de Grupos de WhatsApp (`/group/*`)
  - Gestão de Contatos, Presença e Perfil (`/chat/*`, `/contact/*`, `/profile/*`)
  - Configuração de Webhooks e Eventos em tempo real (`/webhook/*`, `/websocket/*`)
  - Configurações de Comportamento e Integrações (`/settings/*`, `/typebot/*`, `/chatwoot/*`)

---

## 2. AUTENTICAÇÃO E HEADERS
A Evolution API v2.3.7 opera com dois níveis de chaves:
1. **Global API Key (`apikey`):** Chave mestra definida no arquivo `.env` da Evolution (`AUTHENTICATION_API_KEY`). Utilizada para listar, criar, deletar e gerenciar configurações globais de instâncias.
2. **Instance Token / API Key:** Token específico de cada instância (gerado na criação ou customizado).

### Headers Padrão em Requisições HTTP
```http
apikey: {{GLOBAL_API_KEY_OR_INSTANCE_TOKEN}}
Content-Type: application/json
```

---

## 3. PRINCIPAIS ENDPOINTS (EVOLUTION API v2.3.7)

### 3.1 Gestão de Instâncias (`/instance`)
- `POST /instance/create`
  - Criação de nova instância.
  - Body:
    ```json
    {
      "instanceName": "marketing_01",
      "token": "token-opcional-customizado",
      "qrcode": true,
      "number": "5511999999999", // opcional para pairing code
      "integration": "WHATSAPP-BAILEYS",
      "rejectCall": true,
      "msgCall": "Não aceitamos chamadas por este canal.",
      "groupsIgnore": false,
      "alwaysOnline": true,
      "readMessages": false,
      "readStatus": false,
      "syncFullHistory": false
    }
    ```
- `GET /instance/connect/:instance`
  - Retorna o estado atual ou gera QR Code (Base64 + ASCII / Code string) para pareamento.
- `GET /instance/connectionState/:instance`
  - Retorna o estado da conexão (`open`, `connecting`, `close`, `refused`).
- `DELETE /instance/logout/:instance`
  - Desconecta o número do WhatsApp da instância sem deletá-la.
- `DELETE /instance/delete/:instance`
  - Remove a instância e seus dados locais.
- `POST /instance/restart/:instance`
  - Reinicia o processo da instância.
- `GET /instance/fetchInstances`
  - Lista todas as instâncias existentes com seus status.

---

### 3.2 Envio de Mensagens (`/message`)
- `POST /message/sendText/:instance`
  ```json
  {
    "number": "5511999999999", // ou "12036304xxxxxxxxxx@g.us" para grupos
    "text": "Olá! Esta é uma mensagem do JH7 Marketing.",
    "delay": 1200,
    "linkPreview": true,
    "mentionsEveryOne": false,
    "mentioned": ["5511999999999@s.whatsapp.net"]
  }
  ```
- `POST /message/sendMedia/:instance`
  ```json
  {
    "number": "5511999999999",
    "mediatype": "image", // "image" | "video" | "document"
    "mimetype": "image/jpeg",
    "caption": "Confira nossa novidade!",
    "media": "https://dominio.com/imagem.jpg", // URL ou Base64
    "fileName": "banner.jpg"
  }
  ```
- `POST /message/sendWhatsAppAudio/:instance`
  - Envia áudio simulando gravação em tempo real (PTT / Voice Note).
  ```json
  {
    "number": "5511999999999",
    "audio": "https://dominio.com/audio.mp3",
    "delay": 1500,
    "encoding": true
  }
  ```
- `POST /message/sendPoll/:instance`
  - Envio de enquete nativa do WhatsApp.
  ```json
  {
    "number": "12036304xxxxxxxxxx@g.us",
    "name": "Qual seu interesse principal?",
    "selectableCount": 1,
    "values": ["Importação", "Marketing de Grupos", "Automação"]
  }
  ```
- `POST /message/sendReaction/:instance`
  - Reage a uma mensagem com emoji.
  ```json
  {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "BAE5XXXXXX"
    },
    "reaction": "🔥"
  }
  ```

---

### 3.3 Gestão Avançada de Grupos (`/group`)
Essencial para o ecossistema do **JH7 Marketing**.
- `POST /group/createGroup/:instance`: Cria novo grupo WhatsApp com participantes e foto.
- `GET /group/fetchAllGroups/:instance?getParticipants=true`: Lista todos os grupos onde a instância participa com lista de participantes e metadados.
- `GET /group/findGroupInfos/:instance?groupJid=...`: Obtém detalhes, descrição, permissões e participantes de um grupo específico.
- `POST /group/updateParticipant/:instance`: Adiciona, remove, promove a admin ou rebaixa participantes (`action: "add" | "remove" | "promote" | "demote"`).
- `POST /group/updateGroupSetting/:instance`: Altera permissões de envio de mensagens (`announcement`: apenas admins falam ou todos falam) e edição de dados.
- `POST /group/updateGroupPicture/:instance`: Atualiza a imagem de perfil do grupo.
- `POST /group/updateGroupSubject/:instance`: Atualiza o título/nome do grupo.
- `POST /group/updateGroupDescription/:instance`: Atualiza a descrição/regras do grupo.
- `GET /group/inviteCode/:instance?groupJid=...`: Obtém o link de convite do grupo.
- `POST /group/revokeInviteCode/:instance`: Revoga o código de convite e gera um novo.

---

### 3.4 Webhooks e Eventos (`/webhook`)
- `POST /webhook/set/:instance`
  - Define a URL de webhook para recepção de eventos.
  - Eventos críticos:
    - `CONNECTION_UPDATE`: Mudança no status da conexão (`connecting`, `open`, `close`).
    - `MESSAGES_UPSERT`: Novas mensagens recebidas ou enviadas.
    - `MESSAGES_UPDATE`: Atualização de status de leitura/entrega (ACK: 1=PENDING, 2=SERVER_ACK, 3=DELIVERY_ACK, 4=READ, 5=PLAYED).
    - `SEND_MESSAGE`: Confirmação de disparo.
    - `GROUPS_UPSERT` / `GROUP_UPDATE` / `GROUP_PARTICIPANTS_UPDATE`: Alterações e entrada/saída em grupos.
    - `QRCODE_UPDATED`: Novo QR code gerado para exibição em tempo real.

---

## 4. BOAS PRÁTICAS E SEGURANÇA NO JH7 MARKETING
1. **Proteção Contra Banimento e Aquecimento (Warmup):**
   - Respeitar intervalos e `delay` randômicos entre mensagens (humanização).
   - Não disparar rajadas massivas a partir de uma única instância sem fila (Redis + BullMQ).
   - Utilizar controle de concorrência e rate limiting por chip/instância.
2. **Formato de Identificadores (JIDs):**
   - Usuário individual: `5511999999999@s.whatsapp.net`
   - Grupo: `12036304xxxxxxxxxx@g.us`
   - Sanitização de números: sempre remover caracteres especiais `()+- ` e validar o DDI/DDD antes do envio.
3. **Resiliência de Conexão:**
   - Tratar desconexões (`status: close`, `statusCode: 401 | 408 | 515`).
   - Não tentar reconectar instantaneamente em loop fechado; usar backoff exponencial.
   - Atualizar a tabela `instances` no banco de dados sincronizando o status real via Webhook ou polling controlado.
4. **Isolamento Multi-Tenant:**
   - Assegurar que cada empresa/usuário tenha acesso apenas às suas próprias instâncias vinculadas no banco de dados (`company_id`).

---
