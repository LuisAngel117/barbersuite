import { cookies } from "next/headers";
import { ClientsTable } from "@/components/clients/clients-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRANCH_COOKIE } from "@/lib/branch-cookie";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const cookieStore = await cookies();
  const branchId = cookieStore.get(BRANCH_COOKIE)?.value ?? null;

  return (
    <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Clients
          </div>
          {branchId ? (
            <Badge className="rounded-full" variant="outline">
              Branch selected
            </Badge>
          ) : null}
        </div>
        <CardTitle className="text-3xl tracking-tight">Clientes por sucursal</CardTitle>
        <CardDescription className="text-sm leading-6">
          Esta vista usa <code>/api/clients</code> y depende de la sucursal seleccionada en{" "}
          <code>bs_branch_id</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>

      {!branchId ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-6">
          <strong className="block text-base font-semibold tracking-tight">
            Selecciona una sucursal arriba para continuar.
          </strong>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Los clientes son branch-scoped. Mientras no exista una sucursal activa en la cookie,
            esta pantalla no hace requests.
          </p>
        </div>
      ) : (
        <ClientsTable branchId={branchId} key={branchId} />
      )}
      </CardContent>
    </Card>
  );
}
