import { getTranslations } from "next-intl/server";
import { ModulePlaceholder } from "@/components/module-placeholder";

export default async function SettingsPage() {
  const t = await getTranslations("placeholders.settings");

  return (
    <ModulePlaceholder
      bullets={[
        t("bullets.one"),
        t("bullets.two"),
        t("bullets.three"),
      ]}
      ctaHref="/app/ui-kit"
      ctaLabel={t("cta")}
      description={t("description")}
      eyebrow={t("eyebrow")}
      title={t("title")}
    />
  );
}
