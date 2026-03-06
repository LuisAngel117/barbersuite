import { ModulePlaceholder } from "@/components/module-placeholder";

export default function BranchesPage() {
  return (
    <ModulePlaceholder
      bullets={[
        "El backend ya soporta branches admin tenant-scoped.",
        "La UI dedicada se conectará aquí sin tocar el shell.",
        "Este placeholder evita links muertos y deja breadcrumbs reales desde hoy.",
      ]}
      ctaHref="/app"
      ctaLabel="Volver al dashboard"
      description="Espacio reservado para la futura consola de sucursales, visible solo para ADMIN y MANAGER."
      eyebrow="Administración"
      title="Branches"
    />
  );
}
