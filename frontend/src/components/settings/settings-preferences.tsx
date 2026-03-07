"use client";

import Link from "next/link";
import { MoonStar, Languages, MapPinned, Palette } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MePayload } from "@/lib/backend";

type SettingsPreferencesProps = {
  selectedBranch: MePayload["branches"][number] | null;
};

export function SettingsPreferences({ selectedBranch }: SettingsPreferencesProps) {
  const locale = useLocale();
  const { resolvedTheme, theme } = useTheme();
  const tSettings = useTranslations("settings");

  const activeTheme = theme ?? resolvedTheme ?? "system";

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card className="rounded-[1.5rem] border-border/70 bg-card/85">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-muted text-brand-foreground">
              <Palette className="size-4" />
            </div>
            <div className="space-y-1">
              <CardTitle>{tSettings("preferences.theme")}</CardTitle>
              <CardDescription>{tSettings("preferences.themeDescription")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge className="rounded-full" variant="outline">
            <MoonStar className="size-3.5" />
            {activeTheme}
          </Badge>
          <ThemeToggle buttonClassName="rounded-xl w-full justify-center" />
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-border/70 bg-card/85">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-muted text-brand-foreground">
              <Languages className="size-4" />
            </div>
            <div className="space-y-1">
              <CardTitle>{tSettings("preferences.language")}</CardTitle>
              <CardDescription>{tSettings("preferences.languageDescription")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge className="rounded-full" variant="outline">
            {locale.toUpperCase()}
          </Badge>
          <LanguageToggle buttonClassName="rounded-xl w-full justify-center" />
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-border/70 bg-card/85">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-muted text-brand-foreground">
              <MapPinned className="size-4" />
            </div>
            <div className="space-y-1">
              <CardTitle>{tSettings("preferences.currentBranch")}</CardTitle>
              <CardDescription>{tSettings("preferences.currentBranchDescription")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedBranch ? (
            <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{selectedBranch.name}</p>
                <Badge className="rounded-full" variant="outline">
                  {selectedBranch.code}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{selectedBranch.timeZone}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              {tSettings("preferences.noBranch")}
            </div>
          )}
          <Button asChild className="rounded-xl" type="button" variant="outline">
            <Link href="/app/clients">{tSettings("preferences.changeBranch")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
