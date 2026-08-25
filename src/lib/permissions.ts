export interface ModuleActionPermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface SystemUserPermissions {
  dashboard?: { view: boolean };
  health?: { view: boolean };
  companies?: ModuleActionPermission;
  plans?: ModuleActionPermission;
  subscriptions?: ModuleActionPermission;
  users?: ModuleActionPermission;
  migrations?: ModuleActionPermission;
  instances?: ModuleActionPermission;
  workers?: ModuleActionPermission;
  jobs?: ModuleActionPermission;
  api_keys?: ModuleActionPermission;
  logs?: { view: boolean };
  settings?: { view: boolean; edit: boolean };
}

export const SAAS_MODULES_DEFINITION = [
  {
    id: "dashboard",
    name: "Dashboard Geral",
    description: "Visualizar KPIs, faturamento estimado e métricas centrais",
    category: "Visão Geral",
    actions: ["view"],
  },
  {
    id: "health",
    name: "Métricas & Saúde",
    description: "Status de serviços, banco de dados e telemetria",
    category: "Visão Geral",
    actions: ["view"],
  },
  {
    id: "companies",
    name: "Empresas (Tenants)",
    description: "Gestão completa de empresas clientes do sistema",
    category: "Governança e Empresas",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    id: "plans",
    name: "Planos de Acesso",
    description: "Cadastro de pacotes, precificação e limites operacionais",
    category: "Governança e Empresas",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    id: "subscriptions",
    name: "Assinaturas & Faturas",
    description: "Vínculo de empresas a planos, períodos e vigência",
    category: "Governança e Empresas",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    id: "users",
    name: "Usuários do Sistema (SaaS)",
    description: "Controle de operadores, super admins e permissões",
    category: "Governança e Empresas",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    id: "migrations",
    name: "Migrations & DB",
    description: "Execução e governança de scripts SQL estruturais",
    category: "Infra e Banco de Dados",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    id: "instances",
    name: "Instâncias WhatsApp",
    description: "Conexões, QR Code, status e telemetria de WhatsApp",
    category: "Infra e Banco de Dados",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    id: "workers",
    name: "Workers",
    description: "Threads de execução, processos em background e concorrência",
    category: "Infra e Banco de Dados",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    id: "jobs",
    name: "Central de Tarefas",
    description: "Filas BullMQ, Redis, rotinas e tarefas assíncronas",
    category: "Infra e Banco de Dados",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    id: "api_keys",
    name: "Chaves de API & Webhooks",
    description: "Segurança de integração e endpoints externos",
    category: "Infra e Banco de Dados",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    id: "logs",
    name: "Logs de Auditoria",
    description: "Rastreabilidade de ações e segurança",
    category: "Infra e Banco de Dados",
    actions: ["view"],
  },
  {
    id: "settings",
    name: "Parâmetros do SaaS",
    description: "Configurações globais da plataforma",
    category: "Configurações",
    actions: ["view", "edit"],
  },
] as const;

export const ACTION_LABELS: Record<string, string> = {
  view: "Visualizar",
  create: "Criar",
  edit: "Editar",
  delete: "Excluir / Inativar",
};

/**
 * Helper para verificar permissão do usuário
 * Retorna true se for SUPER_ADMIN ou se possuir a permissão específica ativa
 */
export function hasUserPermission(
  role: string | undefined | null,
  permissions: Record<string, any> | null | undefined,
  moduleId: string,
  action: "view" | "create" | "edit" | "delete" = "view"
): boolean {
  if (role === "SUPER_ADMIN") return true;
  if (!permissions) return false;
  return Boolean(permissions[moduleId]?.[action]);
}

/**
 * Mapeia o path da rota frontend /sa/* para o identificador de módulo correspondente
 */
export function getModuleFromPath(pathname: string): string | null {
  if (pathname === "/sa") return "dashboard";
  if (pathname.startsWith("/sa/health")) return "health";
  if (pathname.startsWith("/sa/companies")) return "companies";
  if (pathname.startsWith("/sa/plans")) return "plans";
  if (pathname.startsWith("/sa/subscriptions")) return "subscriptions";
  if (pathname.startsWith("/sa/users")) return "users";
  if (pathname.startsWith("/sa/migrations")) return "migrations";
  if (pathname.startsWith("/sa/instances")) return "instances";
  if (pathname.startsWith("/sa/workers")) return "workers";
  if (pathname.startsWith("/sa/jobs")) return "jobs";
  if (pathname.startsWith("/sa/api-keys")) return "api_keys";
  if (pathname.startsWith("/sa/logs")) return "logs";
  if (pathname.startsWith("/sa/settings")) return "settings";
  return null;
}
