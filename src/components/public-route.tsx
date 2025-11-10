/**
 * Public Route Component
 * Redirects to home if user is already authenticated
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth.context";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Show loading state while checking authentication
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-900 dark:border-gray-100 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to home if already authenticated
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

