import { AppNavigation } from "@/components/app-navigation";
import { BranchSelector } from "@/components/branch-selector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardContext } from "@/lib/dashboard-context";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { payload, selectedBranchId } = await getDashboardContext();

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
          <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5 backdrop-blur">
            <CardHeader className="space-y-5">
              <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Workspace
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl tracking-tight">Operate BarberSuite</CardTitle>
                <CardDescription className="max-w-3xl text-sm leading-6">
                  Todo el frontend operativo consume rutas internas <code>/api/*</code>. El token
                  vive en cookie <code>httpOnly</code> y la sucursal seleccionada en{" "}
                  <code>bs_branch_id</code>.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <AppNavigation />
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5 backdrop-blur">
            <CardContent className="pt-6">
              <BranchSelector
                branches={payload?.branches ?? []}
                selectedBranchId={selectedBranchId}
              />
            </CardContent>
          </Card>
        </section>

        {children}
      </div>
    </main>
  );
}
