"use client";

import { useTranslations } from "next-intl";
import { ClientAppointmentsList } from "@/components/clients/detail/client-appointments-list";
import { ClientOverview } from "@/components/clients/detail/client-overview";
import { ClientReceiptsList } from "@/components/clients/detail/client-receipts-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ClientHistoryResponse } from "@/lib/types/client-history";

export function ClientDetailTabs({
  history,
  branchTimeZone,
}: {
  history: ClientHistoryResponse;
  branchTimeZone: string;
}) {
  const tClients = useTranslations("clients");

  return (
    <Tabs className="space-y-6" data-testid="client-detail-tabs" defaultValue="overview">
      <TabsList>
        <TabsTrigger data-testid="client-detail-tab-overview" value="overview">
          {tClients("tabs.overview")}
        </TabsTrigger>
        <TabsTrigger data-testid="client-detail-tab-appointments" value="appointments">
          {tClients("tabs.appointments")}
        </TabsTrigger>
        <TabsTrigger data-testid="client-detail-tab-receipts" value="receipts">
          {tClients("tabs.receipts")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <ClientOverview branchTimeZone={branchTimeZone} history={history} />
      </TabsContent>
      <TabsContent value="appointments">
        <ClientAppointmentsList
          appointments={history.appointments}
          branchTimeZone={branchTimeZone}
        />
      </TabsContent>
      <TabsContent value="receipts">
        <ClientReceiptsList branchTimeZone={branchTimeZone} receipts={history.receipts} />
      </TabsContent>
    </Tabs>
  );
}
