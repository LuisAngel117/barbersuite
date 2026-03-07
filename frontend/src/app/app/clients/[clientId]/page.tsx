import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { ClientDetailTabs } from "@/components/clients/detail/client-detail-tabs";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardContext } from "@/lib/dashboard-context";
import { hasAnyRole } from "@/lib/roles";
import { getClientHistory } from "@/lib/server-bff";

export const dynamic = "force-dynamic";

type ClientDetailPageProps = {
  params: Promise<{
    clientId: string;
  }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
    limit?: string;
  }>;
};

export default async function ClientDetailPage({
  params,
  searchParams,
}: ClientDetailPageProps) {
  const { clientId } = await params;
  const filters = await searchParams;
  const tClients = await getTranslations("clients");
  const tCommon = await getTranslations("common");
  const tErrors = await getTranslations("errors");
  const { payload, selectedBranchId, problem } = await getDashboardContext();
  const branches = payload?.branches ?? [];
  const activeBranch = branches.find((branch) => branch.id === selectedBranchId) ?? null;
  const canRebook = hasAnyRole(payload?.user.roles ?? [], ["ADMIN", "MANAGER", "RECEPTION"]);

  if (!selectedBranchId || !activeBranch) {
    return (
      <section className="space-y-6">
        <PageHeader
          rightSlot={(
            <Button asChild className="rounded-full" size="sm" variant="outline">
              <Link href="/app/clients">{tCommon("back")}</Link>
            </Button>
          )}
          subtitle={tClients("pageDescription")}
          title={tClients("detailTitle")}
        />
        <EmptyState
          cta={(
            <Button asChild className="rounded-full">
              <Link href="/app/clients">{tClients("missingBranchCta")}</Link>
            </Button>
          )}
          description={tClients("missingBranchDescription")}
          title={tClients("missingBranchTitle")}
          variant="warning"
        />
      </section>
    );
  }

  if (!payload || problem) {
    return (
      <section className="space-y-6">
        <PageHeader
          rightSlot={(
            <Button asChild className="rounded-full" size="sm" variant="outline">
              <Link href="/app/clients">{tCommon("back")}</Link>
            </Button>
          )}
          subtitle={tClients("pageDescription")}
          title={tClients("detailTitle")}
        />
        <EmptyState
          cta={(
            <Button asChild className="rounded-full">
              <Link href="/app/clients">{tCommon("back")}</Link>
            </Button>
          )}
          description={problem?.detail ?? tErrors("generic")}
          title={tClients("loadOneFailed")}
          variant="warning"
        />
      </section>
    );
  }

  const historyResult = await getClientHistory(clientId, {
    from: filters.from,
    to: filters.to,
    limit: filters.limit,
  });

  if (!historyResult.data) {
    return (
      <section className="space-y-6">
        <PageHeader
          rightSlot={(
            <Button asChild className="rounded-full" size="sm" variant="outline">
              <Link href="/app/clients">{tCommon("back")}</Link>
            </Button>
          )}
          subtitle={tClients("pageDescription")}
          title={tClients("detailTitle")}
        />
        <EmptyState
          cta={(
            <Button asChild className="rounded-full">
              <Link href="/app/clients">{tCommon("back")}</Link>
            </Button>
          )}
          description={historyResult.problem?.detail ?? tErrors("generic")}
          icon={<UserRound className="size-5" />}
          title={tClients("loadOneFailed")}
          variant="warning"
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        rightSlot={(
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full" variant="outline">
              {activeBranch.code}
            </Badge>
            <Button asChild className="rounded-full" size="sm" variant="outline">
              <Link href="/app/clients">{tCommon("back")}</Link>
            </Button>
          </div>
        )}
        subtitle={tClients("detailSubtitle")}
        title={historyResult.data.client.fullName}
      />

      <ClientDetailTabs
        branchTimeZone={activeBranch.timeZone}
        canRebook={canRebook}
        history={historyResult.data}
      />
    </section>
  );
}
