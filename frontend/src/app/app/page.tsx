import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { getDashboardContext } from "@/lib/dashboard-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  resolveErrorMessage,
} from "@/lib/backend";

export default async function DashboardPage() {
  const tDashboard = await getTranslations("dashboard");
  const tCommon = await getTranslations("common");
  const { payload, problem } = await getDashboardContext();
  if (!payload) {
    return (
      <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {tDashboard("title")}
          </div>
          <CardTitle className="text-3xl tracking-tight">
            {tDashboard("errorTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-muted-foreground">
          {resolveErrorMessage(
            problem,
            tDashboard("errorFallback"),
          )}
          </p>
          <LogoutButton label={tCommon("backToLogin")} />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
                {tDashboard("tenantDashboard")}
              </Badge>
              <Badge className="rounded-full" variant="outline">
                {payload.tenant.name}
              </Badge>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl tracking-tight">{payload.user.fullName}</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-6">
                {tDashboard("sessionDescription", { email: payload.user.email })}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full" variant="secondary">
              <Link href="/app/services">{tDashboard("goServices")}</Link>
            </Button>
            <Button asChild className="rounded-full" variant="outline">
              <Link href="/app/clients">{tDashboard("goClients")}</Link>
            </Button>
            <Button asChild className="rounded-full" variant="ghost">
              <Link href="/app/ui-kit">{tDashboard("goUiKit")}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {payload.user.roles.map((role) => (
                <Badge className="rounded-full" key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
            </div>
            <CardTitle className="text-xl tracking-tight">{tDashboard("quickSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {tDashboard("tenantId")}
                </p>
                <p className="mt-2 break-all text-sm font-medium">{payload.tenant.id}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {tDashboard("userId")}
                </p>
                <p className="mt-2 break-all text-sm font-medium">{payload.user.id}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {tDashboard("branches")}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{payload.branches.length}</p>
              </div>
            </div>
            <LogoutButton className="w-full justify-center" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5">
          <CardHeader className="space-y-3">
            <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {tDashboard("context")}
            </div>
            <CardTitle className="text-3xl tracking-tight">{payload.tenant.name}</CardTitle>
            <CardDescription className="text-sm leading-6">
              {tDashboard("contextDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {tDashboard("user")}
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight">{payload.user.fullName}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {tDashboard("email")}
              </p>
              <p className="mt-2 text-sm font-medium">{payload.user.email}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {tDashboard("roles")}
              </p>
              <p className="mt-2 text-sm font-medium">{payload.user.roles.join(", ")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5">
          <CardHeader className="space-y-3">
            <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {tDashboard("branches")}
            </div>
            <CardTitle className="text-3xl tracking-tight">{tDashboard("branchesTitle")}</CardTitle>
            <CardDescription className="text-sm leading-6">
              {tDashboard("branchesDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>

          {payload.branches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-6 text-sm text-muted-foreground">
              {tDashboard("branchesEmpty")}
            </div>
          ) : (
            <div className="grid gap-4">
              {payload.branches.map((branch) => (
                <article
                  className="rounded-2xl border border-border/70 bg-muted/40 p-5"
                  key={branch.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
                        {branch.code}
                      </span>
                      <h2 className="text-xl font-semibold tracking-tight">{branch.name}</h2>
                    </div>
                    <Badge
                      className="rounded-full"
                      variant={branch.active ? "secondary" : "outline"}
                    >
                      {branch.active ? tDashboard("active") : tDashboard("inactive")}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{branch.timeZone}</p>
                </article>
              ))}
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
