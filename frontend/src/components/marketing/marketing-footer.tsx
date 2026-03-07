import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function MarketingFooter() {
  const t = await getTranslations("marketing.footer");

  return (
    <footer className="relative border-t border-border/60 bg-background/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <Link className="hover:text-foreground" href="/features">
            {t("features")}
          </Link>
          <Link className="hover:text-foreground" href="/pricing">
            {t("pricing")}
          </Link>
          <Link className="hover:text-foreground" href="/features#architecture">
            {t("docs")}
          </Link>
          <Link className="hover:text-foreground" href="/login">
            {t("login")}
          </Link>
        </div>
        <p>{t("rights")}</p>
      </div>
    </footer>
  );
}
