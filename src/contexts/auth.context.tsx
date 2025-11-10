/**
 * Auth Context
 * Manages authentication state and user information
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "@/services";
import type { User, LoginRequest, SignUpRequest, ApiError } from "@/types/api.types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signUp: (data: SignUpRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  /**
   * Check authentication status and load user profile
   */
  const checkAuth = async () => {
    try {
      if (userService.isAuthenticated()) {
        const response = await userService.getProfile();
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      // Token might be invalid, clear it
      userService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    checkAuth();

    // Listen for token cleared event
    const handleTokenCleared = () => {
      setUser(null);
    };

    window.addEventListener("auth:token-cleared", handleTokenCleared);

    return () => {
      window.removeEventListener("auth:token-cleared", handleTokenCleared);
    };
  }, []);

  /**
   * Login user
   */
  const login = async (data: LoginRequest) => {
    try {
      const response = await userService.login(data);
      setUser(response.user);
      navigate("/");
    } catch (error) {
      const apiError = error as ApiError;
      throw apiError;
    }
  };

  /**
   * Sign up user
   */
  const signUp = async (data: SignUpRequest) => {
    try {
      const response = await userService.signUp(data);
      setUser(response.user);
      navigate("/");
    } catch (error) {
      const apiError = error as ApiError;
      throw apiError;
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    userService.logout();
    setUser(null);
    navigate("/login");
  };

  /**
   * Refresh user profile
   */
  const refreshUser = async () => {
    try {
      if (userService.isAuthenticated()) {
        const response = await userService.getProfile();
        setUser(response.user);
      }
    } catch (error) {
      // If refresh fails, logout
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signUp,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

