import { NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const DEFAULT_PRESET_TEMPLATES = [
  {
    title: "🔥 Oferta Relâmpago (Alta Conversão)",
    type: "product_offer",
    content: "🔥 *OFERTA EXCLUSIVA DO DIA!*\n\n*{nome_produto}*\n\n✨ {headline}\n\nDe: ~{preco_de}~\n*Por apenas: {preco_por}* ({desconto_pct}% OFF!)\n\n👉 *Garanta o seu aqui:* {link_produto}\n\n⚡ _Estoque limitado. Corre antes que acabe!_",
  },
  {
    title: "🚨 Alerta de Reposição / Lançamento",
    type: "product_offer",
    content: "🚨 *NOVIDADE IMPERDÍVEL!*\n\nAcabamos de liberar *{nome_produto}* com desconto especial no grupo VIP.\n\n💰 *Valor exclusivo:* {preco_por}\n\n🔗 *Clique no link oficial:*\n{link_produto}\n\n🏃‍♂️ Aproveite enquanto ainda temos unidades disponíveis!",
  },
  {
    title: "⚡ Queima de Estoque / Últimas Unidades",
    type: "product_offer",
    content: "⚡ *ÚLTIMAS UNIDADES EM ESTOQUE!*\n\n*{nome_produto}*\n\n{descricao_produto}\n\n💥 De ~{preco_de}~ por apenas *{preco_por}*!\n\n🛒 Link direto para pedido:\n{link_produto}\n\nEntrega rápida e garantida pela *{nome_empresa}*.",
  },
  {
    title: "🎁 Cupom Especial Grupo VIP",
    type: "product_offer",
    content: "🎁 *CONDIÇÃO ESPECIAL PARA MEMBROS DO GRUPO*\n\n*{nome_produto}*\n\nValor promocional exclusivo: *{preco_por}* ({desconto_pct}% de desconto)\n\n👉 Compre agora com segurança:\n{link_produto}\n\n_Dúvidas? Chame um dos nossos administradores._",
  },
];

export async function POST() {
  try {
    const cookieStore = await cookies();
    const impersonateCompanyId = cookieStore.get("company_id")?.value;

    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado." }, { status: 401 });
    }

    const companyId = user.company_id || (impersonateCompanyId ? parseInt(impersonateCompanyId, 10) : 1);
    const pool = getDbPool();

    let importedCount = 0;

    // Buscar templates globais do SaaS primeiro, se houver
    let templatesToImport = DEFAULT_PRESET_TEMPLATES;
    try {
      const [saTemplates] = await pool.query<RowDataPacket[]>(
        `SELECT title, content, type FROM sa_message_templates WHERE status = 'active'`
      );
      if (saTemplates && saTemplates.length > 0) {
        templatesToImport = saTemplates.map((t) => ({
          title: t.title,
          content: t.content,
          type: "product_offer",
        }));
      }
    } catch {
      // Usa DEFAULT_PRESET_TEMPLATES como fallback
    }

    for (const tmpl of templatesToImport) {
      if (!tmpl.title || !tmpl.content) continue;
      
      // Verificar se já existe um modelo com título idêntico na empresa
      const [existing] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM company_message_templates WHERE company_id = ? AND title = ? LIMIT 1`,
        [companyId, tmpl.title]
      );

      const templateType = ['product_offer', 'simple_text', 'welcome', 'reminder', 'custom'].includes(tmpl.type)
        ? tmpl.type
        : 'product_offer';

      if (existing.length === 0) {
        await pool.query<ResultSetHeader>(
          `INSERT INTO company_message_templates (company_id, title, content, type, status)
           VALUES (?, ?, ?, ?, 'active')`,
          [companyId, tmpl.title, tmpl.content, templateType]
        );
        importedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message:
        importedCount > 0
          ? `${importedCount} modelo(s) pré-configurado(s) importado(s) com sucesso!`
          : "Todos os modelos pré-configurados já estão cadastrados na sua conta.",
      importedCount,
    });
  } catch (error: any) {
    console.error("Erro ao importar modelos pré-configurados:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao importar modelos." },
      { status: 500 }
    );
  }
}
