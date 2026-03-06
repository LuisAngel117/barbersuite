import { z } from "zod";
import { normalizeOptionalString } from "@/lib/forms";
import type { BarberDetail, CreateBarberRequest, PatchBarberRequest } from "@/lib/types/staff";

type BarberSchemaMessages = {
  fullNameValidation: string;
  emailValidation: string;
  passwordValidation: string;
  branchesValidation: string;
  emptyPatch: string;
};

const uuidArraySchema = z.array(z.string().uuid());

export type BarberFormValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  branchIds: string[];
  serviceIds: string[];
  active: boolean;
};

export function createBarberCreateFormSchema(messages: BarberSchemaMessages) {
  return z.object({
    fullName: z.string().trim().min(2, messages.fullNameValidation),
    email: z.string().trim().email(messages.emailValidation),
    phone: z.string(),
    password: z.string().trim().min(8, messages.passwordValidation),
    branchIds: uuidArraySchema.min(1, messages.branchesValidation),
    serviceIds: uuidArraySchema,
    active: z.boolean(),
  });
}

export function createBarberEditFormSchema(messages: Omit<BarberSchemaMessages, "branchesValidation" | "emptyPatch">) {
  return z.object({
    fullName: z.string().trim().min(2, messages.fullNameValidation),
    email: z.string().trim().email(messages.emailValidation),
    phone: z.string(),
    password: z.string().trim().refine((value) => !value || value.length >= 8, messages.passwordValidation),
    branchIds: uuidArraySchema,
    serviceIds: uuidArraySchema,
    active: z.boolean(),
  });
}

export function createBarberPatchSchema(messages: Pick<BarberSchemaMessages, "emptyPatch">) {
  return z
    .object({
      fullName: z.string().trim().min(2).optional(),
      phone: z.string().optional(),
      active: z.boolean().optional(),
      branchIds: uuidArraySchema.optional(),
      serviceIds: uuidArraySchema.optional(),
      password: z.string().trim().min(8).optional(),
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

function normalizeIds(ids: string[]) {
  return [...new Set(ids)].sort((left, right) => left.localeCompare(right));
}

function sameIdSet(left: string[], right: string[]) {
  const normalizedLeft = normalizeIds(left);
  const normalizedRight = normalizeIds(right);
  return normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

export function getCreateBarberDefaultValues(defaultBranchIds: string[] = []): BarberFormValues {
  return {
    fullName: "",
    email: "",
    phone: "",
    password: "",
    branchIds: normalizeIds(defaultBranchIds),
    serviceIds: [],
    active: true,
  };
}

export function getEditBarberDefaultValues(barber: BarberDetail): BarberFormValues {
  return {
    fullName: barber.fullName,
    email: barber.email,
    phone: barber.phone ?? "",
    password: "",
    branchIds: normalizeIds(barber.branches.map((branch) => branch.id)),
    serviceIds: normalizeIds(barber.services.map((service) => service.id)),
    active: barber.active,
  };
}

export function toBarberCreatePayload(values: BarberFormValues): CreateBarberRequest {
  return {
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    phone: normalizeOptionalString(values.phone),
    password: values.password.trim(),
    branchIds: normalizeIds(values.branchIds),
    serviceIds: normalizeIds(values.serviceIds),
    active: values.active,
  };
}

export function toBarberPatchPayload(
  values: BarberFormValues,
  initialBarber: BarberDetail,
  messages: Pick<BarberSchemaMessages, "emptyPatch">,
): PatchBarberRequest {
  const nextFullName = values.fullName.trim();
  const nextPhone = normalizeOptionalString(values.phone);
  const nextPassword = normalizeOptionalString(values.password);
  const nextBranchIds = normalizeIds(values.branchIds);
  const nextServiceIds = normalizeIds(values.serviceIds);

  const initialBranchIds = initialBarber.branches.map((branch) => branch.id);
  const initialServiceIds = initialBarber.services.map((service) => service.id);

  const patch = {
    ...(nextFullName !== initialBarber.fullName ? { fullName: nextFullName } : {}),
    ...(nextPhone !== (initialBarber.phone ?? undefined) ? { phone: nextPhone } : {}),
    ...(values.active !== initialBarber.active ? { active: values.active } : {}),
    ...(!sameIdSet(nextBranchIds, initialBranchIds) ? { branchIds: nextBranchIds } : {}),
    ...(!sameIdSet(nextServiceIds, initialServiceIds) ? { serviceIds: nextServiceIds } : {}),
    ...(nextPassword ? { password: nextPassword } : {}),
  };

  return createBarberPatchSchema(messages).parse(patch);
}
