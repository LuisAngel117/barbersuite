"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ZodError } from "zod";
import type { ServicePayload } from "@/lib/backend";
import { normalizeOptionalString, toProblemToast } from "@/lib/forms";
import {
  appointmentStatuses,
  createAppointmentFormSchema,
  createAppointmentPatchSchema,
  defaultAppointmentValues,
  type AppointmentFormValues,
} from "@/lib/schemas/appointment.schema";
import type {
  Appointment,
  AppointmentStatus,
  BarberItem,
} from "@/lib/types/appointments";
import {
  createAppointment,
  patchAppointment,
} from "@/components/appointments/appointment-api";
import { ClientPicker } from "@/components/appointments/client-picker";
import { EntitySheet } from "@/components/forms/entity-sheet";
import { ProblemBanner } from "@/components/ui/problem-banner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type ProblemBannerState } from "@/lib/problem";

type AppointmentDraft = {
  startAtLocal?: string;
  durationMinutes?: number;
};

type AppointmentSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit" | "detail";
  timeZone: string;
  canMutate: boolean;
  barbers: BarberItem[];
  services: ServicePayload[];
  initialAppointment?: Appointment | null;
  initialDraft?: AppointmentDraft | null;
  onSuccess: () => Promise<void> | void;
};

function toLocalInputString(value: string, timeZone: string) {
  return DateTime.fromISO(value, { setZone: true }).setZone(timeZone).toFormat("yyyy-MM-dd'T'HH:mm");
}

function getAppointmentDuration(appointment: Appointment) {
  return Math.round(
    DateTime.fromISO(appointment.endAt, { setZone: true })
      .diff(DateTime.fromISO(appointment.startAt, { setZone: true }), "minutes")
      .minutes,
  );
}

function getDefaultValues(
  timeZone: string,
  initialAppointment?: Appointment | null,
  initialDraft?: AppointmentDraft | null,
): AppointmentFormValues {
  if (!initialAppointment) {
    return {
      ...defaultAppointmentValues(
        initialDraft?.startAtLocal ?? "",
        initialDraft?.durationMinutes,
      ),
      notes: "",
    };
  }

  return {
    clientId: initialAppointment.clientId,
    barberId: initialAppointment.barberId,
    serviceId: initialAppointment.serviceId,
    startAtLocal: toLocalInputString(initialAppointment.startAt, timeZone),
    durationMinutes: getAppointmentDuration(initialAppointment),
    status: initialAppointment.status,
    notes: initialAppointment.notes ?? "",
  };
}

export function AppointmentSheet({
  open,
  onOpenChange,
  mode,
  timeZone,
  canMutate,
  barbers,
  services,
  initialAppointment,
  initialDraft,
  onSuccess,
}: AppointmentSheetProps) {
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tAppointments = useTranslations("appointments");
  const [submitProblem, setSubmitProblem] = useState<ProblemBannerState | null>(null);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(
      createAppointmentFormSchema({
        clientRequired: tAppointments("fields.clientValidation"),
        barberRequired: tAppointments("fields.barberValidation"),
        serviceRequired: tAppointments("fields.serviceValidation"),
        startRequired: tAppointments("fields.startValidation"),
        startInvalid: tAppointments("fields.startFormatValidation"),
        durationValidation: tAppointments("fields.durationValidation"),
        emptyPatch: tAppointments("emptyPatch"),
      }),
    ),
    defaultValues: getDefaultValues(timeZone, initialAppointment, initialDraft),
  });

  const readOnly = mode === "detail" || !canMutate;
  const selectedServiceId = form.watch("serviceId");

  useEffect(() => {
    if (mode !== "create" || !selectedServiceId) {
      return;
    }

    const service = services.find((item) => item.id === selectedServiceId);
    if (!service) {
      return;
    }

    const currentDuration = form.getValues("durationMinutes");
    if (!currentDuration) {
      form.setValue("durationMinutes", service.durationMinutes, {
        shouldDirty: true,
      });
    }
  }, [form, mode, selectedServiceId, services]);

  async function handleSubmit(values: AppointmentFormValues) {
    if (readOnly) {
      return;
    }

    setSubmitProblem(null);
    try {
      if (mode === "create") {
        const response = await createAppointment({
          clientId: values.clientId,
          barberId: values.barberId,
          serviceId: values.serviceId,
          startAtLocal: values.startAtLocal,
          durationMinutes: values.durationMinutes,
          notes: normalizeOptionalString(values.notes),
        });

        if (!response.data) {
          const toastProblem = toProblemToast(
            response.problem,
            {
              generic: tAppointments("createFailed"),
              unauthorized: tErrors("unauthorized"),
              forbidden: tErrors("forbidden"),
              branchRequired: tErrors("branchRequired"),
              branchForbidden: tErrors("branchForbidden"),
              conflict: tAppointments("overlapError"),
              validation: tErrors("validation"),
            },
            tAppointments("createFailed"),
          );

          const nextProblem = {
            title: toastProblem.title,
            detail: toastProblem.description,
            code: response.problem?.code,
          };
          setSubmitProblem(nextProblem);
          toast.error(toastProblem.title, {
            description: toastProblem.description,
          });
          return;
        }

        toast.success(tAppointments("created"));
      } else if (initialAppointment) {
        const patch = {
          ...(values.startAtLocal !== toLocalInputString(initialAppointment.startAt, timeZone)
            ? { startAtLocal: values.startAtLocal }
            : {}),
          ...(values.durationMinutes !== getAppointmentDuration(initialAppointment)
            ? { durationMinutes: values.durationMinutes }
            : {}),
          ...(values.status !== initialAppointment.status
            ? { status: values.status as AppointmentStatus }
            : {}),
          ...(normalizeOptionalString(values.notes) !== normalizeOptionalString(initialAppointment.notes)
            ? { notes: normalizeOptionalString(values.notes) }
            : {}),
        };

        const payload = createAppointmentPatchSchema({
          emptyPatch: tAppointments("emptyPatch"),
          durationValidation: tAppointments("fields.durationValidation"),
          startInvalid: tAppointments("fields.startFormatValidation"),
        }).parse(patch);

        const response = await patchAppointment(initialAppointment.id, payload);
        if (!response.data) {
          const toastProblem = toProblemToast(
            response.problem,
            {
              generic: tAppointments("updateFailed"),
              unauthorized: tErrors("unauthorized"),
              forbidden: tErrors("forbidden"),
              branchRequired: tErrors("branchRequired"),
              branchForbidden: tErrors("branchForbidden"),
              conflict: tAppointments("overlapError"),
              validation: tErrors("validation"),
            },
            tAppointments("updateFailed"),
          );

          const nextProblem = {
            title: toastProblem.title,
            detail: toastProblem.description,
            code: response.problem?.code,
          };
          setSubmitProblem(nextProblem);
          toast.error(toastProblem.title, {
            description: toastProblem.description,
          });
          return;
        }

        toast.success(tAppointments("updated"));
      }

      onOpenChange(false);
      await onSuccess();
    } catch (error) {
      if (error instanceof ZodError) {
        const nextProblem = {
          title: tAppointments("validationTitle"),
          detail: error.issues[0]?.message || tErrors("validation"),
          code: "VALIDATION_ERROR",
        } satisfies ProblemBannerState;
        setSubmitProblem(nextProblem);
        toast.error(nextProblem.title, {
          description: nextProblem.detail,
        });
        return;
      }

      throw error;
    }
  }

  const title = mode === "create"
    ? tAppointments("new")
    : mode === "edit"
      ? tAppointments("edit")
      : tAppointments("details");

  const description = mode === "create"
    ? tAppointments("sheet.createDescription")
    : mode === "edit"
      ? tAppointments("sheet.editDescription")
      : tAppointments("sheet.detailDescription");

  return (
    <Form {...form}>
      <EntitySheet
        cancelLabel={readOnly ? tCommon("close") : tCommon("cancel")}
        description={description}
        hideSubmit={readOnly}
        onCancel={() => onOpenChange(false)}
        onOpenChange={onOpenChange}
        onSubmit={form.handleSubmit(handleSubmit)}
        open={open}
        submitLabel={mode === "create" ? tCommon("create") : tCommon("saveChanges")}
        submitTestId="appointment-submit"
        submitting={form.formState.isSubmitting}
        title={title}
      >
        <div className="space-y-6">
          {submitProblem ? <ProblemBanner problem={submitProblem} /> : null}

          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tAppointments("fields.client")}</FormLabel>
                <FormControl>
                  <ClientPicker
                    disabled={readOnly || mode !== "create"}
                    onChange={field.onChange}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="barberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAppointments("fields.barber")}</FormLabel>
                  <Select
                    disabled={readOnly || mode !== "create"}
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 w-full rounded-xl">
                        <SelectValue placeholder={tAppointments("filters.barber")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {barbers.map((barber) => (
                        <SelectItem key={barber.id} value={barber.id}>
                          {barber.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAppointments("fields.service")}</FormLabel>
                  <Select
                    disabled={readOnly || mode !== "create"}
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 w-full rounded-xl">
                        <SelectValue placeholder={tAppointments("fields.service")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="startAtLocal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAppointments("fields.start")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-11 rounded-xl"
                      data-testid="appointment-start"
                      disabled={readOnly}
                      type="datetime-local"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAppointments("fields.duration")}</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 rounded-xl"
                      data-testid="appointment-duration"
                      disabled={readOnly}
                      inputMode="numeric"
                      max={480}
                      min={5}
                      onChange={(event) => {
                        const value = event.target.value.trim();
                        field.onChange(value ? Number(value) : undefined);
                      }}
                      type="number"
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {mode !== "create" ? (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAppointments("fields.status")}</FormLabel>
                  <Select
                    disabled={readOnly}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 w-full rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {appointmentStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {tAppointments(`statuses.${status}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tAppointments("fields.notes")}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="min-h-32 rounded-xl"
                    data-testid="appointment-notes"
                    disabled={readOnly}
                    placeholder={tAppointments("fields.notesPlaceholder")}
                    rows={5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </EntitySheet>
    </Form>
  );
}
