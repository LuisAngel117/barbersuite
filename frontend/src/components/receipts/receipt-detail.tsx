"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { fetchReceipt } from "@/components/receipts/receipt-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProblemBanner } from "@/components/ui/problem-banner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoneyUSD } from "@/lib/format";
import { toProblemToast } from "@/lib/forms";
import { type ProblemBannerState } from "@/lib/problem";
import type { Receipt } from "@/lib/types/receipts";

type ReceiptDetailProps = {
  open: boolean;
  receiptId: string | null;
  timeZone: string;
  onOpenChange: (open: boolean) => void;
};

function formatReceiptDate(value: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

function ReceiptStatusBadge({ status, label }: { status: Receipt["status"]; label: string }) {
  return (
    <Badge className="rounded-full" variant={status === "issued" ? "secondary" : "destructive"}>
      {label}
    </Badge>
  );
}

export function ReceiptDetail({
  open,
  receiptId,
  timeZone,
  onOpenChange,
}: ReceiptDetailProps) {
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tReceipts = useTranslations("receipts");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [problem, setProblem] = useState<ProblemBannerState | null>(null);

  useEffect(() => {
    if (!open || !receiptId) {
      return;
    }

    let active = true;

    void (async () => {
      if (!active) {
        return;
      }

      setIsLoading(true);
      setProblem(null);
      const response = await fetchReceipt(receiptId);
      if (!active) {
        return;
      }

      setIsLoading(false);
      if (!response.data) {
        const toastProblem = toProblemToast(
          response.problem,
          {
            generic: tReceipts("errors.detailFailed"),
            unauthorized: tErrors("unauthorized"),
            forbidden: tErrors("forbidden"),
            branchRequired: tErrors("branchRequired"),
            branchForbidden: tErrors("branchForbidden"),
            conflict: tReceipts("errors.conflict"),
            validation: tErrors("validation"),
          },
          tReceipts("errors.detailFailed"),
        );

        setReceipt(null);
        setProblem({
          title: toastProblem.title,
          detail: toastProblem.description,
          code: response.problem?.code,
        });
        return;
      }

      setReceipt(response.data);
    })();

    return () => {
      active = false;
    };
  }, [open, receiptId, tErrors, tReceipts]);

  const statusLabel = useMemo(
    () => (receipt ? tReceipts(`status.${receipt.status}`) : ""),
    [receipt, tReceipts],
  );

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full border-border/70 bg-background/98 p-0 sm:max-w-2xl">
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="border-b border-border/70 px-6 py-5 text-left">
            <div className="flex flex-wrap items-center gap-3">
              <SheetTitle className="text-xl tracking-tight">
                {receipt?.number ?? tReceipts("viewReceipt")}
              </SheetTitle>
              {receipt ? <ReceiptStatusBadge label={statusLabel} status={receipt.status} /> : null}
            </div>
            <SheetDescription>{tReceipts("detailDescription")}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {problem ? <ProblemBanner problem={problem} /> : null}

            {isLoading ? (
              <div className="space-y-5">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-48 rounded-2xl" />
                <Skeleton className="h-40 rounded-2xl" />
              </div>
            ) : receipt ? (
              <div className="space-y-6">
                <section className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-card/80 p-5 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {tReceipts("fields.issuedAt")}
                    </p>
                    <p className="text-sm font-medium">
                      {formatReceiptDate(receipt.issuedAt, locale, timeZone)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {tReceipts("fields.client")}
                    </p>
                    <p className="text-sm font-medium">
                      {receipt.clientId ?? tReceipts("withoutClient")}
                    </p>
                  </div>
                  {receipt.notes ? (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {tReceipts("fields.notes")}
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">{receipt.notes}</p>
                    </div>
                  ) : null}
                </section>

                <section className="space-y-4 rounded-[1.5rem] border border-border/70 bg-card/80 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold tracking-tight">{tReceipts("fields.items")}</h3>
                    <Badge className="rounded-full" variant="outline">
                      {receipt.items.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {receipt.items.map((item) => (
                      <div
                        className="grid gap-3 rounded-2xl border border-border/70 bg-background/90 px-4 py-3 sm:grid-cols-[1fr_auto_auto]"
                        key={item.id}
                      >
                        <div className="space-y-1">
                          <p className="font-medium tracking-tight">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.serviceId ?? tReceipts("customItem")}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tReceipts("itemSummary", {
                            quantity: item.quantity,
                            unitPrice: formatMoneyUSD(item.unitPrice, locale === "en" ? "en-US" : "es-EC"),
                          })}
                        </p>
                        <p className="text-right text-sm font-semibold">
                          {formatMoneyUSD(item.lineTotal, locale === "en" ? "en-US" : "es-EC")}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4 rounded-[1.5rem] border border-border/70 bg-card/80 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold tracking-tight">{tReceipts("fields.payments")}</h3>
                    <Badge className="rounded-full" variant="outline">
                      {receipt.payments.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {receipt.payments.map((payment) => (
                      <div
                        className="grid gap-2 rounded-2xl border border-border/70 bg-background/90 px-4 py-3 sm:grid-cols-[auto_1fr_auto]"
                        key={payment.id}
                      >
                        <Badge className="rounded-full" variant="secondary">
                          {tReceipts(`paymentMethods.${payment.method}`)}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {payment.reference || tReceipts("withoutReference")}
                        </p>
                        <p className="text-right text-sm font-semibold">
                          {formatMoneyUSD(payment.amount, locale === "en" ? "en-US" : "es-EC")}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-3 rounded-[1.5rem] border border-border/70 bg-card/80 p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{tReceipts("fields.subtotal")}</span>
                    <span>{formatMoneyUSD(receipt.subtotal, locale === "en" ? "en-US" : "es-EC")}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{tReceipts("fields.discount")}</span>
                    <span>{formatMoneyUSD(receipt.discount, locale === "en" ? "en-US" : "es-EC")}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{tReceipts("fields.tax")}</span>
                    <span>{formatMoneyUSD(receipt.tax, locale === "en" ? "en-US" : "es-EC")}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/70 pt-3 text-base font-semibold">
                    <span>{tReceipts("fields.total")}</span>
                    <span>{formatMoneyUSD(receipt.total, locale === "en" ? "en-US" : "es-EC")}</span>
                  </div>
                </section>
              </div>
            ) : !problem ? (
              <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/25 px-4 py-4 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                {tCommon("loading")}
              </div>
            ) : null}
          </div>

          <div className="border-t border-border/70 px-6 py-4">
            <Button className="rounded-xl" onClick={() => onOpenChange(false)} type="button" variant="outline">
              {tCommon("close")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
