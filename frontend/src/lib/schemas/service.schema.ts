import { z } from "zod";
import type { ServicePayload } from "@/lib/backend";
import { normalizeMoneyInput } from "@/lib/forms";

type ServiceSchemaMessages = {
  nameValidation: string;
  durationValidation: string;
  priceValidation: string;
  emptyPatch: string;
};

export function createServiceFormSchema(messages: ServiceSchemaMessages) {
  return z.object({
    name: z.string().trim().min(2, messages.nameValidation),
    durationMinutes: z
      .number({ error: messages.durationValidation })
      .int(messages.durationValidation)
      .min(5, messages.durationValidation)
      .max(480, messages.durationValidation),
    price: z
      .string()
      .trim()
      .min(1, messages.priceValidation)
      .refine((value) => {
        try {
          normalizeMoneyInput(value);
          return true;
        } catch {
          return false;
        }
      }, messages.priceValidation),
    active: z.boolean(),
  });
}

export function createServicePatchSchema(messages: Pick<ServiceSchemaMessages, "emptyPatch">) {
  return z
    .object({
      name: z.string().trim().min(2).optional(),
      durationMinutes: z.number().int().min(5).max(480).optional(),
      price: z.number().min(0).optional(),
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

export type ServiceFormValues = z.infer<ReturnType<typeof createServiceFormSchema>>;

export function getServiceDefaultValues(service?: ServicePayload | null): ServiceFormValues {
  return {
    name: service?.name ?? "",
    durationMinutes: service?.durationMinutes ?? 30,
    price: normalizeMoneyInput(service?.price ?? 10),
    active: service?.active ?? true,
  };
}

export function toServiceCreatePayload(values: ServiceFormValues) {
  return {
    name: values.name.trim(),
    durationMinutes: values.durationMinutes,
    price: Number(normalizeMoneyInput(values.price)),
  };
}

export function toServicePatchPayload(
  values: ServiceFormValues,
  initialService: ServicePayload,
  messages: Pick<ServiceSchemaMessages, "emptyPatch">,
) {
  const next = {
    name: values.name.trim(),
    durationMinutes: values.durationMinutes,
    price: Number(normalizeMoneyInput(values.price)),
    active: values.active,
  };

  const patch = {
    ...(next.name !== initialService.name ? { name: next.name } : {}),
    ...(next.durationMinutes !== initialService.durationMinutes
      ? { durationMinutes: next.durationMinutes }
      : {}),
    ...(next.price !== initialService.price ? { price: next.price } : {}),
    ...(next.active !== initialService.active ? { active: next.active } : {}),
  };

  return createServicePatchSchema(messages).parse(patch);
}
