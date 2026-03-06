"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { ProblemBanner } from "@/components/ui/problem-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginResult = {
  ok?: boolean;
  error?: string;
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(
    searchParams.get("expired")
      ? "Tu sesión expiró. Vuelve a autenticarte."
      : "",
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload = {
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || ""),
    };

    setError("");

    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = (await response.json().catch(() => ({}))) as LoginResult;
        if (!response.ok) {
          setError(result.error || "No pudimos iniciar sesión.");
          return;
        }

        router.replace("/app");
        router.refresh();
      })();
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error ? (
        <ProblemBanner
          problem={{
            title: "No pudimos iniciar sesión",
            detail: error,
            code: "UNAUTHORIZED",
          }}
        />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          autoComplete="email"
          className="h-11 rounded-xl"
          data-testid="login-email"
          id="email"
          name="email"
          placeholder="admin@barbersuite.test"
          required
          type="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          autoComplete="current-password"
          className="h-11 rounded-xl"
          data-testid="login-password"
          id="password"
          minLength={8}
          name="password"
          placeholder="Tu password"
          required
          type="password"
        />
      </div>

      <Button
        className="h-11 w-full rounded-xl bg-primary text-primary-foreground shadow-lg shadow-black/10"
        data-testid="login-submit"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Validando..." : "Entrar al dashboard"}
      </Button>
    </form>
  );
}
