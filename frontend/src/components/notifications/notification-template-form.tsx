"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { toProblemToast } from "@/lib/forms";
import { type ProblemBannerState } from "@/lib/problem";
import {
  createNotificationTemplateFormSchema,
  getNotificationTemplateDefaultValues,
  toNotificationTemplatePayload,
  type NotificationTemplateFormValues,
} from "@/lib/schemas/notification-template.schema";
import type { NotificationEmailTemplate } from "@/lib/types/notification-templates";
import { updateNotificationEmailTemplate } from "@/components/notifications/notifications-api";
import { EntitySheet } from "@/components/forms/entity-sheet";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ProblemBanner } from "@/components/ui/problem-banner";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type NotificationTemplateFormProps = {
  open: boolean;
  template: NotificationEmailTemplate | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void> | void;
};

const TEMPLATE_VARIABLES = [
  "branchCode",
  "branchName",
  "clientName",
  "serviceName",
  "barberName",
  "startAtLocal",
  "endAtLocal",
  "appointmentDate",
  "appointmentTime",
] as const;

const TEMPLATE_PREVIEW_VALUES: Record<(typeof TEMPLATE_VARIABLES)[number], string> = {
  branchCode: "BR-UIO",
  branchName: "Sucursal Centro",
  clientName: "Juan Perez",
  serviceName: "Corte clasico",
  barberName: "Carlos",
  startAtLocal: "2026-03-06 10:00",
  endAtLocal: "2026-03-06 10:30",
  appointmentDate: "2026-03-06",
  appointmentTime: "10:00",
};

function renderTemplatePreview(template: string | null | undefined) {
  if (!template?.trim()) {
    return "N/A";
  }

  return template.replace(/\$\{([^}]+)\}/g, (_match, key: string) => {
    return TEMPLATE_PREVIEW_VALUES[key as keyof typeof TEMPLATE_PREVIEW_VALUES] ?? "";
  });
}

export function NotificationTemplateForm({
  open,
  template,
  onOpenChange,
  onSuccess,
}: NotificationTemplateFormProps) {
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tNotifications = useTranslations("notifications");
  const tToasts = useTranslations("toasts");
  const [submitProblem, setSubmitProblem] = useState<ProblemBannerState | null>(null);

  const schema = useMemo(
    () =>
      createNotificationTemplateFormSchema({
        subjectValidation: tNotifications("validation.subject"),
        bodyRequired: tNotifications("templates.validation.bodyRequired"),
      }),
    [tNotifications],
  );

  const form = useForm<NotificationTemplateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: template
      ? getNotificationTemplateDefaultValues(template)
      : {
          enabled: true,
          subjectTemplate: "",
          bodyTextTemplate: "",
          bodyHtmlTemplate: "",
        },
  });

  useEffect(() => {
    if (!template) {
      return;
    }

    form.reset(getNotificationTemplateDefaultValues(template));
  }, [form, template]);

  const previewSubject = useWatch({
    control: form.control,
    name: "subjectTemplate",
  });
  const previewBodyText = useWatch({
    control: form.control,
    name: "bodyTextTemplate",
  });
  const previewBodyHtml = useWatch({
    control: form.control,
    name: "bodyHtmlTemplate",
  });
  const enabled = useWatch({
    control: form.control,
    name: "enabled",
  });

  async function handleValidSubmit(values: NotificationTemplateFormValues) {
    if (!template) {
      return;
    }

    setSubmitProblem(null);

    const response = await updateNotificationEmailTemplate(
      template.kind,
      toNotificationTemplatePayload(values),
    );

    if (!response.data) {
      const toastProblem = toProblemToast(
        response.problem,
        {
          generic: tNotifications("templates.saveFailed"),
          unauthorized: tErrors("unauthorized"),
          forbidden: tErrors("forbidden"),
          branchRequired: tErrors("branchRequired"),
          branchForbidden: tErrors("branchForbidden"),
          conflict: tErrors("conflict"),
          validation: tNotifications("templates.validation.generic"),
          csrfRequired: tErrors("validation"),
          csrfFailed: tErrors("validation"),
          originForbidden: tErrors("forbidden"),
        },
        tNotifications("templates.saveFailed"),
      );

      setSubmitProblem({
        title: toastProblem.title,
        detail: toastProblem.description,
        code: response.problem?.code,
      });
      toast.error(toastProblem.title, {
        description: toastProblem.description,
      });
      return;
    }

    toast.success(tToasts("templateSaved"), {
      description: tNotifications(`templates.kinds.${template.kind}`),
    });
    onOpenChange(false);
    await onSuccess();
  }

  if (!template) {
    return null;
  }

  return (
    <Form {...form}>
      <EntitySheet
        cancelLabel={tCommon("cancel")}
        description={tNotifications("templates.editorDescription")}
        onCancel={() => onOpenChange(false)}
        onOpenChange={onOpenChange}
        onSubmit={form.handleSubmit(handleValidSubmit)}
        open={open}
        submitLabel={
          form.formState.isSubmitting
            ? tNotifications("templates.saving")
            : tCommon("saveChanges")
        }
        submitTestId="notification-template-submit"
        submitting={form.formState.isSubmitting}
        title={tNotifications("templates.edit")}
      >
        <div className="space-y-6">
          {submitProblem ? <ProblemBanner problem={submitProblem} /> : null}

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full" variant="outline">
              {tNotifications(`templates.kinds.${template.kind}`)}
            </Badge>
            <Badge
              className="rounded-full"
              variant={enabled ? "secondary" : "outline"}
            >
              {enabled
                ? tNotifications("templates.stateEnabled")
                : tNotifications("templates.stateDisabled")}
            </Badge>
          </div>

          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <FormItem className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <FormLabel>{tNotifications("templates.enabled")}</FormLabel>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {tNotifications("templates.enabledHint")}
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
            name="subjectTemplate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tNotifications("templates.subject")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="h-11 rounded-xl"
                    data-testid="notification-template-subject"
                    placeholder={tNotifications("subjectPlaceholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bodyTextTemplate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tNotifications("templates.bodyText")}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="min-h-32 rounded-xl"
                    data-testid="notification-template-bodyText"
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bodyHtmlTemplate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tNotifications("templates.bodyHtml")}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="min-h-32 rounded-xl font-mono text-sm"
                    data-testid="notification-template-bodyHtml"
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold tracking-tight">
                {tNotifications("templates.variables")}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {tNotifications("templates.variablesHint")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_VARIABLES.map((variable) => (
                <code
                  className="rounded-full border border-border/70 bg-muted/35 px-3 py-1 text-xs"
                  key={variable}
                >
                  {`\${${variable}}`}
                </code>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold tracking-tight">
                {tNotifications("templates.preview")}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {tNotifications("templates.previewHint")}
              </p>
            </div>
            <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {tNotifications("templates.subject")}
                </span>
                <p className="text-sm font-medium tracking-tight">
                  {renderTemplatePreview(previewSubject)}
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {tNotifications("templates.bodyText")}
                  </span>
                  <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                    {renderTemplatePreview(previewBodyText)}
                  </pre>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {tNotifications("templates.bodyHtml")}
                  </span>
                  <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                    {renderTemplatePreview(previewBodyHtml)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </EntitySheet>
    </Form>
  );
}
