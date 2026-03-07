import { z } from "zod";
import type { Branch, CreateBranchRequest, PatchBranchRequest } from "@/lib/types/branches";

type BranchSchemaMessages = {
  nameValidation: string;
  codeValidation: string;
  timeZoneValidation: string;
  emptyPatch: string;
};

export type BranchFormValues = {
  name: string;
  code: string;
  timeZone: string;
  active: boolean;
};

function isValidTimeZone(value: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function normalizeBranchCode(value: string) {
  return value.trim().toUpperCase();
}

export function createBranchFormSchema(messages: BranchSchemaMessages) {
  return z.object({
    name: z.string().trim().min(2, messages.nameValidation),
    code: z
      .string()
      .trim()
      .min(2, messages.codeValidation)
      .max(10, messages.codeValidation)
      .refine((value) => /^[A-Z0-9]{2,10}$/.test(normalizeBranchCode(value)), messages.codeValidation),
    timeZone: z
      .string()
      .trim()
      .min(1, messages.timeZoneValidation)
      .refine((value) => isValidTimeZone(value.trim()), messages.timeZoneValidation),
    active: z.boolean(),
  });
}

export function createBranchPatchSchema(messages: Pick<BranchSchemaMessages, "emptyPatch">) {
  return z
    .object({
      name: z.string().trim().min(2).optional(),
      timeZone: z.string().trim().min(1).optional(),
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

export function getBranchDefaultValues(branch?: Branch | null): BranchFormValues {
  return {
    name: branch?.name ?? "",
    code: branch?.code ?? "",
    timeZone: branch?.timeZone ?? "America/Guayaquil",
    active: branch?.active ?? true,
  };
}

export function toBranchCreatePayload(values: BranchFormValues): CreateBranchRequest {
  return {
    name: values.name.trim(),
    code: normalizeBranchCode(values.code),
    timeZone: values.timeZone.trim(),
  };
}

export function toBranchPatchPayload(
  values: BranchFormValues,
  initialBranch: Branch,
  messages: Pick<BranchSchemaMessages, "emptyPatch">,
): PatchBranchRequest {
  const nextName = values.name.trim();
  const nextTimeZone = values.timeZone.trim();

  const patch = {
    ...(nextName !== initialBranch.name ? { name: nextName } : {}),
    ...(nextTimeZone !== initialBranch.timeZone ? { timeZone: nextTimeZone } : {}),
    ...(values.active !== initialBranch.active ? { active: values.active } : {}),
  };

  return createBranchPatchSchema(messages).parse(patch);
}
