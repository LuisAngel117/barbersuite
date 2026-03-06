"use client";

import { Search, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { BranchSelector } from "@/components/branch-selector";
import { LanguageToggle } from "@/components/language-toggle";
import { AppUserMenu } from "@/components/app-user-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

type AppTopbarProps = {
  roles: string[];
  user: {
    fullName: string;
    email: string;
  };
  branches: Array<{
    id: string;
    name: string;
    code: string;
    timeZone: string;
    active: boolean;
  }>;
  selectedBranchId: string | null;
};

export function AppTopbar({
  roles,
  user,
  branches,
  selectedBranchId,
}: AppTopbarProps) {
  const isMobile = useIsMobile();
  const t = useTranslations("ui");
  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) ?? null;

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div className="min-w-0 flex-1">
            <AppBreadcrumbs />
          </div>
          {isMobile ? (
            <div className="flex items-center gap-2">
              <LanguageToggle compact />
              <AppUserMenu compact roles={roles} user={user} />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative hidden w-full max-w-md xl:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 rounded-2xl border-border/70 bg-card/70 pl-10"
              disabled
              placeholder={t("searchPlaceholder")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            {selectedBranch ? (
              <Badge className="rounded-full" variant="outline">
                {selectedBranch.code}
              </Badge>
            ) : (
              <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
                <Sparkles className="size-3.5" />
                {t("selectBranch")}
              </Badge>
            )}

            <div className="hidden md:block">
              <LanguageToggle />
            </div>
            <div className="hidden min-w-[280px] md:block xl:min-w-[320px]">
              <BranchSelector
                branches={branches}
                selectedBranchId={selectedBranchId}
                variant="compact"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
