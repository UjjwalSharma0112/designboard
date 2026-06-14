"use client";

// AuthProvider — a lightweight auth context over the AuthClient. Hydrates the
// current user on mount and exposes the auth actions + status to the app.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getAuthClient,
  type AuthUser,
  type SignUpInput,
} from "./authClient";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  signUp: (input: SignUpInput) => Promise<AuthUser>;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signInWithGoogle: () => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let active = true;
    getAuthClient()
      .getCurrentUser()
      .then((current) => {
        if (!active) return;
        setUser(current);
        setStatus(current ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (!active) return;
        setStatus("unauthenticated");
      });
    return () => {
      active = false;
    };
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    const next = await getAuthClient().signUp(input);
    setUser(next);
    setStatus("authenticated");
    return next;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const next = await getAuthClient().signIn(email, password);
    setUser(next);
    setStatus("authenticated");
    return next;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const next = await getAuthClient().signInWithGoogle();
    setUser(next);
    setStatus("authenticated");
    return next;
  }, []);

  const signOut = useCallback(async () => {
    await getAuthClient().signOut();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, signUp, signIn, signInWithGoogle, signOut }),
    [user, status, signUp, signIn, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return ctx;
}
