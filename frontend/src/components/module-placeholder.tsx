import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
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

type ModulePlaceholderProps = {
  title: string;
  subtitle?: string;
  description: string;
  bullets: string[];
  icon?: ReactNode;
  comingSoonLabel: string;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryCtaHref?: string;
  secondaryCtaLabel?: string;
};

export function ModulePlaceholder({
  title,
  subtitle,
  description,
  bullets,
  icon,
  comingSoonLabel,
  ctaHref,
  ctaLabel,
  secondaryCtaHref,
  secondaryCtaLabel,
}: ModulePlaceholderProps) {
  return (
    <section className="space-y-6">
      <PageHeader
        rightSlot={(
          <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
            {comingSoonLabel}
          </Badge>
        )}
        subtitle={subtitle}
        title={title}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <EmptyState
          cta={
            ctaHref && ctaLabel ? (
              <Button asChild className="rounded-full">
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
            ) : null
          }
          description={description}
          icon={icon}
          secondaryCta={
            secondaryCtaHref && secondaryCtaLabel ? (
              <Button asChild className="rounded-full" variant="outline">
                <Link href={secondaryCtaHref}>{secondaryCtaLabel}</Link>
              </Button>
            ) : null
          }
          title={comingSoonLabel}
        />

        <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5">
          <CardHeader className="space-y-3">
            <Badge className="w-fit rounded-full" variant="outline">
              <Clock3 className="size-3.5" />
              {comingSoonLabel}
            </Badge>
            <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
            <CardDescription className="text-sm leading-6">{subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {bullets.map((bullet) => (
              <div
                className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm leading-6"
                key={bullet}
              >
                {bullet}
              </div>
            ))}
            {ctaHref && ctaLabel ? (
              <Button asChild className="mt-2 justify-between rounded-2xl" variant="ghost">
                <Link href={ctaHref}>
                  <span>{ctaLabel}</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
