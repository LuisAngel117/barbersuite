import { CalendarClock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AppointmentsCalendar } from "@/components/appointments/appointments-calendar";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getDashboardContext } from "@/lib/dashboard-context";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const tAppointments = await getTranslations("appointments");
  const { payload, selectedBranchId } = await getDashboardContext();
  const roles = payload?.user.roles ?? [];
  const branches = payload?.branches ?? [];
  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) ?? null;
  const branchTimeZone = selectedBranch?.timeZone ?? "local";

  return (
    <section className="space-y-6">
      <PageHeader
        subtitle={tAppointments("subtitle")}
        title={tAppointments("title")}
      />

      {!selectedBranchId ? (
        <EmptyState
          cta={(
            <Button asChild className="rounded-full">
              <a href="/app/clients">{tAppointments("noBranchCta")}</a>
            </Button>
          )}
          description={tAppointments("noBranchDesc")}
          icon={<CalendarClock className="size-5" />}
          title={tAppointments("noBranchTitle")}
          variant="warning"
        />
      ) : (
        <AppointmentsCalendar roles={roles} timeZone={branchTimeZone} />
      )}
    </section>
  );
}
