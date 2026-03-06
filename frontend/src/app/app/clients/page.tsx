import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { ClientsTable } from "@/components/clients/clients-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {tClients("pageEyebrow")}
          </div>
          {branchId ? (
            <Badge className="rounded-full" variant="outline">
              {tClients("pageBranchSelected")}
            </Badge>
          ) : null}
        </div>
        <CardTitle className="text-3xl tracking-tight">{tClients("pageTitle")}</CardTitle>
        <CardDescription className="text-sm leading-6">
          {tClients("pageDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>

      {!branchId ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-6">
          <strong className="block text-base font-semibold tracking-tight">
            {tClients("missingBranchTitle")}
          </strong>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {tClients("missingBranchDescription")}
          </p>
        </div>
      ) : (
        <ClientsTable branchId={branchId} key={branchId} roles={roles} />
      )}
      </CardContent>
    </Card>
  );
}
