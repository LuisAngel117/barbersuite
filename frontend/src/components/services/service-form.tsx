"use client";

import { FormEvent, useState } from "react";
import { type ServicePayload } from "@/lib/backend";
import { ProblemBanner } from "@/components/ui/problem-banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export type ServiceFormSubmission = {
  name: string;
  durationMinutes: number;
  price: number;
  active?: boolean;
};

type ServiceFormProps = {
  initialService?: ServicePayload | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: ServiceFormSubmission) => Promise<void> | void;
};

export function ServiceForm({
  initialService,
  isSubmitting,
  onCancel,
  onSubmit,
}: ServiceFormProps) {
  const [name, setName] = useState(initialService?.name ?? "");
  const [durationMinutes, setDurationMinutes] = useState(
    initialService ? String(initialService.durationMinutes) : "30",
  );
  const [price, setPrice] = useState(initialService ? initialService.price.toFixed(2) : "10.00");
  const [active, setActive] = useState(initialService?.active ?? true);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = name.trim();
    const normalizedDuration = Number.parseInt(durationMinutes, 10);
    const normalizedPrice = Number.parseFloat(price);

    if (normalizedName.length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }

    if (Number.isNaN(normalizedDuration) || normalizedDuration < 5 || normalizedDuration > 480) {
      setError("La duración debe estar entre 5 y 480 minutos.");
      return;
    }

    if (Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
      setError("El precio debe ser mayor o igual a 0.");
      return;
    }

    setError("");
    await onSubmit({
      name: normalizedName,
      durationMinutes: normalizedDuration,
      price: Number(normalizedPrice.toFixed(2)),
      active: initialService ? active : undefined,
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {initialService ? "Edit service" : "New service"}
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {initialService ? "Actualizar servicio" : "Crear servicio"}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Los cambios viajan por el BFF interno y mantienen el token fuera del browser.
          </p>
        </div>
      </div>

      {error ? (
        <ProblemBanner
          problem={{
            title: "Validación local",
            detail: error,
            code: "VALIDATION_ERROR",
          }}
        />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="service-name">Name</Label>
        <Input
          className="h-11 rounded-xl"
          data-testid="services-name"
          id="service-name"
          minLength={2}
          onChange={(event) => setName(event.target.value)}
          placeholder="Corte clásico"
          required
          value={name}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="service-duration">Duration (minutes)</Label>
          <Input
            className="h-11 rounded-xl"
            data-testid="services-duration"
            id="service-duration"
            max={480}
            min={5}
            onChange={(event) => setDurationMinutes(event.target.value)}
            required
            step={1}
            type="number"
            value={durationMinutes}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="service-price">Price</Label>
          <Input
            className="h-11 rounded-xl"
            data-testid="services-price"
            id="service-price"
            min={0}
            onChange={(event) => setPrice(event.target.value)}
            required
            step="0.01"
            type="number"
            value={price}
          />
        </div>
      </div>

      <Separator />

      {initialService ? (
        <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm font-medium">
          <Checkbox
            checked={active}
            onCheckedChange={(checked) => setActive(Boolean(checked))}
          />
          <span>Servicio activo</span>
        </label>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">
          Los servicios nuevos se crean activos por defecto.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          className="h-11 rounded-xl"
          data-testid="services-submit"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? initialService
              ? "Guardando..."
              : "Creando..."
            : initialService
              ? "Guardar cambios"
              : "Crear servicio"}
        </Button>
        <Button
          className="h-11 rounded-xl"
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
          variant="outline"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
