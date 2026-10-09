import { useState } from "react";
import type { FormEvent } from "react";
import {
  buscarDonanteSchema,
  type BuscarDonanteForm,
} from "../schemas/buscarDonante";
import "../styles/BuscarDonante.css";

type Donante = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  lugarNacimiento: string;
  sexoBiologico: "MASCULINO" | "FEMENINO";
  domicilio: string;
  codigoPostal: string;
  email: string;
  telefonoFijo: string | null;
  telefonoCelular: string;
};

const formInicial: BuscarDonanteForm = {
  dni: "",
  nombre: "",
  apellido: "",
};

export default function BuscarDonante() {
  const [form, setForm] = useState<BuscarDonanteForm>(formInicial);
  const [resultados, setResultados] = useState<Donante[]>([]);
  const [seleccionado, setSeleccionado] = useState<Donante | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [buscando, setBuscando] = useState(false);

  function formatearFecha(fecha: string) {
    const [anio, mes, dia] = fecha.slice(0, 10).split("-");
    return `${dia}/${mes}/${anio}`;
  }

  async function buscar(e: FormEvent) {
    e.preventDefault();

    setMensaje("");
    setSeleccionado(null);

    const parsed = buscarDonanteSchema.safeParse(form);

    if (!parsed.success) {
      setMensaje(parsed.error.issues[0]?.message ?? "Revisá los datos ingresados.");
      return;
    }

    const params = new URLSearchParams();

    if (parsed.data.dni) {
      params.set("dni", parsed.data.dni);
    } else {
      params.set("nombre", parsed.data.nombre);
      params.set("apellido", parsed.data.apellido);
    }

    setBuscando(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/donantes?${params.toString()}`,
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setResultados([]);
        setMensaje(data?.error ?? "No se pudo realizar la búsqueda.");
        return;
      }

      setResultados(data);

      if (data.length === 0) {
        setMensaje("No se encontraron resultados.");
      }
    } catch {
      setResultados([]);
      setMensaje("No se pudo conectar con el servidor.");
    } finally {
      setBuscando(false);
    }
  }

  async function verDetalle(id: number) {
    setMensaje("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/donantes/${id}`,
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setMensaje(data?.error ?? "No se pudo consultar el donante.");
        return;
      }

      setSeleccionado(data);
    } catch {
      setMensaje("No se pudo conectar con el servidor.");
    }
  }

  return (
    <main className="consulta">
      <header className="consulta-header">
        <h1>Buscar donante</h1>
        <p>
          Buscá un donante por DNI o por nombre y apellido.
        </p>
      </header>

      <form onSubmit={buscar} noValidate>
        <fieldset>
          <legend>Criterios de búsqueda</legend>

          <div className="consulta-grid">
            <div className="consulta-field">
              <label htmlFor="dniBusqueda">DNI</label>
              <input
                id="dniBusqueda"
                value={form.dni}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    dni: e.target.value,
                  }))
                }
              />
            </div>

            <div className="consulta-separador">o</div>

            <div className="consulta-field">
              <label htmlFor="nombreBusqueda">Nombre</label>
              <input
                id="nombreBusqueda"
                value={form.nombre}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    nombre: e.target.value,
                  }))
                }
              />
            </div>

            <div className="consulta-field">
              <label htmlFor="apellidoBusqueda">Apellido</label>
              <input
                id="apellidoBusqueda"
                value={form.apellido}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    apellido: e.target.value,
                  }))
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
        <section className="consulta-resultados">
          <h2>Resultados</h2>

          {resultados.map((donante) => (
            <div className="consulta-resultado" key={donante.id}>
              <div>
                <strong>
                  {donante.nombre} {donante.apellido}
                </strong>
                <p>DNI: {donante.dni}</p>
              </div>

              <button
                type="button"
                onClick={() => verDetalle(donante.id)}
              >
                Ver detalle
              </button>
            </div>
          ))}
        </section>
      )}

      {seleccionado && (
        <section className="consulta-detalle">
          <h2>Datos del donante</h2>

          <fieldset>
            <legend>Datos filiatorios</legend>

            <div className="consulta-datos">
              <p><strong>Nombre:</strong> {seleccionado.nombre}</p>
              <p><strong>Apellido:</strong> {seleccionado.apellido}</p>
              <p><strong>DNI:</strong> {seleccionado.dni}</p>
              <p>
                <strong>Fecha de nacimiento:</strong>{" "}
                {formatearFecha(seleccionado.fechaNacimiento)}
              </p>
              <p>
                <strong>Lugar de nacimiento:</strong>{" "}
                {seleccionado.lugarNacimiento}
              </p>
              <p>
                <strong>Sexo biológico:</strong>{" "}
                {seleccionado.sexoBiologico === "MASCULINO"
                  ? "Masculino"
                  : "Femenino"}
              </p>
            </div>
          </fieldset>

          <fieldset>
            <legend>Domicilio y contacto</legend>

            <div className="consulta-datos">
              <p><strong>Domicilio:</strong> {seleccionado.domicilio}</p>
              <p>
                <strong>Código postal:</strong>{" "}
                {seleccionado.codigoPostal}
              </p>
              <p><strong>Email:</strong> {seleccionado.email}</p>
              <p>
                <strong>Teléfono fijo:</strong>{" "}
                {seleccionado.telefonoFijo || "No registrado"}
              </p>
              <p>
                <strong>Teléfono celular:</strong>{" "}
                {seleccionado.telefonoCelular}
              </p>
            </div>
          </fieldset>
        </section>
      )}
    </main>
  );
}