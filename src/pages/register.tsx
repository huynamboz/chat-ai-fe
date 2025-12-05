import type { ApiError } from "@/types/api.types";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { useAuth } from "@/contexts/auth.context";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);

  const validateForm = (): boolean => {
    let isValid = true;

    setUsernameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    if (!username.trim()) {
      setUsernameError("Username is required");
      isValid = false;
    } else if (username.trim().length < 3) {
      setUsernameError("Username must be at least 3 characters");
      isValid = false;
    }

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

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
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
      await signUp({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      // Redirect is handled by auth context
    } catch (err) {
      const apiError = err as ApiError;

      setError(apiError.error || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            Create an account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign up to get started
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <Input
            autoComplete="username"
            classNames={{
              inputWrapper:
                "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700",
              input: "text-gray-900 dark:text-white",
            }}
            errorMessage={usernameError}
            isDisabled={isLoading}
            isInvalid={!!usernameError}
            label="Username"
            placeholder="Enter your username"
            type="text"
            value={username}
            variant="bordered"
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            autoComplete="email"
            classNames={{
              inputWrapper:
                "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700",
              input: "text-gray-900 dark:text-white",
            }}
            errorMessage={emailError}
            isDisabled={isLoading}
            isInvalid={!!emailError}
            label="Email"
            placeholder="Enter your email"
            type="email"
            value={email}
            variant="bordered"
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            autoComplete="new-password"
            classNames={{
              inputWrapper:
                "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700",
              input: "text-gray-900 dark:text-white",
            }}
            errorMessage={passwordError}
            isDisabled={isLoading}
            isInvalid={!!passwordError}
            label="Password"
            placeholder="Enter your password"
            type="password"
            value={password}
            variant="bordered"
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            autoComplete="new-password"
            classNames={{
              inputWrapper:
                "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700",
              input: "text-gray-900 dark:text-white",
            }}
            errorMessage={confirmPasswordError}
            isDisabled={isLoading}
            isInvalid={!!confirmPasswordError}
            label="Confirm Password"
            placeholder="Confirm your password"
            type="password"
            value={confirmPassword}
            variant="bordered"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            className="w-full bg-primary text-white font-medium hover:bg-primary-600"
            isDisabled={isLoading}
            isLoading={isLoading}
            size="lg"
            type="submit"
          >
            {isLoading ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              className="text-gray-900 dark:text-white font-medium hover:underline"
              to="/login"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
