import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  BellRing,
  CalendarClock,
  CreditCard,
  ShieldCheck,
  Store,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const moduleIcons = {
  agenda: CalendarClock,
  cash: CreditCard,
  reports: Activity,
  notifications: BellRing,
  multibranch: Store,
  security: ShieldCheck,
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.featuresPage.meta");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function FeaturesPage() {
  const t = await getTranslations("marketing");

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-14 sm:px-6 lg:px-8">
      <PageHeader
        subtitle={t("featuresPage.subtitle")}
        title={t("featuresPage.title")}
        rightSlot={
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full px-5" variant="outline">
              <Link href="/pricing">{t("nav.pricing")}</Link>
            </Button>
            <Button asChild className="rounded-full px-5">
              <Link href="/signup">{t("hero.ctaPrimary")}</Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(Object.keys(moduleIcons) as Array<keyof typeof moduleIcons>).map((key) => {
          const Icon = moduleIcons[key];

          return (
            <Card className="rounded-[1.75rem] border-border/70 bg-card/80 py-0" key={key}>
              <CardHeader className="gap-4 p-6">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-muted text-brand-foreground">
                  <Icon className="size-5" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl">{t(`featuresPage.modules.${key}.title`)}</CardTitle>
                  <CardDescription className="text-sm leading-6">
                    {t(`featuresPage.modules.${key}.description`)}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-6 text-sm text-muted-foreground">
                {(["one", "two", "three"] as const).map((bullet) => (
                  <div className="flex gap-2" key={bullet}>
                    <span className="mt-2 size-1.5 rounded-full bg-brand" />
                    <span>{t(`featuresPage.modules.${key}.bullets.${bullet}`)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="space-y-6" id="architecture">
        <div className="space-y-2">
          <Badge className="rounded-full px-3 py-1" variant="outline">
            {t("featuresPage.architectureEyebrow")}
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("featuresPage.architectureTitle")}
          </h2>
          <p className="max-w-3xl text-muted-foreground">{t("featuresPage.architectureSubtitle")}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {(["tenancy", "branchScope", "outbox", "observability"] as const).map((key) => (
            <Card className="rounded-[1.75rem] border-border/70 bg-card/75 py-0" key={key}>
              <CardHeader className="gap-2 p-6">
                <CardTitle className="text-xl">{t(`featuresPage.architecture.${key}.title`)}</CardTitle>
                <CardDescription className="text-sm leading-6">
                  {t(`featuresPage.architecture.${key}.description`)}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
