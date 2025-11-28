import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/api";

type Role = "student" | "faculty" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; role: Role }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const TOKEN_KEY = "campusHub.token";
const USER_KEY = "campusHub.user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const persistAuth = (nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  };

  const clearAuth = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const hydrateFromStorage = async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);

    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setLoading(false);
      return;
    }

    try {
      const data = await apiRequest<{ user: AuthUser }>("/common", { token: storedToken });
      persistAuth(storedToken, data.user);
    } catch (error) {
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrateFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    persistAuth(data.token, data.user);
  };

  const register = async ({ name, email, password, role }: { name: string; email: string; password: string; role: Role }) => {
    const data = await apiRequest<{ token: string; user: AuthUser }>("/auth/register", {
      method: "POST",
      body: { name, email, password, role },
    });
    persistAuth(data.token, data.user);
  };

  const updateStoredUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const nextUser = { ...prev, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const signOut = async () => {
    clearAuth();
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, signOut, updateUser: updateStoredUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
