import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,480px)]">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(9,12,18,0.96),rgba(27,31,40,0.92),rgba(176,98,18,0.78))] p-8 text-white shadow-2xl shadow-black/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.18),transparent_24%)]" />

          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="flex items-start justify-between gap-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80">
                <span className="size-2 rounded-full bg-brand shadow-[0_0_0_6px_rgba(245,158,11,0.18)]" />
                BarberSuite
              </div>

              <div className="flex items-center gap-2">
                <LanguageToggle buttonClassName="border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white" compact />
                <ThemeToggle buttonClassName="border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white" />
              </div>
            </div>

            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-white/70">
                {eyebrow}
              </span>
              <div className="max-w-3xl space-y-4">
                <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
                  {description}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <article
                  className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur"
                  key={stat.label}
                >
                  <strong className="block text-2xl font-semibold tracking-tight">
                    {stat.value}
                  </strong>
                  <span className="mt-2 block text-sm text-white/68">{stat.label}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center rounded-[2rem] border border-border/70 bg-card/75 p-4 shadow-xl shadow-black/5 backdrop-blur md:p-6">
          {children}
        </section>
      </div>
    </main>
  );
}
