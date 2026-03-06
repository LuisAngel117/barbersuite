import { BanknoteArrowDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ReceiptsTable } from "@/components/receipts/receipts-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardContext } from "@/lib/dashboard-context";
import { hasAnyRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const tReceipts = await getTranslations("receipts");
  const { payload, selectedBranchId } = await getDashboardContext();
  const roles = payload?.user.roles ?? [];
  const branches = payload?.branches ?? [];
  const canAccess = hasAnyRole(roles, ["ADMIN", "MANAGER", "RECEPTION"]);
  const activeBranch = branches.find((branch) => branch.id === selectedBranchId) ?? null;

  if (!canAccess) {
    return (
      <section className="space-y-6">
        <PageHeader subtitle={tReceipts("subtitle")} title={tReceipts("title")} />
        <EmptyState
          cta={
            <Button asChild className="rounded-full" size="sm">
              <Link href="/app">{tReceipts("backToDashboard")}</Link>
            </Button>
          }
          description={tReceipts("noAccessDescription")}
          title={tReceipts("noAccessTitle")}
          variant="warning"
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        rightSlot={(
          <Badge className="rounded-full" variant="outline">
            {tReceipts("pageEyebrow")}
          </Badge>
        )}
        subtitle={tReceipts("subtitle")}
        title={tReceipts("title")}
      />

      {!selectedBranchId || !activeBranch ? (
        <EmptyState
          cta={(
            <Button asChild className="rounded-full">
              <Link href="/app/clients">{tReceipts("selectBranchCta")}</Link>
            </Button>
          )}
          description={tReceipts("missingBranchDescription")}
          icon={<BanknoteArrowDown className="size-5" />}
          title={tReceipts("missingBranchTitle")}
          variant="warning"
        />
      ) : (
        <ReceiptsTable
          branchId={activeBranch.code}
          branchTimeZone={activeBranch.timeZone}
          roles={roles}
        />
      )}
    </section>
  );
}
