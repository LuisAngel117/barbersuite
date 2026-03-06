"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { ProblemBanner } from "@/components/ui/problem-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignupResult = {
  ok?: boolean;
  error?: string;
};

export function SignupForm() {
  const router = useRouter();
  const tAuth = useTranslations("auth");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload = {
      tenantName: String(formData.get("tenantName") || "").trim(),
      branchName: String(formData.get("branchName") || "").trim(),
      branchCode: String(formData.get("branchCode") || "").trim().toUpperCase(),
      timeZone: String(formData.get("timeZone") || "").trim(),
      adminFullName: String(formData.get("adminFullName") || "").trim(),
      adminEmail: String(formData.get("adminEmail") || "").trim(),
      adminPassword: String(formData.get("adminPassword") || ""),
    };

    setError("");

    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/tenants/signup", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = (await response.json().catch(() => ({}))) as SignupResult;
        if (!response.ok) {
          setError(result.error || tAuth("signupFailure"));
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
            title: tAuth("signupFailure"),
            detail: error,
          }}
        />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="tenantName">{tAuth("tenantName")}</Label>
        <Input
          className="h-11 rounded-xl"
          data-testid="signup-tenantName"
          id="tenantName"
          minLength={2}
          name="tenantName"
          placeholder="BarberSuite Quito"
          required
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="branchName">{tAuth("branchName")}</Label>
          <Input
            className="h-11 rounded-xl"
            data-testid="signup-branchName"
            id="branchName"
            minLength={2}
            name="branchName"
            placeholder="Sucursal Centro"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="branchCode">{tAuth("branchCode")}</Label>
          <Input
            className="h-11 rounded-xl uppercase"
            data-testid="signup-branchCode"
            id="branchCode"
            name="branchCode"
            pattern="^[A-Z0-9]{2,10}$"
            placeholder="UIO01"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeZone">{tAuth("timeZone")}</Label>
        <Input
          className="h-11 rounded-xl"
          data-testid="signup-timeZone"
          defaultValue="America/Guayaquil"
          id="timeZone"
          name="timeZone"
          placeholder="America/Guayaquil"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminFullName">{tAuth("fullName")}</Label>
        <Input
          className="h-11 rounded-xl"
          data-testid="signup-adminFullName"
          id="adminFullName"
          minLength={2}
          name="adminFullName"
          placeholder="Ana Perez"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminEmail">{tAuth("email")}</Label>
        <Input
          autoComplete="email"
          className="h-11 rounded-xl"
          data-testid="signup-adminEmail"
          id="adminEmail"
          name="adminEmail"
          placeholder="ana@barbersuite.test"
          required
          type="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminPassword">{tAuth("password")}</Label>
        <Input
          autoComplete="new-password"
          className="h-11 rounded-xl"
          data-testid="signup-adminPassword"
          id="adminPassword"
          minLength={8}
          name="adminPassword"
          placeholder="Mínimo 8 caracteres"
          required
          type="password"
        />
      </div>

      <p className="text-sm leading-6 text-muted-foreground">
        {tAuth("signupFootnote")}
      </p>

      <Button
        className="h-11 w-full rounded-xl bg-primary text-primary-foreground shadow-lg shadow-black/10"
        data-testid="signup-submit"
        disabled={isPending}
        type="submit"
      >
        {isPending ? tAuth("creatingTenant") : tAuth("signupCta")}
      </Button>
    </form>
  );
}
