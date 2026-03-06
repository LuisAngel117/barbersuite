"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Search, UserRoundCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ClientPayload } from "@/lib/backend";
import { toProblemToast } from "@/lib/forms";
import {
  fetchClientById,
  fetchClientOptions,
} from "@/components/appointments/appointment-api";
import { ProblemBanner } from "@/components/ui/problem-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ProblemBannerState } from "@/lib/problem";

type ClientPickerProps = {
  value: string;
  onChange: (clientId: string) => void;
  disabled?: boolean;
  messages?: Partial<{
    placeholder: string;
    hint: string;
    empty: string;
    noContact: string;
    change: string;
    searchFailed: string;
    loadFailed: string;
  }>;
};

function clientMeta(client: ClientPayload, emptyLabel: string) {
  return client.email || client.phone || emptyLabel;
}

export function ClientPicker({
  value,
  onChange,
  disabled = false,
  messages,
}: ClientPickerProps) {
  const tAppointments = useTranslations("appointments");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<ClientPayload[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientPayload | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [problem, setProblem] = useState<ProblemBannerState | null>(null);
  const labels = {
    placeholder: messages?.placeholder ?? tAppointments("clientPicker.placeholder"),
    hint: messages?.hint ?? tAppointments("clientPicker.hint"),
    empty: messages?.empty ?? tAppointments("clientPicker.empty"),
    noContact: messages?.noContact ?? tAppointments("clientPicker.noContact"),
    change: messages?.change ?? tAppointments("clientPicker.change"),
    searchFailed: messages?.searchFailed ?? tAppointments("clientPicker.searchFailed"),
    loadFailed: messages?.loadFailed ?? tAppointments("clientPicker.loadFailed"),
  };

  useEffect(() => {
    if (!value || selectedClient?.id === value) {
      return;
    }

    let active = true;
    void (async () => {
      const result = await fetchClientById(value);
      if (!active) {
        return;
      }

      if (result.data) {
        setSelectedClient(result.data);
        setProblem(null);
        return;
      }

      const toastProblem = toProblemToast(
        result.problem,
        {
          generic: labels.loadFailed,
          unauthorized: tErrors("unauthorized"),
          forbidden: tErrors("forbidden"),
          branchRequired: tErrors("branchRequired"),
          branchForbidden: tErrors("branchForbidden"),
          conflict: tErrors("conflict"),
          validation: tErrors("validation"),
        },
        labels.loadFailed,
      );

      setProblem({
        title: toastProblem.title,
        detail: toastProblem.description,
        code: result.problem?.code,
      });
    })();

    return () => {
      active = false;
    };
  }, [labels.loadFailed, selectedClient?.id, tErrors, value]);

  useEffect(() => {
    if (disabled || selectedClient || query.trim().length < 2) {
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(() => {
      setIsSearching(true);
      void (async () => {
        const result = await fetchClientOptions(query.trim());
        if (!active) {
          return;
        }

        setIsSearching(false);
        if (result.data) {
          setOptions(result.data);
          setProblem(null);
          return;
        }

        setOptions([]);
        const toastProblem = toProblemToast(
          result.problem,
          {
            generic: labels.searchFailed,
            unauthorized: tErrors("unauthorized"),
            forbidden: tErrors("forbidden"),
            branchRequired: tErrors("branchRequired"),
            branchForbidden: tErrors("branchForbidden"),
            conflict: tErrors("conflict"),
            validation: tErrors("validation"),
          },
          labels.searchFailed,
        );

        setProblem({
          title: toastProblem.title,
          detail: toastProblem.description,
          code: result.problem?.code,
        });
      })();
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [disabled, labels.searchFailed, query, selectedClient, tErrors]);

  return (
    <div className="space-y-4">
      {problem ? <ProblemBanner problem={problem} /> : null}

      {selectedClient ? (
        <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UserRoundCheck className="size-4 text-brand-foreground" />
                <p className="font-medium tracking-tight">{selectedClient.fullName}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {clientMeta(selectedClient, labels.noContact)}
              </p>
            </div>
            {!disabled ? (
              <Button
                className="rounded-full"
                onClick={() => {
                  setSelectedClient(null);
                  onChange("");
                  setQuery("");
                  setOptions([]);
                  setProblem(null);
                }}
                type="button"
                variant="outline"
              >
                {labels.change}
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 rounded-xl pl-9"
              data-testid="appointment-client-search"
              disabled={disabled}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                if (nextQuery.trim().length < 2) {
                  setIsSearching(false);
                }
              }}
              placeholder={labels.placeholder}
              value={query}
            />
          </div>

          {query.trim().length < 2 ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {labels.hint}
            </p>
          ) : isSearching ? (
            <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              {tCommon("loading")}
            </div>
          ) : options.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/25 px-4 py-4 text-sm text-muted-foreground">
              {labels.empty}
            </div>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-border/70 bg-card/80 p-2">
              {options.map((client) => (
                <button
                  className="flex w-full flex-col items-start gap-1 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/60"
                  key={client.id}
                  onClick={() => {
                    onChange(client.id);
                    setSelectedClient(client);
                    setQuery("");
                    setOptions([]);
                    setProblem(null);
                  }}
                  type="button"
                >
                  <span className="font-medium tracking-tight">{client.fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {clientMeta(client, labels.noContact)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
