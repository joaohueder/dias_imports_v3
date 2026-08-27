import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

export const dynamic = "force-dynamic";

/**
 * Consulta status dos processos do PM2 chamando diretamente o binário local via execFile (muito mais rápido que npx e compatível com o bundler do Next.js)
 */
async function queryPm2List(): Promise<any[]> {
  const pm2Bin = path.join(process.cwd(), "node_modules", "pm2", "bin", "pm2");
  
  // Executa diretamente o node com o script do PM2
  const { stdout } = await execFileAsync(process.execPath, [pm2Bin, "jlist"], {
    cwd: process.cwd(),
    timeout: 8000,
    windowsHide: true,
  });

  const trimmed = stdout.trim();
  const jsonStart = trimmed.indexOf("[");
  const jsonEnd = trimmed.lastIndexOf("]");
  if (jsonStart !== -1 && jsonEnd !== -1) {
    return JSON.parse(trimmed.substring(jsonStart, jsonEnd + 1));
  }
  return [];
}

export async function GET() {
  const start = Date.now();
  try {
    const list = await queryPm2List();

    const onlineProcesses = Array.isArray(list)
      ? list.filter((item) => item.pm2_env?.status === "online")
      : [];

    const isOnline = onlineProcesses.length > 0;
    const latencyMs = Date.now() - start;

    return NextResponse.json({
      status: isOnline ? "online" : "offline",
      latencyMs,
      totalProcesses: list.length,
      onlineProcesses: onlineProcesses.length,
      processes: list.map((item) => ({
        name: item.name,
        status: item.pm2_env?.status,
        cpu: item.monit?.cpu || 0,
        memory: item.monit?.memory || 0,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "PM2 não está rodando";
    return NextResponse.json(
      {
        status: "offline",
        message,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
