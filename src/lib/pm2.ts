import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

/**
 * Consulta se o PM2 está ativo e com processos online
 */
export async function isPm2DaemonRunning(): Promise<boolean> {
  try {
    const pm2Bin = path.join(process.cwd(), "node_modules", "pm2", "bin", "pm2");
    const { stdout } = await execFileAsync(process.execPath, [pm2Bin, "jlist"], {
      cwd: process.cwd(),
      timeout: 5000,
      windowsHide: true,
    });

    const trimmed = stdout.trim();
    const jsonStart = trimmed.indexOf("[");
    const jsonEnd = trimmed.lastIndexOf("]");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const list = JSON.parse(trimmed.substring(jsonStart, jsonEnd + 1));
      if (Array.isArray(list)) {
        return list.some((item) => item.pm2_env?.status === "online");
      }
    }
    return false;
  } catch {
    return false;
  }
}
