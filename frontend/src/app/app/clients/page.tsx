import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ClientsTable } from "@/components/clients/clients-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BRANCH_COOKIE } from "@/lib/branch-cookie";
import { getDashboardContext } from "@/lib/dashboard-context";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const cookieStore = await cookies();
  const tClients = await getTranslations("clients");
  const branchId = cookieStore.get(BRANCH_COOKIE)?.value ?? null;
  const { payload } = await getDashboardContext();
  const roles = payload?.user.roles ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        rightSlot={(
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full" variant="outline">
              {tClients("pageEyebrow")}
            </Badge>
            {branchId ? (
              <Badge className="rounded-full" variant="secondary">
                {tClients("pageBranchSelected")}
              </Badge>
            ) : null}
          </div>
        )}
        subtitle={tClients("pageDescription")}
        title={tClients("pageTitle")}
      />

      {!branchId ? (
        <EmptyState
          cta={(
            <Button asChild className="rounded-full" size="sm">
              <Link href="#branch-selector">{tClients("missingBranchCta")}</Link>
            </Button>
          )}
          description={tClients("missingBranchDescription")}
          title={tClients("missingBranchTitle")}
          variant="warning"
        />
      ) : (
        <ClientsTable branchId={branchId} key={branchId} roles={roles} />
      )}
    </section>
  );
}
