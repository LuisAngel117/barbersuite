"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { toProblemToast } from "@/lib/forms";
import { type ProblemBannerState } from "@/lib/problem";
import {
  createTestEmailFormSchema,
  getTestEmailDefaultValues,
  toTestEmailPayload,
  type TestEmailFormValues,
} from "@/lib/schemas/test-email.schema";
import { enqueueTestEmail } from "@/components/notifications/notifications-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ProblemBanner } from "@/components/ui/problem-banner";
import { Textarea } from "@/components/ui/textarea";

type TestEmailFormProps = {
  onEnqueued: () => void;
};

export function TestEmailForm({ onEnqueued }: TestEmailFormProps) {
  const tErrors = useTranslations("errors");
  const tNotifications = useTranslations("notifications");
  const tToasts = useTranslations("toasts");
  const [submitProblem, setSubmitProblem] = useState<ProblemBannerState | null>(null);

  const form = useForm<TestEmailFormValues>({
    resolver: zodResolver(
      createTestEmailFormSchema({
        emailValidation: tNotifications("validation.email"),
        subjectValidation: tNotifications("validation.subject"),
        bodyRequired: tNotifications("validation.bodyRequired"),
      }),
    ),
    defaultValues: getTestEmailDefaultValues(),
  });

  async function handleValidSubmit(values: TestEmailFormValues) {
    setSubmitProblem(null);

    const response = await enqueueTestEmail(toTestEmailPayload(values));
    if (!response.data) {
      const toastProblem = toProblemToast(
        response.problem,
        {
          generic: tNotifications("errors.enqueueFailed"),
          unauthorized: tErrors("unauthorized"),
          forbidden: tErrors("forbidden"),
          branchRequired: tErrors("branchRequired"),
          branchForbidden: tErrors("branchForbidden"),
          conflict: tNotifications("errors.conflict"),
          validation: tNotifications("errors.validation"),
          csrfRequired: tErrors("validation"),
          csrfFailed: tErrors("validation"),
          originForbidden: tErrors("forbidden"),
        },
        tNotifications("errors.enqueueFailed"),
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

    toast.success(tToasts("emailEnqueued"), {
      description: response.data.outboxId,
    });
    form.reset(getTestEmailDefaultValues());
    onEnqueued();
  }

  function handleInvalidSubmit() {
    const rootMessage =
      typeof form.formState.errors.root?.message === "string"
        ? form.formState.errors.root.message
        : tNotifications("validation.bodyRequired");

    setSubmitProblem({
      title: tNotifications("errors.validationTitle"),
      detail: rootMessage,
      code: "VALIDATION_ERROR",
    });
  }

  return (
    <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-lg shadow-black/5">
      <CardHeader className="space-y-2">
        <CardTitle>{tNotifications("testEmailTitle")}</CardTitle>
        <CardDescription>{tNotifications("testEmailDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            aria-busy={form.formState.isSubmitting}
            className="space-y-5"
            onSubmit={form.handleSubmit(handleValidSubmit, handleInvalidSubmit)}
          >
            {submitProblem ? <ProblemBanner problem={submitProblem} /> : null}

            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="toEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tNotifications("fields.toEmail")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-11 rounded-xl"
                        data-testid="notif-test-to"
                        placeholder="demo@example.com"
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tNotifications("fields.subject")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-11 rounded-xl"
                        data-testid="notif-test-subject"
                        placeholder={tNotifications("subjectPlaceholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bodyText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tNotifications("fields.bodyText")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-28 rounded-xl"
                      data-testid="notif-test-bodyText"
                      placeholder={tNotifications("bodyTextPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bodyHtml"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tNotifications("fields.bodyHtml")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-28 rounded-xl font-mono text-sm"
                      placeholder={tNotifications("bodyHtmlPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              className="w-full rounded-xl sm:w-auto"
              data-testid="notif-test-submit"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting
                ? tNotifications("actions.enqueuing")
                : tNotifications("actions.enqueue")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
