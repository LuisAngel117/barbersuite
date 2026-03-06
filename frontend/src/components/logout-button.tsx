"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
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
  label,
}: LogoutButtonProps) {
  const router = useRouter();
  const tNav = useTranslations("nav");
  const tUi = useTranslations("ui");
  const [isPending, startTransition] = useTransition();
  const [, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);

    const response = await apiFetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
    });

    if (!response.ok) {
      setError(tNav("logout"));
      toast.error(tUi("logoutFailed"));
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
      {isPending ? `${tNav("logout")}...` : (label ?? tNav("logout"))}
    </Button>
  );
}
