import { z } from "zod";
import { normalizeOptionalString } from "@/lib/forms";
import type {
  NotificationEmailTemplate,
  UpsertNotificationEmailTemplateRequest,
} from "@/lib/types/notification-templates";

type NotificationTemplateSchemaMessages = {
  subjectValidation: string;
  bodyRequired: string;
};

const optionalTemplateField = z
  .string()
  .trim()
  .max(20_000)
  .optional()
  .transform((value) => normalizeOptionalString(value));

export function createNotificationTemplateFormSchema(
  messages: NotificationTemplateSchemaMessages,
) {
  return z
    .object({
      enabled: z.boolean(),
      subjectTemplate: z.string().trim().min(2, messages.subjectValidation),
      bodyTextTemplate: optionalTemplateField,
      bodyHtmlTemplate: optionalTemplateField,
    })
    .superRefine((value, ctx) => {
      if (!value.bodyTextTemplate && !value.bodyHtmlTemplate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bodyTextTemplate"],
          message: messages.bodyRequired,
        });
      }
    });
}

export type NotificationTemplateFormValues =
  z.input<ReturnType<typeof createNotificationTemplateFormSchema>>;

export function getNotificationTemplateDefaultValues(
  template: NotificationEmailTemplate,
): NotificationTemplateFormValues {
  return {
    enabled: template.enabled,
    subjectTemplate: template.subjectTemplate,
    bodyTextTemplate: template.bodyTextTemplate ?? "",
    bodyHtmlTemplate: template.bodyHtmlTemplate ?? "",
  };
}

export function toNotificationTemplatePayload(
  values: NotificationTemplateFormValues,
): UpsertNotificationEmailTemplateRequest {
  return {
    enabled: values.enabled,
    subjectTemplate: values.subjectTemplate.trim(),
    bodyTextTemplate: normalizeOptionalString(values.bodyTextTemplate),
    bodyHtmlTemplate: normalizeOptionalString(values.bodyHtmlTemplate),
  };
}
