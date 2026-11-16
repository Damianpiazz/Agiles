import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { z } from "zod";
import {
  buscarDonanteSchema,
  type BuscarDonanteForm,
} from "../schemas/buscarDonante";
import {
  actualizarDonanteSchema,
  type ActualizarDonanteForm,
} from "../schemas/donante";
import { PREGUNTAS_CUESTIONARIO } from "../schemas/entrevista";
import type { Donante } from "../types/donante";
import "../styles/BuscarDonante.css";

type Props = {
  onRegistrarDonacion?: (donante: Donante) => void;
};

type EntrevistaDonacion = {
  id: number;
  resultadoAdmision: "ADMITIDO" | "DIFERIDO";
  tipoDiferimiento: "TEMPORAL" | "PERMANENTE" | null;
  causaDiferimiento: string | null;
  entrevistador: string | null;
  respuestas: Record<string, boolean>;
  createdAt: string;
};

type AnticuerpoIrregularHistorial = {
  id: number;
  resultado: "POSITIVO" | "NEGATIVO";
  operador: string;
  fechaHora: string;
  observacion: string | null;
  createdAt: string;
  updatedAt: string;
};

type DonacionHistorial = {
  id: number;
  fechaHora: string;
  estado: "REGISTRADA" | "EN_CALIFICACION" | "CALIFICADA" | "RECHAZADA";
  operador: string;
  peso: string | null;
  tensionArterial: string | null;
  hemoglobina: string | null;
  voluntario: boolean;
  reposicion: boolean;
  autoExcluido: boolean;
  observaciones: string | null;
  entrevista: EntrevistaDonacion | null;
  anticuerpoIrregular: AnticuerpoIrregularHistorial | null;
};

type DonanteDetalle = Donante & { donaciones?: DonacionHistorial[] };

type CampoEdicion = keyof ActualizarDonanteForm;
type FormEdicionState = Record<CampoEdicion, string>;
type ErroresEdicion = Partial<Record<CampoEdicion, string[]>>;
type BannerEdicion = { tipo: "ok" | "error"; texto: string } | null;

const formInicial: BuscarDonanteForm = {
  dni: "",
  nombre: "",
  apellido: "",
};

const formEdicionVacio: FormEdicionState = {
  domicilio: "",
  codigoPostal: "",
  email: "",
  telefonoFijo: "",
  telefonoCelular: "",
  operador: "",
};

export default function BuscarDonante({ onRegistrarDonacion }: Props) {
  const [form, setForm] = useState<BuscarDonanteForm>(formInicial);
  const [resultados, setResultados] = useState<DonanteDetalle[]>([]);
  const [seleccionado, setSeleccionado] = useState<DonanteDetalle | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [buscando, setBuscando] = useState(false);

  const [editando, setEditando] = useState(false);
  const [formEdicion, setFormEdicion] = useState<FormEdicionState>(formEdicionVacio);
  const [erroresEdicion, setErroresEdicion] = useState<ErroresEdicion>({});
  const [bannerEdicion, setBannerEdicion] = useState<BannerEdicion>(null);
  const [guardando, setGuardando] = useState(false);

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

  function estadoDonacion(estado: DonacionHistorial["estado"]) {
    const etiquetas: Record<DonacionHistorial["estado"], string> = {
      REGISTRADA: "Registrada",
      EN_CALIFICACION: "En calificación",
      CALIFICADA: "Calificada",
      RECHAZADA: "Rechazada / bloqueada",
    };
    return etiquetas[estado];
  }

  function iniciarEdicion(donante: DonanteDetalle) {
    setFormEdicion({
      domicilio: donante.domicilio,
      codigoPostal: donante.codigoPostal,
      email: donante.email,
      telefonoFijo: donante.telefonoFijo ?? "",
      telefonoCelular: donante.telefonoCelular,
      operador: "",
    });
    setErroresEdicion({});
    setBannerEdicion(null);
    setEditando(true);
  }

  function cancelarEdicion() {
    setEditando(false);
    setErroresEdicion({});
    setBannerEdicion(null);
  }

  function onChangeEdicion(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormEdicion((prev) => ({ ...prev, [name]: value }));
  }

  function errorDeEdicion(campo: CampoEdicion) {
    return erroresEdicion[campo]?.[0];
  }

  async function guardarEdicion(e: FormEvent) {
    e.preventDefault();
    if (!seleccionado) return;

    setBannerEdicion(null);

    const parsed = actualizarDonanteSchema.safeParse(formEdicion);
    if (!parsed.success) {
      setErroresEdicion(z.flattenError(parsed.error).fieldErrors as ErroresEdicion);
      setBannerEdicion({ tipo: "error", texto: "Revisá los campos marcados." });
      return;
    }

    setErroresEdicion({});
    setGuardando(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/donantes/${seleccionado.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 400 && data?.campos) {
          setErroresEdicion(data.campos as ErroresEdicion);
          setBannerEdicion({ tipo: "error", texto: "Revisá los campos marcados." });
          return;
        }
        setBannerEdicion({
          tipo: "error",
          texto: data?.error ?? "No se pudieron actualizar los datos del donante.",
        });
        return;
      }

      const actualizado: DonanteDetalle = data;
      setSeleccionado(actualizado);
      setResultados((prev) =>
        prev.map((d) => (d.id === actualizado.id ? { ...d, ...actualizado } : d)),
      );
      setEditando(false);
      setBannerEdicion({
        tipo: "ok",
        texto: `Datos actualizados correctamente. Operador: ${actualizado.operadorModificacion ?? parsed.data.operador} · Fecha y hora: ${actualizado.updatedAt ? formatearFechaHora(actualizado.updatedAt) : formatearFechaHora(new Date().toISOString())}`,
      });
    } catch {
      setBannerEdicion({
        tipo: "error",
        texto: "No se pudo conectar con el servidor.",
      });
    } finally {
      setGuardando(false);
    }
  }

  async function buscar(e: FormEvent) {
    e.preventDefault();

    setMensaje("");
    setSeleccionado(null);
    setEditando(false);
    setBannerEdicion(null);

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
    setEditando(false);
    setBannerEdicion(null);
    setErroresEdicion({});

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

              <div className="consulta-resultado-acciones">
                <button
                  type="button"
                  onClick={() => verDetalle(donante.id)}
                >
                  Ver detalle
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {seleccionado && (
        <section className="consulta-detalle">
          <h2>Datos del donante</h2>

          {bannerEdicion && (
            <div
              className={`consulta-banner ${
                bannerEdicion.tipo === "ok"
                  ? "consulta-banner-ok"
                  : "consulta-banner-error"
              }`}
              role="status"
            >
              {bannerEdicion.texto}
            </div>
          )}

          {seleccionado.operadorModificacion && seleccionado.updatedAt && (
            <p className="consulta-trazabilidad">
              Última modificación por <strong>{seleccionado.operadorModificacion}</strong> el{" "}
              <strong>{formatearFechaHora(seleccionado.updatedAt)}</strong>
            </p>
          )}

          {!editando && (
            <div className="consulta-actions consulta-actions-ficha">
              <button
                type="button"
                onClick={() => iniciarEdicion(seleccionado)}
              >
                Modificar datos
              </button>
              {onRegistrarDonacion && (
                <button
                  type="button"
                  onClick={() => onRegistrarDonacion(seleccionado)}
                >
                  Registrar donación
                </button>
              )}
            </div>
          )}

          {editando ? (
            <form onSubmit={guardarEdicion} noValidate className="consulta-form-edicion">
              <fieldset>
                <legend>Datos filiatorios (no modificables)</legend>
                <div className="consulta-edicion-grid">
                  <div className="consulta-field">
                    <label htmlFor="edicionNombre">Nombre</label>
                    <input
                      id="edicionNombre"
                      value={seleccionado.nombre}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="consulta-field">
                    <label htmlFor="edicionApellido">Apellido</label>
                    <input
                      id="edicionApellido"
                      value={seleccionado.apellido}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="consulta-field">
                    <label htmlFor="edicionDni">DNI</label>
                    <input
                      id="edicionDni"
                      value={seleccionado.dni}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="consulta-field">
                    <label htmlFor="edicionFechaNacimiento">Fecha de nacimiento</label>
                    <input
                      id="edicionFechaNacimiento"
                      value={formatearFecha(seleccionado.fechaNacimiento)}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="consulta-field">
                    <label htmlFor="edicionLugarNacimiento">Lugar de nacimiento</label>
                    <input
                      id="edicionLugarNacimiento"
                      value={seleccionado.lugarNacimiento}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="consulta-field">
                    <label htmlFor="edicionSexoBiologico">Sexo biológico</label>
                    <input
                      id="edicionSexoBiologico"
                      value={
                        seleccionado.sexoBiologico === "MASCULINO"
                          ? "Masculino"
                          : "Femenino"
                      }
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend>Domicilio y contacto</legend>
                <div className="consulta-edicion-grid">
                  <div className="consulta-field">
                    <label htmlFor="edicionDomicilio">Domicilio</label>
                    <input
                      id="edicionDomicilio"
                      name="domicilio"
                      value={formEdicion.domicilio}
                      onChange={onChangeEdicion}
                      aria-invalid={Boolean(errorDeEdicion("domicilio"))}
                    />
                    {errorDeEdicion("domicilio") && (
                      <p className="consulta-error">{errorDeEdicion("domicilio")}</p>
                    )}
                  </div>

                  <div className="consulta-field">
                    <label htmlFor="edicionCodigoPostal">Código postal</label>
                    <input
                      id="edicionCodigoPostal"
                      name="codigoPostal"
                      value={formEdicion.codigoPostal}
                      onChange={onChangeEdicion}
                      aria-invalid={Boolean(errorDeEdicion("codigoPostal"))}
                    />
                    {errorDeEdicion("codigoPostal") && (
                      <p className="consulta-error">{errorDeEdicion("codigoPostal")}</p>
                    )}
                  </div>

                  <div className="consulta-field">
                    <label htmlFor="edicionEmail">Email</label>
                    <input
                      id="edicionEmail"
                      name="email"
                      type="email"
                      value={formEdicion.email}
                      onChange={onChangeEdicion}
                      aria-invalid={Boolean(errorDeEdicion("email"))}
                    />
                    {errorDeEdicion("email") && (
                      <p className="consulta-error">{errorDeEdicion("email")}</p>
                    )}
                  </div>

                  <div className="consulta-field">
                    <label htmlFor="edicionTelefonoFijo">
                      Teléfono fijo <span className="consulta-optional">(opcional)</span>
                    </label>
                    <input
                      id="edicionTelefonoFijo"
                      name="telefonoFijo"
                      value={formEdicion.telefonoFijo}
                      onChange={onChangeEdicion}
                      aria-invalid={Boolean(errorDeEdicion("telefonoFijo"))}
                    />
                    {errorDeEdicion("telefonoFijo") && (
                      <p className="consulta-error">{errorDeEdicion("telefonoFijo")}</p>
                    )}
                  </div>

                  <div className="consulta-field">
                    <label htmlFor="edicionTelefonoCelular">Teléfono celular</label>
                    <input
                      id="edicionTelefonoCelular"
                      name="telefonoCelular"
                      value={formEdicion.telefonoCelular}
                      onChange={onChangeEdicion}
                      aria-invalid={Boolean(errorDeEdicion("telefonoCelular"))}
                    />
                    {errorDeEdicion("telefonoCelular") && (
                      <p className="consulta-error">{errorDeEdicion("telefonoCelular")}</p>
                    )}
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend>Registro de la modificación</legend>
                <div className="consulta-edicion-grid">
                  <div className="consulta-field">
                    <label htmlFor="edicionOperador">Operador responsable</label>
                    <input
                      id="edicionOperador"
                      name="operador"
                      value={formEdicion.operador}
                      onChange={onChangeEdicion}
                      placeholder="Nombre y apellido del operador"
                      aria-invalid={Boolean(errorDeEdicion("operador"))}
                    />
                    {errorDeEdicion("operador") && (
                      <p className="consulta-error">{errorDeEdicion("operador")}</p>
                    )}
                  </div>
                </div>
              </fieldset>

              <div className="consulta-actions consulta-actions-edicion">
                <button type="submit" disabled={guardando}>
                  {guardando ? "Guardando…" : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  className="consulta-btn-secundario"
                  onClick={cancelarEdicion}
                  disabled={guardando}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <>
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
            </>
          )}

          <fieldset>
            <legend>Historial de donaciones</legend>
            {seleccionado.donaciones?.length ? (
              <div className="consulta-donaciones">
                {seleccionado.donaciones.map((donacion) => (
                  <article className="consulta-donacion" key={donacion.id}>
                    <div className="consulta-donacion-header">
                      <h3>Donación #{donacion.id}</h3>
                      <span className={`consulta-estado consulta-estado-${donacion.estado.toLowerCase()}`}>
                        {estadoDonacion(donacion.estado)}
                      </span>
                    </div>
                    <div className="consulta-datos">
                      <p>
                        <strong>Fecha:</strong> {formatearFechaHora(donacion.fechaHora)}
                      </p>
                      <p><strong>Operador:</strong> {donacion.operador}</p>
                      <p><strong>Peso:</strong> {donacion.peso || "No registrado"}</p>
                      <p><strong>Tensión arterial:</strong> {donacion.tensionArterial || "No registrada"}</p>
                      <p><strong>Hemoglobina:</strong> {donacion.hemoglobina || "No registrada"}</p>
                      <p>
                        <strong>Modalidad:</strong>{" "}
                        {donacion.voluntario ? "Voluntaria" : donacion.reposicion ? "Reposición" : "No especificada"}
                      </p>
                      {donacion.autoExcluido && (
                        <p><strong>Autoexclusión:</strong> Sí</p>
                      )}
                      {donacion.observaciones && (
                        <p><strong>Observaciones:</strong> {donacion.observaciones}</p>
                      )}
                    </div>
                    {donacion.anticuerpoIrregular ? (
                      <div className="consulta-anticuerpo-donacion">
                        <h4>Resultado inmune / anticuerpos irregulares</h4>
                        <div className="consulta-datos">
                          <p>
                            <strong>Resultado:</strong>{" "}
                            {donacion.anticuerpoIrregular.resultado === "POSITIVO"
                              ? "Positivo"
                              : "Negativo"}
                          </p>
                          <p>
                            <strong>Operador:</strong>{" "}
                            {donacion.anticuerpoIrregular.operador}
                          </p>
                          <p>
                            <strong>Fecha:</strong>{" "}
                            {formatearFechaHora(donacion.anticuerpoIrregular.fechaHora)}
                          </p>
                          {donacion.anticuerpoIrregular.observacion && (
                            <p>
                              <strong>Observación:</strong>{" "}
                              {donacion.anticuerpoIrregular.observacion}
                            </p>
                          )}
                          {donacion.anticuerpoIrregular.resultado === "POSITIVO" && (
                            <p>
                              <strong>Acción:</strong> Reservar para receptor sin el antígeno correspondiente o desplasmatizar completamente. No se recomienda utilizar componentes plasmáticos derivados.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="consulta-sin-anticuerpo">
                        Sin registro de anticuerpos irregulares.
                      </p>
                    )}

                    {donacion.entrevista ? (
                      <details className="consulta-entrevista-donacion">
                        <summary>Ver entrevista pre-donación</summary>
                        <div className="consulta-entrevista-contenido">
                          <div className="consulta-datos">
                            <p>
                              <strong>Resultado:</strong>{" "}
                              {donacion.entrevista.resultadoAdmision === "ADMITIDO"
                                ? "Admitido"
                                : "Diferido"}
                            </p>
                            <p>
                              <strong>Personal entrevistador:</strong>{" "}
                              {donacion.entrevista.entrevistador || "No registrado"}
                            </p>
                            <p>
                              <strong>Fecha:</strong>{" "}
                              {formatearFechaHora(donacion.entrevista.createdAt)}
                            </p>
                            {donacion.entrevista.resultadoAdmision === "DIFERIDO" && (
                              <>
                                <p>
                                  <strong>Tipo de diferimiento:</strong>{" "}
                                  {donacion.entrevista.tipoDiferimiento || "No registrado"}
                                </p>
                                <p>
                                  <strong>Causa:</strong>{" "}
                                  {donacion.entrevista.causaDiferimiento || "No registrada"}
                                </p>
                              </>
                            )}
                          </div>
                          <h4>Respuestas del cuestionario</h4>
                          <ul className="consulta-respuestas-entrevista">
                            {Object.entries(donacion.entrevista.respuestas).map(
                              ([clave, respuesta]) => (
                                <li key={clave}>
                                  <strong>
                                    {PREGUNTAS_CUESTIONARIO.find(
                                      (pregunta) => pregunta.clave === clave,
                                    )?.texto ?? clave}
                                  </strong>
                                  <span>{respuesta ? "Sí" : "No"}</span>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      </details>
                    ) : (
                      <p className="consulta-sin-entrevista">
                        Esta donación no tiene una entrevista asociada.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p>No hay donaciones registradas para este donante.</p>
            )}
          </fieldset>

        </section>
      )}
    </main>
  );
}
