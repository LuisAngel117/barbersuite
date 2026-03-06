import { UiKitShowcase } from "@/components/ui-kit-showcase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function UiKitPage() {
  return (
    <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5">
      <CardHeader className="space-y-3">
        <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          UI Kit
        </div>
        <CardTitle className="text-3xl tracking-tight">Design system sandbox</CardTitle>
        <CardDescription className="text-sm leading-6">
          Ruta interna para validar Tailwind, shadcn, dark mode, Sonner y componentes base sin
          depender del backend.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UiKitShowcase />
      </CardContent>
    </Card>
  );
}
