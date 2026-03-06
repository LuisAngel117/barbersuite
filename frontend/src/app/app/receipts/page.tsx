import { ModulePlaceholder } from "@/components/module-placeholder";

export default function ReceiptsPage() {
  return (
    <ModulePlaceholder
      bullets={[
        "Caja y comprobantes llegarán en el slice financiero.",
        "La navegación ya los expone para ADMIN, MANAGER y RECEPTION.",
        "La estructura del shell deja espacio para KPIs, filtros y listados operativos.",
      ]}
      ctaHref="/app/services"
      ctaLabel="Ir a servicios"
      description="Vista preparatoria para recibos, cierres y operación de caja, ya integrada al shell role-based."
      eyebrow="Caja"
      title="Receipts"
    />
  );
}
