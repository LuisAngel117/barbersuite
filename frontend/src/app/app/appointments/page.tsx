import { ModulePlaceholder } from "@/components/module-placeholder";

export default function AppointmentsPage() {
  return (
    <ModulePlaceholder
      bullets={[
        "La agenda entrará en el siguiente slice con citas branch-scoped.",
        "Este espacio ya existe para estabilizar navegación desktop/mobile y breadcrumbs.",
        "El shell ya soporta roles, branch context y módulos futuros sin rehacer el layout.",
      ]}
      ctaHref="/app/clients"
      ctaLabel="Ir a clientes"
      description="Módulo placeholder listo para conectar agenda, disponibilidad y confirmaciones sin rearmar el App Shell."
      eyebrow="Agenda"
      title="Appointments"
    />
  );
}
