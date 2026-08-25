import type { Metadata } from "next";
import { AuthFormLayout } from "@/components/auth/AuthFormLayout";

export const metadata: Metadata = {
  title: "Super Admin Login | JH7 Marketing",
  description: "Painel administrativo do SaaS JH7 Marketing",
};

export default function SuperAdminLoginPage() {
  return <AuthFormLayout type="sa" />;
}
