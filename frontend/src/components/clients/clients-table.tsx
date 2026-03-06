"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { type ClientPagePayload, type ClientPayload } from "@/lib/backend";
import {
  readApiResponse,
  toProblemBanner,
  type ProblemBannerState,
} from "@/lib/problem";
import { apiFetch } from "@/lib/api-client";
import { ClientForm, type ClientFormSubmission } from "@/components/clients/client-form";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_PAGE_SIZE = 20;

function toTestIdSegment(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ClientsLoadingState() {
  return (
    <div className="space-y-4 px-6 py-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="grid gap-3 sm:grid-cols-[1.6fr_1.4fr_1fr_1fr]" key={index}>
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function ClientsTable({ branchId }: { branchId: string }) {
  const router = useRouter();
  const locale = useLocale();
  const tClients = useTranslations("clients");
  const tUi = useTranslations("ui");
  const tCommon = useTranslations("common");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [clientPage, setClientPage] = useState<ClientPagePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingClientId, setPendingClientId] = useState<string | null>(null);
  const [problem, setProblem] = useState<ProblemBannerState | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingClient, setEditingClient] = useState<ClientPayload | null>(null);

  const fetchClients = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(DEFAULT_PAGE_SIZE),
    });

    if (query) {
      params.set("q", query);
    }

    const response = await fetch(`/api/clients?${params.toString()}`, {
      cache: "no-store",
    });
    const result = await readApiResponse<ClientPagePayload>(response);

    if (!response.ok || !result.data) {
      setClientPage(null);
      setProblem(toProblemBanner(result.problem, tClients("loadFailed")));
      setIsLoading(false);
      return;
    }

    setClientPage(result.data);
    setProblem(null);
    setIsLoading(false);
  }, [page, query, tClients]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchClients();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchClients]);

  async function reloadClients() {
    setIsLoading(true);
    await fetchClients();
  }

  async function openClientEditor(clientId: string) {
    setPendingClientId(clientId);
    setProblem(null);

    const response = await fetch(`/api/clients/${clientId}`, {
      cache: "no-store",
    });
    const result = await readApiResponse<ClientPayload>(response);

    setPendingClientId(null);
    if (!response.ok || !result.data) {
      setProblem(toProblemBanner(result.problem, tClients("loadOneFailed")));
      return;
    }

    setEditingClient(result.data);
    setFormMode("edit");
  }

  async function handleSubmit(payload: ClientFormSubmission) {
    const isEditing = formMode === "edit" && editingClient;
    const target = isEditing ? `/api/clients/${editingClient.id}` : "/api/clients";
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
    const result = await readApiResponse<ClientPayload>(response);

    setIsSubmitting(false);
    if (!response.ok) {
      setProblem(
        toProblemBanner(
          result.problem,
          isEditing ? tClients("updateFailed") : tClients("createFailed"),
        ),
      );
      return;
    }

    toast.success(isEditing ? tClients("updateSuccess") : tClients("createSuccess"));
    setFormMode(null);
    setEditingClient(null);
    await reloadClients();
    router.refresh();
  }

  async function handleToggleActive(client: ClientPayload) {
    setPendingClientId(client.id);
    setProblem(null);

    const response = await apiFetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ active: !client.active }),
    });
    const result = await readApiResponse<ClientPayload>(response);

    setPendingClientId(null);
    if (!response.ok) {
      setProblem(toProblemBanner(result.problem, tClients("toggleFailed")));
      return;
    }

    toast.success(client.active ? tClients("deactivateSuccess") : tClients("activateSuccess"));
    await reloadClients();
    router.refresh();
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProblem(null);
    setIsLoading(true);

    const nextQuery = queryInput.trim();
    if (page === 0 && nextQuery === query) {
      void fetchClients();
      return;
    }

    setPage(0);
    setQuery(nextQuery);
  }

  const canGoPrevious = page > 0 && !isLoading;
  const canGoNext = clientPage
    ? clientPage.totalPages > 0 && page < clientPage.totalPages - 1 && !isLoading
    : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
              {tUi("branchScoped")}
            </Badge>
            <Badge className="rounded-full" variant="outline">
              {branchId}
            </Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{tClients("description")}</p>
        </div>

        <Button
          className="rounded-full"
          data-testid="clients-add"
          onClick={() => {
            setEditingClient(null);
            setFormMode("create");
            setProblem(null);
          }}
          type="button"
        >
          {tClients("add")}
        </Button>
      </div>

      <form
        className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-card/70 p-5 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto]"
        onSubmit={handleSearchSubmit}
      >
        <div className="space-y-2">
          <Label htmlFor="client-search">{tClients("searchLabel")}</Label>
          <Input
            className="h-11 rounded-xl"
            data-testid="clients-search"
            id="client-search"
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder={tClients("searchPlaceholder")}
            value={queryInput}
          />
        </div>

        <Button
          className="h-11 self-end rounded-xl"
          data-testid="clients-search-submit"
          disabled={isLoading}
          type="submit"
          variant="outline"
        >
          {tClients("searchSubmit")}
        </Button>
      </form>

      {problem ? <ProblemBanner problem={problem} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        <Card className="overflow-hidden rounded-[1.5rem] border-border/70 bg-card/80 shadow-lg shadow-black/5">
          <CardHeader className="space-y-3">
            <CardTitle className="text-xl tracking-tight">{tClients("listTitle")}</CardTitle>
            <CardDescription>{tClients("listDescription")}</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {isLoading ? (
              <ClientsLoadingState />
            ) : !clientPage || clientPage.items.length === 0 ? (
              <div className="px-6 py-8">
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-6">
                  <strong className="block text-base font-semibold tracking-tight">
                    {query ? tClients("searchEmptyTitle") : tClients("emptyTitle")}
                  </strong>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {query ? tClients("searchEmptyDescription") : tClients("emptyDescription")}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4 font-semibold">{tClients("name")}</th>
                        <th className="px-6 py-4 font-semibold">{tClients("contact")}</th>
                        <th className="px-6 py-4 font-semibold">{tClients("notes")}</th>
                        <th className="px-6 py-4 font-semibold">{tClients("active")}</th>
                        <th className="px-6 py-4 font-semibold">{tClients("actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientPage.items.map((client) => (
                        <tr
                          className="border-t border-border/70 align-top"
                          data-testid={`clients-row-${toTestIdSegment(client.fullName)}`}
                          key={client.id}
                        >
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="font-medium">{client.fullName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(client.createdAt, locale)}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p>{client.phone || tClients("withoutPhone")}</p>
                              <p className="text-xs text-muted-foreground">
                                {client.email || tClients("withoutEmail")}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">{client.notes || tClients("withoutNotes")}</td>
                          <td className="px-6 py-4">
                            <Badge
                              className="rounded-full"
                              variant={client.active ? "secondary" : "outline"}
                            >
                              {client.active ? tClients("rowActive") : tClients("rowInactive")}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                className="rounded-full"
                                data-testid={`clients-edit-${toTestIdSegment(client.fullName)}`}
                                disabled={pendingClientId === client.id || isSubmitting}
                                onClick={() => void openClientEditor(client.id)}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                {pendingClientId === client.id
                                  ? tClients("loading")
                                  : tClients("edit")}
                              </Button>
                              <Button
                                className="rounded-full"
                                data-testid={`clients-toggle-${toTestIdSegment(client.fullName)}`}
                                disabled={pendingClientId === client.id || isSubmitting}
                                onClick={() => void handleToggleActive(client)}
                                size="sm"
                                type="button"
                                variant="ghost"
                              >
                                {pendingClientId === client.id
                                  ? tClients("saving")
                                  : client.active
                                    ? tClients("deactivate")
                                    : tClients("activate")}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-4 border-t border-border/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <Badge className="w-fit rounded-full" variant="outline">
                    {tClients("pagination", {
                      count: clientPage.totalItems,
                      page: clientPage.page + 1,
                      totalPages: Math.max(clientPage.totalPages, 1),
                    })}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      className="rounded-full"
                      disabled={!canGoPrevious}
                      onClick={() => {
                        setIsLoading(true);
                        setPage((currentPage) => Math.max(currentPage - 1, 0));
                      }}
                      type="button"
                      variant="outline"
                    >
                      {tCommon("previous")}
                    </Button>
                    <Button
                      className="rounded-full"
                      disabled={!canGoNext}
                      onClick={() => {
                        setIsLoading(true);
                        setPage((currentPage) => currentPage + 1);
                      }}
                      type="button"
                      variant="outline"
                    >
                      {tCommon("next")}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-lg shadow-black/5">
          <CardContent className="pt-6">
            {formMode ? (
              <ClientForm
                initialClient={editingClient}
                isSubmitting={isSubmitting}
                key={editingClient?.id ?? "create-client"}
                onCancel={() => {
                  setFormMode(null);
                  setEditingClient(null);
                }}
                onSubmit={handleSubmit}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-6">
                <strong className="block text-base font-semibold tracking-tight">
                  {tClients("selectActionTitle")}
                </strong>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {tClients("selectActionDescription")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
