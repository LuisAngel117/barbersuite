import { getTranslations } from "next-intl/server";
import { ServicesTable } from "@/components/services/services-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardContext } from "@/lib/dashboard-context";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const tServices = await getTranslations("services");
  const { payload } = await getDashboardContext();
  const roles = payload?.user.roles ?? [];

  return (
    <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5">
      <CardHeader className="space-y-3">
        <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {tServices("pageEyebrow")}
        </div>
        <CardTitle className="text-3xl tracking-tight">{tServices("pageTitle")}</CardTitle>
        <CardDescription className="text-sm leading-6">
          {tServices("pageDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ServicesTable roles={roles} />
      </CardContent>
    </Card>
  );
}
