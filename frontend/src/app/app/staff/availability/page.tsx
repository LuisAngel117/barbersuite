import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AvailabilityEditor } from "@/components/availability/availability-editor";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardContext } from "@/lib/dashboard-context";
import { hasAnyRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const tAvailability = await getTranslations("availability");
  const tUi = await getTranslations("ui");
  const { payload, selectedBranchId } = await getDashboardContext();
  const roles = payload?.user.roles ?? [];
  const canManageAvailability = hasAnyRole(roles, ["ADMIN", "MANAGER"]);

  return (
    <section className="space-y-6">
      <PageHeader
        rightSlot={(
          <Badge className="rounded-full" variant="outline">
            {tUi("branchScoped")}
          </Badge>
        )}
        subtitle={tAvailability("subtitle")}
        title={tAvailability("title")}
      />

      {!canManageAvailability ? (
        <EmptyState
          cta={(
            <Button asChild className="rounded-full" size="sm">
              <Link href="/app/staff">{tAvailability("backToStaff")}</Link>
            </Button>
          )}
          description={tAvailability("noAccessDescription")}
          title={tAvailability("noAccessTitle")}
          variant="warning"
        />
      ) : !selectedBranchId ? (
        <EmptyState
          cta={(
            <Button asChild className="rounded-full" size="sm">
              <Link href="/app/clients">{tAvailability("selectBranchCta")}</Link>
            </Button>
          )}
          description={tAvailability("branchRequiredDescription")}
          title={tAvailability("branchRequiredTitle")}
          variant="warning"
        />
      ) : (
        <AvailabilityEditor />
      )}
    </section>
  );
}
