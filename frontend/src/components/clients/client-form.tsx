"use client";

import { FormEvent, useState } from "react";
import { type ClientPayload } from "@/lib/backend";

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
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="dashboard-heading">
        <span className="eyebrow">{initialClient ? "Edit client" : "New client"}</span>
        <h1>{initialClient ? "Actualizar cliente" : "Crear cliente"}</h1>
        <p className="muted">
          Esta operación usa el BFF interno y adjunta la sucursal desde la cookie seleccionada.
        </p>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="field">
        <label htmlFor="client-full-name">Full name</label>
        <input
          data-testid="client-fullName"
          id="client-full-name"
          minLength={2}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="María Torres"
          required
          value={fullName}
        />
      </div>

      <div className="field-group">
        <div className="field">
          <label htmlFor="client-phone">Phone</label>
          <input
            data-testid="client-phone"
            id="client-phone"
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+593999123456"
            value={phone}
          />
        </div>

        <div className="field">
          <label htmlFor="client-email">Email</label>
          <input
            data-testid="client-email"
            id="client-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="cliente@example.com"
            type="email"
            value={email}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="client-notes">Notes</label>
        <textarea
          data-testid="client-notes"
          id="client-notes"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Preferencias, recordatorios o contexto operativo."
          rows={5}
          value={notes}
        />
      </div>

      {initialClient ? (
        <label className="checkbox-row">
          <input
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            type="checkbox"
          />
          <span>Cliente activo</span>
        </label>
      ) : (
        <p className="support">Los clientes nuevos se crean activos por defecto.</p>
      )}

      <div className="actions-row">
        <button
          className="button button-primary"
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
        </button>
        <button
          className="button button-secondary"
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
