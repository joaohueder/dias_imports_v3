import type { Metadata } from "next";
import { SaLayoutClient } from "@/components/sa/SaLayoutClient";
import { LayoutProvider } from "@/context/LayoutContext";
import { SaAuthProvider } from "@/context/SaAuthContext";
import { DesktopOnlyGuard } from "@/components/ui/DesktopOnlyGuard";

export const metadata: Metadata = {
  title: "Super Admin SaaS | JH7 Marketing",
  description: "Painel central de governança e controle SaaS",
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DesktopOnlyGuard systemName="Super Admin JH7" minWidth={1200}>
      <SaAuthProvider>
        <LayoutProvider>
          <SaLayoutClient>{children}</SaLayoutClient>
        </LayoutProvider>
      </SaAuthProvider>
    </DesktopOnlyGuard>
  );
}
