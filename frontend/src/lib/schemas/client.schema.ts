import { z } from "zod";
import type { ClientPayload } from "@/lib/backend";
import { normalizeOptionalString } from "@/lib/forms";

type ClientSchemaMessages = {
  fullNameValidation: string;
  emailValidation: string;
  emptyPatch: string;
};

export function createClientFormSchema(messages: ClientSchemaMessages) {
  return z.object({
    fullName: z.string().trim().min(2, messages.fullNameValidation),
    phone: z.string(),
    email: z
      .string()
      .refine((value) => {
        const normalized = normalizeOptionalString(value);
        if (!normalized) {
          return true;
        }

        return z.email().safeParse(normalized).success;
      }, messages.emailValidation),
    notes: z.string(),
    active: z.boolean(),
  });
}

export function createClientPatchSchema(messages: Pick<ClientSchemaMessages, "emptyPatch">) {
  return z
    .object({
      fullName: z.string().trim().min(2).optional(),
      phone: z.string().optional(),
      email: z.email().optional(),
      notes: z.string().optional(),
      active: z.boolean().optional(),
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

export type ClientFormValues = z.infer<ReturnType<typeof createClientFormSchema>>;

export function getClientDefaultValues(client?: ClientPayload | null): ClientFormValues {
  return {
    fullName: client?.fullName ?? "",
    phone: client?.phone ?? "",
    email: client?.email ?? "",
    notes: client?.notes ?? "",
    active: client?.active ?? true,
  };
}

export function toClientCreatePayload(values: ClientFormValues) {
  return {
    fullName: values.fullName.trim(),
    phone: normalizeOptionalString(values.phone),
    email: normalizeOptionalString(values.email),
    notes: normalizeOptionalString(values.notes),
  };
}

export function toClientPatchPayload(
  values: ClientFormValues,
  initialClient: ClientPayload,
  messages: Pick<ClientSchemaMessages, "emptyPatch">,
) {
  const next = {
    fullName: values.fullName.trim(),
    phone: normalizeOptionalString(values.phone),
    email: normalizeOptionalString(values.email),
    notes: normalizeOptionalString(values.notes),
    active: values.active,
  };

  const patch = {
    ...(next.fullName !== initialClient.fullName ? { fullName: next.fullName } : {}),
    ...(next.phone !== (initialClient.phone ?? undefined) ? { phone: next.phone } : {}),
    ...(next.email !== (initialClient.email ?? undefined) ? { email: next.email } : {}),
    ...(next.notes !== (initialClient.notes ?? undefined) ? { notes: next.notes } : {}),
    ...(next.active !== initialClient.active ? { active: next.active } : {}),
  };

  return createClientPatchSchema(messages).parse(patch);
}
