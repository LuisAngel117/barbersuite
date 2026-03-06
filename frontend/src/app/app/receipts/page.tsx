import { getTranslations } from "next-intl/server";
import { ModulePlaceholder } from "@/components/module-placeholder";

export default async function ReceiptsPage() {
  const t = await getTranslations("placeholders.receipts");

  return (
    <ModulePlaceholder
      bullets={[
        t("bullets.one"),
        t("bullets.two"),
        t("bullets.three"),
      ]}
      ctaHref="/app/services"
      ctaLabel={t("cta")}
      description={t("description")}
      eyebrow={t("eyebrow")}
      title={t("title")}
    />
  );
}
