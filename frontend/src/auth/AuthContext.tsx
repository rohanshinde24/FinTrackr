import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiRequest } from "../api/client";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  defaultCurrency: string;
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegistrationInput extends LoginInput {
  firstName: string;
  lastName: string;
}

interface AuthContextValue {
  session: AuthSession | null;
  checkingSession: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegistrationInput) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = "fintrackr.auth.session.v1";
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readStoredSession = (): AuthSession | null => {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as Partial<AuthSession>;
    if (
      typeof parsed.token !== "string" ||
      !parsed.user ||
      typeof parsed.user.id !== "string" ||
      typeof parsed.user.email !== "string"
    ) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed as AuthSession;
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const storeSession = (session: AuthSession | null): void => {
  if (session) {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());
  const [checkingSession, setCheckingSession] = useState(Boolean(session));

  const logout = useCallback(() => {
    storeSession(null);
    setSession(null);
    setCheckingSession(false);
  }, []);

  const saveAuthenticatedSession = useCallback((nextSession: AuthSession) => {
    storeSession(nextSession);
    setSession(nextSession);
  }, []);

  useEffect(() => {
    if (!session || !checkingSession) return;

    let active = true;
    apiRequest<{ user: AuthUser }>("/auth/profile", {}, session.token)
      .then(({ user }) => {
        if (!active) return;
        const refreshedSession = { ...session, user };
        storeSession(refreshedSession);
        setSession(refreshedSession);
        setCheckingSession(false);
      })
      .catch(() => {
        if (active) logout();
      });

    return () => {
      active = false;
    };
  }, [checkingSession, logout, session]);

  const login = useCallback(
    async (input: LoginInput) => {
      const nextSession = await apiRequest<AuthSession>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      });
      saveAuthenticatedSession(nextSession);
    },
    [saveAuthenticatedSession]
  );

  const register = useCallback(
    async (input: RegistrationInput) => {
      const nextSession = await apiRequest<AuthSession>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      });
      saveAuthenticatedSession(nextSession);
    },
    [saveAuthenticatedSession]
  );

  const value = useMemo(
    () => ({ session, checkingSession, login, register, logout }),
    [checkingSession, login, logout, register, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
