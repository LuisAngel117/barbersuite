import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookie";

export default async function LoginPage() {
  const cookieStore = await cookies();
  if (cookieStore.has(ACCESS_TOKEN_COOKIE)) {
    redirect("/app");
  }

  return (
    <AuthShell
      eyebrow="Login"
      title="Una barbería con control serio desde el primer día."
      description="Inicia sesión contra el backend real. El JWT se guarda en cookie httpOnly y el dashboard vive como Server Component."
      stats={[
        { value: "JWT", label: "Cookie httpOnly" },
        { value: "/me", label: "Dashboard server-side" },
        { value: "PG17", label: "Backend local listo" },
      ]}
    >
      <Card className="w-full rounded-[1.5rem] border-border/70 bg-background/95 shadow-xl shadow-black/5">
        <CardHeader className="space-y-4">
          <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Acceso
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl tracking-tight">Entrar a BarberSuite</CardTitle>
            <CardDescription className="text-sm leading-6">
              Inicia sesión con <strong>email + password</strong>. El backend resuelve el tenant
              desde el usuario.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <LoginForm />

          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>¿Todavía no tienes tenant?</span>
            <Link className="font-medium text-brand transition-colors hover:text-brand/80" href="/signup">
              Crear cuenta y sucursal inicial
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
