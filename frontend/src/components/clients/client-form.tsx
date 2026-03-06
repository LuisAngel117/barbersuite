"use client";

import { FormEvent, useState } from "react";
import { type ClientPayload } from "@/lib/backend";
import { ProblemBanner } from "@/components/ui/problem-banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export type ClientFormSubmission = {
  fullName: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  active?: boolean;
};

type ClientFormProps = {
  initialClient?: ClientPayload | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: ClientFormSubmission) => Promise<void> | void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeOptional(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function ClientForm({
  initialClient,
  isSubmitting,
  onCancel,
  onSubmit,
}: ClientFormProps) {
  const [fullName, setFullName] = useState(initialClient?.fullName ?? "");
  const [phone, setPhone] = useState(initialClient?.phone ?? "");
  const [email, setEmail] = useState(initialClient?.email ?? "");
  const [notes, setNotes] = useState(initialClient?.notes ?? "");
  const [active, setActive] = useState(initialClient?.active ?? true);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedFullName = fullName.trim();
    const normalizedEmail = normalizeOptional(email);

    if (normalizedFullName.length < 2) {
      setError("El nombre completo debe tener al menos 2 caracteres.");
      return;
    }

    if (normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)) {
      setError("Ingresa un email válido o deja el campo vacío.");
      return;
    }

    setError("");
    await onSubmit({
      fullName: normalizedFullName,
      phone: normalizeOptional(phone),
      email: normalizedEmail,
      notes: normalizeOptional(notes),
      active: initialClient ? active : undefined,
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {initialClient ? "Edit client" : "New client"}
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {initialClient ? "Actualizar cliente" : "Crear cliente"}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Esta operación usa el BFF interno y adjunta la sucursal desde la cookie seleccionada.
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
        <Label htmlFor="client-full-name">Full name</Label>
        <Input
          className="h-11 rounded-xl"
          data-testid="client-fullName"
          id="client-full-name"
          minLength={2}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="María Torres"
          required
          value={fullName}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client-phone">Phone</Label>
          <Input
            className="h-11 rounded-xl"
            data-testid="client-phone"
            id="client-phone"
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+593999123456"
            value={phone}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-email">Email</Label>
          <Input
            className="h-11 rounded-xl"
            data-testid="client-email"
            id="client-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="cliente@example.com"
            type="email"
            value={email}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="client-notes">Notes</Label>
        <Textarea
          className="min-h-32 rounded-xl"
          data-testid="client-notes"
          id="client-notes"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Preferencias, recordatorios o contexto operativo."
          rows={5}
          value={notes}
        />
      </div>

      <Separator />

      {initialClient ? (
        <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm font-medium">
          <Checkbox
            checked={active}
            onCheckedChange={(checked) => setActive(Boolean(checked))}
          />
          <span>Cliente activo</span>
        </label>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">
          Los clientes nuevos se crean activos por defecto.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          className="h-11 rounded-xl"
          data-testid="client-submit"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? initialClient
              ? "Guardando..."
              : "Creando..."
            : initialClient
              ? "Guardar cambios"
              : "Crear cliente"}
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
