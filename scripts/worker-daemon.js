/**
 * JH7 Marketing - Background Worker Daemon
 * Daemon preparado para a nova arquitetura e criação dos workers sob demanda.
 */

const fetch = globalThis.fetch;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const INTERVAL_MS = 2000;

let lastHealthCheckTime = 0;
let cachedHealthIntervalMs = 15000;

let lastCronSubscriptionsTime = 0;
let cachedSubscriptionsIntervalMs = 60 * 1000; // 1 minuto por padrão

let lastGroupsSyncTime = 0;
let cachedGroupsSyncIntervalMs = 300 * 1000; // 5 minutos por padrão

async function runHealthCheckAutonomous(customIntervalMs) {
  try {
    const now = Date.now();
    const interval = customIntervalMs || cachedHealthIntervalMs || 15000;
    if (now - lastHealthCheckTime < interval) return;

    // Dispara checagem do worker de saúde diretamente
    const res = await fetch(`${BASE_URL}/api/sa/workers/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-internal": "daemon",
      },
      body: JSON.stringify({ queue_name: "system-health-monitor", limit: 1 }),
    });

    if (res.ok) {
      lastHealthCheckTime = now;
      const data = await res.json().catch(() => ({}));
      if (data.processedCount > 0) {
        console.log(`[Health-Worker] Telemetria atualizada com sucesso (${new Date().toLocaleTimeString()})`);
      }
    }
  } catch (err) {
    // Falha silenciosa de rede do daemon
  }
}

async function getActiveQueues() {
  try {
    const res = await fetch(`${BASE_URL}/api/sa/workers`, {
      headers: {
        "x-worker-internal": "daemon",
      },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const workers = data.workers || [];
      
      // Atualiza o intervalo configurado dinamicamente do worker de saúde
      const hw = workers.find((w) => w.id === "w-health-01" || w.queue === "system-health-monitor");
      if (hw) {
        if (hw.schedule_enabled === false || hw.status === "paused" || hw.status === "stopped") {
          cachedHealthIntervalMs = null;
        } else {
          const secs = Number(hw.schedule_interval_seconds) || (Number(hw.schedule_interval_minutes) ? Number(hw.schedule_interval_minutes) * 60 : 15);
          cachedHealthIntervalMs = Math.max(15, secs) * 1000;
        }
      }

      // Atualiza o intervalo configurado dinamicamente do worker de assinaturas
      const sw = workers.find((w) => w.id === "w-cron-01" || w.queue === "cron-subscriptions");
      if (sw) {
        if (sw.schedule_enabled === false || sw.status === "paused" || sw.status === "stopped") {
          cachedSubscriptionsIntervalMs = null;
        } else {
          const secs = Number(sw.schedule_interval_seconds) || (Number(sw.schedule_interval_minutes) ? Number(sw.schedule_interval_minutes) * 60 : 60);
          cachedSubscriptionsIntervalMs = Math.max(15, secs) * 1000;
        }
      }

      // Atualiza o intervalo configurado dinamicamente do worker de atualização de grupos WhatsApp
      const gw = workers.find((w) => w.id === "w-groups-01" || w.queue === "whatsapp-groups-sync");
      if (gw) {
        if (gw.schedule_enabled === false || gw.status === "paused" || gw.status === "stopped") {
          cachedGroupsSyncIntervalMs = null;
        } else {
          const secs = Number(gw.schedule_interval_seconds) || (Number(gw.schedule_interval_minutes) ? Number(gw.schedule_interval_minutes) * 60 : 300);
          cachedGroupsSyncIntervalMs = Math.max(15, secs) * 1000;
        }
      }

      const queues = workers
        .filter((w) => w.status === "active" || w.status === "idle")
        .map((w) => w.queue);
      return Array.from(new Set(queues));
    }
  } catch {
    // Mantém intervalo de fallback se a requisição falhar
  }
  return [];
}

async function processQueue(queueName, limit = 5) {
  try {
    const res = await fetch(`${BASE_URL}/api/sa/workers/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-internal": "daemon",
      },
      body: JSON.stringify({ queue_name: queueName, limit }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.processedCount > 0) {
        console.log(`[Worker] Processadas ${data.processedCount} tarefa(s) na fila ${queueName}`);
      }
    }
  } catch {
    // Falha silenciosa ou log de conexão
  }
}

async function runSubscriptionsCheckAutonomous(customIntervalMs) {
  try {
    const now = Date.now();
    const interval = customIntervalMs || cachedSubscriptionsIntervalMs || 60000;
    if (now - lastCronSubscriptionsTime < interval) return;

    // Dispara checagem do worker de assinaturas
    const res = await fetch(`${BASE_URL}/api/sa/workers/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-internal": "daemon",
      },
      body: JSON.stringify({ queue_name: "cron-subscriptions", limit: 1 }),
    });

    if (res.ok) {
      lastCronSubscriptionsTime = now;
      const data = await res.json().catch(() => ({}));
      if (data.processedCount > 0) {
        console.log(`[Subscriptions-Worker] Verificação de assinaturas executada (${new Date().toLocaleTimeString()})`);
      }
    }
  } catch (err) {
    // Falha silenciosa de rede do daemon
  }
}

async function runGroupsSyncAutonomous(customIntervalMs) {
  try {
    const now = Date.now();
    const interval = customIntervalMs || cachedGroupsSyncIntervalMs || 60000;
    if (now - lastGroupsSyncTime < interval) return;

    // Dispara a rotina periódica de enfileiramento e sincronização de grupos
    const res = await fetch(`${BASE_URL}/api/sa/workers/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-internal": "daemon",
      },
      body: JSON.stringify({ queue_name: "whatsapp-groups-sync", trigger_routine: true, limit: 5 }),
    });

    if (res.ok) {
      lastGroupsSyncTime = now;
      const data = await res.json().catch(() => ({}));
      if (data.enqueuedCount > 0 || data.processedCount > 0) {
        console.log(`[Groups-Sync-Worker] Rotina de grupos executada: ${data.enqueuedCount || 0} enfileirados, ${data.processedCount || 0} processados (${new Date().toLocaleTimeString()})`);
      }
    }
  } catch (err) {
    console.error("[Groups-Sync-Worker] Erro ao disparar rotina de grupos:", err.message);
  }
}

async function loop() {
  console.log(`[JH7 Daemon] Worker Daemon em execução...`);

  while (true) {
    if (cachedHealthIntervalMs !== null) {
      await runHealthCheckAutonomous(cachedHealthIntervalMs);
    }
    if (cachedSubscriptionsIntervalMs !== null) {
      await runSubscriptionsCheckAutonomous(cachedSubscriptionsIntervalMs);
    }
    if (cachedGroupsSyncIntervalMs !== null) {
      await runGroupsSyncAutonomous(cachedGroupsSyncIntervalMs);
    }
    const activeQueues = await getActiveQueues();
    for (const q of activeQueues) {
      if (q !== "system-health-monitor" && q !== "cron-subscriptions") {
        await processQueue(q, 5);
      }
    }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
}

loop();
