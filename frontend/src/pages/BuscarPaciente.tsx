import { useState } from "react";
import type { FormEvent } from "react";
import "../styles/BuscarDonante.css";

type Paciente = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  operador: string;
  createdAt: string;
};

type FormularioBusqueda = {
  dni: string;
  nombre: string;
  apellido: string;
};

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const formularioInicial: FormularioBusqueda = {
  dni: "",
  nombre: "",
  apellido: "",
};

function esPaciente(value: unknown): value is Paciente {
  if (!value || typeof value !== "object") return false;

  const paciente = value as Record<string, unknown>;
  return (
    Number.isInteger(paciente.id) &&
    typeof paciente.nombre === "string" &&
    typeof paciente.apellido === "string" &&
    typeof paciente.dni === "string" &&
    typeof paciente.fechaNacimiento === "string" &&
    typeof paciente.operador === "string" &&
    typeof paciente.createdAt === "string"
  );
}

function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}

function formatearFechaHora(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(fecha));
}

export default function BuscarPaciente() {
  const [form, setForm] = useState(formularioInicial);
  const [resultados, setResultados] = useState<Paciente[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [buscando, setBuscando] = useState(false);

  async function buscar(event: FormEvent) {
    event.preventDefault();
    setMensaje("");
    setResultados([]);

    const dni = form.dni.trim();
    const nombre = form.nombre.trim();
    const apellido = form.apellido.trim();

    if (dni && !/^\d{7,8}$/.test(dni)) {
      setMensaje("Ingresá un DNI válido de 7 u 8 dígitos.");
      return;
    }

    if (!dni && (!nombre || !apellido)) {
      setMensaje("Ingresá un DNI o completá nombre y apellido.");
      return;
    }

    const params = new URLSearchParams();
    if (dni) {
      params.set("dni", dni);
    } else {
      params.set("nombre", nombre);
      params.set("apellido", apellido);
    }

    setBuscando(true);
    try {
      const response = await fetch(
        `${API_URL}/api/pacientes?${params.toString()}`,
      );
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const detalle =
          data && typeof data === "object" && "error" in data
            ? data.error
            : null;
        setMensaje(
          typeof detalle === "string"
            ? detalle
            : "No se pudo realizar la búsqueda.",
        );
        return;
      }

      if (!Array.isArray(data) || !data.every(esPaciente)) {
        setMensaje("El servidor devolvió resultados con un formato inválido.");
        return;
      }

      setResultados(data);
      if (data.length === 0) setMensaje("No se encontraron pacientes.");
    } catch {
      setMensaje("No se pudo conectar con el servidor.");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <main className="consulta">
      <header className="consulta-header">
        <h1>Buscar paciente</h1>
        <p>Buscá pacientes o receptores por DNI, o por nombre y apellido.</p>
      </header>

      <form onSubmit={buscar} noValidate>
        <fieldset>
          <legend>Criterios de búsqueda</legend>
          <div className="consulta-grid">
            <div className="consulta-field">
              <label htmlFor="dniPacienteBusqueda">DNI</label>
              <input
                id="dniPacienteBusqueda"
                inputMode="numeric"
                value={form.dni}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, dni: event.target.value }))
                }
              />
            </div>

            <div className="consulta-separador">o</div>

            <div className="consulta-field">
              <label htmlFor="nombrePacienteBusqueda">Nombre</label>
              <input
                id="nombrePacienteBusqueda"
                value={form.nombre}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, nombre: event.target.value }))
                }
              />
            </div>

            <div className="consulta-field">
              <label htmlFor="apellidoPacienteBusqueda">Apellido</label>
              <input
                id="apellidoPacienteBusqueda"
                value={form.apellido}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, apellido: event.target.value }))
                }
              />
            </div>
          </div>
        </fieldset>

        <div className="consulta-actions">
          <button type="submit" disabled={buscando}>
            {buscando ? "Buscando…" : "Buscar"}
          </button>
        </div>
      </form>

      {mensaje && (
        <div className="consulta-banner" role="status">
          {mensaje}
        </div>
      )}

      {resultados.length > 0 && (
        <section className="consulta-resultados" aria-live="polite">
          <h2>Resultados</h2>
          {resultados.map((paciente) => (
            <article className="consulta-resultado" key={paciente.id}>
              <div>
                <strong>
                  {paciente.nombre} {paciente.apellido}
                </strong>
                <p>DNI: {paciente.dni}</p>
                <p>Fecha de nacimiento: {formatearFecha(paciente.fechaNacimiento)}</p>
                <p>Registrado por: {paciente.operador}</p>
                <p>Fecha y hora de alta: {formatearFechaHora(paciente.createdAt)}</p>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
