"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { getDevSession, setDevSession, setAuthTokenProvider, type DevSession, api } from "./api";

export type SessionRole = DevSession["role"];

export interface AppSession {
  userId: string;
  role: SessionRole;
  displayName: string;
}

interface SessionContextValue {
  session: AppSession | null;
  isLoaded: boolean;
  loginAs: (userId: string, role: SessionRole) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  isLoaded: false,
  loginAs: () => {},
  logout: () => {},
});

function DevSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const dev = getDevSession();
    if (dev) {
      setSession({
        userId: dev.userId,
        role: dev.role,
        displayName: dev.userId,
      });
    }
    setIsLoaded(true);
    const sync = () => {
      const next = getDevSession();
      setSession(
        next
          ? { userId: next.userId, role: next.role, displayName: next.userId }
          : null,
      );
    };
    window.addEventListener("cv-session-change", sync);
    return () => window.removeEventListener("cv-session-change", sync);
  }, []);

  const loginAs = useCallback((userId: string, role: SessionRole) => {
    setDevSession({ userId, role });
  }, []);

  const logout = useCallback(() => setDevSession(null), []);

  return (
    <SessionContext.Provider value={{ session, isLoaded, loginAs, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

function ClerkSessionBridge({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId, signOut, getToken } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState<{
    id: string;
    role: SessionRole;
    displayName: string;
  } | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setAuthTokenProvider(null);
      return;
    }
    setAuthTokenProvider(() => getToken());
    return () => setAuthTokenProvider(null);
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || !userId) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    api
      .get<{ id: string; role: SessionRole; displayName: string }>("/users/me", true)
      .then((me) => {
        if (!cancelled) setProfile(me);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, userId]);

  const session = useMemo<AppSession | null>(() => {
    if (!isSignedIn || !userId) return null;
    return {
      userId: profile?.id ?? userId,
      role: profile?.role ?? "customer",
      displayName:
        profile?.displayName ??
        user?.fullName ??
        user?.primaryEmailAddress?.emailAddress ??
        userId,
    };
  }, [isSignedIn, userId, profile, user]);

  const logout = useCallback(() => {
    void signOut({ redirectUrl: "/" });
  }, [signOut]);

  return (
    <SessionContext.Provider
      value={{
        session,
        isLoaded,
        loginAs: () => {},
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function SessionProvider({
  children,
  clerkEnabled = false,
}: {
  children: React.ReactNode;
  clerkEnabled?: boolean;
}) {
  if (!clerkEnabled) {
    return <DevSessionProvider>{children}</DevSessionProvider>;
  }

  return <ClerkSessionBridge>{children}</ClerkSessionBridge>;
}

export const useSession = () => useContext(SessionContext);
