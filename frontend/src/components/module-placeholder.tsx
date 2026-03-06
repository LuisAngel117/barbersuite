import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  ctaHref?: string;
  ctaLabel?: string;
};

export function ModulePlaceholder({
  eyebrow,
  title,
  description,
  bullets,
  ctaHref,
  ctaLabel,
}: ModulePlaceholderProps) {
  return (
    <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5">
      <CardHeader className="space-y-3">
        <Badge className="w-fit rounded-full" variant="outline">
          {eyebrow}
        </Badge>
        <CardTitle className="text-3xl tracking-tight">{title}</CardTitle>
        <CardDescription className="max-w-2xl text-sm leading-6">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {bullets.map((bullet) => (
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm" key={bullet}>
              {bullet}
            </div>
          ))}
        </div>
        {ctaHref && ctaLabel ? (
          <Button asChild className="rounded-full">
            <Link href={ctaHref}>
              {ctaLabel}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
