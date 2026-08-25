import { NextResponse } from "next/server";
import net from "net";

export const dynamic = "force-dynamic";

export async function GET() {
  const host = process.env.REDIS_HOST || "127.0.0.1";
  const port = Number(process.env.REDIS_PORT) || 6379;
  const password = process.env.REDIS_PASSWORD || "";

  const start = Date.now();

  return new Promise<NextResponse>((resolve) => {
    const socket = new net.Socket();
    let hasResolved = false;

    const cleanup = () => {
      socket.removeAllListeners();
      if (!socket.destroyed) {
        socket.destroy();
      }
    };

    socket.setTimeout(2500);

    socket.on("connect", () => {
      if (password) {
        socket.write(`AUTH ${password}\r\n`);
      } else {
        socket.write("PING\r\n");
      }
    });

    socket.on("data", (data) => {
      if (hasResolved) return;
      hasResolved = true;
      const latencyMs = Date.now() - start;
      const responseStr = data.toString();

      cleanup();

      if (responseStr.includes("+PONG") || responseStr.includes("+OK")) {
        resolve(
          NextResponse.json({
            status: "online",
            host,
            port,
            latencyMs,
            timestamp: new Date().toISOString(),
          })
        );
      } else if (responseStr.startsWith("-NOAUTH")) {
        resolve(
          NextResponse.json(
            {
              status: "offline",
              message: "Redis requer autenticação de senha (NOAUTH).",
              host,
              port,
              timestamp: new Date().toISOString(),
            },
            { status: 401 }
          )
        );
      } else if (responseStr.startsWith("-ERR") || responseStr.startsWith("-WRONGPASS")) {
        resolve(
          NextResponse.json(
            {
              status: "offline",
              message: responseStr.trim(),
              host,
              port,
              timestamp: new Date().toISOString(),
            },
            { status: 401 }
          )
        );
      } else {
        resolve(
          NextResponse.json({
            status: "online",
            host,
            port,
            latencyMs,
            timestamp: new Date().toISOString(),
          })
        );
      }
    });

    socket.on("timeout", () => {
      if (hasResolved) return;
      hasResolved = true;
      cleanup();
      resolve(
        NextResponse.json(
          {
            status: "offline",
            message: "Timeout ao conectar no servidor Redis (2500ms)",
            host,
            port,
            timestamp: new Date().toISOString(),
          },
          { status: 504 }
        )
      );
    });

    socket.on("error", (err) => {
      if (hasResolved) return;
      hasResolved = true;
      cleanup();
      resolve(
        NextResponse.json(
          {
            status: "offline",
            message: err?.message || "Falha de conexão com Redis",
            code: (err as { code?: string })?.code,
            host,
            port,
            timestamp: new Date().toISOString(),
          },
          { status: 503 }
        )
      );
    });

    socket.connect(port, host);
  });
}
