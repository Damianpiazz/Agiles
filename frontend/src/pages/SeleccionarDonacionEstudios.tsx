import { DonacionesTable } from "../components/DonacionesTable";
import { PageHeader } from "../components/PageHeader";
import { useDonaciones } from "../hooks/useDatos";

type Props = {
  onSeleccionar: (donacionId: number) => void;
  onVolver?: () => void;
};

export default function SeleccionarDonacionEstudios({ onSeleccionar, onVolver }: Props) {
  const { datos: donaciones, cargando, error } = useDonaciones();

  return (
    <>
      <PageHeader
        title="Cargar PCI y Serología"
        description="Elegí una donación registrada para cargar o actualizar su Prueba de Coombs indirecta y su serología."
        actions={
          onVolver ? (
            <button type="button" className="ui-btn ui-btn-secondary" onClick={onVolver}>
              Volver al resumen
            </button>
          ) : undefined
        }
      />

      <section className="ui-section" aria-labelledby="donacionesEstudiosTitulo">
        <h2 id="donacionesEstudiosTitulo">Donaciones registradas</h2>
        <DonacionesTable
          rows={donaciones}
          loading={cargando}
          error={error}
          onSeleccionar={(donacion) => onSeleccionar(donacion.id)}
          actionLabel="Cargar estudios"
          caption="Donaciones disponibles para cargar PCI y serología."
        />
      </section>
    </>
  );
}
