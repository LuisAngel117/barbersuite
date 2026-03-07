import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  ChartNoAxesCombined,
  CreditCard,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const highlightIcons = {
  agenda: CalendarClock,
  cash: CreditCard,
  reports: ChartNoAxesCombined,
  notifications: BellRing,
  multibranch: Store,
  rbac: ShieldCheck,
} as const;

const audienceIcons = {
  owners: Store,
  managers: ChartNoAxesCombined,
  teams: Users,
} as const;

export default async function MarketingHomePage() {
  const t = await getTranslations("marketing");

  return (
    <div className="pb-20">
      <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:pb-24 lg:pt-20">
        <div className="space-y-8">
          <Badge className="rounded-full border-brand/30 bg-brand-muted px-4 py-1 text-brand-foreground" variant="outline">
            {t("hero.badge")}
          </Badge>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.03] tracking-tight sm:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              {t("hero.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-11 rounded-full px-6" size="lg">
              <Link data-testid="marketing-cta-signup" href="/signup">
                {t("hero.ctaPrimary")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild className="h-11 rounded-full px-6" size="lg" variant="outline">
              <Link href="/features">{t("hero.ctaSecondary")}</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {(["ops", "cash", "visibility"] as const).map((key) => (
              <Card className="gap-3 rounded-[1.5rem] border-border/70 bg-card/75 py-5 backdrop-blur" key={key}>
                <CardHeader className="gap-1 px-5">
                  <CardDescription>{t(`hero.metrics.${key}.label`)}</CardDescription>
                  <CardTitle className="text-2xl">{t(`hero.metrics.${key}.value`)}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/80 py-0 shadow-2xl shadow-brand/10 backdrop-blur">
          <div className="border-b border-border/70 px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("home.preview.eyebrow")}</p>
                <h2 className="text-2xl font-semibold tracking-tight">{t("home.preview.title")}</h2>
              </div>
              <Badge className="rounded-full px-3 py-1" variant="secondary">
                {t("home.preview.badge")}
              </Badge>
            </div>
          </div>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t("home.preview.calendarTitle")}</p>
                    <p className="text-sm text-muted-foreground">{t("home.preview.calendarSubtitle")}</p>
                  </div>
                  <Badge variant="outline">{t("home.preview.liveBadge")}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"].map((slot) => (
                    <div
                      className="rounded-2xl border border-brand/20 bg-brand-muted/60 px-3 py-4 text-center text-sm font-medium text-brand-foreground"
                      key={slot}
                    >
                      {slot}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
                  <p className="text-sm font-medium">{t("home.preview.cashTitle")}</p>
                  <p className="mt-1 text-3xl font-semibold">USD 1,280</p>
                  <p className="mt-2 text-sm text-muted-foreground">{t("home.preview.cashSubtitle")}</p>
                </div>
                <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
                  <p className="text-sm font-medium">{t("home.preview.reportTitle")}</p>
                  <div className="mt-3 flex items-end gap-2">
                    {[32, 48, 41, 58, 66, 52].map((height, index) => (
                      <div
                        className="w-full rounded-full bg-brand/80"
                        key={`${height}-${index}`}
                        style={{ height: `${height}px` }}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{t("home.preview.reportSubtitle")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            {t("home.audienceEyebrow")}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("home.audienceTitle")}</h2>
          <p className="max-w-3xl text-muted-foreground">{t("home.audienceSubtitle")}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {(["owners", "managers", "teams"] as const).map((key) => {
            const Icon = audienceIcons[key];

            return (
              <Card className="rounded-[1.75rem] border-border/70 bg-card/75 py-0" key={key}>
                <CardHeader className="gap-4 p-6">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-muted text-brand-foreground">
                    <Icon className="size-5" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{t(`home.audience.${key}.title`)}</CardTitle>
                    <CardDescription className="text-sm leading-6">
                      {t(`home.audience.${key}.description`)}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            {t("sections.featuresEyebrow")}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("sections.featuresTitle")}
          </h2>
          <p className="max-w-3xl text-muted-foreground">{t("sections.featuresSubtitle")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(Object.keys(highlightIcons) as Array<keyof typeof highlightIcons>).map((key) => {
            const Icon = highlightIcons[key];

            return (
              <Card className="rounded-[1.75rem] border-border/70 bg-card/80 py-0" key={key}>
                <CardHeader className="gap-4 p-6">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-muted text-brand-foreground">
                    <Icon className="size-5" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{t(`highlights.${key}.title`)}</CardTitle>
                    <CardDescription className="text-sm leading-6">
                      {t(`highlights.${key}.description`)}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            {t("sections.faqEyebrow")}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("sections.faqTitle")}</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {(["one", "two", "three", "four"] as const).map((item) => (
            <Card className="rounded-[1.75rem] border-border/70 bg-card/75 py-0" key={item}>
              <CardHeader className="gap-3 p-6">
                <CardTitle className="text-lg">{t(`faq.${item}.question`)}</CardTitle>
                <CardDescription className="text-sm leading-6">
                  {t(`faq.${item}.answer`)}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <Card className="rounded-[2rem] border-border/70 bg-primary py-0 text-primary-foreground shadow-xl shadow-brand/10">
          <CardContent className="flex flex-col gap-6 px-6 py-10 lg:flex-row lg:items-end lg:justify-between lg:px-10">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary-foreground/70">
                {t("home.finalCta.eyebrow")}
              </p>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("home.finalCta.title")}
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-primary-foreground/75 sm:text-base">
                {t("home.finalCta.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="h-11 rounded-full px-6" size="lg" variant="secondary">
                <Link href="/signup">{t("hero.ctaPrimary")}</Link>
              </Button>
              <Button asChild className="h-11 rounded-full border-primary-foreground/20 px-6 text-primary-foreground" size="lg" variant="outline">
                <Link href="/pricing">{t("home.finalCta.secondary")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
