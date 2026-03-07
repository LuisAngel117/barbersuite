"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReceiptDetail } from "@/components/receipts/receipt-detail";
import { formatMoneyUSD } from "@/lib/format";
import type { ClientHistoryReceipt } from "@/lib/types/client-history";

function formatDateTime(value: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export function ClientReceiptsList({
  receipts,
  branchTimeZone,
}: {
  receipts: ClientHistoryReceipt[];
  branchTimeZone: string;
}) {
  const locale = useLocale();
  const tClients = useTranslations("clients");
  const tCommon = useTranslations("common");
  const tReceipts = useTranslations("receipts");
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  const localeCode = useMemo(
    () => (locale === "en" ? "en-US" : "es-EC"),
    [locale],
  );

  if (receipts.length === 0) {
    return (
      <Card className="rounded-[1.5rem] border-border/70 bg-card/80">
        <CardContent className="px-6 py-8 text-sm text-muted-foreground">
          {tClients("emptyReceipts")}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4" data-testid="client-receipts-list">
        {receipts.map((receipt) => (
          <Card className="rounded-[1.5rem] border-border/70 bg-card/80" key={receipt.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-lg tracking-tight">{receipt.number}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(receipt.issuedAt, locale, branchTimeZone)}
                </p>
              </div>
              <Badge className="rounded-full" variant={receipt.status === "issued" ? "secondary" : "outline"}>
                {tReceipts(`status.${receipt.status}`)}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold">
                {formatMoneyUSD(receipt.total, localeCode)}
              </p>
              <Button
                className="rounded-full"
                onClick={() => setSelectedReceiptId(receipt.id)}
                size="sm"
                type="button"
                variant="outline"
              >
                {tCommon("view")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <ReceiptDetail
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReceiptId(null);
          }
        }}
        open={Boolean(selectedReceiptId)}
        receiptId={selectedReceiptId}
        timeZone={branchTimeZone}
      />
    </>
  );
}
