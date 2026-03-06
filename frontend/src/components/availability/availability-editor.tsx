"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import type { BarberItem, BarbersResponse } from "@/lib/types/appointments";
import {
  createAvailabilityIssueMap,
  createAvailabilitySchema,
  createEmptyAvailabilityException,
  createEmptyExceptionInterval,
  createEmptyWeeklyInterval,
  normalizeAvailabilityPayload,
  type AvailabilityFormValues,
} from "@/lib/schemas/availability.schema";
import { readApiResponse, toProblemBanner, type ProblemBannerState } from "@/lib/problem";
import type {
  AvailabilityBarber,
  AvailabilityBarbersResponse,
  PutAvailabilityRequest,
} from "@/lib/types/availability";
import { EmptyState } from "@/components/empty-state";
import { ExceptionsEditor } from "@/components/availability/exceptions-editor";
import { WeeklyScheduleEditor } from "@/components/availability/weekly-schedule-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProblemBanner } from "@/components/ui/problem-banner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

function emptyDraft(): PutAvailabilityRequest {
  return {
    weekly: [],
    exceptions: [],
  };
}

function toDraft(barber: AvailabilityBarber): PutAvailabilityRequest {
  return {
    weekly: barber.weekly.map((interval) => ({
      dayOfWeek: interval.dayOfWeek,
      start: interval.start,
      end: interval.end,
    })),
    exceptions: barber.exceptions.map((exception) => ({
      date: exception.date,
      type: exception.type,
      note: exception.note ?? "",
      intervals: (exception.intervals ?? []).map((interval) => ({
        start: interval.start,
        end: interval.end,
      })),
    })),
  };
}

function serializeDraft(values: AvailabilityFormValues) {
  return JSON.stringify(normalizeAvailabilityPayload(values));
}

function firstIssueMessage(issues: Map<string, string>) {
  return issues.values().next().value ?? null;
}

function resolveWeeklyIntervalIndex(
  weekly: PutAvailabilityRequest["weekly"],
  dayOfWeek: number,
  dayIntervalIndex: number,
) {
  return weekly
    .map((interval, index) => ({ interval, index }))
    .filter(({ interval }) => interval.dayOfWeek === dayOfWeek)[dayIntervalIndex]?.index ?? -1;
}

export function AvailabilityEditor() {
  const tAvailability = useTranslations("availability");
  const tCommon = useTranslations("common");
  const [barbers, setBarbers] = useState<BarberItem[]>([]);
  const [availabilityByBarberId, setAvailabilityByBarberId] = useState<
    Record<string, AvailabilityBarber>
  >({});
  const [draftsByBarberId, setDraftsByBarberId] = useState<Record<string, PutAvailabilityRequest>>(
    {},
  );
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [issues, setIssues] = useState<Map<string, string>>(new Map());
  const [problem, setProblem] = useState<ProblemBannerState | null>(null);

  const schema = useMemo(
    () =>
      createAvailabilitySchema({
        timeFormat: tAvailability("errors.invalidTime"),
        startBeforeEnd: tAvailability("errors.startBeforeEnd"),
        dayOfWeek: tAvailability("errors.dayOfWeek"),
        weeklyOverlap: tAvailability("errors.overlap"),
        exceptionDate: tAvailability("errors.invalidDate"),
        duplicateExceptionDate: tAvailability("errors.duplicateDate"),
        closedWithIntervals: tAvailability("errors.closedWithIntervals"),
        overrideNeedsIntervals: tAvailability("errors.overrideNeedsIntervals"),
        exceptionOverlap: tAvailability("errors.exceptionOverlap"),
      }),
    [tAvailability],
  );

  const currentBarberMeta = selectedBarberId
    ? barbers.find((item) => item.id === selectedBarberId) ?? null
    : null;
  const currentBarber = selectedBarberId
    ? availabilityByBarberId[selectedBarberId] ??
      (currentBarberMeta
        ? {
            barberId: currentBarberMeta.id,
            barberName: currentBarberMeta.fullName,
            weekly: [],
            exceptions: [],
          }
        : null)
    : null;
  const currentDraft = selectedBarberId
    ? draftsByBarberId[selectedBarberId] ?? (currentBarber ? toDraft(currentBarber) : emptyDraft())
    : null;
  const isDirty = Boolean(
    currentBarber &&
      currentDraft &&
      serializeDraft(currentDraft) !== serializeDraft(toDraft(currentBarber)),
  );

  const validateDraft = useCallback(
    (values: PutAvailabilityRequest) => {
      const payload = normalizeAvailabilityPayload(values);
      const result = schema.safeParse(payload);
      if (result.success) {
        return new Map<string, string>();
      }

      return createAvailabilityIssueMap(result.error.issues);
    },
    [schema],
  );

  const fetchBarberAvailability = useCallback(async (barber: BarberItem) => {
    const params = new URLSearchParams({
      barberId: barber.id,
    });
    const response = await fetch(`/api/availability/barbers?${params.toString()}`, {
      cache: "no-store",
    });
    const result = await readApiResponse<AvailabilityBarbersResponse>(response);

    if (!response.ok) {
      setProblem(toProblemBanner(result.problem, tAvailability("loadFailed")));
      return;
    }

    const payload = result.data?.items[0] ?? {
      barberId: barber.id,
      barberName: barber.fullName,
      weekly: [],
      exceptions: [],
    };
    setAvailabilityByBarberId((current) => ({
      ...current,
      [barber.id]: payload,
    }));
    setDraftsByBarberId((current) => ({
      ...current,
      [barber.id]: current[barber.id] ?? toDraft(payload),
    }));
    setProblem(null);
  }, [tAvailability]);

  const fetchBarbers = useCallback(async () => {
    setIsLoading(true);

    const response = await fetch("/api/barbers", {
      cache: "no-store",
    });
    const result = await readApiResponse<BarbersResponse>(response);

    if (!response.ok || !result.data) {
      setBarbers([]);
      setAvailabilityByBarberId({});
      setDraftsByBarberId({});
      setSelectedBarberId(null);
      setProblem(toProblemBanner(result.problem, tAvailability("loadFailed")));
      setIsLoading(false);
      return;
    }

    const nextBarbers = result.data.items.filter((item) => item.active);
    setBarbers(nextBarbers);
    setAvailabilityByBarberId({});
    setDraftsByBarberId({});
    setSelectedBarberId((current) =>
      current && nextBarbers.some((item) => item.id === current)
        ? current
        : nextBarbers[0]?.id ?? null,
    );
    setProblem(null);
    setIssues(new Map());
    setShowValidation(false);
    setIsLoading(false);
  }, [tAvailability]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchBarbers();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchBarbers]);

  useEffect(() => {
    if (!selectedBarberId || !currentBarberMeta || availabilityByBarberId[selectedBarberId]) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void fetchBarberAvailability(currentBarberMeta);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [availabilityByBarberId, currentBarberMeta, fetchBarberAvailability, selectedBarberId]);

  const updateCurrentDraft = useCallback(
    (updater: (draft: PutAvailabilityRequest) => PutAvailabilityRequest) => {
      if (!selectedBarberId || !currentDraft) {
        return;
      }

      const nextDraft = updater(currentDraft);
      setDraftsByBarberId((current) => ({
        ...current,
        [selectedBarberId]: nextDraft,
      }));
      setProblem(null);
      if (showValidation) {
        setIssues(validateDraft(nextDraft));
      }
    },
    [currentDraft, selectedBarberId, showValidation, validateDraft],
  );

  const handleSave = useCallback(async () => {
    if (!selectedBarberId || !currentDraft) {
      return;
    }

    const nextIssues = validateDraft(currentDraft);
    if (nextIssues.size > 0) {
      setShowValidation(true);
      setIssues(nextIssues);
      const message = firstIssueMessage(nextIssues) ?? tAvailability("saveFailed");
      setProblem({
        title: tAvailability("errors.validationTitle"),
        detail: message,
        code: "VALIDATION_ERROR",
      });
      toast.error(message);
      return;
    }

    setIsSaving(true);
    setProblem(null);
    const payload = normalizeAvailabilityPayload(currentDraft);
    const response = await apiFetch(`/api/availability/barbers/${selectedBarberId}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await readApiResponse<AvailabilityBarber>(response);
    setIsSaving(false);

    if (!response.ok || !result.data) {
      const nextProblem = toProblemBanner(result.problem, tAvailability("saveFailed"));
      setProblem(nextProblem);
      toast.error(nextProblem.detail);
      return;
    }

    const savedBarber = result.data;
    setAvailabilityByBarberId((current) => ({
      ...current,
      [savedBarber.barberId]: savedBarber,
    }));
    setDraftsByBarberId((current) => ({
      ...current,
      [savedBarber.barberId]: toDraft(savedBarber),
    }));
    setIssues(new Map());
    setShowValidation(false);
    setProblem(null);
    toast.success(tAvailability("saved"));
  }, [currentDraft, selectedBarberId, tAvailability, validateDraft]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <Skeleton className="h-48 rounded-[1.75rem]" />
          <Skeleton className="h-48 rounded-[1.75rem]" />
        </div>
        <Skeleton className="h-72 rounded-[1.75rem]" />
        <Skeleton className="h-80 rounded-[1.75rem]" />
      </div>
    );
  }

  if (!barbers.length) {
    return (
      <EmptyState
        cta={(
          <Button asChild className="rounded-full" size="sm">
            <Link href="/app/staff">{tAvailability("goToStaffCta")}</Link>
          </Button>
        )}
        description={tAvailability("noBarbersDescription")}
        title={tAvailability("noBarbersTitle")}
      />
    );
  }

  return (
    <div className="space-y-6">
      {problem ? <ProblemBanner problem={problem} /> : null}

      <Card className="rounded-[1.75rem] border-border/70 shadow-lg shadow-black/5">
        <CardHeader className="flex flex-col gap-4 border-b border-border/70 pb-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
                {currentBarber?.barberName ?? tAvailability("selectBarber")}
              </Badge>
              <Badge className="rounded-full" variant={isDirty ? "secondary" : "outline"}>
                {isDirty ? tAvailability("pendingChanges") : tAvailability("savedState")}
              </Badge>
            </div>
            <CardTitle>{tAvailability("editorTitle")}</CardTitle>
            <CardDescription>{tAvailability("editorDescription")}</CardDescription>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[280px]">
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                htmlFor="availability-barber-select"
              >
                {tAvailability("selectBarber")}
              </label>
              <Select
                onValueChange={(value) => {
                  setSelectedBarberId(value);
                  setProblem(null);
                  setIssues(new Map());
                  setShowValidation(false);
                }}
                value={selectedBarberId ?? undefined}
              >
                <SelectTrigger
                  className="h-11 w-full rounded-xl"
                  data-testid="availability-barber-select"
                  id="availability-barber-select"
                >
                  <SelectValue placeholder={tAvailability("selectBarberHint")} />
                </SelectTrigger>
                <SelectContent>
                  {barbers.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="h-11 rounded-xl"
              data-testid="availability-save"
              disabled={!currentDraft || isSaving || !isDirty}
              onClick={() => void handleSave()}
              type="button"
            >
              {isSaving ? tAvailability("saving") : tCommon("save")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-brand-muted text-brand-foreground">
                <CalendarClock className="size-5" />
              </span>
              <div>
                <p className="font-medium tracking-tight">{tAvailability("weeklyTitle")}</p>
                <p className="text-sm text-muted-foreground">
                  {currentDraft?.weekly.length ?? 0} {tAvailability("weeklyCountLabel")}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-brand-muted text-brand-foreground">
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <p className="font-medium tracking-tight">{tAvailability("exceptionsTitle")}</p>
                <p className="text-sm text-muted-foreground">
                  {currentDraft?.exceptions.length ?? 0} {tAvailability("exceptionsCountLabel")}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-brand-muted text-brand-foreground">
                <CheckCircle2 className="size-5" />
              </span>
              <div>
                <p className="font-medium tracking-tight">{tAvailability("saveStateTitle")}</p>
                <p className="text-sm text-muted-foreground">
                  {isDirty ? tAvailability("pendingChanges") : tAvailability("savedState")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {currentDraft ? (
        <>
          <WeeklyScheduleEditor
            issues={issues}
            onAddInterval={(dayOfWeek) =>
              updateCurrentDraft((draft) => ({
                ...draft,
                weekly: [...draft.weekly, createEmptyWeeklyInterval(dayOfWeek)],
              }))
            }
            onChangeInterval={(dayOfWeek, intervalIndex, field, value) =>
              updateCurrentDraft((draft) => {
                const nextWeekly = [...draft.weekly];
                const resolvedIndex = resolveWeeklyIntervalIndex(nextWeekly, dayOfWeek, intervalIndex);
                if (resolvedIndex < 0) {
                  return draft;
                }

                nextWeekly[resolvedIndex] = {
                  ...nextWeekly[resolvedIndex]!,
                  [field]: value,
                };

                return {
                  ...draft,
                  weekly: nextWeekly,
                };
              })
            }
            onRemoveInterval={(dayOfWeek, intervalIndex) =>
              updateCurrentDraft((draft) => {
                const resolvedIndex = resolveWeeklyIntervalIndex(draft.weekly, dayOfWeek, intervalIndex);
                if (resolvedIndex < 0) {
                  return draft;
                }

                return {
                  ...draft,
                  weekly: draft.weekly.filter((_, index) => index !== resolvedIndex),
                };
              })
            }
            showErrors={showValidation}
            weekly={currentDraft.weekly}
          />

          <ExceptionsEditor
            exceptions={currentDraft.exceptions}
            issues={issues}
            onAddException={() =>
              updateCurrentDraft((draft) => ({
                ...draft,
                exceptions: [...draft.exceptions, createEmptyAvailabilityException()],
              }))
            }
            onAddInterval={(exceptionIndex) =>
              updateCurrentDraft((draft) => {
                const nextExceptions = [...draft.exceptions];
                const currentException = nextExceptions[exceptionIndex];
                if (!currentException) {
                  return draft;
                }

                nextExceptions[exceptionIndex] = {
                  ...currentException,
                  type: "override",
                  intervals: [...(currentException.intervals ?? []), createEmptyExceptionInterval()],
                };

                return {
                  ...draft,
                  exceptions: nextExceptions,
                };
              })
            }
            onChangeException={(exceptionIndex, field, value) =>
              updateCurrentDraft((draft) => {
                const nextExceptions = [...draft.exceptions];
                const currentException = nextExceptions[exceptionIndex];
                if (!currentException) {
                  return draft;
                }

                if (field === "type") {
                  nextExceptions[exceptionIndex] = {
                    ...currentException,
                    type: value as "closed" | "override",
                    intervals:
                      value === "override"
                        ? currentException.intervals?.length
                          ? currentException.intervals
                          : [createEmptyExceptionInterval()]
                        : [],
                  };
                } else {
                  nextExceptions[exceptionIndex] = {
                    ...currentException,
                    [field]: value,
                  };
                }

                return {
                  ...draft,
                  exceptions: nextExceptions,
                };
              })
            }
            onChangeInterval={(exceptionIndex, intervalIndex, field, value) =>
              updateCurrentDraft((draft) => {
                const nextExceptions = [...draft.exceptions];
                const currentException = nextExceptions[exceptionIndex];
                if (!currentException) {
                  return draft;
                }

                const nextIntervals = [...(currentException.intervals ?? [])];
                const currentInterval = nextIntervals[intervalIndex];
                if (!currentInterval) {
                  return draft;
                }

                nextIntervals[intervalIndex] = {
                  ...currentInterval,
                  [field]: value,
                };
                nextExceptions[exceptionIndex] = {
                  ...currentException,
                  intervals: nextIntervals,
                };

                return {
                  ...draft,
                  exceptions: nextExceptions,
                };
              })
            }
            onRemoveException={(exceptionIndex) =>
              updateCurrentDraft((draft) => ({
                ...draft,
                exceptions: draft.exceptions.filter((_, index) => index !== exceptionIndex),
              }))
            }
            onRemoveInterval={(exceptionIndex, intervalIndex) =>
              updateCurrentDraft((draft) => {
                const nextExceptions = [...draft.exceptions];
                const currentException = nextExceptions[exceptionIndex];
                if (!currentException) {
                  return draft;
                }

                nextExceptions[exceptionIndex] = {
                  ...currentException,
                  intervals: (currentException.intervals ?? []).filter(
                    (_, index) => index !== intervalIndex,
                  ),
                };

                return {
                  ...draft,
                  exceptions: nextExceptions,
                };
              })
            }
            showErrors={showValidation}
          />
        </>
      ) : null}
    </div>
  );
}
