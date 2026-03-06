import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardContext } from "@/lib/dashboard-context";
import { hasAnyRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const tNotifications = await getTranslations("notifications");
  const { payload } = await getDashboardContext();
  const roles = payload?.user.roles ?? [];
  const canAccessNotifications = hasAnyRole(roles, ["ADMIN", "MANAGER"]);

  return (
    <section className="space-y-6">
      <PageHeader
        rightSlot={(
          <Badge className="rounded-full" variant="outline">
            {tNotifications("pageEyebrow")}
          </Badge>
        )}
        subtitle={tNotifications("subtitle")}
        title={tNotifications("title")}
      />

      {canAccessNotifications ? (
        <NotificationsPanel />
      ) : (
        <EmptyState
          cta={(
            <Button asChild className="rounded-full" size="sm">
              <Link href="/app">{tNotifications("backToDashboard")}</Link>
            </Button>
          )}
          description={tNotifications("noAccessDescription")}
          title={tNotifications("noAccessTitle")}
          variant="warning"
        />
      )}
    </section>
  );
}
