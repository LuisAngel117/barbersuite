import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";
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
      <div className="card stack">
        <div className="stack">
          <span className="eyebrow">Signup</span>
          <h1>Onboarding inicial</h1>
          <p>
            Este flujo crea tenant, branch, admin y acceso inicial. Al terminar te redirige directo
            al dashboard.
          </p>
        </div>

        <SignupForm />

        <div className="link-row">
          <span className="muted">¿Ya tienes cuenta?</span>
          <Link className="link-accent" href="/login">
            Ir al login
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
