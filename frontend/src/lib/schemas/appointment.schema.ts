import { z } from "zod";

const LOCAL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const APPOINTMENT_STATUSES = [
  "scheduled",
  "checked_in",
  "completed",
  "cancelled",
  "no_show",
] as const;

type AppointmentSchemaMessages = {
  clientRequired: string;
  barberRequired: string;
  serviceRequired: string;
  startRequired: string;
  startInvalid: string;
  durationValidation: string;
  emptyPatch: string;
};

export type AppointmentStatusValue = (typeof APPOINTMENT_STATUSES)[number];

function optionalDuration(messages: AppointmentSchemaMessages) {
  return z
    .number({ error: messages.durationValidation })
    .int(messages.durationValidation)
    .min(5, messages.durationValidation)
    .max(480, messages.durationValidation)
    .optional();
}

export function createAppointmentFormSchema(messages: AppointmentSchemaMessages) {
  return z.object({
    clientId: z.string().uuid(messages.clientRequired),
    barberId: z.string().uuid(messages.barberRequired),
    serviceId: z.string().uuid(messages.serviceRequired),
    startAtLocal: z
      .string()
      .trim()
      .min(1, messages.startRequired)
      .regex(LOCAL_DATE_TIME_PATTERN, messages.startInvalid),
    durationMinutes: optionalDuration(messages),
    status: z.enum(APPOINTMENT_STATUSES),
    notes: z.string(),
  });
}

export function createAppointmentPatchSchema(
  messages: Pick<AppointmentSchemaMessages, "emptyPatch" | "durationValidation" | "startInvalid">,
) {
  return z
    .object({
      startAtLocal: z
        .string()
        .trim()
        .regex(LOCAL_DATE_TIME_PATTERN, messages.startInvalid)
        .optional(),
      durationMinutes: z
        .number({ error: messages.durationValidation })
        .int(messages.durationValidation)
        .min(5, messages.durationValidation)
        .max(480, messages.durationValidation)
        .optional(),
      status: z.enum(APPOINTMENT_STATUSES).optional(),
      notes: z.string().optional(),
    })
    .superRefine((value, context) => {
      if (Object.keys(value).length === 0) {
        context.addIssue({
          code: "custom",
          message: messages.emptyPatch,
          path: ["root"],
        });
      }
    });
}

export type AppointmentFormValues = z.infer<ReturnType<typeof createAppointmentFormSchema>>;

export function defaultAppointmentValues(startAtLocal = "", durationMinutes?: number): AppointmentFormValues {
  return {
    clientId: "",
    barberId: "",
    serviceId: "",
    startAtLocal,
    durationMinutes,
    status: "scheduled",
    notes: "",
  };
}

export const appointmentStatuses = APPOINTMENT_STATUSES;
