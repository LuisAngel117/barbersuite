import { Bell } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ModulePlaceholder } from "@/components/module-placeholder";

export default async function NotificationsPage() {
  const t = await getTranslations("placeholders.notifications");
  const tCommon = await getTranslations("placeholders.common");

  return (
    <ModulePlaceholder
      bullets={[
        t("bullets.one"),
        t("bullets.two"),
        t("bullets.three"),
      ]}
      comingSoonLabel={tCommon("comingSoon")}
      ctaHref="/app/clients"
      ctaLabel={t("ctaPrimary")}
      description={t("description")}
      icon={<Bell className="size-5" />}
      secondaryCtaHref="/app"
      secondaryCtaLabel={t("ctaSecondary")}
      subtitle={t("subtitle")}
      title={t("title")}
    />
  );
}
