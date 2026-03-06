"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ZodError } from "zod";
import { type ClientPayload } from "@/lib/backend";
import { apiFetch } from "@/lib/api-client";
import { toProblemToast } from "@/lib/forms";
import {
  createClientFormSchema,
  getClientDefaultValues,
  toClientCreatePayload,
  toClientPatchPayload,
  type ClientFormValues,
} from "@/lib/schemas/client.schema";
import { EntitySheet } from "@/components/forms/entity-sheet";
import { ProblemBanner } from "@/components/ui/problem-banner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { readApiResponse, type ProblemBannerState } from "@/lib/problem";

type ClientFormProps = {
  mode: "create" | "edit";
  open: boolean;
  initialClient?: ClientPayload | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void> | void;
};

export function ClientForm({
  mode,
  open,
  initialClient,
  onOpenChange,
  onSuccess,
}: ClientFormProps) {
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tClients = useTranslations("clients");
  const tForm = useTranslations("clients.form");
  const [submitProblem, setSubmitProblem] = useState<ProblemBannerState | null>(null);

  const schema = useMemo(
    () =>
      createClientFormSchema({
        fullNameValidation: tForm("fullNameValidation"),
        emailValidation: tForm("emailValidation"),
        emptyPatch: tForm("emptyPatch"),
      }),
    [tForm],
  );
  const defaultValues = useMemo(() => getClientDefaultValues(initialClient), [initialClient]);
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  async function handleValidSubmit(values: ClientFormValues) {
    setSubmitProblem(null);

    try {
      const isEditing = mode === "edit" && initialClient;
      const target = isEditing ? `/api/clients/${initialClient.id}` : "/api/clients";
      const method = isEditing ? "PATCH" : "POST";
      const payload = isEditing
        ? toClientPatchPayload(values, initialClient, {
            emptyPatch: tForm("emptyPatch"),
          })
        : toClientCreatePayload(values);

      const response = await apiFetch(target, {
        method,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await readApiResponse<ClientPayload>(response);

      if (!response.ok) {
        const toastProblem = toProblemToast(
          result.problem,
          {
            generic: isEditing ? tClients("updateFailed") : tClients("createFailed"),
            unauthorized: tErrors("unauthorized"),
            forbidden: tErrors("forbidden"),
            branchRequired: tErrors("branchRequired"),
            branchForbidden: tErrors("branchForbidden"),
            conflict: tErrors("conflict"),
            validation: tErrors("validation"),
          },
          isEditing ? tClients("updateFailed") : tClients("createFailed"),
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

      toast.success(mode === "edit" ? tClients("updateSuccess") : tClients("createSuccess"));
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
        submitTestId="client-submit"
        submitting={form.formState.isSubmitting}
        title={mode === "edit" ? tForm("editTitle") : tForm("newTitle")}
      >
        <div className="space-y-6">
          {submitProblem ? <ProblemBanner problem={submitProblem} /> : null}

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tForm("fullName")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="h-11 rounded-xl"
                    data-testid="client-fullName"
                    placeholder={tForm("fullNamePlaceholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm("phone")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-11 rounded-xl"
                      data-testid="client-phone"
                      placeholder={tForm("phonePlaceholder")}
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
                  <FormLabel>{tForm("email")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-11 rounded-xl"
                      data-testid="client-email"
                      placeholder={tForm("emailPlaceholder")}
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tForm("notes")}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="min-h-32 rounded-xl"
                    data-testid="client-notes"
                    placeholder={tForm("notesPlaceholder")}
                    rows={5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {mode === "edit" ? (
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <FormLabel>{tForm("clientActive")}</FormLabel>
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
