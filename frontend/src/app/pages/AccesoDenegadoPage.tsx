import { Link } from "react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Section } from "@/shared/components/ui/Section";
import { Notice } from "@/shared/components/ui/Notice";

export function AccesoDenegadoPage() {
  return (
    <>
      <PageHeader title="Sin acceso" subtitle="Tu rol no tiene permisos para esta sección." />
      <Section title="Permisos">
        <Notice tono="warn" titulo="Acceso restringido">
          Esta pantalla está disponible solo para los roles indicados. Volvé a la búsqueda unificada o
          solicitá el rol correspondiente a administración.
        </Notice>
        <Link to="/">Volver a la búsqueda</Link>
      </Section>
    </>
  );
}
