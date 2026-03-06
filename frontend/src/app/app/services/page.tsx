import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { ServicesTable } from "@/components/services/services-table";
import { Badge } from "@/components/ui/badge";
import { getDashboardContext } from "@/lib/dashboard-context";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const tServices = await getTranslations("services");
  const { payload } = await getDashboardContext();
  const roles = payload?.user.roles ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        rightSlot={(
          <Badge className="rounded-full" variant="outline">
            {tServices("pageEyebrow")}
          </Badge>
        )}
        subtitle={tServices("pageDescription")}
        title={tServices("pageTitle")}
      />
      <ServicesTable roles={roles} />
    </section>
  );
}
