import { LogoutButton } from "@/components/logout-button";
import { getDashboardContext } from "@/lib/dashboard-context";
import {
  resolveErrorMessage,
} from "@/lib/backend";

export default async function DashboardPage() {
  const { payload, problem } = await getDashboardContext();
  if (!payload) {
    return (
      <div className="dashboard-panel stack">
        <div className="dashboard-heading">
          <span className="eyebrow">Dashboard</span>
          <h1>No pudimos cargar tu contexto actual</h1>
        </div>
        <p className="muted">
          {resolveErrorMessage(
            problem,
            "El backend respondió con un error inesperado al consultar /me.",
          )}
        </p>
        <div className="actions-row">
          <LogoutButton label="Volver al login" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-topbar">
        <div className="dashboard-panel stack">
          <div className="badge-row">
            <span className="soft-pill">Tenant-scoped dashboard</span>
            <span className="soft-pill">{payload.tenant.name}</span>
          </div>
          <div className="dashboard-heading">
            <span className="eyebrow">Operación actual</span>
            <h1>{payload.user.fullName}</h1>
            <p className="muted">
              Sesión autenticada para <strong>{payload.user.email}</strong>. Este tablero consume
              <code> /api/v1/me</code> server-side y nunca expone el token al navegador.
            </p>
          </div>
        </div>

        <div className="dashboard-panel stack">
          <div className="badge-row">
            {payload.user.roles.map((role) => (
              <span className="soft-pill" key={role}>
                {role}
              </span>
            ))}
          </div>
          <div className="summary-grid">
            <dl className="summary-card">
              <dt>Tenant ID</dt>
              <dd>{payload.tenant.id}</dd>
            </dl>
            <dl className="summary-card">
              <dt>User ID</dt>
              <dd>{payload.user.id}</dd>
            </dl>
            <dl className="summary-card">
              <dt>Sucursales accesibles</dt>
              <dd>{payload.branches.length}</dd>
            </dl>
          </div>
          <div className="actions-row">
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel stack">
          <div className="dashboard-heading">
            <span className="eyebrow">Contexto</span>
            <h1>{payload.tenant.name}</h1>
            <p className="muted">
              BarberSuite ya quedó conectado al backend real y está listo para recruiter demos.
            </p>
          </div>

          <div className="summary-grid">
            <dl className="summary-card">
              <dt>Usuario</dt>
              <dd>{payload.user.fullName}</dd>
            </dl>
            <dl className="summary-card">
              <dt>Email</dt>
              <dd>{payload.user.email}</dd>
            </dl>
            <dl className="summary-card">
              <dt>Roles</dt>
              <dd>{payload.user.roles.join(", ")}</dd>
            </dl>
          </div>
        </section>

        <section className="dashboard-panel stack">
          <div className="dashboard-heading">
            <span className="eyebrow">Sucursales</span>
            <h1>Accesos vigentes</h1>
            <p className="muted">
              La lista viene de <code>user_branch_access</code> y respeta el tenant del JWT.
            </p>
          </div>

          {payload.branches.length === 0 ? (
            <div className="empty-state">Este usuario todavía no tiene sucursales asignadas.</div>
          ) : (
            <div className="branch-list">
              {payload.branches.map((branch) => (
                <article className="branch-card" key={branch.id}>
                  <div className="branch-card-top">
                    <div className="stack">
                      <span className="branch-code">{branch.code}</span>
                      <h2>{branch.name}</h2>
                    </div>
                    <span
                      className={`status-chip ${
                        branch.active ? "status-chip-active" : "status-chip-inactive"
                      }`}
                    >
                      {branch.active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  <p className="muted">{branch.timeZone}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
