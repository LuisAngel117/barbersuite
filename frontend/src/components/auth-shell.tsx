type AuthStat = {
  value: string;
  label: string;
};

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  stats: AuthStat[];
  children: React.ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  stats,
  children,
}: AuthShellProps) {
  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <div className="auth-brand">
          <span className="auth-brand-dot" />
          BarberSuite
        </div>

        <div className="auth-copy">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="display">{title}</h1>
          <p className="lede">{description}</p>
        </div>

        <div className="hero-grid">
          {stats.map((stat) => (
            <article className="hero-stat" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="auth-panel">{children}</section>
    </main>
  );
}
