"use client";

import { useTranslations } from "next-intl";
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
  const tAuth = useTranslations("auth");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(
    searchParams.get("expired")
      ? tAuth("sessionExpired")
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
          setError(result.error || tAuth("loginFailure"));
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
            title: tAuth("loginFailure"),
            detail: error,
            code: "UNAUTHORIZED",
          }}
        />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">{tAuth("email")}</Label>
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
        <Label htmlFor="password">{tAuth("password")}</Label>
        <Input
          autoComplete="current-password"
          className="h-11 rounded-xl"
          data-testid="login-password"
          id="password"
          minLength={8}
          name="password"
          placeholder={tAuth("password")}
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
        {isPending ? tAuth("validating") : tAuth("loginCta")}
      </Button>
    </form>
  );
}
