"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import type {
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventDropArg,
  EventInput,
} from "@fullcalendar/core";
import esLocale from "@fullcalendar/core/locales/es";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import luxonPlugin from "@fullcalendar/luxon3";
import timeGridPlugin from "@fullcalendar/timegrid";
import { DateTime } from "luxon";
import { CalendarClock, Filter, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ServicePayload } from "@/lib/backend";
import type {
  Appointment,
  BarberItem,
} from "@/lib/types/appointments";
import { hasAnyRole } from "@/lib/roles";
import { toProblemToast } from "@/lib/forms";
import {
  fetchAppointments,
  fetchAvailabilitySlots,
  fetchBarbers,
  fetchServices,
  patchAppointment,
} from "@/components/appointments/appointment-api";
import { AppointmentSheet } from "@/components/appointments/appointment-sheet";
import { EmptyState } from "@/components/empty-state";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { type ProblemBannerState } from "@/lib/problem";

type CalendarView = "timeGridDay" | "timeGridWeek" | "listWeek";

type AppointmentSheetState = {
  open: boolean;
  mode: "create" | "edit" | "detail";
  appointment?: Appointment | null;
  draft?: {
    barberId?: string;
    serviceId?: string;
    startAtLocal?: string;
    durationMinutes?: number;
  } | null;
};

type AppointmentsCalendarProps = {
  timeZone: string;
  roles: readonly string[];
};

type VisibleRange = {
  start: Date;
  end: Date;
};

function formatRangeDate(value: Date, timeZone: string) {
  return DateTime.fromJSDate(value, { zone: timeZone }).toISODate() ?? "";
}

function toLocalDateTime(value: Date, timeZone: string) {
  return DateTime.fromJSDate(value, { zone: timeZone }).toFormat("yyyy-MM-dd'T'HH:mm");
}

function durationMinutesFromRange(start: Date | null, end: Date | null) {
  if (!start || !end) {
    return 30;
  }

  return Math.max(
    5,
    Math.round(
      DateTime.fromJSDate(end).diff(DateTime.fromJSDate(start), "minutes").minutes,
    ),
  );
}

function localTimeFromDate(value: Date, timeZone: string) {
  return DateTime.fromJSDate(value, { zone: timeZone }).toFormat("HH:mm");
}

function listVisibleDates(range: VisibleRange, timeZone: string) {
  const dates: string[] = [];
  let cursor = DateTime.fromJSDate(range.start, { zone: timeZone }).startOf("day");
  const limit = DateTime.fromJSDate(range.end, { zone: timeZone }).startOf("day");

  while (cursor < limit) {
    const isoDate = cursor.toISODate();
    if (isoDate) {
      dates.push(isoDate);
    }
    cursor = cursor.plus({ days: 1 });
  }

  return dates;
}

function buildSlotsCacheKey(date: string, barberId: string, serviceId: string) {
  return `${date}|${barberId}|${serviceId}`;
}

export function AppointmentsCalendar({
  timeZone,
  roles,
}: AppointmentsCalendarProps) {
  const locale = useLocale();
  const tAppointments = useTranslations("appointments");
  const tErrors = useTranslations("errors");
  const tToasts = useTranslations("toasts");
  const canMutate = hasAnyRole(roles, ["ADMIN", "MANAGER", "RECEPTION"]);
  const calendarRef = useRef<FullCalendar | null>(null);
  const slotCacheRef = useRef(new Map<string, Set<string>>());
  const slotPromisesRef = useRef(new Map<string, Promise<Set<string>>>());
  const lastSelectToastAtRef = useRef(0);
  const [barbers, setBarbers] = useState<BarberItem[]>([]);
  const [services, setServices] = useState<ServicePayload[]>([]);
  const [isCatalogsLoading, setIsCatalogsLoading] = useState(true);
  const [problem, setProblem] = useState<ProblemBannerState | null>(null);
  const [activeView, setActiveView] = useState<CalendarView>("timeGridDay");
  const [barberFilter, setBarberFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibleRange, setVisibleRange] = useState<VisibleRange | null>(null);
  const [sheetState, setSheetState] = useState<AppointmentSheetState>({
    open: false,
    mode: "create",
    appointment: null,
    draft: null,
  });

  const servicesById = Object.fromEntries(services.map((service) => [service.id, service]));

  useEffect(() => {
    let active = true;
    void (async () => {
      setIsCatalogsLoading(true);

      const [barbersResult, servicesResult] = await Promise.all([
        fetchBarbers(),
        fetchServices(),
      ]);

      if (!active) {
        return;
      }

      if (!barbersResult.data || !servicesResult.data) {
        const failingProblem = barbersResult.problem ?? servicesResult.problem;
        const toastProblem = toProblemToast(
          failingProblem,
          {
            generic: tAppointments("loadFailed"),
            unauthorized: tErrors("unauthorized"),
            forbidden: tErrors("forbidden"),
            branchRequired: tErrors("branchRequired"),
            branchForbidden: tErrors("branchForbidden"),
            conflict: tErrors("conflict"),
            validation: tErrors("validation"),
          },
          tAppointments("loadFailed"),
        );

        setProblem({
          title: toastProblem.title,
          detail: toastProblem.description,
          code: failingProblem?.code,
        });
        setBarbers([]);
        setServices([]);
        setIsCatalogsLoading(false);
        return;
      }

      setBarbers(barbersResult.data);
      setServices(servicesResult.data);
      setProblem(null);
      setIsCatalogsLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [tAppointments, tErrors]);

  useEffect(() => {
    calendarRef.current?.getApi().refetchEvents();
  }, [barberFilter, statusFilter]);

  const loadSlots = useCallback(async (date: string, barberId: string, serviceId: string) => {
    const key = buildSlotsCacheKey(date, barberId, serviceId);
    const cached = slotCacheRef.current.get(key);
    if (cached) {
      return cached;
    }

    const pending = slotPromisesRef.current.get(key);
    if (pending) {
      return pending;
    }

    const promise = (async () => {
      const response = await fetchAvailabilitySlots({
        date,
        barberId,
        serviceId,
      });

      slotPromisesRef.current.delete(key);

      if (!response.data) {
        return new Set<string>();
      }

      const nextSlots = new Set(response.data.items[0]?.slots ?? []);
      slotCacheRef.current.set(key, nextSlots);
      return nextSlots;
    })();

    slotPromisesRef.current.set(key, promise);
    return promise;
  }, []);

  function getCachedSlots(date: string, barberId: string, serviceId: string) {
    return slotCacheRef.current.get(buildSlotsCacheKey(date, barberId, serviceId)) ?? null;
  }

  const primeSlotsForDates = useCallback(async (
    dates: string[],
    slotConfigs: Array<{ barberId: string; serviceId: string }>,
  ) => {
    const uniqueConfigs = Array.from(
      new Map(
        slotConfigs.map((config) => [`${config.barberId}|${config.serviceId}`, config]),
      ).values(),
    );

    await Promise.all(
      uniqueConfigs.flatMap((config) =>
        dates.map((date) => loadSlots(date, config.barberId, config.serviceId)),
      ),
    );
  }, [loadSlots]);

  function toastSelectRequirements() {
    const now = Date.now();
    if (now - lastSelectToastAtRef.current < 1500) {
      return;
    }

    lastSelectToastAtRef.current = now;
    toast.warning(tAppointments("selectBarberAndServiceFirst"));
  }

  async function refetchEvents() {
    calendarRef.current?.getApi().refetchEvents();
  }

  async function handleEvents(
    fetchInfo: { start: Date; end: Date },
    successCallback: (events: EventInput[]) => void,
    failureCallback: (error: Error) => void,
  ) {
    const from = formatRangeDate(fetchInfo.start, timeZone);
    const to = DateTime.fromJSDate(fetchInfo.end, { zone: timeZone })
      .minus({ days: 1 })
      .toISODate() ?? from;

    const result = await fetchAppointments({
      from,
      to,
      barberId: barberFilter !== "all" ? barberFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    });

    if (!result.data) {
      const toastProblem = toProblemToast(
        result.problem,
        {
          generic: tAppointments("loadFailed"),
          unauthorized: tErrors("unauthorized"),
          forbidden: tErrors("forbidden"),
          branchRequired: tErrors("branchRequired"),
          branchForbidden: tErrors("branchForbidden"),
          conflict: tErrors("conflict"),
          validation: tErrors("validation"),
        },
        tAppointments("loadFailed"),
      );

      setProblem({
        title: toastProblem.title,
        detail: toastProblem.description,
        code: result.problem?.code,
      });
      failureCallback(new Error(toastProblem.description));
      return;
    }

    setProblem(null);
    const visibleDates = listVisibleDates(
      {
        start: fetchInfo.start,
        end: fetchInfo.end,
      },
      timeZone,
    );

    const slotConfigs = result.data.map((appointment) => ({
      barberId: appointment.barberId,
      serviceId: appointment.serviceId,
    }));
    void primeSlotsForDates(visibleDates, slotConfigs);

    successCallback(
      result.data.map((appointment) => ({
        id: appointment.id,
        start: appointment.startAt,
        end: appointment.endAt,
        title:
          servicesById[appointment.serviceId]?.name ??
          tAppointments("eventFallback"),
        extendedProps: {
          appointment,
        },
      })),
    );
  }

  async function handleCalendarPatch(
    appointmentId: string,
    start: Date | null,
    end: Date | null,
  ) {
    const response = await patchAppointment(appointmentId, {
      startAtLocal: start ? toLocalDateTime(start, timeZone) : undefined,
      durationMinutes: durationMinutesFromRange(start, end),
    });

    if (!response.data) {
      const toastProblem = toProblemToast(
        response.problem,
        {
          generic: tAppointments("updateFailed"),
          unauthorized: tErrors("unauthorized"),
          forbidden: tErrors("forbidden"),
          branchRequired: tErrors("branchRequired"),
          branchForbidden: tErrors("branchForbidden"),
          conflict: tErrors("conflict"),
          validation: tErrors("validation"),
          codes: {
            APPOINTMENT_OUTSIDE_AVAILABILITY: tToasts("outsideAvailability"),
            APPOINTMENT_OVERLAP: tToasts("overlap"),
          },
        },
        tAppointments("updateFailed"),
      );

      toast.error(toastProblem.title, {
        description: toastProblem.description,
      });
      throw new Error(toastProblem.description);
    }

    toast.success(tAppointments("updated"));
  }

  async function handleEventDrop(info: EventDropArg) {
    try {
      await handleCalendarPatch(info.event.id, info.event.start, info.event.end);
      await refetchEvents();
    } catch {
      info.revert();
    }
  }

  async function handleEventResize(info: EventResizeDoneArg) {
    try {
      await handleCalendarPatch(info.event.id, info.event.start, info.event.end);
      await refetchEvents();
    } catch {
      info.revert();
    }
  }

  function openCreateSheet(startAtLocal?: string, durationMinutes?: number) {
    setSheetState({
      open: true,
      mode: "create",
      appointment: null,
      draft: {
        barberId: barberFilter !== "all" ? barberFilter : undefined,
        serviceId: serviceFilter !== "all" ? serviceFilter : undefined,
        startAtLocal,
        durationMinutes,
      },
    });
  }

  function openAppointmentSheet(appointment: Appointment) {
    setSheetState({
      open: true,
      mode: canMutate ? "edit" : "detail",
      appointment,
      draft: null,
    });
  }

  useEffect(() => {
    if (!visibleRange || barberFilter === "all" || serviceFilter === "all") {
      return;
    }

    const visibleDates = listVisibleDates(visibleRange, timeZone);
    void primeSlotsForDates(visibleDates, [
      {
        barberId: barberFilter,
        serviceId: serviceFilter,
      },
    ]);
  }, [barberFilter, primeSlotsForDates, serviceFilter, timeZone, visibleRange]);

  return (
    <div className="space-y-6" data-testid="appointments-page">
      <Card className="rounded-[1.75rem] border-border/70 bg-card/85 shadow-xl shadow-black/5">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
                  {tAppointments("calendarBadge")}
                </Badge>
                <Badge className="rounded-full" variant="outline">
                  {timeZone}
                </Badge>
              </div>
              <CardTitle className="text-2xl tracking-tight">{tAppointments("calendarTitle")}</CardTitle>
              <CardDescription>{tAppointments("calendarDescription")}</CardDescription>
            </div>
            {!isCatalogsLoading && canMutate ? (
              <Button
                className="rounded-xl"
                disabled={barbers.length === 0 || services.length === 0}
                onClick={() => openCreateSheet()}
                type="button"
              >
                <Plus className="size-4" />
                {tAppointments("new")}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {problem ? <ProblemBanner problem={problem} /> : null}

          {isCatalogsLoading ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-10 w-24 rounded-xl" />
                <Skeleton className="h-10 w-24 rounded-xl" />
                <Skeleton className="h-10 w-24 rounded-xl" />
                <Skeleton className="h-10 w-56 rounded-xl" />
                <Skeleton className="h-10 w-48 rounded-xl" />
              </div>
              <Skeleton className="h-[720px] rounded-[1.5rem]" />
            </div>
          ) : barbers.length === 0 ? (
            <div data-testid="appointments-no-barbers">
              <EmptyState
                cta={canMutate ? (
                  <Button asChild className="rounded-full">
                    <a href="/app/branches">{tAppointments("noBarbersCta")}</a>
                  </Button>
                ) : null}
                description={tAppointments("noBarbersDesc")}
                icon={<CalendarClock className="size-5" />}
                title={tAppointments("noBarbersTitle")}
              />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {([
                    ["timeGridDay", tAppointments("day")],
                    ["timeGridWeek", tAppointments("week")],
                    ["listWeek", tAppointments("list")],
                  ] as const).map(([view, label]) => (
                    <Button
                      className="rounded-xl"
                      key={view}
                      onClick={() => {
                        calendarRef.current?.getApi().changeView(view);
                        setActiveView(view);
                      }}
                      type="button"
                      variant={activeView === view ? "default" : "outline"}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/35 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    <Filter className="size-3.5" />
                    {tAppointments("filters.label")}
                  </div>

                  <Select onValueChange={setBarberFilter} value={barberFilter}>
                    <SelectTrigger className="h-10 w-[220px] rounded-xl">
                      <SelectValue placeholder={tAppointments("filters.barber")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tAppointments("filters.all")}</SelectItem>
                      {barbers.map((barber) => (
                        <SelectItem key={barber.id} value={barber.id}>
                          {barber.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select onValueChange={setStatusFilter} value={statusFilter}>
                    <SelectTrigger className="h-10 w-[220px] rounded-xl">
                      <SelectValue placeholder={tAppointments("filters.status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tAppointments("filters.all")}</SelectItem>
                      {(["scheduled", "checked_in", "completed", "cancelled", "no_show"] as const).map((status) => (
                        <SelectItem key={status} value={status}>
                          {tAppointments(`statuses.${status}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select onValueChange={setServiceFilter} value={serviceFilter}>
                    <SelectTrigger className="h-10 w-[220px] rounded-xl">
                      <SelectValue placeholder={tAppointments("fields.service")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tAppointments("filters.all")}</SelectItem>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/80 p-3 shadow-inner shadow-black/5">
                <FullCalendar
                  allDaySlot={false}
                  datesSet={(arg: DatesSetArg) => {
                    setActiveView(arg.view.type as CalendarView);
                    setVisibleRange({
                      start: arg.start,
                      end: arg.end,
                    });
                  }}
                  editable={canMutate}
                  eventAllow={(dropInfo, draggedEvent) => {
                    if (!canMutate) {
                      return false;
                    }

                    if (!draggedEvent) {
                      return false;
                    }

                    const appointment = draggedEvent.extendedProps.appointment as Appointment | undefined;
                    if (!appointment) {
                      return false;
                    }

                    const date = formatRangeDate(dropInfo.start, timeZone);
                    const time = localTimeFromDate(dropInfo.start, timeZone);
                    const cachedSlots = getCachedSlots(date, appointment.barberId, appointment.serviceId);

                    if (!cachedSlots) {
                      void loadSlots(date, appointment.barberId, appointment.serviceId);
                      return true;
                    }

                    return cachedSlots.has(time);
                  }}
                  eventClick={(info: EventClickArg) => {
                    const appointment = info.event.extendedProps.appointment as Appointment | undefined;
                    if (!appointment) {
                      return;
                    }
                    openAppointmentSheet(appointment);
                  }}
                  eventContent={(eventInfo) => {
                    const appointment = eventInfo.event.extendedProps.appointment as Appointment;
                    return (
                      <div className="flex flex-col gap-0.5">
                        <span className="truncate text-xs font-semibold">
                          {eventInfo.event.title}
                        </span>
                        <span className="truncate text-[11px] opacity-85">
                          {tAppointments(`statuses.${appointment.status}`)}
                        </span>
                      </div>
                    );
                  }}
                  eventDrop={(info) => {
                    void handleEventDrop(info);
                  }}
                  eventResizableFromStart
                  eventResize={(info) => {
                    void handleEventResize(info);
                  }}
                  events={(fetchInfo, successCallback, failureCallback) => {
                    void handleEvents(fetchInfo, successCallback, failureCallback);
                  }}
                  expandRows
                  headerToolbar={false}
                  height="auto"
                  initialDate={DateTime.now().setZone(timeZone).toJSDate()}
                  initialView="timeGridDay"
                  locale={locale === "es" ? esLocale : "en"}
                  nowIndicator
                  plugins={[timeGridPlugin, listPlugin, interactionPlugin, luxonPlugin]}
                  ref={calendarRef}
                  selectAllow={(selectInfo) => {
                    if (!canMutate) {
                      return false;
                    }

                    if (barberFilter === "all" || serviceFilter === "all") {
                      toastSelectRequirements();
                      return false;
                    }

                    const date = formatRangeDate(selectInfo.start, timeZone);
                    const time = localTimeFromDate(selectInfo.start, timeZone);
                    const cachedSlots = getCachedSlots(date, barberFilter, serviceFilter);

                    if (!cachedSlots) {
                      void loadSlots(date, barberFilter, serviceFilter);
                      return false;
                    }

                    return cachedSlots.has(time);
                  }}
                  select={(info: DateSelectArg) => {
                    if (!canMutate) {
                      return;
                    }

                    openCreateSheet(
                      toLocalDateTime(info.start, timeZone),
                      durationMinutesFromRange(info.start, info.end),
                    );
                    calendarRef.current?.getApi().unselect();
                  }}
                  selectable={canMutate}
                  selectMirror
                  slotDuration="00:15:00"
                  slotMaxTime="22:00:00"
                  slotMinTime="07:00:00"
                  snapDuration="00:15:00"
                  timeZone={timeZone}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {sheetState.open ? (
        <AppointmentSheet
          barbers={barbers}
          canMutate={canMutate}
          initialAppointment={sheetState.appointment}
          initialDraft={sheetState.draft}
          key={`${sheetState.mode}-${sheetState.appointment?.id ?? sheetState.draft?.startAtLocal ?? "new"}`}
          mode={sheetState.mode}
          onOpenChange={(open) => {
            setSheetState((current) => ({
              ...current,
              open,
            }));
            if (!open) {
              setSheetState({
                open: false,
                mode: "create",
                appointment: null,
                draft: null,
              });
            }
          }}
          onSuccess={async () => {
            await refetchEvents();
          }}
          open={sheetState.open}
          services={services}
          timeZone={timeZone}
        />
      ) : null}
    </div>
  );
}
