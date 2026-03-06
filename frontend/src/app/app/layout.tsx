import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getDashboardContext } from "@/lib/dashboard-context";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { payload, selectedBranchId } = await getDashboardContext();
  const roles = payload?.user.roles ?? [];
  const user = payload?.user ?? {
    fullName: "BarberSuite",
    email: "demo@barbersuite.local",
    roles: [],
  };
  const branches = payload?.branches ?? [];

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar roles={roles} user={{ fullName: user.fullName, email: user.email }} />
      <SidebarInset className="min-h-screen bg-transparent">
        <AppTopbar
          branches={branches}
          roles={roles}
          selectedBranchId={selectedBranchId}
          user={{ fullName: user.fullName, email: user.email }}
        />
        <div className="flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8">{children}</div>
        <MobileBottomNav
          branches={branches}
          roles={roles}
          selectedBranchId={selectedBranchId}
          user={{ fullName: user.fullName, email: user.email }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
