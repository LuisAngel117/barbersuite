"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createVoidReceiptFormSchema } from "@/lib/schemas/receipt.schema";
import type { Receipt } from "@/lib/types/receipts";
import { toProblemToast } from "@/lib/forms";
import { type ProblemBannerState } from "@/lib/problem";
import { voidReceipt } from "@/components/receipts/receipt-api";
import { ProblemBanner } from "@/components/ui/problem-banner";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type VoidReceiptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: Receipt | null;
  onSuccess: (receipt: Receipt) => Promise<void> | void;
};

export function VoidReceiptDialog({
  open,
  onOpenChange,
  receipt,
  onSuccess,
}: VoidReceiptDialogProps) {
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tReceipts = useTranslations("receipts");
  const tToasts = useTranslations("toasts");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [problem, setProblem] = useState<ProblemBannerState | null>(null);

  function resetState() {
    setReason("");
    setProblem(null);
    setIsSubmitting(false);
  }

  async function handleConfirm() {
    const parsed = createVoidReceiptFormSchema({
      reasonValidation: tReceipts("errors.reasonValidation"),
    }).safeParse({ reason });

    if (!parsed.success) {
      setProblem({
        title: tReceipts("errors.validationTitle"),
        detail: parsed.error.issues[0]?.message || tErrors("validation"),
        code: "VALIDATION_ERROR",
      });
      return;
    }

    if (!receipt) {
      return;
    }

    setIsSubmitting(true);
    const response = await voidReceipt(receipt.id, parsed.data);
    setIsSubmitting(false);

    if (!response.data) {
      const toastProblem = toProblemToast(
        response.problem,
        {
          generic: tReceipts("errors.voidFailed"),
          unauthorized: tErrors("unauthorized"),
          forbidden: tErrors("forbidden"),
          branchRequired: tErrors("branchRequired"),
          branchForbidden: tErrors("branchForbidden"),
          conflict: tReceipts("errors.conflict"),
          validation: tErrors("validation"),
        },
        tReceipts("errors.voidFailed"),
      );

      const nextProblem = {
        title: toastProblem.title,
        detail: toastProblem.description,
        code: response.problem?.code,
      } satisfies ProblemBannerState;
      setProblem(nextProblem);
      toast.error(toastProblem.title, {
        description: toastProblem.description,
      });
      return;
    }

    toast.success(tToasts("receiptVoided"), {
      description: response.data.number,
    });
    resetState();
    onOpenChange(false);
    await onSuccess(response.data);
  }

  return (
    <AlertDialog
      onOpenChange={(nextOpen) => {
        if (isSubmitting && !nextOpen) {
          return;
        }

        if (!nextOpen) {
          resetState();
        }
        onOpenChange(nextOpen);
      }}
      open={open}
    >
      <AlertDialogContent className="rounded-[1.5rem] border-border/70">
        <AlertDialogHeader>
          <AlertDialogTitle>{tReceipts("voidReceipt")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tReceipts("confirm.voidDescription", {
              number: receipt?.number ?? "—",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {problem ? <ProblemBanner problem={problem} /> : null}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="receipt-void-reason">
              {tReceipts("fields.voidReason")}
            </label>
            <Textarea
              className="min-h-28 rounded-xl"
              data-testid="receipt-void-reason"
              disabled={isSubmitting}
              id="receipt-void-reason"
              onChange={(event) => {
                setReason(event.target.value);
                if (problem) {
                  setProblem(null);
                }
              }}
              placeholder={tReceipts("fields.voidReasonPlaceholder")}
              rows={4}
              value={reason}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid="receipt-void-submit"
            disabled={isSubmitting}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
            variant="destructive"
          >
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {tReceipts("voidReceipt")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
