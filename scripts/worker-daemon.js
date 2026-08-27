/**
 * JH7 Marketing - Background Worker Daemon
 * Processa filas de tarefas assíncronas periodicamente no servidor.
 */

const fetch = globalThis.fetch;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const INTERVAL_MS = 4000;

async function processQueue(queueName = "whatsapp-messages-default", limit = 5) {
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
  } catch (error) {
    // Falha silenciosa ou log de conexão
  }
}

async function loop() {
  console.log(`[JH7 Daemon] Worker iniciado monitorando filas a cada ${INTERVAL_MS}ms...`);
  
  const queues = [
    "whatsapp-messages-high",
    "whatsapp-messages-default",
    "evolution-webhook-sync",
    "cron-subscriptions",
  ];

  while (true) {
    for (const q of queues) {
      await processQueue(q, 5);
    }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
}

loop();
