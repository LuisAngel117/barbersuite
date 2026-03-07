import Link from "next/link";
import { Scissors } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export async function MarketingNav() {
  const t = await getTranslations("marketing.nav");

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3 text-lg font-semibold tracking-tight" href="/">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-muted text-brand-foreground">
            <Scissors className="size-4" />
          </div>
          <span>BarberSuite</span>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
          <nav className="hidden items-center gap-2 md:flex">
            <Button asChild size="sm" variant="ghost">
              <Link data-testid="marketing-nav-features" href="/features">
                {t("features")}
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link data-testid="marketing-nav-pricing" href="/pricing">
                {t("pricing")}
              </Link>
            </Button>
          </nav>
          <LanguageToggle buttonClassName="rounded-full" compact />
          <ThemeToggle buttonClassName="rounded-full" />
          <Button asChild className="rounded-full" size="sm" variant="outline">
            <Link href="/login">{t("login")}</Link>
          </Button>
          <Button asChild className="rounded-full" size="sm">
            <Link href="/signup">{t("signup")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
