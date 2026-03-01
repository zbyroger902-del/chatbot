"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@/app/(auth)/auth";

type SessionContextValue = {
  data: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  update: () => Promise<void>;
  signOut: (options?: { redirectTo?: string; callbackUrl?: string }) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Session | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const session = (await res.json()) as Session;
        setData(session);
        setStatus("authenticated");
      } else {
        setData(null);
        setStatus("unauthenticated");
      }
    } catch {
      setData(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const signOut = useCallback(
    (options?: { redirectTo?: string; callbackUrl?: string }) => {
      const url =
        options?.redirectTo ?? options?.callbackUrl ?? "/login";
      window.location.assign(
        `/api/auth/signout?callbackUrl=${encodeURIComponent(url)}`
      );
    },
    []
  );

  const value: SessionContextValue = {
    data,
    status,
    update: fetchSession,
    signOut,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
