import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ChartColumnBig } from "lucide-react";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardContext } from "@/lib/dashboard-context";
import { hasAnyRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

function formatDateInput(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

export default async function ReportsPage() {
  const tReports = await getTranslations("reports");
  const { payload, selectedBranchId } = await getDashboardContext();
  const roles = payload?.user.roles ?? [];
  const branches = payload?.branches ?? [];
  const canAccess = hasAnyRole(roles, ["ADMIN", "MANAGER"]);
  const activeBranch = branches.find((branch) => branch.id === selectedBranchId) ?? null;

  if (!canAccess) {
    return (
      <section className="space-y-6">
        <PageHeader subtitle={tReports("subtitle")} title={tReports("title")} />
        <EmptyState
          cta={
            <Button asChild className="rounded-full" size="sm">
              <Link href="/app">{tReports("backToDashboard")}</Link>
            </Button>
          }
          description={tReports("noAccessDescription")}
          icon={<ChartColumnBig className="size-5" />}
          title={tReports("noAccessTitle")}
          variant="warning"
        />
      </section>
    );
  }

  if (!selectedBranchId || !activeBranch) {
    return (
      <section className="space-y-6">
        <PageHeader
          rightSlot={(
            <Badge className="rounded-full" variant="outline">
              {tReports("pageEyebrow")}
            </Badge>
          )}
          subtitle={tReports("subtitle")}
          title={tReports("title")}
        />
        <EmptyState
          cta={(
            <Button asChild className="rounded-full">
              <Link href="/app/clients">{tReports("selectBranchCta")}</Link>
            </Button>
          )}
          description={tReports("noBranchDescription")}
          icon={<ChartColumnBig className="size-5" />}
          title={tReports("noBranchTitle")}
          variant="warning"
        />
      </section>
    );
  }

  const now = new Date();
  const initialTo = formatDateInput(now, activeBranch.timeZone);
  const initialFrom = formatDateInput(
    new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    activeBranch.timeZone,
  );

  return (
    <section className="space-y-6">
      <PageHeader
        rightSlot={(
          <Badge className="rounded-full" variant="outline">
            {tReports("pageEyebrow")}
          </Badge>
        )}
        subtitle={tReports("subtitle")}
        title={tReports("title")}
      />

      <ReportsDashboard
        branchCode={activeBranch.code}
        branchName={activeBranch.name}
        branchTimeZone={activeBranch.timeZone}
        initialFrom={initialFrom}
        initialTo={initialTo}
      />
    </section>
  );
}
