import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthService } from "@/services/auth";
import { setAccessToken } from "@/lib/axios";
import type { User } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isRefreshing: boolean;
  error: string | null;
  login: (payload: Record<string, any>) => Promise<void>;
  register: (payload: Record<string, any>) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const refreshUser = async () => {
    setIsRefreshing(true);
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      setError(null);
    } catch (err: any) {
      setUser(null);
      // Don't set error on standard session check failure
    } finally {
      setIsRefreshing(false);
    }
  };

  const login = async (payload: Record<string, any>) => {
    setError(null);
    try {
      await AuthService.login(payload);
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (err: any) {
      const apiMessage = err.response?.data?.error?.message || "Invalid credentials.";
      setError(apiMessage);
      throw err;
    }
  };

  const register = async (payload: Record<string, any>) => {
    setError(null);
    try {
      await AuthService.register(payload);
      // Automatically log in user after successful registration
      await AuthService.login({
        username_or_email: payload.email,
        password: payload.password,
      });
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (err: any) {
      const apiMessage = err.response?.data?.error?.message || "Registration failed.";
      setError(apiMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch {
      // Clean up even if api fails
    } finally {
      setAccessToken(null);
      setUser(null);
      setError(null);
    }
  };

  // Session Restoration
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Attempt to refresh the access token on startup
        await AuthService.refresh();
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        // Silent failure if no session exists
        setUser(null);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isInitialized,
        isRefreshing,
        error,
        login,
        register,
        logout,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
