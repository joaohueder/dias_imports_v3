"use client";

import { useEffect, useState } from "react";
import { Database } from "lucide-react";

type DbStatus = "checking" | "online" | "offline";

export function DatabaseStatusIndicator() {
  const [status, setStatus] = useState<DbStatus>("checking");

  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      try {
        const response = await fetch("/api/health/db", {
          cache: "no-store",
        });
        if (isMounted) {
          if (response.ok) {
            setStatus("online");
          } else {
            setStatus("offline");
          }
        }
      } catch {
        if (isMounted) {
          setStatus("offline");
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div 
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-slate-800 bg-slate-900/80 text-[10px] font-medium"
      title={`Banco de dados: ${status}`}
    >
      <Database className="w-3 h-3 text-slate-400" />
      <span className="text-slate-400">DB:</span>
      
      {status === "checking" && (
        <span className="inline-flex items-center gap-1 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          <span>Verificando...</span>
        </span>
      )}

      {status === "online" && (
        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span>Online</span>
        </span>
      )}

      {status === "offline" && (
        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
          </span>
          <span>Offline</span>
        </span>
      )}
    </div>
  );
}
