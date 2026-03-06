"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
  label?: string;
};

export function LogoutButton({
  className,
  label = "Cerrar sesión",
}: LogoutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);

    const response = await apiFetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
    });

    if (!response.ok) {
      setError("No pudimos cerrar la sesión.");
      toast.error("No pudimos cerrar la sesión.");
      return;
    }

    startTransition(() => {
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <Button
      className={cn("gap-2 rounded-full", className)}
      data-testid="nav-logout"
      disabled={isPending}
      onClick={() => void handleClick()}
      type="button"
      variant="outline"
    >
      <LogOut className="size-4" />
      {isPending ? "Cerrando..." : label}
    </Button>
  );
}
