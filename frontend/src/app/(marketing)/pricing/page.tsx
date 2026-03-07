import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.pricingPage.meta");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function PricingPage() {
  const t = await getTranslations("marketing");
  const plans = ["starter", "pro", "enterprise"] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-14 sm:px-6 lg:px-8">
      <PageHeader
        subtitle={t("pricingPage.subtitle")}
        title={t("pricingPage.title")}
        rightSlot={
          <Badge className="rounded-full px-3 py-1" variant="outline">
            {t("pricingPage.perBranch")}
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isFeatured = plan === "pro";

          return (
            <Card
              className={`rounded-[1.9rem] border-border/70 py-0 ${
                isFeatured
                  ? "border-brand/40 bg-brand-muted/40 shadow-xl shadow-brand/10"
                  : "bg-card/80"
              }`}
              key={plan}
            >
              <CardHeader className="gap-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-2xl">{t(`pricingPage.plans.${plan}.name`)}</CardTitle>
                    <CardDescription className="mt-2 text-sm leading-6">
                      {t(`pricingPage.plans.${plan}.description`)}
                    </CardDescription>
                  </div>
                  {isFeatured ? (
                    <Badge className="rounded-full px-3 py-1">{t("pricingPage.featured")}</Badge>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-semibold tracking-tight">{t(`pricingPage.plans.${plan}.price`)}</p>
                  <p className="text-sm text-muted-foreground">{t("pricingPage.billingNote")}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-6">
                {(["one", "two", "three", "four"] as const).map((bullet) => (
                  <div className="flex gap-3 text-sm text-muted-foreground" key={bullet}>
                    <div className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-brand-muted text-brand-foreground">
                      <Check className="size-3.5" />
                    </div>
                    <span>{t(`pricingPage.plans.${plan}.bullets.${bullet}`)}</span>
                  </div>
                ))}
                <Button asChild className="mt-4 h-11 w-full rounded-full" variant={isFeatured ? "default" : "outline"}>
                  <Link href={plan === "enterprise" ? "/features" : "/signup"}>
                    {t(`pricingPage.plans.${plan}.cta`)}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-[2rem] border-border/70 bg-card/80 py-0">
        <CardHeader className="gap-3 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-muted text-brand-foreground">
              <Sparkles className="size-4" />
            </div>
            <div>
              <CardTitle className="text-2xl">{t("pricingPage.roadmapTitle")}</CardTitle>
              <CardDescription>{t("pricingPage.roadmapSubtitle")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pb-6 md:grid-cols-3">
          {(["whatsapp", "sri", "enterprise"] as const).map((key) => (
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5" key={key}>
              <p className="text-sm font-semibold">{t(`pricingPage.roadmap.${key}.title`)}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(`pricingPage.roadmap.${key}.description`)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
