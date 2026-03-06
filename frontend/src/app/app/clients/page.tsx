import { cookies } from "next/headers";
import { ClientsTable } from "@/components/clients/clients-table";
import { BRANCH_COOKIE } from "@/lib/branch-cookie";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const cookieStore = await cookies();
  const branchId = cookieStore.get(BRANCH_COOKIE)?.value ?? null;

  return (
    <section className="dashboard-panel stack">
      <div className="dashboard-heading">
        <span className="eyebrow">Clients</span>
        <h1>Clientes por sucursal</h1>
        <p className="muted">
          Esta vista usa <code>/api/clients</code> y depende de la sucursal seleccionada en{" "}
          <code>bs_branch_id</code>.
        </p>
      </div>

      {!branchId ? (
        <div className="empty-state stack">
          <strong>Selecciona una sucursal arriba para continuar.</strong>
          <p>
            Los clientes son branch-scoped. Mientras no exista una sucursal activa en la cookie,
            esta pantalla no hace requests.
          </p>
        </div>
      ) : (
        <ClientsTable branchId={branchId} key={branchId} />
      )}
    </section>
  );
}
