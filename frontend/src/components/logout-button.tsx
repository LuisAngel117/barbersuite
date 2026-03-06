"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type LogoutButtonProps = {
  className?: string;
  label?: string;
};

export function LogoutButton({
  className = "button button-secondary",
  label = "Cerrar sesión",
}: LogoutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);

    const response = await fetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
    });

    if (!response.ok) {
      setError("No pudimos cerrar la sesión.");
      return;
    }

    startTransition(() => {
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <div className="stack">
      <button className={className} disabled={isPending} onClick={() => void handleClick()} type="button">
        {isPending ? "Cerrando..." : label}
      </button>
      {error ? <p className="alert">{error}</p> : null}
    </div>
  );
}
