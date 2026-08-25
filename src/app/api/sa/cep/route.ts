import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cep = searchParams.get("cep")?.replace(/\D/g, "") || "";

    if (!cep || cep.length !== 8) {
      return NextResponse.json(
        { success: false, error: "CEP inválido. Deve conter 8 dígitos." },
        { status: 400 }
      );
    }

    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      headers: { "User-Agent": "JH7-Marketing-SaaS/1.0" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Erro ao consultar serviço de CEP externo." },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.erro) {
      return NextResponse.json(
        { success: false, error: "CEP não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        zipcode: data.cep || cep,
        street: data.logradouro || "",
        complement: data.complemento || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno ao buscar CEP";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
