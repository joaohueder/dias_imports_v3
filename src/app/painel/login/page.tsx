import type { Metadata } from "next";
import { AuthFormLayout } from "@/components/auth/AuthFormLayout";

export const metadata: Metadata = {
  title: "Login da Empresa | JH7 Marketing",
  description: "Acesse o painel da sua empresa para gerenciar marketing e campanhas em grupos de WhatsApp",
};

export default function PainelEmpresaLoginPage() {
  return <AuthFormLayout type="painel" />;
}
