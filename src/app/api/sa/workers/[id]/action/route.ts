import { NextRequest, NextResponse } from "next/server";
import { requireSaPermission } from "@/lib/server-permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireSaPermission("workers", "edit");
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { action } = body; // "start" | "pause" | "restart"

    if (!["start", "pause", "restart"].includes(action)) {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

    // Simulação de execução com feedback de sucesso
    return NextResponse.json({
      success: true,
      message: `Comando '${action}' enviado com sucesso para o worker '${id}'.`,
      workerId: id,
      action,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao executar ação no worker:", error);
    return NextResponse.json(
      { error: "Erro ao processar ação no worker" },
      { status: 500 }
    );
  }
}
