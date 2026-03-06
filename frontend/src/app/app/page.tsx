import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { getDashboardContext } from "@/lib/dashboard-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  resolveErrorMessage,
} from "@/lib/backend";

export default async function DashboardPage() {
  const { payload, problem } = await getDashboardContext();
  if (!payload) {
    return (
      <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Dashboard
          </div>
          <CardTitle className="text-3xl tracking-tight">
            No pudimos cargar tu contexto actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-muted-foreground">
          {resolveErrorMessage(
            problem,
            "El backend respondió con un error inesperado al consultar /me.",
          )}
          </p>
          <LogoutButton label="Volver al login" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
                Tenant dashboard
              </Badge>
              <Badge className="rounded-full" variant="outline">
                {payload.tenant.name}
              </Badge>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl tracking-tight">{payload.user.fullName}</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-6">
              Sesión autenticada para <strong>{payload.user.email}</strong>. Este tablero consume
              <code> /api/v1/me</code> server-side y nunca expone el token al navegador.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full" variant="secondary">
              <Link href="/app/services">Ir a Services</Link>
            </Button>
            <Button asChild className="rounded-full" variant="outline">
              <Link href="/app/clients">Ir a Clients</Link>
            </Button>
            <Button asChild className="rounded-full" variant="ghost">
              <Link href="/app/ui-kit">Ver UI Kit</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {payload.user.roles.map((role) => (
                <Badge className="rounded-full" key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
            </div>
            <CardTitle className="text-xl tracking-tight">Resumen rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Tenant ID
                </p>
                <p className="mt-2 break-all text-sm font-medium">{payload.tenant.id}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  User ID
                </p>
                <p className="mt-2 break-all text-sm font-medium">{payload.user.id}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Sucursales accesibles
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{payload.branches.length}</p>
              </div>
            </div>
            <LogoutButton className="w-full justify-center" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5">
          <CardHeader className="space-y-3">
            <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Contexto
            </div>
            <CardTitle className="text-3xl tracking-tight">{payload.tenant.name}</CardTitle>
            <CardDescription className="text-sm leading-6">
              BarberSuite ya quedó conectado al backend real y está listo para recruiter demos.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Usuario
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight">{payload.user.fullName}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Email
              </p>
              <p className="mt-2 text-sm font-medium">{payload.user.email}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Roles
              </p>
              <p className="mt-2 text-sm font-medium">{payload.user.roles.join(", ")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/70 bg-card/80 shadow-xl shadow-black/5">
          <CardHeader className="space-y-3">
            <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Sucursales
            </div>
            <CardTitle className="text-3xl tracking-tight">Accesos vigentes</CardTitle>
            <CardDescription className="text-sm leading-6">
              La lista viene de <code>user_branch_access</code> y respeta el tenant del JWT.
            </CardDescription>
          </CardHeader>
          <CardContent>

          {payload.branches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-6 text-sm text-muted-foreground">
              Este usuario todavía no tiene sucursales asignadas.
            </div>
          ) : (
            <div className="grid gap-4">
              {payload.branches.map((branch) => (
                <article
                  className="rounded-2xl border border-border/70 bg-muted/40 p-5"
                  key={branch.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
                        {branch.code}
                      </span>
                      <h2 className="text-xl font-semibold tracking-tight">{branch.name}</h2>
                    </div>
                    <Badge
                      className="rounded-full"
                      variant={branch.active ? "secondary" : "outline"}
                    >
                      {branch.active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{branch.timeZone}</p>
                </article>
              ))}
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
