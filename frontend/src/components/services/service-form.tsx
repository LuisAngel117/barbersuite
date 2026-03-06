"use client";

import { FormEvent, useState } from "react";
import { type ServicePayload } from "@/lib/backend";

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
  const [price, setPrice] = useState(
    initialService ? initialService.price.toFixed(2) : "10.00",
  );
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
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="dashboard-heading">
        <span className="eyebrow">{initialService ? "Edit service" : "New service"}</span>
        <h1>{initialService ? "Actualizar servicio" : "Crear servicio"}</h1>
        <p className="muted">
          Los cambios viajan por el BFF interno y mantienen el token fuera del browser.
        </p>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="field">
        <label htmlFor="service-name">Name</label>
        <input
          id="service-name"
          minLength={2}
          onChange={(event) => setName(event.target.value)}
          placeholder="Corte clásico"
          required
          value={name}
        />
      </div>

      <div className="field-group">
        <div className="field">
          <label htmlFor="service-duration">Duration (minutes)</label>
          <input
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

        <div className="field">
          <label htmlFor="service-price">Price</label>
          <input
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

      {initialService ? (
        <label className="checkbox-row">
          <input
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            type="checkbox"
          />
          <span>Servicio activo</span>
        </label>
      ) : (
        <p className="support">Los servicios nuevos se crean activos por defecto.</p>
      )}

      <div className="actions-row">
        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting
            ? initialService
              ? "Guardando..."
              : "Creando..."
            : initialService
              ? "Guardar cambios"
              : "Crear servicio"}
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
