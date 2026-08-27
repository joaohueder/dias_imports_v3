/**
 * Client Helper / Service para comunicação com a Evolution API v2.3.7
 */

export interface EvolutionCreateInstanceOptions {
  instanceName: string;
  token?: string;
  qrcode?: boolean;
  number?: string;
  integration?: string;
  rejectCall?: boolean;
  msgCall?: string;
  groupsIgnore?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  readStatus?: boolean;
  syncFullHistory?: boolean;
}

export function getEvolutionConfig() {
  const url = (process.env.EVOLUTION_API_URL || "https://evolutionapi.vps10189.panel.icontainer.cloud").replace(/\/+$/, "");
  const apiKey = process.env.EVOLUTION_API_KEY || "5em2RwHksmaRBri6i7skhGTxfa2rHrzT";
  return { url, apiKey };
}

/**
 * Cria uma instância diretamente na Evolution API v2.3.7
 */
export async function createEvolutionInstance(options: EvolutionCreateInstanceOptions) {
  const { url, apiKey } = getEvolutionConfig();

  const payload = {
    instanceName: options.instanceName,
    token: options.token || undefined,
    qrcode: options.qrcode ?? true,
    number: options.number || undefined,
    integration: options.integration || "WHATSAPP-BAILEYS",
    rejectCall: options.rejectCall ?? true,
    msgCall: options.msgCall || "Não aceitamos chamadas por este canal.",
    groupsIgnore: options.groupsIgnore ?? false,
    alwaysOnline: options.alwaysOnline ?? true,
    readMessages: options.readMessages ?? false,
    readStatus: options.readStatus ?? false,
    syncFullHistory: options.syncFullHistory ?? false,
  };

  try {
    const res = await fetch(`${url}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return {
      ok: res.ok,
      status: res.status,
      data,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`Erro ao conectar com Evolution API (${url}/instance/create):`, error);
    return {
      ok: false,
      status: 500,
      data: { error: message },
    };
  }
}

/**
 * Busca estado ou QR Code para conexão da instância
 */
export async function connectEvolutionInstance(instanceName: string) {
  const { url, apiKey } = getEvolutionConfig();

  try {
    const res = await fetch(`${url}/instance/connect/${instanceName}`, {
      method: "GET",
      headers: {
        apikey: apiKey,
      },
    });

    const data = await res.json();
    return {
      ok: res.ok,
      status: res.status,
      data,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`Erro ao conectar instância Evolution (${instanceName}):`, error);
    return {
      ok: false,
      status: 500,
      data: { error: message },
    };
  }
}

/**
 * Reinicia uma instância na Evolution API
 */
export async function restartEvolutionInstance(instanceName: string) {
  const { url, apiKey } = getEvolutionConfig();

  try {
    const res = await fetch(`${url}/instance/restart/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
    });

    const data = await res.json();
    return {
      ok: res.ok,
      status: res.status,
      data,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`Erro ao reiniciar instância Evolution (${instanceName}):`, error);
    return {
      ok: false,
      status: 500,
      data: { error: message },
    };
  }
}

/**
 * Desconecta (logout) uma instância na Evolution API
 */
export async function logoutEvolutionInstance(instanceName: string) {
  const { url, apiKey } = getEvolutionConfig();

  try {
    const res = await fetch(`${url}/instance/logout/${instanceName}`, {
      method: "DELETE",
      headers: {
        apikey: apiKey,
      },
    });

    const data = await res.json();
    return {
      ok: res.ok,
      status: res.status,
      data,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`Erro ao efetuar logout na Evolution (${instanceName}):`, error);
    return {
      ok: false,
      status: 500,
      data: { error: message },
    };
  }
}

/**
 * Remove (delete) uma instância na Evolution API
 */
export async function deleteEvolutionInstance(instanceName: string) {
  const { url, apiKey } = getEvolutionConfig();

  try {
    const res = await fetch(`${url}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: {
        apikey: apiKey,
      },
    });

    const data = await res.json();
    return {
      ok: res.ok,
      status: res.status,
      data,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`Erro ao deletar instância na Evolution (${instanceName}):`, error);
    return {
      ok: false,
      status: 500,
      data: { error: message },
    };
  }
}

/**
 * Envia uma mensagem de texto através da Evolution API v2.3.7
 */
export async function sendEvolutionText(instanceName: string, number: string, text: string) {
  const { url, apiKey } = getEvolutionConfig();

  // Limpa caracteres do número deixando apenas dígitos
  let cleanNumber = number.replace(/\D/g, "");
  if ((cleanNumber.length === 10 || cleanNumber.length === 11) && !cleanNumber.startsWith("55")) {
    cleanNumber = "55" + cleanNumber;
  }

  try {
    const res = await fetch(`${url}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        number: cleanNumber,
        text,
        delay: 1000,
        linkPreview: false,
      }),
    });

    const rawText = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { error: rawText || "Resposta não-JSON do servidor Evolution API" };
    }

    return {
      ok: res.ok,
      status: res.status,
      data,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`Erro ao enviar mensagem via Evolution (${instanceName}):`, error);
    return {
      ok: false,
      status: 500,
      data: { error: message },
    };
  }
}

/**
 * Busca estado de conexão da instância
 */
export async function getConnectionStateEvolution(instanceName: string) {
  const { url, apiKey } = getEvolutionConfig();

  try {
    const res = await fetch(`${url}/instance/connectionState/${instanceName}`, {
      method: "GET",
      headers: {
        apikey: apiKey,
      },
    });

    const data = await res.json();
    return {
      ok: res.ok,
      status: res.status,
      data,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return {
      ok: false,
      status: 500,
      data: { error: message },
    };
  }
}
