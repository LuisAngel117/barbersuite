import Link from "next/link";
import { BadgeCheck, Building2, Scissors, Sparkles, Users } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { ClientPagePayload, MePayload, ServicePayload } from "@/lib/backend";
import { fetchBffJson } from "@/lib/server-bff";
import { hasAnyRole } from "@/lib/roles";
import { formatMoneyUSD } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardPanelsProps = {
  branches: MePayload["branches"];
  roles: readonly string[];
  selectedBranchId: string | null;
  tenantName: string;
};

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export async function DashboardPanels({
  branches,
  roles,
  selectedBranchId,
  tenantName,
}: DashboardPanelsProps) {
  const locale = await getLocale();
  const tDashboard = await getTranslations("dashboard");
  const canManageServices = hasAnyRole(roles, ["ADMIN", "MANAGER"]);
  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) ?? null;

  const [servicesResult, clientsResult] = await Promise.all([
    fetchBffJson<ServicePayload[]>("/api/services"),
    selectedBranchId
      ? fetchBffJson<ClientPagePayload>("/api/clients?page=0&size=5")
      : Promise.resolve({ data: null, problem: null, status: 200 }),
  ]);

  const services = servicesResult.data ?? [];
  const clientsPage = clientsResult.data;
  const activeServices = services.filter((service) => service.active).length;
  const recentClients = clientsPage?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-[1.5rem] border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
                {tDashboard("activeBranch")}
              </Badge>
              <Building2 className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-xl tracking-tight">
                {selectedBranch ? selectedBranch.name : tDashboard("branchNone")}
              </CardTitle>
              <CardDescription className="text-sm leading-6">
                {selectedBranch
                  ? `${selectedBranch.code} · ${selectedBranch.timeZone}`
                  : tDashboard("branchNoneDescription")}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {selectedBranch ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full" variant={selectedBranch.active ? "secondary" : "outline"}>
                  {selectedBranch.active
                    ? tDashboard("branchStatusActive")
                    : tDashboard("branchStatusInactive")}
                </Badge>
                <Button asChild className="rounded-full" size="sm" variant="outline">
                  <Link href="/app/clients">{tDashboard("openBranchClients")}</Link>
                </Button>
              </div>
            ) : (
              <Button asChild className="rounded-full" size="sm">
                <Link href="#branch-selector">{tDashboard("selectBranchCta")}</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className="rounded-full" variant="outline">
                {tDashboard("services")}
              </Badge>
              <Scissors className="size-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-4xl tracking-tight">{services.length}</CardTitle>
            <CardDescription>
              {tDashboard("servicesMetricDetail", { active: activeServices })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-full" size="sm" variant="outline">
              <Link href="/app/services">{tDashboard("openServices")}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className="rounded-full" variant="outline">
                {tDashboard("clients")}
              </Badge>
              <Users className="size-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-4xl tracking-tight">
              {selectedBranch ? (clientsPage?.totalItems ?? 0) : "—"}
            </CardTitle>
            <CardDescription>
              {selectedBranch
                ? tDashboard("clientsMetricDetail")
                : tDashboard("clientsMetricWithoutBranch")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="rounded-full"
              size="sm"
              variant={selectedBranch ? "outline" : "secondary"}
            >
              <Link href={selectedBranch ? "/app/clients" : "#branch-selector"}>
                {selectedBranch ? tDashboard("openClients") : tDashboard("selectBranchCta")}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
                {tDashboard("role")}
              </Badge>
              <BadgeCheck className="size-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl tracking-tight">{tenantName}</CardTitle>
            <CardDescription>{tDashboard("tenantDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <Badge className="rounded-full" key={role} variant="secondary">
                {role}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <Card className="rounded-[1.75rem] border-border/70 bg-card/85 shadow-xl shadow-black/5">
          <CardHeader className="space-y-3">
            <Badge className="w-fit rounded-full" variant="outline">
              {tDashboard("recentClients")}
            </Badge>
            <CardTitle className="text-2xl tracking-tight">{tDashboard("recentClientsTitle")}</CardTitle>
            <CardDescription>{tDashboard("recentClientsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedBranch ? (
              <EmptyState
                cta={(
                  <Button asChild className="rounded-full" size="sm">
                    <Link href="#branch-selector">{tDashboard("selectBranchCta")}</Link>
                  </Button>
                )}
                description={tDashboard("recentClientsNoBranchDescription")}
                title={tDashboard("recentClientsNoBranchTitle")}
                variant="warning"
              />
            ) : recentClients.length === 0 ? (
              <EmptyState
                cta={(
                  <Button asChild className="rounded-full" size="sm">
                    <Link href="/app/clients?create=1">{tDashboard("newClient")}</Link>
                  </Button>
                )}
                description={tDashboard("recentClientsEmptyDescription")}
                title={tDashboard("recentClientsEmptyTitle")}
              />
            ) : (
              <div className="grid gap-3">
                {recentClients.map((client) => (
                  <article
                    className="rounded-2xl border border-border/70 bg-muted/35 p-4"
                    key={client.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="font-medium tracking-tight">{client.fullName}</h3>
                        <p className="text-xs text-muted-foreground">
                          {client.email || client.phone || tDashboard("recentClientsNoContact")}
                        </p>
                      </div>
                      <Badge className="rounded-full" variant={client.active ? "secondary" : "outline"}>
                        {client.active ? tDashboard("active") : tDashboard("inactive")}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {formatDate(client.createdAt, locale)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/70 bg-card/85 shadow-xl shadow-black/5">
          <CardHeader className="space-y-3">
            <Badge className="w-fit rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
              {tDashboard("quickActions")}
            </Badge>
            <CardTitle className="text-2xl tracking-tight">{tDashboard("quickActionsTitle")}</CardTitle>
            <CardDescription>{tDashboard("quickActionsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {canManageServices ? (
              <Button asChild className="w-full justify-between rounded-2xl" size="lg">
                <Link href="/app/services?create=1">{tDashboard("newService")}</Link>
              </Button>
            ) : null}

            {selectedBranch ? (
              <Button asChild className="w-full justify-between rounded-2xl" size="lg" variant="secondary">
                <Link href="/app/clients?create=1">{tDashboard("newClient")}</Link>
              </Button>
            ) : (
              <Button asChild className="w-full justify-between rounded-2xl" size="lg" variant="outline">
                <Link href="#branch-selector">{tDashboard("selectBranchCta")}</Link>
              </Button>
            )}

            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {tDashboard("revenueHint")}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {services.length > 0
                  ? tDashboard("revenueHintDescription", {
                      amount: formatMoneyUSD(
                        services.reduce((total, service) => total + Number(service.price), 0),
                        locale === "en" ? "en-US" : "es-EC",
                      ),
                    })
                  : tDashboard("revenueHintEmpty")}
              </p>
            </div>

            <Button asChild className="w-full justify-between rounded-2xl" size="lg" variant="ghost">
              <Link href="/app/ui-kit">
                <span>{tDashboard("openUiKit")}</span>
                <Sparkles className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function DashboardPanelsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card className="rounded-[1.5rem] border-border/70 bg-card/85 shadow-lg shadow-black/5" key={index}>
            <CardHeader className="space-y-4">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-2xl" />
              <Skeleton className="h-4 w-full rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-32 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <Card className="rounded-[1.75rem] border-border/70 bg-card/85 shadow-xl shadow-black/5">
          <CardHeader className="space-y-3">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-8 w-64 rounded-2xl" />
            <Skeleton className="h-4 w-full rounded-full" />
          </CardHeader>
          <CardContent className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton className="h-24 rounded-2xl" key={index} />
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-[1.75rem] border-border/70 bg-card/85 shadow-xl shadow-black/5">
          <CardHeader className="space-y-3">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-8 w-48 rounded-2xl" />
            <Skeleton className="h-4 w-full rounded-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-12 rounded-2xl" />
            <Skeleton className="h-12 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
