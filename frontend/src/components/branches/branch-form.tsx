"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { toProblemToast } from "@/lib/forms";
import {
  createBranchFormSchema,
  getBranchDefaultValues,
  normalizeBranchCode,
  toBranchCreatePayload,
  toBranchPatchPayload,
  type BranchFormValues,
} from "@/lib/schemas/branch.schema";
import { readApiResponse, type ProblemBannerState } from "@/lib/problem";
import type { Branch } from "@/lib/types/branches";
import { EntitySheet } from "@/components/forms/entity-sheet";
import { ProblemBanner } from "@/components/ui/problem-banner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type BranchFormProps = {
  mode: "create" | "edit";
  open: boolean;
  initialBranch?: Branch | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void> | void;
};

export function BranchForm({
  mode,
  open,
  initialBranch,
  onOpenChange,
  onSuccess,
}: BranchFormProps) {
  const tBranches = useTranslations("branches");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const [submitProblem, setSubmitProblem] = useState<ProblemBannerState | null>(null);

  const schema = useMemo(
    () =>
      createBranchFormSchema({
        nameValidation: tBranches("form.nameValidation"),
        codeValidation: tBranches("form.codeValidation"),
        timeZoneValidation: tBranches("form.timeZoneValidation"),
        emptyPatch: tBranches("form.emptyPatch"),
      }),
    [tBranches],
  );

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getBranchDefaultValues(initialBranch),
  });

  async function handleValidSubmit(values: BranchFormValues) {
    setSubmitProblem(null);

    const isEditing = mode === "edit" && initialBranch;
    const target = isEditing ? `/api/branches/${initialBranch.id}` : "/api/branches";
    const method = isEditing ? "PATCH" : "POST";
    const payload = isEditing
      ? toBranchPatchPayload(values, initialBranch, {
          emptyPatch: tBranches("form.emptyPatch"),
        })
      : toBranchCreatePayload(values);

    const response = await apiFetch(target, {
      method,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await readApiResponse<Branch>(response);

    if (!response.ok) {
      const toastProblem = toProblemToast(
        result.problem,
        {
          generic: isEditing ? tBranches("updateFailed") : tBranches("createFailed"),
          unauthorized: tErrors("unauthorized"),
          forbidden: tErrors("forbidden"),
          branchRequired: tErrors("branchRequired"),
          branchForbidden: tErrors("branchForbidden"),
          conflict: tBranches("duplicateCode"),
          validation: tErrors("validation"),
        },
        isEditing ? tBranches("updateFailed") : tBranches("createFailed"),
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

    toast.success(mode === "edit" ? tBranches("toasts.updated") : tBranches("toasts.created"));
    onOpenChange(false);
    await onSuccess();
  }

  return (
    <Form {...form}>
      <EntitySheet
        cancelLabel={tCommon("cancel")}
        description={tBranches("form.description")}
        onCancel={() => onOpenChange(false)}
        onOpenChange={onOpenChange}
        onSubmit={form.handleSubmit(handleValidSubmit)}
        open={open}
        submitLabel={
          form.formState.isSubmitting
            ? mode === "edit"
              ? tBranches("form.saving")
              : tBranches("form.creating")
            : mode === "edit"
              ? tBranches("form.update")
              : tBranches("form.create")
        }
        submitTestId="branch-submit"
        submitting={form.formState.isSubmitting}
        title={mode === "edit" ? tBranches("editBranch") : tBranches("newBranch")}
      >
        <div className="space-y-6">
          {submitProblem ? <ProblemBanner problem={submitProblem} /> : null}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tBranches("fields.name")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="h-11 rounded-xl"
                    data-testid="branch-name"
                    placeholder={tBranches("form.namePlaceholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tBranches("fields.code")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-11 rounded-xl uppercase"
                      data-testid="branch-code"
                      disabled={mode === "edit"}
                      onBlur={(event) => {
                        field.onBlur();
                        form.setValue("code", normalizeBranchCode(event.target.value), {
                          shouldDirty: mode !== "edit",
                          shouldValidate: true,
                        });
                      }}
                      placeholder={tBranches("form.codePlaceholder")}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    {mode === "edit" ? tBranches("form.codeLocked") : tBranches("form.codeHelp")}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeZone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tBranches("fields.timeZone")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-11 rounded-xl"
                      data-testid="branch-timeZone"
                      placeholder={tBranches("form.timeZonePlaceholder")}
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
                      <FormLabel>{tBranches("fields.active")}</FormLabel>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {tBranches("form.activeDescription")}
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
            <p className="text-sm leading-6 text-muted-foreground">
              {tBranches("form.newDefaultActive")}
            </p>
          )}
        </div>
      </EntitySheet>
    </Form>
  );
}
