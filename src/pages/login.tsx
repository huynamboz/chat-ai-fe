import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { useAuth } from "@/contexts/auth.context";
import { HealthIcon } from "@/components/icons";
import type { ApiError } from "@/types/api.types";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);

    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login({
        email: email.trim(),
        password,
      });
      // Redirect is handled by auth context
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary rounded-2xl shadow-lg">
              <HealthIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Health AI Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Health knowledge consultation support
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 space-y-5 border border-gray-100 dark:border-gray-800">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isInvalid={!!emailError}
              errorMessage={emailError}
              classNames={{
                base: "w-full",
                inputWrapper:
                  "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary transition-colors",
                input: "text-gray-900 dark:text-white",
                label: "text-gray-700 dark:text-gray-300",
              }}
              variant="bordered"
              isDisabled={isLoading}
              autoComplete="email"
              size="lg"
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              isInvalid={!!passwordError}
              errorMessage={passwordError}
              classNames={{
                base: "w-full",
                inputWrapper:
                  "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary transition-colors",
                input: "text-gray-900 dark:text-white",
                label: "text-gray-700 dark:text-gray-300",
              }}
              variant="bordered"
              isDisabled={isLoading}
              autoComplete="current-password"
              size="lg"
            />

            <Button
              type="submit"
              className="w-full bg-primary text-white font-semibold shadow-lg hover:bg-primary-600 hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
              isLoading={isLoading}
              isDisabled={isLoading}
              size="lg"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              className="text-primary font-semibold hover:text-primary-600 transition-colors"
              to="/register"
            >
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

