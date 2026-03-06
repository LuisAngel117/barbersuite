"use client";

import { useState } from "react";
import { Rocket, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DataTableDemo } from "@/components/data-table/data-table-demo";
import { EntitySheet } from "@/components/forms/entity-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DestructiveConfirm } from "@/components/ui/destructive-confirm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

export function UiKitShowcase() {
  const [dialogName, setDialogName] = useState("Corte Signature");
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isConfirmPending, setIsConfirmPending] = useState(false);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
      <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-lg shadow-black/5">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
              Buttons
            </Badge>
            <Badge className="rounded-full" variant="outline">
              Brand accent
            </Badge>
          </div>
          <CardTitle className="text-2xl tracking-tight">Acciones y acentos</CardTitle>
          <CardDescription>
            Base visual neutral con detalles amber en focus, badges y superficies activas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button className="rounded-full">Primary action</Button>
            <Button className="rounded-full" variant="outline">
              Outline
            </Button>
            <Button className="rounded-full" variant="ghost">
              Ghost
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
              Brand / Amber
            </Badge>
            <Badge className="rounded-full" variant="secondary">
              Active
            </Badge>
            <Badge className="rounded-full" variant="outline">
              Inactive
            </Badge>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="rounded-3xl border-border/70 bg-muted/45 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Card surface</CardTitle>
                <CardDescription>
                  Superficie principal para métricas, formularios o estados.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="rounded-3xl border-brand/20 bg-brand-muted/40 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Brand surface</CardTitle>
                <CardDescription>
                  Variante suave para destacar contexto sin romper el look minimal.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-lg shadow-black/5">
          <CardHeader className="space-y-3">
            <CardTitle className="text-xl tracking-tight">Toast y overlays</CardTitle>
            <CardDescription>
              Sonner, Dialog y Sheet listos para pantallas operativas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full rounded-xl"
              onClick={() =>
                toast.success("BarberSuite UI ready", {
                  description: "Sonner quedó montado globalmente con tema light/dark.",
                })
              }
              variant="secondary"
            >
              Show toast
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full rounded-xl" variant="outline">
                  Open dialog
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Crear plantilla premium</DialogTitle>
                  <DialogDescription>
                    Dialog listo para flujos editoriales, confirmaciones y modales de formulario.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                  <Label htmlFor="ui-kit-dialog-name">Template name</Label>
                  <Input
                    className="h-11 rounded-xl"
                    id="ui-kit-dialog-name"
                    onChange={(event) => setDialogName(event.target.value)}
                    value={dialogName}
                  />
                </div>

                <DialogFooter>
                  <Button
                    className="rounded-xl"
                    onClick={() =>
                      toast.message("Dialog action executed", {
                        description: `Guardaste ${dialogName}.`,
                        icon: <Sparkles className="size-4" />,
                      })
                    }
                  >
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button className="w-full rounded-xl" variant="ghost">
                  Open sheet
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full max-w-md border-border/70 bg-background/95">
                <SheetHeader>
                  <SheetTitle>Slide-out inspector</SheetTitle>
                  <SheetDescription>
                    Útil para edición rápida, filtros o navegación mobile.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 px-4 pb-4">
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                    <p className="text-sm leading-6 text-muted-foreground">
                      El sheet ya está listo para convertirse en panel lateral de formularios o
                      detalles.
                    </p>
                  </div>
                  <Button className="w-full rounded-xl" variant="outline">
                    <Rocket className="size-4" />
                    Trigger next step
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-lg shadow-black/5">
          <CardHeader className="space-y-3">
            <CardTitle className="text-xl tracking-tight">Skeleton states</CardTitle>
            <CardDescription>Loading placeholders para dashboard, tablas y paneles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-6 w-1/2 rounded-full" />
            <Skeleton className="h-24 rounded-2xl" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-lg shadow-black/5">
          <CardHeader className="space-y-3">
            <CardTitle className="text-xl tracking-tight">Form patterns</CardTitle>
            <CardDescription>
              Sheets con footer sticky, pending states y confirmación destructiva.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full rounded-xl" onClick={() => setIsFormSheetOpen(true)}>
              Open entity sheet
            </Button>
            <Button
              className="w-full rounded-xl"
              onClick={() => setIsConfirmOpen(true)}
              variant="outline"
            >
              Open destructive confirm
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="xl:col-span-2 rounded-[1.5rem] border-border/70 bg-card/80 shadow-lg shadow-black/5">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
              DataTable
            </Badge>
            <Badge className="rounded-full" variant="outline">
              TanStack + shadcn
            </Badge>
          </div>
          <CardTitle className="text-2xl tracking-tight">DataTable demo</CardTitle>
          <CardDescription>
            Patrón reutilizable para listados operativos con toolbar, acciones, paginación y
            estados vacíos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableDemo />
        </CardContent>
      </Card>

      <EntitySheet
        cancelLabel="Cancel"
        description="Reusable drawer shell for entity create/edit flows."
        onCancel={() => setIsFormSheetOpen(false)}
        onOpenChange={setIsFormSheetOpen}
        onSubmit={(event) => {
          event.preventDefault();
          toast.success("Demo saved", {
            description: "Entity sheet stays reusable across services and clients.",
          });
          setIsFormSheetOpen(false);
        }}
        open={isFormSheetOpen}
        submitLabel="Save changes"
        submitting={false}
        title="Entity sheet demo"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ui-kit-sheet-name">Display name</Label>
            <Input className="h-11 rounded-xl" defaultValue="Fade Signature" id="ui-kit-sheet-name" />
          </div>
          <div className="rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            RHF field errors land here in the real forms. This mock keeps the pattern visible in the UI Kit.
          </div>
        </div>
      </EntitySheet>

      <DestructiveConfirm
        cancelLabel="Cancel"
        confirmLabel="Deactivate"
        description="This is the same confirmation wrapper used by row actions in the real tables."
        onConfirm={async () => {
          setIsConfirmPending(true);
          try {
            await new Promise((resolve) => window.setTimeout(resolve, 500));
            toast.message("Demo confirmed", {
              description: "The wrapper handles focus, pending state and destructive styling.",
            });
            setIsConfirmOpen(false);
          } finally {
            setIsConfirmPending(false);
          }
        }}
        onOpenChange={setIsConfirmOpen}
        open={isConfirmOpen}
        pending={isConfirmPending}
        title="Deactivate demo record?"
      />
    </div>
  );
}
