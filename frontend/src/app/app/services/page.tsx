import { ServicesTable } from "@/components/services/services-table";

export const dynamic = "force-dynamic";

export default function ServicesPage() {
  return (
    <section className="dashboard-panel stack">
      <div className="dashboard-heading">
        <span className="eyebrow">Services</span>
        <h1>Servicios del tenant</h1>
        <p className="muted">
          Esta vista opera contra <code>/api/services</code> y respeta el alcance tenant-scoped.
        </p>
      </div>
      <ServicesTable />
    </section>
  );
}
