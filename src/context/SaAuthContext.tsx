"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { hasUserPermission, SaasAction, SaasModuleId } from "@/lib/permissions";

export interface SaUserSession {
  id: number;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "COMPANY_ADMIN" | "USER";
  status: "active" | "inactive";
  whatsapp?: string | null;
  permissions: Record<string, Record<string, boolean>> | null;
}

interface SaAuthContextType {
  user: SaUserSession | null;
  loading: boolean;
  can: (module: SaasModuleId, action: SaasAction) => boolean;
  refreshUser: () => Promise<void>;
}

const SaAuthContext = createContext<SaAuthContextType>({
  user: null,
  loading: true,
  can: () => true,
  refreshUser: async () => {},
});

export function SaAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SaUserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/sa/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        }
      }
    } catch {
      // Ignora erro
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const can = useCallback(
    (module: SaasModuleId, action: SaasAction): boolean => {
      if (!user) {
        // Se ainda estiver carregando, por segurança não esconde tudo se for super admin esperado, ou se role existe
        return false;
      }
      return hasUserPermission(user.role, user.permissions, module, action);
    },
    [user]
  );

  return (
    <SaAuthContext.Provider
      value={{
        user,
        loading,
        can,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </SaAuthContext.Provider>
  );
}

export function useSaAuth() {
  return useContext(SaAuthContext);
}
