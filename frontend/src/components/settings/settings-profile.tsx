"use client";

import { UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MePayload } from "@/lib/backend";

type SettingsProfileProps = {
  user: MePayload["user"];
  branches: MePayload["branches"];
  selectedBranch: MePayload["branches"][number] | null;
};

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) {
    return "BS";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function SettingsProfile({
  user,
  branches,
  selectedBranch,
}: SettingsProfileProps) {
  const tSettings = useTranslations("settings");
  const tCommon = useTranslations("common");

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="rounded-[1.5rem] border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>{tSettings("tabs.profile")}</CardTitle>
          <CardDescription>{tSettings("profile.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex size-16 items-center justify-center rounded-3xl border border-brand/20 bg-brand-muted text-xl font-semibold text-brand-foreground">
              {getInitials(user.fullName)}
            </div>
            <div className="space-y-1">
              <p className="text-xl font-semibold tracking-tight">{user.fullName}</p>
              <p className="text-sm text-muted-foreground" data-testid="settings-user-email">
                {user.email}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {tSettings("profile.fullName")}
              </p>
              <p className="text-sm font-medium">{user.fullName}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {tSettings("profile.email")}
              </p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {tSettings("profile.roles")}
            </p>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <Badge className="rounded-full" key={role} variant="outline">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>{tSettings("profile.accessTitle")}</CardTitle>
          <CardDescription>{tSettings("profile.accessDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {tSettings("profile.currentBranch")}
            </p>
            {selectedBranch ? (
              <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{selectedBranch.name}</p>
                  <Badge className="rounded-full" variant="outline">
                    {selectedBranch.code}
                  </Badge>
                  <Badge className="rounded-full" variant={selectedBranch.active ? "secondary" : "outline"}>
                    {selectedBranch.active ? tSettings("profile.active") : tSettings("profile.inactive")}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{selectedBranch.timeZone}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                {tSettings("profile.noCurrentBranch")}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {tSettings("profile.branches")}
            </p>
            {branches.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {branches.map((branch) => (
                  <Badge className="rounded-full" key={branch.id} variant="secondary">
                    {branch.code} · {branch.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                <UserRound className="size-4" />
                {tCommon("none")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
