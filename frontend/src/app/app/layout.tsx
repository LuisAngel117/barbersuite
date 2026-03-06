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
