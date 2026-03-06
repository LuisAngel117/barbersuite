"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { type ServicePayload } from "@/lib/backend";
import {
  readApiResponse,
  toProblemBanner,
  type ProblemBannerState,
} from "@/lib/problem";
import { apiFetch } from "@/lib/api-client";
import { ServiceForm, type ServiceFormSubmission } from "@/components/services/service-form";
import { ProblemBanner } from "@/components/ui/problem-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

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

function ServicesLoadingState() {
  return (
    <div className="space-y-4 px-6 py-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr]" key={index}>
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      ))}
    </div>
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

    const response = await apiFetch(target, {
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

    toast.success(
      isEditing ? "Servicio actualizado correctamente." : "Servicio creado correctamente.",
    );
    setFormMode(null);
    setEditingService(null);
    await reloadServices();
    router.refresh();
  }

  async function handleToggleActive(service: ServicePayload) {
    setPendingServiceId(service.id);
    setProblem(null);

    const response = await apiFetch(`/api/services/${service.id}`, {
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

    toast.success(service.active ? "Servicio desactivado." : "Servicio activado.");
    await reloadServices();
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
              {services.length} servicios
            </Badge>
            <Badge className="rounded-full" variant="outline">
              Tenant scoped
            </Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Gestión tenant-scoped con orden activo primero y edición rápida desde la misma vista.
          </p>
        </div>

        <Button
          className="rounded-full"
          data-testid="services-add"
          onClick={() => {
            setEditingService(null);
            setFormMode("create");
            setProblem(null);
          }}
          type="button"
        >
          Nuevo servicio
        </Button>
      </div>

      {problem ? <ProblemBanner problem={problem} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        <Card className="overflow-hidden rounded-[1.5rem] border-border/70 bg-card/80 shadow-lg shadow-black/5">
          <CardHeader className="space-y-3">
            <CardTitle className="text-xl tracking-tight">Listado</CardTitle>
            <CardDescription>
              Los servicios se muestran con preferencia por activos y nombre ascendente.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {isLoading ? (
              <ServicesLoadingState />
            ) : services.length === 0 ? (
              <div className="px-6 py-8">
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-6">
                  <strong className="block text-base font-semibold tracking-tight">
                    No hay servicios todavía.
                  </strong>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Crea el primero para empezar a operar el tenant.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Name</th>
                      <th className="px-6 py-4 font-semibold">Duration</th>
                      <th className="px-6 py-4 font-semibold">Price</th>
                      <th className="px-6 py-4 font-semibold">Active</th>
                      <th className="px-6 py-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => (
                      <tr
                        className="border-t border-border/70 align-top"
                        data-testid={`services-row-${toTestIdSegment(service.name)}`}
                        key={service.id}
                      >
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="font-medium">{service.name}</p>
                            <p className="text-xs text-muted-foreground">{service.id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">{service.durationMinutes} min</td>
                        <td className="px-6 py-4">{currencyFormatter.format(service.price)}</td>
                        <td className="px-6 py-4">
                          <Badge
                            className="rounded-full"
                            variant={service.active ? "secondary" : "outline"}
                          >
                            {service.active ? "Activa" : "Inactiva"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              className="rounded-full"
                              data-testid={`services-edit-${toTestIdSegment(service.name)}`}
                              disabled={pendingServiceId === service.id || isSubmitting}
                              onClick={() => void openServiceEditor(service.id)}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              {pendingServiceId === service.id ? "Loading..." : "Edit"}
                            </Button>
                            <Button
                              className="rounded-full"
                              data-testid={`services-toggle-${toTestIdSegment(service.name)}`}
                              disabled={pendingServiceId === service.id || isSubmitting}
                              onClick={() => void handleToggleActive(service)}
                              size="sm"
                              type="button"
                              variant="ghost"
                            >
                              {pendingServiceId === service.id
                                ? "Saving..."
                                : service.active
                                  ? "Deactivate"
                                  : "Activate"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-lg shadow-black/5">
          <CardContent className="pt-6">
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
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-6">
                <strong className="block text-base font-semibold tracking-tight">
                  Selecciona una acción.
                </strong>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Puedes crear un servicio nuevo o abrir uno existente para editarlo y cambiar su
                  estado.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
