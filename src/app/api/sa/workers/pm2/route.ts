import { NextRequest, NextResponse } from "next/server";
import { requireSaPermission } from "@/lib/server-permissions";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

export interface Pm2ProcessInfo {
  name: string;
  pm_id: number;
  status: "online" | "stopping" | "stopped" | "launching" | "errored" | "unknown";
  cpu: number;
  memory: number; // bytes
  uptime: number; // ms
  restarts: number;
}

export interface Pm2StatusResponse {
  available: boolean;
  daemonRunning: boolean;
  processes: Pm2ProcessInfo[];
  error?: string;
}

/**
 * Executa comandos do PM2 usando o binário local diretamente
 */
async function runPm2(args: string[]): Promise<string> {
  const pm2Bin = path.join(process.cwd(), "node_modules", "pm2", "bin", "pm2");
  const { stdout, stderr } = await execFileAsync(process.execPath, [pm2Bin, ...args], {
    cwd: process.cwd(),
    timeout: 15000,
    windowsHide: true,
  });
  return stdout || stderr;
}

/**
 * Consulta status dos processos do PM2
 */
export async function GET() {
  try {
    const auth = await requireSaPermission("workers", "view");
    if (!auth.authorized) {
      return auth.response;
    }

    try {
      const stdout = await runPm2(["jlist"]);
      let list: any[] = [];
      const trimmed = stdout.trim();
      const jsonStart = trimmed.indexOf("[");
      const jsonEnd = trimmed.lastIndexOf("]");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        list = JSON.parse(trimmed.substring(jsonStart, jsonEnd + 1));
      }

      const processes: Pm2ProcessInfo[] = Array.isArray(list)
        ? list.map((item) => ({
            name: item.name || "unknown",
            pm_id: item.pm_id ?? -1,
            status: item.pm2_env?.status || "unknown",
            cpu: Number(item.monit?.cpu) || 0,
            memory: Number(item.monit?.memory) || 0,
            uptime: item.pm2_env?.pm_uptime ? Date.now() - item.pm2_env.pm_uptime : 0,
            restarts: item.pm2_env?.restart_time || 0,
          }))
        : [];

      const daemonRunning = processes.some((p) => p.status === "online");

      return NextResponse.json({
        available: true,
        daemonRunning,
        processes,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "PM2 não detectado ou inativo";
      return NextResponse.json({
        available: false,
        daemonRunning: false,
        processes: [],
        error: errMsg,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao consultar status do PM2";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Ações de controle do PM2: start, restart, stop, reload
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSaPermission("workers", "edit");
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as "start" | "restart" | "stop" | "reload" | "start-daemon";
    const target = body.target || "ecosystem.config.js";

    let output = "";
    if (action === "start") {
      output = await runPm2(["start", target]);
    } else if (action === "start-daemon") {
      output = await runPm2(["start", "scripts/worker-daemon.js", "--name", "jh7-worker-daemon"]);
    } else if (action === "restart") {
      output = await runPm2(["restart", target === "ecosystem.config.js" ? "all" : target]);
    } else if (action === "stop") {
      output = await runPm2(["stop", target === "ecosystem.config.js" ? "all" : target]);
    } else if (action === "reload") {
      output = await runPm2(["reload", target === "ecosystem.config.js" ? "all" : target]);
    } else {
      return NextResponse.json({ error: "Ação do PM2 inválida" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      output,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao executar comando do PM2";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
