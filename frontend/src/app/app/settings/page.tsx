import { getTranslations } from "next-intl/server";
import { SettingsIntegrations } from "@/components/settings/settings-integrations";
import { SettingsPreferences } from "@/components/settings/settings-preferences";
import { SettingsProfile } from "@/components/settings/settings-profile";
import { SettingsWorkspace } from "@/components/settings/settings-workspace";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDashboardContext } from "@/lib/dashboard-context";
import { hasAnyRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const tSettings = await getTranslations("settings");
  const { payload, selectedBranchId } = await getDashboardContext();
  const tenant = payload?.tenant ?? { id: "", name: "BarberSuite" };
  const user = payload?.user ?? {
    id: "",
    fullName: "BarberSuite",
    email: "demo@barbersuite.local",
    roles: [],
  };
  const branches = payload?.branches ?? [];
  const roles = payload?.user.roles ?? [];
  const canManageWorkspace = hasAnyRole(roles, ["ADMIN", "MANAGER"]);
  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) ?? null;
  const backendBaseUrl = process.env.BACKEND_BASE_URL ?? "";
  const showLocalShortcuts =
    backendBaseUrl.includes("localhost") || backendBaseUrl.includes("barbersuite-backend");

  return (
    <section className="space-y-6">
      <PageHeader
        rightSlot={(
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full" variant="outline">
              {user.roles.join(" · ")}
            </Badge>
            {selectedBranch ? (
              <Badge className="rounded-full" variant="secondary">
                {selectedBranch.code}
              </Badge>
            ) : null}
          </div>
        )}
        subtitle={tSettings("subtitle")}
        title={tSettings("title")}
      />

      <Tabs className="space-y-6" data-testid="settings-tabs" defaultValue="profile">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger data-testid="settings-tab-profile" value="profile">
            {tSettings("tabs.profile")}
          </TabsTrigger>
          <TabsTrigger data-testid="settings-tab-preferences" value="preferences">
            {tSettings("tabs.preferences")}
          </TabsTrigger>
          {canManageWorkspace ? (
            <TabsTrigger data-testid="settings-tab-workspace" value="workspace">
              {tSettings("tabs.workspace")}
            </TabsTrigger>
          ) : null}
          {canManageWorkspace ? (
            <TabsTrigger data-testid="settings-tab-integrations" value="integrations">
              {tSettings("tabs.integrations")}
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="profile">
          <SettingsProfile branches={branches} selectedBranch={selectedBranch} user={user} />
        </TabsContent>

        <TabsContent value="preferences">
          <SettingsPreferences selectedBranch={selectedBranch} />
        </TabsContent>

        {canManageWorkspace ? (
          <TabsContent value="workspace">
            <SettingsWorkspace branches={branches} tenant={tenant} />
          </TabsContent>
        ) : null}

        {canManageWorkspace ? (
          <TabsContent value="integrations">
            <SettingsIntegrations showLocalShortcuts={showLocalShortcuts} />
          </TabsContent>
        ) : null}
      </Tabs>
    </section>
  );
}
