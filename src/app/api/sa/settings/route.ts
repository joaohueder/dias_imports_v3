import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCurrentSaUser } from "@/lib/session";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSaUser();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const pool = getDbPool();

    // Buscar configurações da tabela system_settings
    let rows: RowDataPacket[] = [];
    try {
      const [result] = await pool.query<RowDataPacket[]>(
        `SELECT setting_key, setting_value, category FROM system_settings`
      );
      rows = result;
    } catch (dbErr: any) {
      // Se a tabela ainda não existir antes da migration rodar, retorna os padrões de segurança
      console.warn("Tabela system_settings não encontrada ou inacessível:", dbErr.message);
      return NextResponse.json({
        settings: {
          layout: {
            preset: "1200px",
            customWidth: 1200,
          },
        },
      });
    }

    const settingsMap: Record<string, string> = {};
    rows.forEach((r) => {
      settingsMap[r.setting_key] = r.setting_value;
    });

    const layoutSettings = {
      preset: settingsMap["layout_max_width_preset"] || "1200px",
      customWidth: Math.max(1200, parseInt(settingsMap["layout_max_width_custom"] || "1200", 10)),
    };

    return NextResponse.json({
      settings: {
        layout: layoutSettings,
      },
    });
  } catch (error: any) {
    console.error("Erro ao buscar configurações do sistema:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar configurações" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSaUser();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Apenas SUPER_ADMIN pode salvar parâmetros globais do SaaS
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas Super Admin pode alterar parâmetros globais." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { category, settings } = body;

    if (category === "layout" && settings) {
      const preset = ["1200px", "1440px", "full", "custom"].includes(settings.preset)
        ? settings.preset
        : "1200px";
      const customWidth = Math.max(1200, parseInt(String(settings.customWidth || 1200), 10));

      const pool = getDbPool();

      // Garantir que a tabela existe (cria caso a migration ainda não tenha sido executada manualmente)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          setting_key VARCHAR(100) NOT NULL UNIQUE,
          setting_value LONGTEXT NULL,
          category VARCHAR(50) NOT NULL DEFAULT 'layout',
          description VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Upsert das configurações
      await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value, category, description)
         VALUES (?, ?, 'layout', 'Preset de largura máxima do container')
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
        ["layout_max_width_preset", preset]
      );

      await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value, category, description)
         VALUES (?, ?, 'layout', 'Valor numérico customizado em pixels')
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
        ["layout_max_width_custom", String(customWidth)]
      );

      return NextResponse.json({
        success: true,
        message: "Parâmetros de layout salvos com sucesso!",
        settings: {
          layout: {
            preset,
            customWidth,
          },
        },
      });
    }

    return NextResponse.json(
      { error: "Categoria de parâmetros não suportada ou inválida." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Erro ao salvar parâmetros do sistema:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao salvar configurações" },
      { status: 500 }
    );
  }
}
