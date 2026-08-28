-- 0040_create_sa_message_templates_table.sql
-- Tabela de modelos mestre/padrão de mensagens do SaaS para snapshot em novas empresas

CREATE TABLE IF NOT EXISTS sa_message_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'product_offer',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO sa_message_templates (id, title, content, type, status)
VALUES (
  1,
  '🔥 Oferta Exclusiva com Preço e Link',
  '🚀 *{nome_produto}*\n\n{headline}\n\nDe: ~{preco_de}~\n🔥 *Por apenas: {preco_por}*\n\n🛒 Garanta o seu agora no link exclusivo:\n{link_produto}\n\n_Promoção por tempo limitado enquanto durarem os estoques!_',
  'product_offer',
  'active'
);

INSERT IGNORE INTO sa_message_templates (id, title, content, type, status)
VALUES (
  2,
  '⚡ Lançamento & Acesso Antecipado VIP',
  '✨ *CHEGOU NOVIDADE NO ESTOQUE!* ✨\n\n*{nome_produto}*\n\n{subheadline}\n\n💥 Condição especial para membros do grupo:\n*R$ {preco_por}*\n\n👉 Acesse agora antes que acabe:\n{link_produto}',
  'product_offer',
  'active'
);

INSERT IGNORE INTO sa_message_templates (id, title, content, type, status)
VALUES (
  3,
  '⏳ Últimas Unidades / Alerta de Estoque',
  '⚠️ *ÚLTIMAS PEÇAS DISPONÍVEIS!* ⚠️\n\nProduto: *{nome_produto}*\nDe ~{preco_de}~ por apenas *{preco_por}*\n\nNão deixe para depois! Clique abaixo e finalize seu pedido:\n{link_produto}',
  'product_offer',
  'active'
);
