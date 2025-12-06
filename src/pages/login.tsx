import type { ApiError } from "@/types/api.types";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { GalleryVerticalEnd } from "lucide-react";
import { useForm } from "react-hook-form";

import { useAuth } from "@/contexts/auth.context";

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    setError(null);
    setIsLoading(true);

    try {
      await login({
        email: data.email.trim(),
        password: data.password,
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
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            AKE Inc.
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <form
              className="flex flex-col gap-6"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Login to your account</h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Enter your email below to login to your account
                </p>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="email">
                    Email
                  </label>
                  <Input
                    errorMessage={errors.email?.message}
                    id="email"
                    isDisabled={isLoading}
                    isInvalid={!!errors.email}
                    placeholder="m@example.com"
                    type="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Please enter a valid email address",
                      },
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <label className="text-sm font-medium" htmlFor="password">
                      Password
                    </label>
                    <a
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                      href="/forgot-password"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    errorMessage={errors.password?.message}
                    id="password"
                    isDisabled={isLoading}
                    isInvalid={!!errors.password}
                    type="password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-500 text-center">{error}</p>
                )}
                <Button className="w-full" isLoading={isLoading} type="submit">
                  Login
                </Button>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a className="underline underline-offset-4" href="/register">
                  Sign up
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          alt="Login illustration"
          className="absolute inset-0 h-full w-full object-cover"
          src="/bg.jpg"
        />
      </div>
    </div>
  );
}
