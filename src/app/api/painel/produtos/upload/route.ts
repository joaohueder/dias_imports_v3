import { NextRequest, NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "Nenhum arquivo enviado." }, { status: 400 });
    }

    // Whitelist estrita de extensões e tipos MIME para mitigar upload arbitrário
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    const rawExt = (path.extname(file.name) || "").toLowerCase();
    if (!allowedMimeTypes.includes(file.type) || !allowedExtensions.includes(rawExt)) {
      return NextResponse.json(
        { success: false, message: "Tipo de arquivo não permitido. Envie apenas imagens JPG, PNG ou WEBP." },
        { status: 400 }
      );
    }

    // Validação de tamanho máximo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "A imagem não pode ultrapassar 5MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validação básica de Magic Bytes
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp = buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";

    if (!isJpeg && !isPng && !isWebp) {
      return NextResponse.json(
        { success: false, message: "Arquivo corrompido ou formato de imagem inválido." },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(uploadDir, { recursive: true });

    const safeExt = isWebp ? ".webp" : isPng ? ".png" : ".jpg";
    const filename = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${safeExt}`;
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/products/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error: any) {
    console.error("Erro no upload de imagem:", error);
    return NextResponse.json({ success: false, message: error.message || "Erro no upload" }, { status: 500 });
  }
}
