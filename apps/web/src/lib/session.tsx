"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getDevSession, setDevSession, type DevSession } from "./api";

interface SessionContextValue {
  session: DevSession | null;
  loginAs: (userId: string, role: DevSession["role"]) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  loginAs: () => {},
  logout: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<DevSession | null>(null);

  useEffect(() => {
    const sync = () => setSession(getDevSession());
    sync();
    window.addEventListener("cv-session-change", sync);
    return () => window.removeEventListener("cv-session-change", sync);
  }, []);

  const loginAs = useCallback((userId: string, role: DevSession["role"]) => {
    setDevSession({ userId, role });
  }, []);

  const logout = useCallback(() => setDevSession(null), []);

  return (
    <SessionContext.Provider value={{ session, loginAs, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
