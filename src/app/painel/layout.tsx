import type { Metadata } from "next";
import { LayoutProvider } from "@/context/LayoutContext";
import { DesktopOnlyGuard } from "@/components/ui/DesktopOnlyGuard";
import { PainelLayoutClient } from "@/components/painel/PainelLayoutClient";

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
    <DesktopOnlyGuard systemName="Painel do Cliente JH7" minWidth={1200}>
      <LayoutProvider>
        <PainelLayoutClient>
          {children}
        </PainelLayoutClient>
      </LayoutProvider>
    </DesktopOnlyGuard>
  );
}
