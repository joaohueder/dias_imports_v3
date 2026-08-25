import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const dynamic = "force-dynamic";

export async function GET() {
  let connection: mysql.Connection | null = null;
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "jh7_marketing";

  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      connectTimeout: 3000,
    });

    await connection.ping();
    await connection.end();

    return NextResponse.json({
      status: "online",
      database,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    if (connection) {
      try {
        await connection.end();
      } catch {
        // ignora erro ao fechar conexão falha
      }
    }

    const message = error instanceof Error ? error.message : "Erro de conexão";
    const code = (error as { code?: string })?.code || "UNKNOWN_ERROR";
    const errno = (error as { errno?: number })?.errno;
    const sqlState = (error as { sqlState?: string })?.sqlState;

    return NextResponse.json(
      {
        status: "offline",
        message,
        code,
        errno,
        sqlState,
        config: {
          host,
          port,
          user,
          database,
          hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
          hasDbHost: Boolean(process.env.DB_HOST),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
