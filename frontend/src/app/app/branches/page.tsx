import { Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ModulePlaceholder } from "@/components/module-placeholder";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getDashboardContext } from "@/lib/dashboard-context";
import { hasAnyRole } from "@/lib/roles";

export default async function BranchesPage() {
  const t = await getTranslations("placeholders.branches");
  const tCommon = await getTranslations("placeholders.common");
  const { payload } = await getDashboardContext();
  const roles = payload?.user.roles ?? [];
  const canAccess = hasAnyRole(roles, ["ADMIN", "MANAGER"]);

  if (!canAccess) {
    return (
      <section className="space-y-6">
        <PageHeader subtitle={t("subtitle")} title={t("title")} />
        <EmptyState
          cta={
            <Button asChild className="rounded-full" size="sm">
              <Link href="/app">{tCommon("backToDashboard")}</Link>
            </Button>
          }
          description={tCommon("restrictedDescription")}
          title={tCommon("restrictedTitle")}
          variant="warning"
        />
      </section>
    );
  }

  return (
    <ModulePlaceholder
      bullets={[
        t("bullets.one"),
        t("bullets.two"),
        t("bullets.three"),
      ]}
      comingSoonLabel={tCommon("comingSoon")}
      ctaHref="/app"
      ctaLabel={t("ctaPrimary")}
      description={t("description")}
      icon={<Building2 className="size-5" />}
      secondaryCtaHref="/app/clients"
      secondaryCtaLabel={t("ctaSecondary")}
      subtitle={t("subtitle")}
      title={t("title")}
    />
  );
}
