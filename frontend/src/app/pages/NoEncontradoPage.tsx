import { Link } from "react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Section } from "@/shared/components/ui/Section";

export function NoEncontradoPage() {
  return (
    <>
      <PageHeader title="Pantalla no encontrada" subtitle="La ruta solicitada no existe en este módulo." />
      <Section title="Navegación">
        <p className="soft">Revisá el menú lateral o volvé a la búsqueda unificada.</p>
        <p style={{ marginTop: "var(--s-4)" }}>
          <Link to="/">Ir a la búsqueda</Link>
        </p>
      </Section>
    </>
  );
}
