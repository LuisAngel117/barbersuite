"use client";

import { useLocale, useTranslations } from "next-intl";
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

function sortServices(services: ServicePayload[], locale: string) {
  return [...services].sort((left, right) => {
    if (left.active !== right.active) {
      return left.active ? -1 : 1;
    }

    return left.name.localeCompare(right.name, locale, { sensitivity: "base" });
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
  const locale = useLocale();
  const tServices = useTranslations("services");
  const tUi = useTranslations("ui");
  const [services, setServices] = useState<ServicePayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);
  const [problem, setProblem] = useState<ProblemBannerState | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingService, setEditingService] = useState<ServicePayload | null>(null);

  const currencyFormatter = new Intl.NumberFormat(locale === "en" ? "en-US" : "es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

  const fetchServices = useCallback(async () => {
    const response = await fetch("/api/services", {
      cache: "no-store",
    });
    const result = await readApiResponse<ServicePayload[]>(response);

    if (!response.ok || !result.data) {
      setServices([]);
      setProblem(toProblemBanner(result.problem, tServices("loadFailed")));
      setIsLoading(false);
      return;
    }

    setServices(sortServices(result.data, locale));
    setProblem(null);
    setIsLoading(false);
  }, [locale, tServices]);

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
      setProblem(toProblemBanner(result.problem, tServices("loadOneFailed")));
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
              detail: tServices("conflict"),
              code: result.problem.code,
            }
          : toProblemBanner(
              result.problem,
              isEditing ? tServices("updateFailed") : tServices("createFailed"),
            ),
      );
      return;
    }

    toast.success(isEditing ? tServices("updateSuccess") : tServices("createSuccess"));
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
      setProblem(toProblemBanner(result.problem, tServices("toggleFailed")));
      return;
    }

    toast.success(service.active ? tServices("deactivateSuccess") : tServices("activateSuccess"));
    await reloadServices();
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
              {tServices("count", { count: services.length })}
            </Badge>
            <Badge className="rounded-full" variant="outline">
              {tUi("tenantScoped")}
            </Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{tServices("description")}</p>
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
          {tServices("add")}
        </Button>
      </div>

      {problem ? <ProblemBanner problem={problem} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        <Card className="overflow-hidden rounded-[1.5rem] border-border/70 bg-card/80 shadow-lg shadow-black/5">
          <CardHeader className="space-y-3">
            <CardTitle className="text-xl tracking-tight">{tServices("listTitle")}</CardTitle>
            <CardDescription>{tServices("listDescription")}</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {isLoading ? (
              <ServicesLoadingState />
            ) : services.length === 0 ? (
              <div className="px-6 py-8">
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-6">
                  <strong className="block text-base font-semibold tracking-tight">
                    {tServices("emptyTitle")}
                  </strong>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {tServices("emptyDescription")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-semibold">{tServices("name")}</th>
                      <th className="px-6 py-4 font-semibold">{tServices("duration")}</th>
                      <th className="px-6 py-4 font-semibold">{tServices("price")}</th>
                      <th className="px-6 py-4 font-semibold">{tServices("active")}</th>
                      <th className="px-6 py-4 font-semibold">{tServices("actions")}</th>
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
                            {service.active ? tServices("rowActive") : tServices("rowInactive")}
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
                              {pendingServiceId === service.id
                                ? tServices("loading")
                                : tServices("edit")}
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
                                ? tServices("saving")
                                : service.active
                                  ? tServices("deactivate")
                                  : tServices("activate")}
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
                  {tServices("selectActionTitle")}
                </strong>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {tServices("selectActionDescription")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
