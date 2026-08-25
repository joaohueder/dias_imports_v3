import type { Metadata } from "next";
import { SaLayoutClient } from "@/components/sa/SaLayoutClient";

export const metadata: Metadata = {
  title: "Super Admin SaaS | JH7 Marketing",
  description: "Painel central de governança e controle SaaS",
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SaLayoutClient>{children}</SaLayoutClient>;
}
