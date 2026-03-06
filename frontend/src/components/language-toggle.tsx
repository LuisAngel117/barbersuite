"use client";

import { Check, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/i18n/config";

type LanguageToggleProps = {
  buttonClassName?: string;
  compact?: boolean;
};

const localeOptions: Array<{ value: AppLocale; label: string }> = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
];

export function LanguageToggle({ buttonClassName, compact = false }: LanguageToggleProps) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const t = useTranslations("ui");
  const [isPending, startTransition] = useTransition();

  async function handleLocaleChange(nextLocale: AppLocale) {
    const response = await fetch("/api/i18n/locale", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ locale: nextLocale }),
      cache: "no-store",
    });

    if (!response.ok) {
      toast.error(t("languageUpdateFailed"));
      return;
    }

    toast.success(t("languageUpdated"));
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t("language")}
          className={cn("gap-2 rounded-full", buttonClassName)}
          disabled={isPending}
          size="sm"
          variant="outline"
        >
          <Languages className="size-4" />
          {!compact ? <span className="hidden sm:inline">{locale.toUpperCase()}</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {localeOptions.map((option) => (
          <DropdownMenuItem
            className="cursor-pointer"
            key={option.value}
            onClick={() => void handleLocaleChange(option.value)}
          >
            <span className="flex-1">{option.label}</span>
            {locale === option.value ? <Check className="size-4 text-brand" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
