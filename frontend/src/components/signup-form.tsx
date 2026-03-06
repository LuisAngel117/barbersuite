"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type SignupResult = {
  ok?: boolean;
  error?: string;
};

export function SignupForm() {
  const router = useRouter();
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
          setError(result.error || "No pudimos completar el onboarding.");
          return;
        }

        router.replace("/app");
        router.refresh();
      })();
    });
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {error ? <div className="alert">{error}</div> : null}

      <div className="field">
        <label htmlFor="tenantName">Tenant</label>
        <input
          id="tenantName"
          minLength={2}
          name="tenantName"
          placeholder="BarberSuite Quito"
          required
        />
      </div>

      <div className="field-group">
        <div className="field">
          <label htmlFor="branchName">Sucursal inicial</label>
          <input
            id="branchName"
            minLength={2}
            name="branchName"
            placeholder="Sucursal Centro"
            required
          />
        </div>

        <div className="field field-code">
          <label htmlFor="branchCode">Código</label>
          <input
            id="branchCode"
            name="branchCode"
            pattern="^[A-Z0-9]{2,10}$"
            placeholder="UIO01"
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="timeZone">Time zone</label>
        <input
          defaultValue="America/Guayaquil"
          id="timeZone"
          name="timeZone"
          placeholder="America/Guayaquil"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="adminFullName">Admin full name</label>
        <input
          id="adminFullName"
          minLength={2}
          name="adminFullName"
          placeholder="Ana Perez"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="adminEmail">Admin email</label>
        <input
          autoComplete="email"
          id="adminEmail"
          name="adminEmail"
          placeholder="ana@barbersuite.test"
          required
          type="email"
        />
      </div>

      <div className="field">
        <label htmlFor="adminPassword">Admin password</label>
        <input
          autoComplete="new-password"
          id="adminPassword"
          minLength={8}
          name="adminPassword"
          placeholder="Mínimo 8 caracteres"
          required
          type="password"
        />
      </div>

      <p className="support">
        El signup llama al backend real y te deja autenticado sin exponer el token en el browser.
      </p>

      <button className="button button-primary" disabled={isPending} type="submit">
        {isPending ? "Creando tenant..." : "Crear cuenta y entrar"}
      </button>
    </form>
  );
}
