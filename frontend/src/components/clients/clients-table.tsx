"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  type ClientPagePayload,
  type ClientPayload,
} from "@/lib/backend";
import {
  readApiResponse,
  toProblemBanner,
  type ProblemBannerState,
} from "@/lib/problem";
import { ClientForm, type ClientFormSubmission } from "@/components/clients/client-form";
import { ProblemBanner } from "@/components/ui/problem-banner";

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ClientsTable({ branchId }: { branchId: string }) {
  const router = useRouter();
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
      setProblem(toProblemBanner(result.problem, "No pudimos cargar los clientes."));
      setIsLoading(false);
      return;
    }

    setClientPage(result.data);
    setProblem(null);
    setIsLoading(false);
  }, [page, query]);

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
      setProblem(toProblemBanner(result.problem, "No pudimos cargar el cliente solicitado."));
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

    const response = await fetch(target, {
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
          isEditing ? "No pudimos actualizar el cliente." : "No pudimos crear el cliente.",
        ),
      );
      return;
    }

    setFormMode(null);
    setEditingClient(null);
    await reloadClients();
    router.refresh();
  }

  async function handleToggleActive(client: ClientPayload) {
    setPendingClientId(client.id);
    setProblem(null);

    const response = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ active: !client.active }),
    });
    const result = await readApiResponse<ClientPayload>(response);

    setPendingClientId(null);
    if (!response.ok) {
      setProblem(
        toProblemBanner(
          result.problem,
          `No pudimos ${client.active ? "desactivar" : "activar"} el cliente.`,
        ),
      );
      return;
    }

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
    <div className="workspace-stack">
      <div className="table-toolbar">
        <div className="toolbar-copy">
          <div className="badge-row">
            <span className="soft-pill">Branch-scoped data</span>
            <span className="soft-pill">{branchId}</span>
          </div>
          <p className="muted">
            El listado usa la branch seleccionada arriba y soporta búsqueda y paginación.
          </p>
        </div>

        <button
          className="button button-primary"
          data-testid="clients-add"
          onClick={() => {
            setEditingClient(null);
            setFormMode("create");
            setProblem(null);
          }}
          type="button"
        >
          Nuevo cliente
        </button>
      </div>

      <form className="search-form" onSubmit={handleSearchSubmit}>
        <div className="field search-field">
          <label htmlFor="client-search">Buscar</label>
          <input
            data-testid="clients-search"
            id="client-search"
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Nombre, teléfono o email"
            value={queryInput}
          />
        </div>

        <button
          className="button button-secondary"
          data-testid="clients-search-submit"
          disabled={isLoading}
          type="submit"
        >
          Buscar
        </button>
      </form>

      {problem ? <ProblemBanner problem={problem} /> : null}

      <div className="workspace-grid">
        <div className="workspace-surface">
          {isLoading ? (
            <div className="empty-state">Loading clients...</div>
          ) : !clientPage || clientPage.items.length === 0 ? (
            <div className="empty-state stack">
              <strong>
                {query ? "No encontramos clientes para esa búsqueda." : "No hay clientes todavía."}
              </strong>
              <p>
                {query
                  ? "Prueba otro término o crea el primer cliente de esta sucursal."
                  : "Registra el primer cliente de la sucursal seleccionada."}
              </p>
            </div>
          ) : (
            <>
              <div className="table-shell">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Notes</th>
                      <th>Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientPage.items.map((client) => (
                      <tr
                        data-testid={`clients-row-${toTestIdSegment(client.fullName)}`}
                        key={client.id}
                      >
                        <td>
                          <div className="cell-stack">
                            <strong>{client.fullName}</strong>
                            <span className="muted">{formatDate(client.createdAt)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-stack">
                            <span>{client.phone || "Sin teléfono"}</span>
                            <span className="muted">{client.email || "Sin email"}</span>
                          </div>
                        </td>
                        <td>{client.notes || "Sin notas"}</td>
                        <td>
                          <span
                            className={`status-chip ${
                              client.active ? "status-chip-active" : "status-chip-inactive"
                            }`}
                          >
                            {client.active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="button button-secondary button-small"
                              data-testid={`clients-edit-${toTestIdSegment(client.fullName)}`}
                              disabled={pendingClientId === client.id || isSubmitting}
                              onClick={() => void openClientEditor(client.id)}
                              type="button"
                            >
                              {pendingClientId === client.id ? "Loading..." : "Edit"}
                            </button>
                            <button
                              className="button button-secondary button-small"
                              data-testid={`clients-toggle-${toTestIdSegment(client.fullName)}`}
                              disabled={pendingClientId === client.id || isSubmitting}
                              onClick={() => void handleToggleActive(client)}
                              type="button"
                            >
                              {pendingClientId === client.id
                                ? "Saving..."
                                : client.active
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

              <div className="page-actions">
                <span className="soft-pill">
                  {clientPage.totalItems} clientes · página {clientPage.page + 1} de{" "}
                  {Math.max(clientPage.totalPages, 1)}
                </span>
                <div className="actions-row">
                  <button
                    className="button button-secondary button-small"
                    disabled={!canGoPrevious}
                    onClick={() => {
                      setIsLoading(true);
                      setPage((currentPage) => Math.max(currentPage - 1, 0));
                    }}
                    type="button"
                  >
                    Prev
                  </button>
                  <button
                    className="button button-secondary button-small"
                    disabled={!canGoNext}
                    onClick={() => {
                      setIsLoading(true);
                      setPage((currentPage) => currentPage + 1);
                    }}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="workspace-surface">
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
            <div className="empty-state stack">
              <strong>Selecciona una acción.</strong>
              <p>
                Puedes crear un cliente nuevo, editar uno existente o cambiar su estado desde la
                tabla.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
