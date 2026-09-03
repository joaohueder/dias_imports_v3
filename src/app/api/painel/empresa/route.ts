import { NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { unmask } from "@/lib/validators";

export const dynamic = "force-dynamic";

// GET - Obter os dados completos da empresa para edição
export async function GET() {
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

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.*, 
              COALESCE(
                (SELECT p.name FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1),
                c.plan,
                'Personalizado'
              ) as current_plan_name
       FROM companies c 
       WHERE c.id = ? 
       LIMIT 1`,
      [companyId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Empresa não encontrada." }, { status: 404 });
    }

    const companyData = rows[0];
    let backupCodes = [];
    if (companyData.backup_codes) {
      try {
        backupCodes = typeof companyData.backup_codes === "string"
          ? JSON.parse(companyData.backup_codes)
          : companyData.backup_codes;
      } catch {}
    }

    // Se ainda não tiver códigos reservas gerados, gera automaticamente
    if (!Array.isArray(backupCodes) || backupCodes.length === 0) {
      const { generateBackupCodes } = await import("@/lib/backup-codes");
      backupCodes = generateBackupCodes(10);
      await pool.query(
        "UPDATE companies SET backup_codes = ? WHERE id = ?",
        [JSON.stringify(backupCodes), companyId]
      );
      companyData.backup_codes = backupCodes;
    } else {
      companyData.backup_codes = backupCodes;
    }

    return NextResponse.json({
      success: true,
      company: companyData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao buscar dados da empresa." },
      { status: 500 }
    );
  }
}

// PUT - Atualizar todos os dados da empresa
export async function PUT(request: Request) {
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
    const body = await request.json();

    const {
      name,
      trade_name,
      document,
      email,
      phone,
      whatsapp,
      admin_whatsapp,
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
        { success: false, message: "A Razão Social / Nome da Empresa é obrigatório." },
        { status: 400 }
      );
    }

    if (!trade_name || trade_name.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "O Nome Fantasia / Marca é obrigatório." },
        { status: 400 }
      );
    }

    const cleanDoc = document ? unmask(document) : null;
    if (!cleanDoc || (cleanDoc.length !== 11 && cleanDoc.length !== 14)) {
      return NextResponse.json(
        { success: false, message: "O CPF (11 dígitos) ou CNPJ (14 dígitos) é obrigatório e deve ser válido." },
        { status: 400 }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, message: "O E-mail Corporativo é obrigatório e deve ser válido." },
        { status: 400 }
      );
    }

    const cleanWhatsapp = whatsapp ? unmask(whatsapp) : (phone ? unmask(phone) : null);
    if (!cleanWhatsapp || cleanWhatsapp.length < 10) {
      return NextResponse.json(
        { success: false, message: "O WhatsApp da Empresa é obrigatório." },
        { status: 400 }
      );
    }

    const cleanAdminWhatsapp = admin_whatsapp ? unmask(admin_whatsapp) : null;
    if (!cleanAdminWhatsapp || cleanAdminWhatsapp.length < 10) {
      return NextResponse.json(
        { success: false, message: "O WhatsApp de Login / Administrador é obrigatório." },
        { status: 400 }
      );
    }

    // Se documento informado, valida duplicidade em outra empresa
    if (cleanDoc && cleanDoc.length > 0) {
      const [dup] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM companies WHERE document = ? AND id != ?",
        [cleanDoc, companyId]
      );
      if (dup.length > 0) {
        return NextResponse.json(
          { success: false, message: "Já existe outra empresa cadastrada com este CNPJ/CPF." },
          { status: 400 }
        );
      }
    }

    // Se admin_whatsapp informado, valida duplicidade em outra empresa
    if (cleanAdminWhatsapp && cleanAdminWhatsapp.length > 0) {
      const [dupAdmin] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM companies WHERE admin_whatsapp = ? AND id != ?",
        [cleanAdminWhatsapp, companyId]
      );
      if (dupAdmin.length > 0) {
        return NextResponse.json(
          { success: false, message: "Este WhatsApp de Administrador já está em uso por outra empresa." },
          { status: 400 }
        );
      }
    }

    const cleanPhone = cleanWhatsapp;
    const cleanZipcode = address_zipcode ? unmask(address_zipcode) : null;

    await pool.query(
      `UPDATE companies SET 
        name = ?,
        trade_name = ?,
        document = ?,
        email = ?,
        phone = ?,
        whatsapp = ?,
        admin_whatsapp = ?,
        address_zipcode = ?,
        address_street = ?,
        address_number = ?,
        address_complement = ?,
        address_neighborhood = ?,
        address_city = ?,
        address_state = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [
        name.trim(),
        trade_name?.trim() || null,
        cleanDoc,
        email?.trim() || null,
        cleanPhone,
        cleanWhatsapp,
        cleanAdminWhatsapp,
        cleanZipcode,
        address_street?.trim() || null,
        address_number?.trim() || null,
        address_complement?.trim() || null,
        address_neighborhood?.trim() || null,
        address_city?.trim() || null,
        address_state?.trim() || null,
        companyId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Dados da empresa atualizados com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro ao atualizar dados da empresa:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao salvar alterações da empresa." },
      { status: 500 }
    );
  }
}
