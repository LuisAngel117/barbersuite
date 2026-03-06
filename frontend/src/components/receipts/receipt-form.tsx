"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ServicePayload } from "@/lib/backend";
import { formatMoneyUSD, formatMinutes } from "@/lib/format";
import { normalizeMoneyInput, toProblemToast } from "@/lib/forms";
import {
  calculateReceiptTotals,
  createReceiptFormSchema,
  getReceiptDefaultValues,
  toReceiptCreatePayload,
  type ReceiptFormValues,
} from "@/lib/schemas/receipt.schema";
import { type ProblemBannerState } from "@/lib/problem";
import type { Receipt } from "@/lib/types/receipts";
import { createReceipt } from "@/components/receipts/receipt-api";
import { ClientPicker } from "@/components/appointments/client-picker";
import { EntitySheet } from "@/components/forms/entity-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ProblemBanner } from "@/components/ui/problem-banner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ReceiptFormProps = {
  open: boolean;
  services: ServicePayload[];
  isServicesLoading?: boolean;
  serviceCatalogError?: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: (receipt: Receipt) => Promise<void> | void;
};

function sortServicesCatalog(services: ServicePayload[]) {
  return [...services].sort((left, right) =>
    left.name.localeCompare(right.name, "es", { sensitivity: "base" }),
  );
}

export function ReceiptForm({
  open,
  services,
  isServicesLoading = false,
  serviceCatalogError = null,
  onOpenChange,
  onSuccess,
}: ReceiptFormProps) {
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tReceipts = useTranslations("receipts");
  const tToasts = useTranslations("toasts");
  const [submitProblem, setSubmitProblem] = useState<ProblemBannerState | null>(null);

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(
      createReceiptFormSchema({
        clientValidation: tReceipts("errors.clientValidation"),
        itemDescriptionValidation: tReceipts("errors.itemDescriptionValidation"),
        quantityValidation: tReceipts("errors.quantityValidation"),
        unitPriceValidation: tReceipts("errors.unitPriceValidation"),
        itemsValidation: tReceipts("errors.itemsValidation"),
        paymentsValidation: tReceipts("errors.paymentsValidation"),
        paymentMethodValidation: tReceipts("errors.paymentMethodValidation"),
        paymentAmountValidation: tReceipts("errors.paymentAmountValidation"),
        discountValidation: tReceipts("errors.discountValidation"),
        taxValidation: tReceipts("errors.taxValidation"),
        paymentMismatch: tReceipts("errors.paymentMismatch"),
        reasonValidation: tReceipts("errors.reasonValidation"),
      }),
    ),
    defaultValues: getReceiptDefaultValues(),
  });

  const itemsFieldArray = useFieldArray({
    control: form.control,
    name: "items",
  });
  const paymentsFieldArray = useFieldArray({
    control: form.control,
    name: "payments",
  });

  const items = useWatch({
    control: form.control,
    name: "items",
  });
  const payments = useWatch({
    control: form.control,
    name: "payments",
  });
  const discount = useWatch({
    control: form.control,
    name: "discount",
  }) ?? "0.00";
  const tax = useWatch({
    control: form.control,
    name: "tax",
  }) ?? "0.00";

  const totals = useMemo(
    () => calculateReceiptTotals({
      items: items ?? [],
      payments: payments ?? [],
      discount,
      tax,
    }),
    [discount, items, payments, tax],
  );
  const sortedServices = useMemo(() => sortServicesCatalog(services), [services]);

  function setItemService(index: number, nextValue: string) {
    const serviceId = nextValue === "custom" ? "" : nextValue;
    form.setValue(`items.${index}.serviceId`, serviceId, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const service = sortedServices.find((item) => item.id === serviceId);
    if (!service) {
      return;
    }

    form.setValue(`items.${index}.description`, service.name, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue(`items.${index}.unitPrice`, normalizeMoneyInput(service.price), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  async function handleValidSubmit(values: ReceiptFormValues) {
    setSubmitProblem(null);

    const response = await createReceipt(toReceiptCreatePayload(values));
    if (!response.data) {
      const toastProblem = toProblemToast(
        response.problem,
        {
          generic: tReceipts("errors.createFailed"),
          unauthorized: tErrors("unauthorized"),
          forbidden: tErrors("forbidden"),
          branchRequired: tErrors("branchRequired"),
          branchForbidden: tErrors("branchForbidden"),
          conflict: tReceipts("errors.conflict"),
          validation: tErrors("validation"),
        },
        tReceipts("errors.createFailed"),
      );

      const nextProblem = {
        title: toastProblem.title,
        detail: toastProblem.description,
        code: response.problem?.code,
      } satisfies ProblemBannerState;
      setSubmitProblem(nextProblem);
      toast.error(toastProblem.title, {
        description: toastProblem.description,
      });
      return;
    }

    toast.success(tToasts("receiptCreated"), {
      description: response.data.number,
    });
    onOpenChange(false);
    await onSuccess(response.data);
  }

  function handleInvalidSubmit() {
    const rootMessage =
      typeof form.formState.errors.root?.message === "string"
        ? form.formState.errors.root.message
        : tErrors("validation");

    setSubmitProblem({
      title: tReceipts("errors.validationTitle"),
      detail: rootMessage,
      code: "VALIDATION_ERROR",
    });
  }

  return (
    <Form {...form}>
      <EntitySheet
        cancelLabel={tCommon("cancel")}
        description={tReceipts("createDescription")}
        onCancel={() => onOpenChange(false)}
        onOpenChange={onOpenChange}
        onSubmit={form.handleSubmit(handleValidSubmit, handleInvalidSubmit)}
        open={open}
        submitLabel={form.formState.isSubmitting ? tReceipts("creating") : tReceipts("newSale")}
        submitTestId="receipt-submit"
        submitting={form.formState.isSubmitting}
        title={tReceipts("newSale")}
      >
        <div className="space-y-6">
          {submitProblem ? <ProblemBanner problem={submitProblem} /> : null}

          <section className="space-y-4 rounded-[1.5rem] border border-border/70 bg-card/80 p-5">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold tracking-tight">{tReceipts("fields.client")}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{tReceipts("clientOptional")}</p>
            </div>
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ClientPicker
                      messages={{
                        placeholder: tReceipts("clientPicker.placeholder"),
                        hint: tReceipts("clientPicker.hint"),
                        empty: tReceipts("clientPicker.empty"),
                        noContact: tReceipts("clientPicker.noContact"),
                        change: tReceipts("clientPicker.change"),
                        searchFailed: tReceipts("clientPicker.searchFailed"),
                        loadFailed: tReceipts("clientPicker.loadFailed"),
                      }}
                      onChange={field.onChange}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className="space-y-4 rounded-[1.5rem] border border-border/70 bg-card/80 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold tracking-tight">{tReceipts("fields.items")}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{tReceipts("itemsDescription")}</p>
              </div>
              <Button
                className="rounded-xl"
                data-testid="receipt-add-item"
                onClick={() => itemsFieldArray.append({
                  serviceId: "",
                  description: "",
                  quantity: 1,
                  unitPrice: "0.00",
                })}
                type="button"
                variant="outline"
              >
                <Plus className="size-4" />
                {tReceipts("addItem")}
              </Button>
            </div>

            {serviceCatalogError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {serviceCatalogError}
              </div>
            ) : null}

            <div className="space-y-4">
              {itemsFieldArray.fields.map((field, index) => (
                <div className="space-y-4 rounded-[1.25rem] border border-border/70 bg-background/80 p-4" key={field.id}>
                  <div className="flex items-center justify-between gap-3">
                    <Badge className="rounded-full" variant="outline">
                      {tReceipts("itemLabel", { index: index + 1 })}
                    </Badge>
                    <Button
                      className="rounded-xl"
                      data-testid={`receipt-remove-item-${index}`}
                      disabled={itemsFieldArray.fields.length === 1}
                      onClick={() => itemsFieldArray.remove(index)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                    <div className="space-y-2">
                      <FormLabel>{tReceipts("fields.service")}</FormLabel>
                      <Select
                        disabled={isServicesLoading}
                        onValueChange={(value) => setItemService(index, value)}
                        value={items[index]?.serviceId || "custom"}
                      >
                        <SelectTrigger className="h-11 rounded-xl" data-testid={`receipt-item-service-${index}`}>
                          <SelectValue placeholder={tReceipts("customItem")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">{tReceipts("customItem")}</SelectItem>
                          {sortedServices.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} · {formatMinutes(service.durationMinutes)} · {formatMoneyUSD(service.price, locale === "en" ? "en-US" : "es-EC")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field: itemField }) => (
                        <FormItem>
                          <FormLabel>{tReceipts("fields.description")}</FormLabel>
                          <FormControl>
                            <Input
                              {...itemField}
                              className="h-11 rounded-xl"
                              data-testid={`receipt-item-description-${index}`}
                              placeholder={tReceipts("fields.descriptionPlaceholder")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field: itemField }) => (
                        <FormItem>
                          <FormLabel>{tReceipts("fields.quantity")}</FormLabel>
                          <FormControl>
                            <Input
                              className="h-11 rounded-xl"
                              data-testid={`receipt-item-quantity-${index}`}
                              inputMode="numeric"
                              min={1}
                              onChange={(event) => {
                                const value = event.target.value.trim();
                                itemField.onChange(value ? Number(value) : 1);
                              }}
                              type="number"
                              value={itemField.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field: itemField }) => (
                        <FormItem>
                          <FormLabel>{tReceipts("fields.unitPrice")}</FormLabel>
                          <FormControl>
                            <Input
                              {...itemField}
                              className="h-11 rounded-xl"
                              data-testid={`receipt-item-unitPrice-${index}`}
                              inputMode="decimal"
                              placeholder="0.00"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded-[1.5rem] border border-border/70 bg-card/80 p-5">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold tracking-tight">{tReceipts("fields.payments")}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{tReceipts("paymentsDescription")}</p>
            </div>

            <div className="space-y-4">
              {paymentsFieldArray.fields.map((field, index) => (
                <div className="space-y-4 rounded-[1.25rem] border border-border/70 bg-background/80 p-4" key={field.id}>
                  <div className="flex items-center justify-between gap-3">
                    <Badge className="rounded-full" variant="outline">
                      {tReceipts("paymentLabel", { index: index + 1 })}
                    </Badge>
                    <Button
                      className="rounded-xl"
                      data-testid={`receipt-remove-payment-${index}`}
                      disabled={paymentsFieldArray.fields.length === 1}
                      onClick={() => paymentsFieldArray.remove(index)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[220px_1fr_1fr]">
                    <FormField
                      control={form.control}
                      name={`payments.${index}.method`}
                      render={({ field: paymentField }) => (
                        <FormItem>
                          <FormLabel>{tReceipts("fields.method")}</FormLabel>
                          <Select onValueChange={paymentField.onChange} value={paymentField.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 rounded-xl" data-testid={`receipt-payment-method-${index}`}>
                                <SelectValue placeholder={tReceipts("fields.method")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">{tReceipts("paymentMethods.cash")}</SelectItem>
                              <SelectItem value="card">{tReceipts("paymentMethods.card")}</SelectItem>
                              <SelectItem value="transfer">{tReceipts("paymentMethods.transfer")}</SelectItem>
                              <SelectItem value="other">{tReceipts("paymentMethods.other")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`payments.${index}.amount`}
                      render={({ field: paymentField }) => (
                        <FormItem>
                          <FormLabel>{tReceipts("fields.amount")}</FormLabel>
                          <FormControl>
                            <Input
                              {...paymentField}
                              className="h-11 rounded-xl"
                              data-testid={`receipt-payment-amount-${index}`}
                              inputMode="decimal"
                              placeholder="0.00"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`payments.${index}.reference`}
                      render={({ field: paymentField }) => (
                        <FormItem>
                          <FormLabel>{tReceipts("fields.reference")}</FormLabel>
                          <FormControl>
                            <Input
                              {...paymentField}
                              className="h-11 rounded-xl"
                              data-testid={`receipt-payment-reference-${index}`}
                              placeholder={tReceipts("fields.referencePlaceholder")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              className="rounded-xl"
              data-testid="receipt-add-payment"
              onClick={() => paymentsFieldArray.append({
                method: "cash",
                amount: "0.00",
                reference: "",
              })}
              type="button"
              variant="outline"
            >
              <Plus className="size-4" />
              {tReceipts("addPayment")}
            </Button>
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-card/80 p-5">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold tracking-tight">{tReceipts("fields.notes")}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{tReceipts("notesDescription")}</p>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-32 rounded-xl"
                        data-testid="receipt-notes"
                        placeholder={tReceipts("fields.notesPlaceholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-card/80 p-5">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold tracking-tight">{tReceipts("totalsTitle")}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{tReceipts("totalsDescription")}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tReceipts("fields.discount")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-11 rounded-xl"
                          data-testid="receipt-discount"
                          inputMode="decimal"
                          placeholder="0.00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tReceipts("fields.tax")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-11 rounded-xl"
                          data-testid="receipt-tax"
                          inputMode="decimal"
                          placeholder="0.00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{tReceipts("fields.subtotal")}</span>
                  <span>{formatMoneyUSD(totals.subtotal, locale === "en" ? "en-US" : "es-EC")}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{tReceipts("fields.discount")}</span>
                  <span>{formatMoneyUSD(totals.discount, locale === "en" ? "en-US" : "es-EC")}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{tReceipts("fields.tax")}</span>
                  <span>{formatMoneyUSD(totals.tax, locale === "en" ? "en-US" : "es-EC")}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border/70 pt-3 text-base font-semibold">
                  <span>{tReceipts("fields.total")}</span>
                  <span>{formatMoneyUSD(totals.total, locale === "en" ? "en-US" : "es-EC")}</span>
                </div>
              </div>

              {!totals.paymentsMatch ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {tReceipts("errors.paymentMismatch")}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </EntitySheet>
    </Form>
  );
}
