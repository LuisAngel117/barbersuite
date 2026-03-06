import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookie";

export default async function SignupPage() {
  const cookieStore = await cookies();
  if (cookieStore.has(ACCESS_TOKEN_COOKIE)) {
    redirect("/app");
  }

  return (
    <AuthShell
      eyebrow="Onboarding"
      title="Crea tenant, sucursal inicial y admin en un solo paso."
      description="El signup delega todo el alta al backend y abre sesión automática con la cookie segura del frontend."
      stats={[
        { value: "201", label: "Signup end-to-end" },
        { value: "IANA", label: "Validación de time zone" },
        { value: "Slice 1", label: "Dashboard inmediato" },
      ]}
    >
      <Card className="w-full rounded-[1.5rem] border-border/70 bg-background/95 shadow-xl shadow-black/5">
        <CardHeader className="space-y-4">
          <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Signup
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl tracking-tight">Onboarding inicial</CardTitle>
            <CardDescription className="text-sm leading-6">
              Este flujo crea tenant, branch, admin y acceso inicial. Al terminar te redirige
              directo al dashboard.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <SignupForm />

          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>¿Ya tienes cuenta?</span>
            <Link className="font-medium text-brand transition-colors hover:text-brand/80" href="/login">
              Ir al login
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
