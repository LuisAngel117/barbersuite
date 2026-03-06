import { AppNavigation } from "@/components/app-navigation";
import { BranchSelector } from "@/components/branch-selector";
import { getDashboardContext } from "@/lib/dashboard-context";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { payload, selectedBranchId } = await getDashboardContext();

  return (
    <main className="dashboard-page">
      <section className="dashboard-shell">
        <div className="dashboard-stack">
          <section className="dashboard-panel stack">
            <div className="dashboard-heading">
              <span className="eyebrow">Workspace</span>
              <h1>Operate BarberSuite</h1>
              <p className="muted">
                Todo el frontend operativo consume rutas internas <code>/api/*</code>. El token
                vive en cookie <code>httpOnly</code> y la sucursal seleccionada en{" "}
                <code>bs_branch_id</code>.
              </p>
            </div>
            <AppNavigation />
          </section>
          <section className="dashboard-panel">
            <BranchSelector
              branches={payload?.branches ?? []}
              selectedBranchId={selectedBranchId}
            />
          </section>
          {children}
        </div>
      </section>
    </main>
  );
}
