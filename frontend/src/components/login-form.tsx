"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

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
      tenantId: String(formData.get("tenantId") || "").trim(),
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
    <form className="form-grid" onSubmit={handleSubmit}>
      {error ? <div className="alert">{error}</div> : null}

      <div className="field">
        <label htmlFor="tenantId">Tenant ID</label>
        <input
          autoComplete="off"
          id="tenantId"
          name="tenantId"
          placeholder="11111111-1111-7111-8111-111111111111"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          autoComplete="email"
          id="email"
          name="email"
          placeholder="admin@barbersuite.test"
          required
          type="email"
        />
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          autoComplete="current-password"
          id="password"
          minLength={8}
          name="password"
          placeholder="Tu password"
          required
          type="password"
        />
      </div>

      <p className="support">
        Mientras el backend mantenga login tenant-qualified, este campo es obligatorio.
      </p>

      <button className="button button-primary" disabled={isPending} type="submit">
        {isPending ? "Validando..." : "Entrar al dashboard"}
      </button>
    </form>
  );
}
