import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
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
      <div className="card stack">
        <div className="stack">
          <span className="eyebrow">Acceso</span>
          <h1>Entrar a BarberSuite</h1>
          <p>
            El backend actual todavía autentica por <strong>tenantId + email + password</strong>.
          </p>
        </div>

        <LoginForm />

        <div className="link-row">
          <span className="muted">¿Todavía no tienes tenant?</span>
          <Link className="link-accent" href="/signup">
            Crear cuenta y sucursal inicial
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
