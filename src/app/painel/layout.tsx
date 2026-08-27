import type { Metadata } from "next";
import { LayoutProvider } from "@/context/LayoutContext";

export const metadata: Metadata = {
  title: "Painel do Cliente | JH7 Marketing",
  description: "Painel de controle e gerenciamento de grupos WhatsApp da empresa",
};

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutProvider>
      {children}
    </LayoutProvider>
  );
}
