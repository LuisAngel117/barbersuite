"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { MePayload, ServicePayload } from "@/lib/backend";
import type { ProblemBannerState } from "@/lib/problem";
import type { BarberDetail } from "@/lib/types/staff";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { normalizeOptionalString, toProblemToast } from "@/lib/forms";
import {
  createBarberCreateFormSchema,
  createBarberEditFormSchema,
  getCreateBarberDefaultValues,
  getEditBarberDefaultValues,
  toBarberCreatePayload,
  toBarberPatchPayload,
  type BarberFormValues,
} from "@/lib/schemas/barber.schema";
import { readApiResponse } from "@/lib/problem";
import { formatMoneyUSD, formatMinutes } from "@/lib/format";
import { EntitySheet } from "@/components/forms/entity-sheet";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ProblemBanner } from "@/components/ui/problem-banner";
import { Switch } from "@/components/ui/switch";

type BarberFormProps = {
  mode: "create" | "edit";
  open: boolean;
  initialBarber?: BarberDetail | null;
  branches: MePayload["branches"];
  services: ServicePayload[];
  defaultBranchIds?: string[];
  focusPassword?: boolean;
  isServicesLoading?: boolean;
  serviceCatalogError?: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void> | void;
};

function toggleSelection(values: string[], nextValue: string, checked: boolean) {
  const selection = new Set(values);
  if (checked) {
    selection.add(nextValue);
  } else {
    selection.delete(nextValue);
  }

  return [...selection].sort((left, right) => left.localeCompare(right));
}

export function BarberForm({
  mode,
  open,
  initialBarber,
  branches,
  services,
  defaultBranchIds = [],
  focusPassword = false,
  isServicesLoading = false,
  serviceCatalogError = null,
  onOpenChange,
  onSuccess,
}: BarberFormProps) {
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tStaff = useTranslations("staff");
  const [submitProblem, setSubmitProblem] = useState<ProblemBannerState | null>(null);

  const schema = useMemo(() => {
    const messages = {
      fullNameValidation: tStaff("form.fullNameValidation"),
      emailValidation: tStaff("form.emailValidation"),
      passwordValidation: tStaff("form.passwordValidation"),
      branchesValidation: tStaff("form.branchesValidation"),
      emptyPatch: tStaff("form.emptyPatch"),
    };

    return mode === "edit"
      ? createBarberEditFormSchema(messages)
      : createBarberCreateFormSchema(messages);
  }, [mode, tStaff]);

  const defaultValues = useMemo(
    () => mode === "edit" && initialBarber
      ? getEditBarberDefaultValues(initialBarber)
      : getCreateBarberDefaultValues(defaultBranchIds),
    [defaultBranchIds, initialBarber, mode],
  );

  const form = useForm<BarberFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (open && focusPassword) {
      window.setTimeout(() => form.setFocus("password"), 0);
    }
  }, [focusPassword, form, open]);

  async function handleValidSubmit(values: BarberFormValues) {
    setSubmitProblem(null);

    const isEditing = mode === "edit" && initialBarber;
    const target = isEditing ? `/api/staff/barbers/${initialBarber.id}` : "/api/staff/barbers";
    const method = isEditing ? "PATCH" : "POST";
    const payload = isEditing
      ? toBarberPatchPayload(values, initialBarber, {
          emptyPatch: tStaff("form.emptyPatch"),
        })
      : toBarberCreatePayload(values);

    const response = await apiFetch(target, {
      method,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await readApiResponse<BarberDetail>(response);

    if (!response.ok) {
      const toastProblem = toProblemToast(
        result.problem,
        {
          generic: isEditing ? tStaff("toasts.updateError") : tStaff("toasts.createError"),
          unauthorized: tErrors("unauthorized"),
          forbidden: tErrors("forbidden"),
          branchRequired: tErrors("branchRequired"),
          branchForbidden: tErrors("branchForbidden"),
          conflict: tStaff("toasts.conflictEmail"),
          validation: tErrors("validation"),
        },
        isEditing ? tStaff("toasts.updateError") : tStaff("toasts.createError"),
      );

      const nextProblem = {
        title: toastProblem.title,
        detail: toastProblem.description,
        code: result.problem?.code,
      } satisfies ProblemBannerState;
      setSubmitProblem(nextProblem);
      toast.error(toastProblem.title, {
        description: toastProblem.description,
      });
      return;
    }

    const passwordWasChanged = Boolean(isEditing && normalizeOptionalString(values.password));
    toast.success(
      passwordWasChanged
        ? tStaff("toasts.passwordReset")
        : mode === "edit"
          ? tStaff("toasts.updated")
          : tStaff("toasts.created"),
    );
    onOpenChange(false);
    await onSuccess();
  }

  return (
    <Form {...form}>
      <EntitySheet
        cancelLabel={tCommon("cancel")}
        description={mode === "edit" ? tStaff("form.editDescription") : tStaff("form.createDescription")}
        onCancel={() => onOpenChange(false)}
        onOpenChange={onOpenChange}
        onSubmit={form.handleSubmit(handleValidSubmit)}
        open={open}
        submitLabel={
          form.formState.isSubmitting
            ? mode === "edit"
              ? tStaff("form.saving")
              : tStaff("form.creating")
            : mode === "edit"
              ? tStaff("form.update")
              : tStaff("form.create")
        }
        submitTestId="barber-submit"
        submitting={form.formState.isSubmitting}
        title={mode === "edit" ? tStaff("editBarber") : tStaff("newBarber")}
      >
        <div className="space-y-6">
          {submitProblem ? <ProblemBanner problem={submitProblem} /> : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{tStaff("fields.fullName")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-11 rounded-xl"
                      data-testid="barber-fullName"
                      placeholder={tStaff("form.fullNamePlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tStaff("fields.email")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-11 rounded-xl"
                      data-testid="barber-email"
                      disabled={mode === "edit"}
                      placeholder="barber@example.com"
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tStaff("fields.phone")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-11 rounded-xl"
                      data-testid="barber-phone"
                      placeholder={tStaff("form.phonePlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{tStaff("fields.password")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-11 rounded-xl"
                      data-testid="barber-password"
                      placeholder={mode === "edit" ? tStaff("form.passwordOptionalPlaceholder") : "NewPass123!"}
                      type="password"
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    {mode === "edit" ? tStaff("form.passwordOptionalHelp") : tStaff("form.passwordCreateHelp")}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <FormLabel>{tStaff("fields.active")}</FormLabel>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {tStaff("form.activeDescription")}
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

          <FormField
            control={form.control}
            name="branchIds"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <div className="space-y-1">
                  <FormLabel>{tStaff("fields.branches")}</FormLabel>
                  <p className="text-sm leading-6 text-muted-foreground">{tStaff("form.branchesHelp")}</p>
                </div>
                <div className="grid gap-3">
                  {branches.map((branch) => {
                    const checked = field.value.includes(branch.id);
                    return (
                      <label
                        className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 transition hover:border-brand/35 hover:bg-brand-muted/35"
                        data-testid={`barber-branch-${branch.id}`}
                        key={branch.id}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(nextChecked) => {
                            field.onChange(toggleSelection(field.value, branch.id, nextChecked === true));
                          }}
                        />
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium tracking-tight">{branch.name}</span>
                            <Badge className="rounded-full" variant="outline">
                              {branch.code}
                            </Badge>
                            {!branch.active ? (
                              <Badge className="rounded-full" variant="secondary">
                                {tStaff("inactive")}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground">{branch.timeZone}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serviceIds"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <div className="space-y-1">
                  <FormLabel>{tStaff("fields.services")}</FormLabel>
                  <p className="text-sm leading-6 text-muted-foreground">{tStaff("form.servicesHelp")}</p>
                </div>
                {serviceCatalogError ? (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {serviceCatalogError}
                  </div>
                ) : null}
                {isServicesLoading ? (
                  <div className="rounded-2xl border border-dashed border-border/70 px-4 py-5 text-sm text-muted-foreground">
                    {tCommon("loading")}
                  </div>
                ) : services.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 px-4 py-5 text-sm text-muted-foreground">
                    {tStaff("form.noServicesAvailable")}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {services.map((service) => {
                      const checked = field.value.includes(service.id);
                      return (
                        <label
                          className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 transition hover:border-brand/35 hover:bg-brand-muted/35"
                          data-testid={`barber-service-${service.id}`}
                          key={service.id}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(nextChecked) => {
                              field.onChange(toggleSelection(field.value, service.id, nextChecked === true));
                            }}
                          />
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium tracking-tight">{service.name}</span>
                              {!service.active ? (
                                <Badge className="rounded-full" variant="secondary">
                                  {tStaff("inactive")}
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatMinutes(service.durationMinutes)} · {formatMoneyUSD(service.price)}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </EntitySheet>
    </Form>
  );
}
