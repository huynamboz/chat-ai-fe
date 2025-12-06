import type { ApiError } from "@/types/api.types";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { GalleryVerticalEnd } from "lucide-react";

import { useAuth } from "@/contexts/auth.context";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);

  const validateForm = (): boolean => {
    let isValid = true;

    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
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
      const trimmedEmail = email.trim();
      const derivedUsername =
        trimmedEmail.split("@")[0]?.trim() || trimmedEmail;

      await signUp({
        username: derivedUsername,
        email: trimmedEmail,
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
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Acme Inc.
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create an account</h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Enter your details below to sign up
                </p>
              </div>

              <div className="grid gap-4">
                {error && (
                  <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
                    {error}
                  </div>
                )}

                <Input
                  autoComplete="email"
                  classNames={{
                    inputWrapper:
                      "bg-white border-gray-300",
                    input: "text-gray-900",
                  }}
                  errorMessage={emailError || undefined}
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
                      "bg-white border-gray-300",
                    input: "text-gray-900",
                  }}
                  errorMessage={passwordError || undefined}
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
                      "bg-white border-gray-300",
                    input: "text-gray-900",
                  }}
                  errorMessage={confirmPasswordError || undefined}
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
                  className="w-full"
                  isDisabled={isLoading}
                  isLoading={isLoading}
                  type="submit"
                >
                  {isLoading ? "Creating account..." : "Sign up"}
                </Button>
              </div>

              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link className="underline underline-offset-4" to="/login">
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="relative hidden bg-muted lg:block">
        <img
          alt="Register illustration"
          className="absolute inset-0 h-full w-full object-cover"
          src="/bg.jpg"
        />
      </div>
    </div>
  );
}
