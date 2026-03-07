import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { BranchesTable } from "@/components/branches/branches-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getDashboardContext } from "@/lib/dashboard-context";
import { hasAnyRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const tBranches = await getTranslations("branches");
  const { payload } = await getDashboardContext();
  const roles = payload?.user.roles ?? [];
  const canAccess = hasAnyRole(roles, ["ADMIN", "MANAGER"]);

  if (!canAccess) {
    return (
      <section className="space-y-6">
        <PageHeader subtitle={tBranches("subtitle")} title={tBranches("title")} />
        <EmptyState
          cta={
            <Button asChild className="rounded-full" size="sm">
              <Link href="/app">{tBranches("backToDashboard")}</Link>
            </Button>
          }
          description={tBranches("noAccessDescription")}
          title={tBranches("noAccessTitle")}
          variant="warning"
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        rightSlot={(
          <Button asChild className="rounded-full" size="sm">
            <Link href="/app/branches?create=1">{tBranches("newBranch")}</Link>
          </Button>
        )}
        subtitle={tBranches("subtitle")}
        title={tBranches("title")}
      />

      <BranchesTable roles={roles} />
    </section>
  );
}
