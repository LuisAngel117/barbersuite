import { z } from "zod";
import { normalizeMoneyInput, normalizeOptionalString } from "@/lib/forms";
import type { CreateReceiptRequest, PaymentMethod } from "@/lib/types/receipts";

const PAYMENT_METHODS = ["cash", "card", "transfer", "other"] as const;

type ReceiptSchemaMessages = {
  clientValidation: string;
  itemDescriptionValidation: string;
  quantityValidation: string;
  unitPriceValidation: string;
  itemsValidation: string;
  paymentsValidation: string;
  paymentMethodValidation: string;
  paymentAmountValidation: string;
  discountValidation: string;
  taxValidation: string;
  paymentMismatch: string;
  reasonValidation: string;
};

const uuidField = (message: string) =>
  z.string().refine((value) => !value || z.string().uuid().safeParse(value).success, message);

const moneyField = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => {
      try {
        normalizeMoneyInput(value);
        return true;
      } catch {
        return false;
      }
    }, message);

function moneyToCents(value: string | number) {
  return Math.round(Number(normalizeMoneyInput(value)) * 100);
}

function safeMoneyToCents(value: string | number) {
  try {
    return moneyToCents(value);
  } catch {
    return 0;
  }
}

function centsToMoneyString(cents: number) {
  return (cents / 100).toFixed(2);
}

export const receiptStatuses = ["issued", "voided"] as const;
export const paymentMethods = PAYMENT_METHODS;

export function createReceiptFormSchema(messages: ReceiptSchemaMessages) {
  return z.object({
    clientId: uuidField(messages.clientValidation),
    notes: z.string(),
    discount: moneyField(messages.discountValidation),
    tax: moneyField(messages.taxValidation),
    items: z.array(
      z.object({
        serviceId: uuidField(messages.itemDescriptionValidation),
        description: z.string().trim().min(1, messages.itemDescriptionValidation),
        quantity: z
          .number({ error: messages.quantityValidation })
          .int(messages.quantityValidation)
          .min(1, messages.quantityValidation),
        unitPrice: moneyField(messages.unitPriceValidation),
      }),
    ).min(1, messages.itemsValidation),
    payments: z.array(
      z.object({
        method: z.enum(PAYMENT_METHODS, {
          error: messages.paymentMethodValidation,
        }),
        amount: moneyField(messages.paymentAmountValidation),
        reference: z.string(),
      }),
    ).min(1, messages.paymentsValidation),
  }).superRefine((value, context) => {
    const subtotalCents = value.items.reduce((sum, item) =>
      sum + item.quantity * safeMoneyToCents(item.unitPrice), 0);
    const discountCents = safeMoneyToCents(value.discount);
    const taxCents = safeMoneyToCents(value.tax);
    const totalCents = subtotalCents - discountCents + taxCents;
    const paymentsCents = value.payments.reduce((sum, payment) =>
      sum + safeMoneyToCents(payment.amount), 0);

    if (discountCents > subtotalCents) {
      context.addIssue({
        code: "custom",
        message: messages.discountValidation,
        path: ["discount"],
      });
    }

    if (totalCents < 0) {
      context.addIssue({
        code: "custom",
        message: messages.taxValidation,
        path: ["tax"],
      });
    }

    if (paymentsCents !== totalCents) {
      context.addIssue({
        code: "custom",
        message: messages.paymentMismatch,
        path: ["root"],
      });
    }
  });
}

export function createVoidReceiptFormSchema(messages: Pick<ReceiptSchemaMessages, "reasonValidation">) {
  return z.object({
    reason: z.string().trim().min(2, messages.reasonValidation),
  });
}

export type ReceiptFormValues = z.infer<ReturnType<typeof createReceiptFormSchema>>;
export type VoidReceiptFormValues = z.infer<ReturnType<typeof createVoidReceiptFormSchema>>;

export function getReceiptDefaultValues(): ReceiptFormValues {
  return {
    clientId: "",
    notes: "",
    discount: "0.00",
    tax: "0.00",
    items: [
      {
        serviceId: "",
        description: "",
        quantity: 1,
        unitPrice: "0.00",
      },
    ],
    payments: [
      {
        method: "cash",
        amount: "0.00",
        reference: "",
      },
    ],
  };
}

export function calculateReceiptTotals(values: Pick<ReceiptFormValues, "items" | "discount" | "tax" | "payments">) {
  const subtotalCents = values.items.reduce((sum, item) =>
    sum + item.quantity * safeMoneyToCents(item.unitPrice), 0);
  const discountCents = safeMoneyToCents(values.discount);
  const taxCents = safeMoneyToCents(values.tax);
  const totalCents = Math.max(subtotalCents - discountCents + taxCents, 0);
  const paymentsCents = values.payments.reduce((sum, payment) =>
    sum + safeMoneyToCents(payment.amount), 0);

  return {
    subtotal: centsToMoneyString(subtotalCents),
    discount: centsToMoneyString(discountCents),
    tax: centsToMoneyString(taxCents),
    total: centsToMoneyString(totalCents),
    subtotalCents,
    discountCents,
    taxCents,
    totalCents,
    paymentsCents,
    paymentsMatch: paymentsCents === totalCents,
  };
}

export function toReceiptCreatePayload(values: ReceiptFormValues): CreateReceiptRequest {
  return {
    clientId: normalizeOptionalString(values.clientId),
    notes: normalizeOptionalString(values.notes),
    discount: Number(normalizeMoneyInput(values.discount)),
    tax: Number(normalizeMoneyInput(values.tax)),
    items: values.items.map((item) => ({
      serviceId: normalizeOptionalString(item.serviceId),
      description: item.description.trim(),
      quantity: item.quantity,
      unitPrice: Number(normalizeMoneyInput(item.unitPrice)),
    })),
    payments: values.payments.map((payment) => ({
      method: payment.method as PaymentMethod,
      amount: Number(normalizeMoneyInput(payment.amount)),
      reference: normalizeOptionalString(payment.reference),
    })),
  };
}
