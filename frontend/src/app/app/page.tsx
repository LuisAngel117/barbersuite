import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AlertCircle, Building2, Sparkles } from "lucide-react";
import {
  DashboardPanels,
  DashboardPanelsSkeleton,
} from "@/components/dashboard/dashboard-panels";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardContext } from "@/lib/dashboard-context";
import { resolveErrorMessage } from "@/lib/backend";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const tDashboard = await getTranslations("dashboard");
  const tCommon = await getTranslations("common");
  const { payload, problem, selectedBranchId } = await getDashboardContext();

  if (!payload) {
    return (
      <section className="space-y-6">
        <PageHeader
          rightSlot={(
            <Badge className="rounded-full" variant="outline">
              {tDashboard("title")}
            </Badge>
          )}
          subtitle={tDashboard("subtitle")}
          title={tDashboard("title")}
        />
        <EmptyState
          cta={<Button asChild className="rounded-full"><Link href="/login">{tCommon("backToLogin")}</Link></Button>}
          description={resolveErrorMessage(problem, tDashboard("errorFallback"))}
          icon={<AlertCircle className="size-5" />}
          title={tDashboard("errorTitle")}
          variant="warning"
        />
      </section>
    );
  }

  const primaryRole = payload.user.roles[0] ?? "STAFF";

  return (
    <section className="space-y-6">
      <PageHeader
        rightSlot={(
          <>
            <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
              <Building2 className="size-3.5" />
              {payload.tenant.name}
            </Badge>
            <Badge className="rounded-full" variant="outline">
              {primaryRole}
            </Badge>
            <Button asChild className="rounded-full" size="sm" variant="ghost">
              <Link href="/app/ui-kit">
                <Sparkles className="size-4" />
                {tDashboard("openUiKit")}
              </Link>
            </Button>
          </>
        )}
        subtitle={tDashboard("subtitle", { name: payload.user.fullName })}
        title={tDashboard("title")}
      />

      <Suspense fallback={<DashboardPanelsSkeleton />}>
        <DashboardPanels
          branches={payload.branches}
          roles={payload.user.roles}
          selectedBranchId={selectedBranchId}
          tenantName={payload.tenant.name}
        />
      </Suspense>
    </section>
  );
}
