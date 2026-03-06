"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { type ServicePayload } from "@/lib/backend";
import {
  readApiResponse,
  toProblemBanner,
  type ProblemBannerState,
} from "@/lib/problem";
import { ServiceForm, type ServiceFormSubmission } from "@/components/services/service-form";
import { ProblemBanner } from "@/components/ui/problem-banner";

const currencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function sortServices(services: ServicePayload[]) {
  return [...services].sort((left, right) => {
    if (left.active !== right.active) {
      return left.active ? -1 : 1;
    }

    return left.name.localeCompare(right.name, "es", { sensitivity: "base" });
  });
}

function toTestIdSegment(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

export function ServicesTable() {
  const router = useRouter();
  const [services, setServices] = useState<ServicePayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);
  const [problem, setProblem] = useState<ProblemBannerState | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingService, setEditingService] = useState<ServicePayload | null>(null);

  const fetchServices = useCallback(async () => {
    const response = await fetch("/api/services", {
      cache: "no-store",
    });
    const result = await readApiResponse<ServicePayload[]>(response);

    if (!response.ok || !result.data) {
      setServices([]);
      setProblem(toProblemBanner(result.problem, "No pudimos cargar los servicios."));
      setIsLoading(false);
      return;
    }

    setServices(sortServices(result.data));
    setProblem(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchServices();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchServices]);

  async function reloadServices() {
    setIsLoading(true);
    await fetchServices();
  }

  async function openServiceEditor(serviceId: string) {
    setPendingServiceId(serviceId);
    setProblem(null);

    const response = await fetch(`/api/services/${serviceId}`, {
      cache: "no-store",
    });
    const result = await readApiResponse<ServicePayload>(response);

    setPendingServiceId(null);
    if (!response.ok || !result.data) {
      setProblem(toProblemBanner(result.problem, "No pudimos cargar el servicio solicitado."));
      return;
    }

    setEditingService(result.data);
    setFormMode("edit");
  }

  async function handleSubmit(payload: ServiceFormSubmission) {
    const isEditing = formMode === "edit" && editingService;
    const target = isEditing ? `/api/services/${editingService.id}` : "/api/services";
    const method = isEditing ? "PATCH" : "POST";

    setIsSubmitting(true);
    setProblem(null);

    const response = await fetch(target, {
      method,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await readApiResponse<ServicePayload>(response);

    setIsSubmitting(false);
    if (!response.ok) {
      setProblem(
        result.problem?.code === "CONFLICT"
          ? {
              title: result.problem.title || "Conflict",
              detail: "Ya existe un servicio con ese nombre dentro del tenant.",
              code: result.problem.code,
            }
          : toProblemBanner(
              result.problem,
              isEditing ? "No pudimos actualizar el servicio." : "No pudimos crear el servicio.",
            ),
      );
      return;
    }

    setFormMode(null);
    setEditingService(null);
    await reloadServices();
    router.refresh();
  }

  async function handleToggleActive(service: ServicePayload) {
    setPendingServiceId(service.id);
    setProblem(null);

    const response = await fetch(`/api/services/${service.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ active: !service.active }),
    });
    const result = await readApiResponse<ServicePayload>(response);

    setPendingServiceId(null);
    if (!response.ok) {
      setProblem(
        toProblemBanner(
          result.problem,
          `No pudimos ${service.active ? "desactivar" : "activar"} el servicio.`,
        ),
      );
      return;
    }

    await reloadServices();
    router.refresh();
  }

  return (
    <div className="workspace-stack">
      <div className="table-toolbar">
        <div className="toolbar-copy">
          <span className="soft-pill">{services.length} servicios cargados</span>
          <p className="muted">
            Gestión tenant-scoped con listado activo primero y edición inline.
          </p>
        </div>

        <button
          className="button button-primary"
          data-testid="services-add"
          onClick={() => {
            setEditingService(null);
            setFormMode("create");
            setProblem(null);
          }}
          type="button"
        >
          Nuevo servicio
        </button>
      </div>

      {problem ? <ProblemBanner problem={problem} /> : null}

      <div className="workspace-grid">
        <div className="workspace-surface">
          {isLoading ? (
            <div className="empty-state">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="empty-state stack">
              <strong>No hay servicios todavía.</strong>
              <p>Crea el primero para empezar a operar el tenant.</p>
            </div>
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Duration</th>
                    <th>Price</th>
                    <th>Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr
                      data-testid={`services-row-${toTestIdSegment(service.name)}`}
                      key={service.id}
                    >
                      <td>
                        <div className="cell-stack">
                          <strong>{service.name}</strong>
                          <span className="muted">{service.id}</span>
                        </div>
                      </td>
                      <td>{service.durationMinutes} min</td>
                      <td>{currencyFormatter.format(service.price)}</td>
                      <td>
                        <span
                          className={`status-chip ${
                            service.active ? "status-chip-active" : "status-chip-inactive"
                          }`}
                        >
                          {service.active ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="button button-secondary button-small"
                            data-testid={`services-edit-${toTestIdSegment(service.name)}`}
                            disabled={pendingServiceId === service.id || isSubmitting}
                            onClick={() => void openServiceEditor(service.id)}
                            type="button"
                          >
                            {pendingServiceId === service.id ? "Loading..." : "Edit"}
                          </button>
                          <button
                            className="button button-secondary button-small"
                            data-testid={`services-toggle-${toTestIdSegment(service.name)}`}
                            disabled={pendingServiceId === service.id || isSubmitting}
                            onClick={() => void handleToggleActive(service)}
                            type="button"
                          >
                            {pendingServiceId === service.id
                              ? "Saving..."
                              : service.active
                                ? "Deactivate"
                                : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="workspace-surface">
          {formMode ? (
            <ServiceForm
              initialService={editingService}
              isSubmitting={isSubmitting}
              key={editingService?.id ?? "create-service"}
              onCancel={() => {
                setFormMode(null);
                setEditingService(null);
              }}
              onSubmit={handleSubmit}
            />
          ) : (
            <div className="empty-state stack">
              <strong>Selecciona una acción.</strong>
              <p>
                Puedes crear un servicio nuevo o abrir uno existente para editarlo y cambiar su
                estado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
