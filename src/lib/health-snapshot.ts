import fs from "fs";
import path from "path";

export interface SystemHealthSnapshot {
  id: number;
  status: "healthy" | "degraded" | "critical";
  db_status: "online" | "offline" | "degraded";
  db_latency_ms: number | null;
  redis_status: "online" | "offline" | "degraded";
  redis_latency_ms: number | null;
  pm2_status: "online" | "offline" | "degraded";
  evolution_status: "online" | "offline" | "degraded";
  whatsapp_status: "connected" | "disconnected" | "connecting";
  whatsapp_phone: string | null;
  whatsapp_profile: string | null;
  system_cpu_usage: string;
  system_total_mem_mb: number;
  system_used_mem_mb: number;
  system_uptime_seconds: number;
  updated_at: string;
}

const SNAPSHOT_FILE_PATH = path.resolve(process.cwd(), ".system-health.json");

/**
 * Lê o snapshot do sistema salvo em arquivo local JSON.
 * Se o arquivo não existir ou falhar, retorna null.
 */
export function readHealthSnapshotFromFile(): SystemHealthSnapshot | null {
  try {
    if (!fs.existsSync(SNAPSHOT_FILE_PATH)) {
      return null;
    }
    const content = fs.readFileSync(SNAPSHOT_FILE_PATH, "utf-8");
    if (!content.trim()) return null;
    return JSON.parse(content) as SystemHealthSnapshot;
  } catch {
    return null;
  }
}

/**
 * Salva o snapshot em disco em arquivo local JSON atômico/síncrono.
 */
export function writeHealthSnapshotToFile(snapshot: SystemHealthSnapshot): void {
  try {
    const tempPath = `${SNAPSHOT_FILE_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(snapshot, null, 2), "utf-8");
    fs.renameSync(tempPath, SNAPSHOT_FILE_PATH);
  } catch (err) {
    try {
      fs.writeFileSync(SNAPSHOT_FILE_PATH, JSON.stringify(snapshot, null, 2), "utf-8");
    } catch {
      // Falha silenciosa em caso de restrição de I/O
    }
  }
}
