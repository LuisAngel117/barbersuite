"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ZodError } from "zod";
import { type ServicePayload } from "@/lib/backend";
import { apiFetch } from "@/lib/api-client";
import { normalizeMoneyInput, toProblemToast } from "@/lib/forms";
import {
  createServiceFormSchema,
  getServiceDefaultValues,
  toServiceCreatePayload,
  toServicePatchPayload,
  type ServiceFormValues,
} from "@/lib/schemas/service.schema";
import { EntitySheet } from "@/components/forms/entity-sheet";
import { ProblemBanner } from "@/components/ui/problem-banner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { readApiResponse, type ProblemBannerState } from "@/lib/problem";

type ServiceFormProps = {
  mode: "create" | "edit";
  open: boolean;
  initialService?: ServicePayload | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void> | void;
};

export function ServiceForm({
  mode,
  open,
  initialService,
  onOpenChange,
  onSuccess,
}: ServiceFormProps) {
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tServices = useTranslations("services");
  const tForm = useTranslations("services.form");
  const [submitProblem, setSubmitProblem] = useState<ProblemBannerState | null>(null);

  const schema = useMemo(
    () =>
      createServiceFormSchema({
        nameValidation: tForm("nameValidation"),
        durationValidation: tForm("durationValidation"),
        priceValidation: tForm("priceValidation"),
        emptyPatch: tForm("emptyPatch"),
      }),
    [tForm],
  );
  const defaultValues = useMemo(() => getServiceDefaultValues(initialService), [initialService]);
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  async function handleValidSubmit(values: ServiceFormValues) {
    setSubmitProblem(null);

    try {
      const isEditing = mode === "edit" && initialService;
      const target = isEditing ? `/api/services/${initialService.id}` : "/api/services";
      const method = isEditing ? "PATCH" : "POST";
      const payload = isEditing
        ? toServicePatchPayload(values, initialService, {
            emptyPatch: tForm("emptyPatch"),
          })
        : toServiceCreatePayload(values);

      const response = await apiFetch(target, {
        method,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await readApiResponse<ServicePayload>(response);

      if (!response.ok) {
        const toastProblem = toProblemToast(
          result.problem,
          {
            generic: isEditing ? tServices("updateFailed") : tServices("createFailed"),
            unauthorized: tErrors("unauthorized"),
            forbidden: tErrors("forbidden"),
            branchRequired: tErrors("branchRequired"),
            branchForbidden: tErrors("branchForbidden"),
            conflict: tServices("conflict"),
            validation: tErrors("validation"),
          },
          isEditing ? tServices("updateFailed") : tServices("createFailed"),
        );

        const nextProblem = {
          title: toastProblem.title,
          detail: toastProblem.description,
          code: result.problem?.code,
        };
        setSubmitProblem(nextProblem);
        toast.error(toastProblem.title, {
          description: toastProblem.description,
        });
        return;
      }

      toast.success(mode === "edit" ? tServices("updateSuccess") : tServices("createSuccess"));
      onOpenChange(false);
      await onSuccess();
    } catch (error) {
      if (error instanceof ZodError) {
        const nextProblem = {
          title: tForm("validationTitle"),
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

  return (
    <Form {...form}>
      <EntitySheet
        cancelLabel={tCommon("cancel")}
        description={tForm("description")}
        onCancel={() => onOpenChange(false)}
        onOpenChange={onOpenChange}
        onSubmit={form.handleSubmit(handleValidSubmit)}
        open={open}
        submitLabel={
          form.formState.isSubmitting
            ? mode === "edit"
              ? tForm("saving")
              : tForm("creating")
            : mode === "edit"
              ? tForm("update")
              : tForm("create")
        }
        submitTestId="services-submit"
        submitting={form.formState.isSubmitting}
        title={mode === "edit" ? tForm("editTitle") : tForm("newTitle")}
      >
        <div className="space-y-6">
          {submitProblem ? <ProblemBanner problem={submitProblem} /> : null}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tServices("name")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="h-11 rounded-xl"
                    data-testid="services-name"
                    placeholder={tForm("namePlaceholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tServices("durationMinutes")}</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 rounded-xl"
                      data-testid="services-duration"
                      inputMode="numeric"
                      max={480}
                      min={5}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                      type="number"
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tServices("price")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-11 rounded-xl"
                      data-testid="services-price"
                      inputMode="decimal"
                      onBlur={(event) => {
                        field.onBlur();
                        try {
                          form.setValue("price", normalizeMoneyInput(event.target.value), {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        } catch {
                          // Leave the raw value so the validation message remains visible.
                        }
                      }}
                      placeholder="10.00"
                      type="text"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {mode === "edit" ? (
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <FormLabel>{tForm("serviceActive")}</FormLabel>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {tForm("activeDescription")}
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">{tForm("newDefaultActive")}</p>
          )}
        </div>
      </EntitySheet>
    </Form>
  );
}
