import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BarbersTable } from "@/components/staff/barbers-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardContext } from "@/lib/dashboard-context";
import { hasAnyRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const tStaff = await getTranslations("staff");
  const { payload, selectedBranchId } = await getDashboardContext();
  const roles = payload?.user.roles ?? [];
  const branches = payload?.branches ?? [];
  const canManageStaff = hasAnyRole(roles, ["ADMIN", "MANAGER"]);

  return (
    <section className="space-y-6">
      <PageHeader
        rightSlot={(
          <Badge className="rounded-full" variant="outline">
            {tStaff("pageEyebrow")}
          </Badge>
        )}
        subtitle={tStaff("subtitle")}
        title={tStaff("title")}
      />

      {canManageStaff ? (
        <BarbersTable branches={branches} roles={roles} selectedBranchId={selectedBranchId} />
      ) : (
        <EmptyState
          cta={(
            <Button asChild className="rounded-full" size="sm">
              <Link href="/app">{tStaff("backToDashboard")}</Link>
            </Button>
          )}
          description={tStaff("noAccessDescription")}
          title={tStaff("noAccessTitle")}
          variant="warning"
        />
      )}
    </section>
  );
}
