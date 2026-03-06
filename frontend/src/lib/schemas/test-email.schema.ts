import { z } from "zod";
import { normalizeOptionalString } from "@/lib/forms";
import type { SendTestEmailRequest } from "@/lib/types/notifications";

type TestEmailSchemaMessages = {
  emailValidation: string;
  subjectValidation: string;
  bodyRequired: string;
};

const optionalBodyField = z
  .string()
  .trim()
  .max(20_000)
  .optional()
  .transform((value) => normalizeOptionalString(value));

export function createTestEmailFormSchema(messages: TestEmailSchemaMessages) {
  return z
    .object({
      toEmail: z.email(messages.emailValidation),
      subject: z.string().trim().min(2, messages.subjectValidation).max(200),
      bodyText: optionalBodyField,
      bodyHtml: optionalBodyField,
    })
    .superRefine((value, ctx) => {
      if (!value.bodyText && !value.bodyHtml) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bodyText"],
          message: messages.bodyRequired,
        });
      }
    });
}

export type TestEmailFormValues = z.input<ReturnType<typeof createTestEmailFormSchema>>;

export function getTestEmailDefaultValues(): TestEmailFormValues {
  return {
    toEmail: "",
    subject: "",
    bodyText: "Hello from BarberSuite.",
    bodyHtml: "",
  };
}

export function toTestEmailPayload(values: TestEmailFormValues): SendTestEmailRequest {
  return {
    toEmail: values.toEmail,
    subject: values.subject,
    bodyText: normalizeOptionalString(values.bodyText),
    bodyHtml: normalizeOptionalString(values.bodyHtml),
  };
}
