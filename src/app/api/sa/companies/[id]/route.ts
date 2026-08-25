import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";
import { deleteEvolutionInstance } from "@/lib/evolution";

export const dynamic = "force-dynamic";

// GET - Obter detalhes de uma empresa
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSaPermission("companies", "view");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const { id } = await params;
    const pool = getDbPool();

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         c.*, 
         COUNT(DISTINCT u.id) as user_count,
         COALESCE(sub.plan_snapshot_name, p.name, c.plan) as current_plan_name,
         sub.status as subscription_status,
         sub.id as active_subscription_id,
         COALESCE(sub.plan_snapshot_max_groups, p.max_groups, 0) as quota_max_groups,
         COALESCE(sub.plan_snapshot_max_products, p.max_products, 0) as quota_max_products,
         COALESCE(sub.plan_snapshot_max_messages_day, p.max_messages_day, c.max_messages_day) as quota_max_messages_day,
         COALESCE(sub.plan_snapshot_max_instances, p.max_instances, c.max_instances) as quota_max_instances
       FROM companies c 
       LEFT JOIN users u ON u.company_id = c.id 
       LEFT JOIN (
         SELECT s1.*
         FROM subscriptions s1
         INNER JOIN (
           SELECT company_id, MAX(id) as max_id
           FROM subscriptions
           WHERE status = 'active'
           GROUP BY company_id
         ) s2 ON s1.id = s2.max_id
       ) sub ON sub.company_id = c.id
       LEFT JOIN plans p ON sub.plan_id = p.id
       WHERE c.id = ? 
       GROUP BY c.id, sub.id, sub.plan_snapshot_name, sub.status, sub.plan_snapshot_max_groups, sub.plan_snapshot_max_products, sub.plan_snapshot_max_messages_day, sub.plan_snapshot_max_instances, p.name, p.max_groups, p.max_products, p.max_messages_day, p.max_instances`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, company: rows[0] });
  } catch (error: unknown) {
    console.error("Erro na rota /api/sa/companies/[id]:", error);
    const message = error instanceof Error ? error.message : "Erro ao carregar empresa";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT - Atualizar empresa existente
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {    const auth = await requireSaPermission("companies", "edit");
    if (!auth.authorized) return auth.response;
    await initAuthDatabase();
    const { id } = await params;
    const pool = getDbPool();
    const body = await request.json();

    const {
      name,
      trade_name,
      document,
      email,
      whatsapp,
      admin_whatsapp,
      plan,
      status,
      max_instances,
      max_messages_day,
      address_zipcode,
      address_street,
      address_number,
      address_complement,
      address_neighborhood,
      address_city,
      address_state,
    } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "A Razão Social / Nome da Empresa é obrigatório." },
        { status: 400 }
      );
    }

    if (!admin_whatsapp || admin_whatsapp.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "O WhatsApp de Acesso Admin é obrigatório." },
        { status: 400 }
      );
    }

    if (document && document.trim().length > 0) {
      const [existingDoc] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM companies WHERE document = ? AND id != ?",
        [document.trim(), id]
      );
      if (existingDoc.length > 0) {
        return NextResponse.json(
          { success: false, error: "Já existe outra empresa com este Documento (CNPJ/CPF)." },
          { status: 409 }
        );
      }
    }

    // Validação de unicidade do admin_whatsapp (excluindo a própria empresa)
    const cleanAdminWhatsapp = admin_whatsapp.replace(/\D/g, "");
    const [existingAdminWa] = await pool.query<RowDataPacket[]>(
      `SELECT id, name FROM companies 
       WHERE REPLACE(REPLACE(REPLACE(REPLACE(admin_whatsapp, ' ', ''), '-', ''), '(', ''), ')', '') = ?
         AND id != ?`,
      [cleanAdminWhatsapp, id]
    );

    if (existingAdminWa.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Este WhatsApp de Acesso Admin já pertence à empresa "${existingAdminWa[0].name}". O WhatsApp admin deve ser único no sistema todo.`,
        },
        { status: 409 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE companies SET 
        name = ?, 
        trade_name = ?, 
        document = ?, 
        email = ?, 
        whatsapp = ?,
        admin_whatsapp = ?,
        plan = COALESCE(?, plan), 
        status = COALESCE(?, status), 
        max_instances = COALESCE(?, max_instances), 
        max_messages_day = COALESCE(?, max_messages_day), 
        address_zipcode = ?,
        address_street = ?,
        address_number = ?,
        address_complement = ?,
        address_neighborhood = ?,
        address_city = ?, 
        address_state = ?
      WHERE id = ?`,
      [
        name.trim(),
        trade_name?.trim() || null,
        document?.trim() || null,
        email?.trim() || null,
        whatsapp?.trim() || null,
        admin_whatsapp?.trim() || null,
        plan || null,
        status || null,
        max_instances ? Number(max_instances) : null,
        max_messages_day ? Number(max_messages_day) : null,
        address_zipcode?.trim() || null,
        address_street?.trim() || null,
        address_number?.trim() || null,
        address_complement?.trim() || null,
        address_neighborhood?.trim() || null,
        address_city?.trim() || null,
        address_state?.trim() || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Empresa não encontrada para atualização." },
        { status: 404 }
      );
    }

    // Sincronizar usuário COMPANY_ADMIN com o novo admin_whatsapp
    try {
      const [existingUser] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM users WHERE company_id = ? AND role = 'COMPANY_ADMIN' LIMIT 1",
        [id]
      );

      if (existingUser.length > 0) {
        try {
          await pool.query(
            "UPDATE users SET whatsapp = ?, name = ? WHERE id = ?",
            [admin_whatsapp.trim(), trade_name?.trim() || name.trim(), existingUser[0].id]
          );
        } catch (updateUserErr: unknown) {
          const sqlMsg = updateUserErr instanceof Error ? updateUserErr.message : "";
          if (sqlMsg.includes("Unknown column 'whatsapp'")) {
            await pool.query(
              "UPDATE users SET name = ? WHERE id = ?",
              [trade_name?.trim() || name.trim(), existingUser[0].id]
            );
          } else {
            console.warn("Aviso ao atualizar usuário admin da empresa:", updateUserErr);
          }
        }
      } else {
        const generatedEmail = email?.trim() || `admin_${id}@empresa.com`;
        try {
          await pool.query(
            `INSERT INTO users (name, email, whatsapp, password, role, company_id, status)
             VALUES (?, ?, ?, '123456', 'COMPANY_ADMIN', ?, 'active')`,
            [trade_name?.trim() || name.trim(), generatedEmail, admin_whatsapp.trim(), id]
          );
        } catch (insertUserErr: unknown) {
          const sqlMsg = insertUserErr instanceof Error ? insertUserErr.message : "";
          if (sqlMsg.includes("Unknown column 'whatsapp'")) {
            await pool.query(
              `INSERT INTO users (name, email, password, role, company_id, status)
               VALUES (?, ?, '123456', 'COMPANY_ADMIN', ?, 'active')`,
              [trade_name?.trim() || name.trim(), generatedEmail, id]
            );
          } else {
            console.warn("Aviso ao criar usuário admin da empresa:", insertUserErr);
          }
        }
      }
    } catch (syncErr) {
      console.warn("Aviso ao sincronizar usuário admin da empresa:", syncErr);
    }

    return NextResponse.json({
      success: true,
      message: "Empresa atualizada com sucesso.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar empresa";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE - Remover empresa
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSaPermission("companies", "delete");
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const pool = getDbPool();

    // Desassociar ou checar usuários vinculados
    await pool.query("UPDATE users SET company_id = NULL WHERE company_id = ?", [id]);

    // Buscar e remover instâncias WhatsApp associadas (tanto na Evolution API quanto no banco de dados)
    try {
      const [instances] = await pool.query<RowDataPacket[]>(
        "SELECT id, name FROM instances WHERE company_id = ?",
        [id]
      );

      for (const inst of instances) {
        if (inst.name) {
          try {
            await deleteEvolutionInstance(inst.name);
          } catch (evoErr) {
            console.warn(`Aviso: Erro ao deletar instância ${inst.name} na Evolution API:`, evoErr);
          }
        }
      }

      await pool.query("DELETE FROM instances WHERE company_id = ?", [id]);
    } catch (instErr) {
      console.warn("Aviso ao remover instâncias da empresa:", instErr);
    }

    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM companies WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Empresa não encontrada para exclusão." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Empresa excluída com sucesso.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao excluir empresa";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
