import { ModulePlaceholder } from "@/components/module-placeholder";

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      bullets={[
        "Aquí entrarán preferencias de tenant, branding y hardening operativo.",
        "El shell ya considera este destino en desktop y mobile.",
        "También sirve como lugar natural para accesos internos como UI Kit.",
      ]}
      ctaHref="/app/ui-kit"
      ctaLabel="Abrir UI Kit"
      description="Zona placeholder para configuración y sistema, reservada a ADMIN y MANAGER."
      eyebrow="Sistema"
      title="Settings"
    />
  );
}
