"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, getAuthToken, setAuthToken, setAuthTokenProvider } from "./api";

export type SessionRole = "customer" | "manager" | "admin";

export interface AppSession {
  userId: string;
  role: SessionRole;
  displayName: string;
  email: string;
}

interface SessionContextValue {
  session: AppSession | null;
  isLoaded: boolean;
  logout: () => void;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  isLoaded: false,
  logout: () => {},
  refresh: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setAuthTokenProvider(null);
      setSession(null);
      return;
    }

    setAuthTokenProvider(() => Promise.resolve(token));
    try {
      const me = await api.get<{
        id: string;
        role: SessionRole;
        displayName: string;
        email: string;
      }>("/users/me", true);
      setSession({
        userId: me.id,
        role: me.role,
        displayName: me.displayName,
        email: me.email,
      });
    } catch {
      setAuthToken(null);
      setAuthTokenProvider(null);
      setSession(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) setIsLoaded(true);
    })();

    const sync = () => {
      void refresh();
    };
    window.addEventListener("cv-session-change", sync);
    return () => {
      cancelled = true;
      window.removeEventListener("cv-session-change", sync);
    };
  }, [refresh]);

  const logout = useCallback(() => {
    setAuthToken(null);
    setAuthTokenProvider(null);
    setSession(null);
  }, []);

  return (
    <SessionContext.Provider value={{ session, isLoaded, logout, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
