import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const dynamic = "force-dynamic";

export async function GET() {
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "jh7_marketing";

  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      connectTimeout: 2000,
    });

    await connection.ping();
    await connection.end();

    return NextResponse.json({
      status: "online",
      database,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro de conexão";
    return NextResponse.json(
      {
        status: "offline",
        message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
