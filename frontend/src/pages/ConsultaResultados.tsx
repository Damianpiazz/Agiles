
import { useState } from "react";
import type { FormEvent } from "react";
import "../styles/ConsultaResultados.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

type Resultado = {
  resultado: string;
  intensidad?: string | null;
  valor?: string | null;
  unidad?: string | null;
  observacion?: string | null;
  antigeno?: { nombre?: string } | null;
  determinacionSerologica?: { nombre?: string } | null;
};

type Donacion = {
  id: number;
  fechaHora: string;
  estado: string;
  operador: string;
  estadoUnidad: string;
  discrepanciaResuelta: boolean;
  observacionDiscrepancia: string | null;
  calificacionBiologica: {
    estado: string;
    operador: string;
    fechaInicio: string;
  } | null;
  tipificacionesSanguineas: {
    id: number;
    grupoABO: string;
    factorRhD: string;
    operador: string;
    fechaHora: string;
  }[];
  pciDonaciones: {
    pci: {
      fecha: string;
      hora: string;
      observaciones: string | null;
      resultados: Resultado[];
    };
  }[];
  serologiaDonaciones: {
    serologia: {
      fecha: string;
      hora: string;
      observaciones: string | null;
      resultados: Resultado[];
    };
  }[];
  anticuerpoIrregular: {
    resultado: string;
    operador: string;
    fechaHora: string;
    observacion: string | null;
  } | null;
  eventosEstadoUnidad: {
    estado: string;
    motivo: string | null;
    usuario: string;
    fechaHora: string;
  }[];
};

type Donante = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  donaciones: Donacion[];
};

type Banner = {
  tipo: "ok" | "error";
  texto: string;
} | null;

export default function ConsultaResultados() {
  const [dni, setDni] = useState("");
  const [donante, setDonante] = useState<Donante | null>(null);
  const [banner, setBanner] = useState<Banner>(null);
  const [consultando, setConsultando] = useState(false);

  async function consultar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBanner(null);
    setDonante(null);

    if (!/^\d{7,8}$/.test(dni.trim())) {
      setBanner({
        tipo: "error",
        texto: "Ingresá un DNI válido de 7 u 8 dígitos.",
      });
      return;
    }

    setConsultando(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/api/consultas-resultados/donante/${encodeURIComponent(dni.trim())}`,
      );

      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          datos?.error || "No se pudieron consultar los resultados.",
        );
      }

      setDonante(datos as Donante);
      setBanner({
        tipo: "ok",
        texto: "Resultados consultados correctamente.",
      });
    } catch (error) {
      setBanner({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : "No se pudo conectar con el servidor.",
      });
    } finally {
      setConsultando(false);
    }
  }

  function fecha(valor: string) {
    return new Date(valor).toLocaleString("es-AR");
  }

  return (
    <main className="consulta-container">
      <header className="consulta-header">
        <h1>Consultar resultados de calificación</h1>
        <p>
          Consultá los resultados de calificación biológica y el estado
          de las donaciones de un donante.
        </p>
      </header>

      {banner && (
        <div
          className={`consulta-banner consulta-banner-${banner.tipo}`}
          role="status"
        >
          {banner.texto}
        </div>
      )}

      <section className="consulta-card">
        <h2>Buscar donante</h2>
        <form onSubmit={consultar} className="consulta-form">
          <div className="consulta-field">
            <label htmlFor="consultaDni">DNI del donante</label>
            <input
              id="consultaDni"
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
              placeholder="Ingresá el DNI"
              required
            />
          </div>

          <button type="submit" disabled={consultando}>
            {consultando ? "Consultando..." : "Consultar resultados"}
          </button>
        </form>
      </section>

      {donante && (
        <>
          <section className="consulta-card">
            <h2>Datos del donante</h2>
            <div className="consulta-datos">
              <p>
                <strong>Nombre:</strong> {donante.nombre} {donante.apellido}
              </p>
              <p>
                <strong>DNI:</strong> {donante.dni}
              </p>
              <p>
                <strong>ID:</strong> {donante.id}
              </p>
            </div>
          </section>

          <h2 className="consulta-subtitulo">Historial de donaciones</h2>

          {donante.donaciones.length === 0 ? (
            <section className="consulta-card">
              Este donante no tiene donaciones registradas.
            </section>
          ) : (
            donante.donaciones.map((donacion) => (
              <section className="consulta-card" key={donacion.id}>
                <div className="consulta-donacion-header">
                  <h2>Donación #{donacion.id}</h2>
                  <span className="consulta-estado">
                    {donacion.estado}
                  </span>
                </div>

                <p>
                  <strong>Fecha:</strong> {fecha(donacion.fechaHora)}
                </p>
                <p>
                  <strong>Operador:</strong> {donacion.operador}
                </p>
                <p>
                  <strong>Calificación biológica:</strong>{" "}
                  {donacion.calificacionBiologica?.estado || "Sin iniciar"}
                </p>

                <div className="consulta-seccion">
                  <h3>Tipificación ABO/RhD</h3>

                  {donacion.tipificacionesSanguineas.length === 0 ? (
                    <p>Sin resultados registrados.</p>
                  ) : (
                    donacion.tipificacionesSanguineas.map((item) => (
                      <div
                        key={item.id}
                        className="consulta-resultado consulta-tipificacion"
                      >
                        <strong className="consulta-grupo-sanguineo">
                          {item.grupoABO}
                          {item.factorRhD === "POSITIVO" ? "+" : "-"}
                        </strong>

                        <div className="consulta-metadatos">
                          <p>Operador: {item.operador}</p>
                          <p>Fecha: {fecha(item.fechaHora)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="consulta-seccion">
                  <h3>Prueba de compatibilidad inmunohematológica (PCI)</h3>
                  {donacion.pciDonaciones.length === 0 ? (
                    <p>Sin estudios registrados.</p>
                  ) : (
                    donacion.pciDonaciones.map((vinculo, index) => (
                      <div className="consulta-resultado" key={index}>
                        <p>
                          <strong>Fecha:</strong> {vinculo.pci.fecha}
                        </p>
                        {vinculo.pci.observaciones && (
                          <p>{vinculo.pci.observaciones}</p>
                        )}
                        {vinculo.pci.resultados.map((r, i) => (
                          <p key={i}>
                            {r.antigeno?.nombre || "Antígeno"}: {r.resultado}
                            {r.intensidad ? ` (${r.intensidad})` : ""}
                            {r.observacion ? ` - ${r.observacion}` : ""}
                          </p>
                        ))}
                      </div>
                    ))
                  )}
                </div>

                <div className="consulta-seccion">
                  <h3>Serología</h3>
                  {donacion.serologiaDonaciones.length === 0 ? (
                    <p>Sin estudios registrados.</p>
                  ) : (
                    donacion.serologiaDonaciones.map((vinculo, index) => (
                      <div className="consulta-resultado" key={index}>
                        <p>
                          <strong>Fecha:</strong> {vinculo.serologia.fecha}
                        </p>
                        {vinculo.serologia.observaciones && (
                          <p>{vinculo.serologia.observaciones}</p>
                        )}
                        {vinculo.serologia.resultados.map((r, i) => (
                          <p key={i}>
                            {r.determinacionSerologica?.nombre || "Determinación"}:
                            {" "}{r.resultado}
                            {r.valor ? ` - ${r.valor} ${r.unidad || ""}` : ""}
                            {r.observacion ? ` - ${r.observacion}` : ""}
                          </p>
                        ))}
                      </div>
                    ))
                  )}
                </div>

                <div className="consulta-seccion">
                  <h3>Anticuerpos irregulares</h3>
                  {donacion.anticuerpoIrregular ? (
                    <div className="consulta-resultado">
                      <strong>{donacion.anticuerpoIrregular.resultado}</strong>
                      <span>
                        Operador: {donacion.anticuerpoIrregular.operador}
                      </span>
                      <span>
                        Fecha: {fecha(donacion.anticuerpoIrregular.fechaHora)}
                      </span>
                      {donacion.anticuerpoIrregular.observacion && (
                        <p>{donacion.anticuerpoIrregular.observacion}</p>
                      )}
                    </div>
                  ) : (
                    <p>Sin resultados registrados.</p>
                  )}
                </div>

                <div className="consulta-seccion">
                  <h3>Estado de la unidad</h3>
                  <p>
                    <strong>Estado:</strong> {donacion.estadoUnidad}
                  </p>
                  {donacion.estadoUnidad === "BLOQUEADA" && (
                    <p className="consulta-bloqueo">
                      <strong>Motivo del bloqueo:</strong>{" "}
                      {donacion.eventosEstadoUnidad.find(
                        (evento) => evento.estado === "BLOQUEADA",
                      )?.motivo ||
                        donacion.observacionDiscrepancia ||
                        "Sin motivo informado"}
                    </p>
                  )}
                  {donacion.discrepanciaResuelta && (
                    <p>La discrepancia fue resuelta.</p>
                  )}
                </div>
              </section>
            ))
          )}
        </>
      )}
    </main>
  );
}
