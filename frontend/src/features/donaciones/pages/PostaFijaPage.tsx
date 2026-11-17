import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { rutas } from "@/app/router/paths";
import { SelectorPersona } from "@/features/personas/components/SelectorPersona";
import { catalogosApi } from "@/features/catalogos/api/catalogos.api";
import { donacionesApi } from "@/features/donaciones/api/donaciones.api";
import type { Persona } from "@/features/personas/types";
import { Field } from "@/shared/components/ui/Field";
import { FormActions } from "@/shared/components/ui/FormActions";
import { Notice } from "@/shared/components/ui/Notice";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { PersonBanner } from "@/shared/components/ui/PersonBanner";
import { Section } from "@/shared/components/ui/Section";
import { useQuery } from "@tanstack/react-query";
import { mensajeDeError } from "@/infrastructure/api/errors";
import { presentacionSemaforo } from "@/features/personas/model/semaforo";
import { fechaParaInput, grupoFactorLegible, nombreCompleto } from "@/shared/utils/formato";

type TipoDonacion = "VOLUNTARIO" | "REPOSICION" | "AUTOEXCLUIDO";

export function PostaFijaPage() {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [termino, setTermino] = useState("");
  const [tipo, setTipo] = useState<TipoDonacion>("VOLUNTARIO");
  const [peso, setPeso] = useState("");
  const [tension, setTension] = useState("");
  const [hemoglobina, setHemoglobina] = useState("");
  const [fecha, setFecha] = useState(fechaParaInput(new Date().toISOString()));
  const [operador, setOperador] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [donacionId, setDonacionId] = useState<number | null>(null);

  const catalogos = useQuery({ queryKey: ["catalogos", "consolidado"], queryFn: () => catalogosApi.consolidado() });

  const guardar = useMutation({
    mutationFn: () =>
      donacionesApi.crearCompleta({
        idPersona: persona?.id ?? 0,
        donacion: {
          fecha: fecha || undefined,
          peso: peso ? Number(peso) : null,
          tensionArterial: tension || undefined,
          hemoglobina: hemoglobina ? Number(hemoglobina) : null,
          voluntario: tipo === "VOLUNTARIO",
          reposicion: tipo === "REPOSICION",
          autoexcluido: tipo === "AUTOEXCLUIDO",
          observaciones: observaciones || undefined,
          operador: operador || undefined,
        },
      }),
    onSuccess: (resultado) => setDonacionId(resultado.donacion.id),
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (persona && !guardar.isPending) guardar.mutate();
  }

  return (
    <>
      <PageHeader
        title="Posta fija: registro de donante y donación"
        subtitle={`Donación en curso: DON-${donacionId ?? 1025}. Los datos de persona se precargan por DNI. PCI y serologías se cargan desde “Donaciones y estudios” para esta donación.`}
        actions={
          donacionId ? (
            <Link className="btn btn--primary" to={`${rutas.donacionesEstudios}?donacion=${donacionId}`}>
              Cargar estudios
            </Link>
          ) : undefined
        }
      />

      <Section title="Identificación y datos personales" description="Buscar donante por DNI, nombre o historia clínica">
        <SelectorPersona
          valor={termino}
          onChange={setTermino}
          onSeleccionar={(encontrada) => {
            setPersona(encontrada);
            setTermino(nombreCompleto(encontrada));
          }}
          label="Nombre y apellido / DNI"
        />
        {persona ? (
          <div style={{ marginTop: "var(--s-4)" }}>
            <PersonBanner
              persona={persona}
              estado={presentacionSemaforo(persona.semaforo)}
              datosExtra={[
                `HC ${persona.historiaClinica ?? "—"}`,
                persona.telefono ? `Tel. ${persona.telefono}` : "",
                persona.direccion
                  ? [
                      persona.direccion.calle,
                      persona.direccion.numero,
                      persona.direccion.ciudad?.nombre,
                      persona.direccion.ciudad?.provincia?.nombre,
                    ]
                      .filter(Boolean)
                      .join(" ")
                  : "",
              ]}
            />
            <p className="soft" style={{ marginTop: "var(--s-2)" }}>
              Grupo y factor: {grupoFactorLegible(persona.grupoFactor)} · Fecha de nacimiento:{" "}
              {fechaParaInput(persona.fechaNacimiento) || "Sin dato"}
            </p>
          </div>
        ) : null}
      </Section>

      {guardar.isError ? (
        <Notice tono="danger" titulo="No se pudo registrar la donación">
          {mensajeDeError(guardar.error)}
        </Notice>
      ) : null}

      {donacionId ? (
        <Notice tono="info" titulo="Donación registrada">
          Donación DON-{donacionId}. Desde “Donaciones y estudios” podés cargar PCI, serología de 1ra y 2da muestra.
        </Notice>
      ) : null}

      <form onSubmit={enviar}>
        <Section title="Tipo de donación y destino" description="Voluntario, reposición o autoexcluido">
          <div className="checkbox-row">
            {(
              [
                ["VOLUNTARIO", "Voluntario"],
                ["REPOSICION", "Reposición"],
                ["AUTOEXCLUIDO", "Autoexcluido"],
              ] as const
            ).map(([valor, etiqueta]) => (
              <label className="checkbox" key={valor}>
                <input
                  type="radio"
                  name="tipo-donacion"
                  value={valor}
                  checked={tipo === valor}
                  onChange={() => setTipo(valor)}
                />
                {etiqueta}
              </label>
            ))}
          </div>
          <p className="muted" style={{ marginTop: "var(--s-2)" }}>
            {tipo === "REPOSICION"
              ? "Indicá para qué paciente es la reposición en el historial de la persona."
              : "No aplica (donación voluntaria)."}
          </p>
        </Section>

        <Section title="Controles físicos" description="Datos de la extracción">
          <div className="form-grid">
            <Field label="Fecha" htmlFor="donacion-fecha" ancho={3}>
              <input
                id="donacion-fecha"
                className="input"
                type="date"
                value={fecha}
                onChange={(evento) => setFecha(evento.target.value)}
              />
            </Field>
            <Field label="Peso" htmlFor="donacion-peso" ancho={3}>
              <div className="input-row">
                <input
                  id="donacion-peso"
                  className="input input--data"
                  type="number"
                  step="0.1"
                  value={peso}
                  onChange={(evento) => setPeso(evento.target.value)}
                />
                <span className="input-row__suffix">kg</span>
              </div>
            </Field>
            <Field label="Tensión arterial" htmlFor="donacion-ta" ancho={3}>
              <input
                id="donacion-ta"
                className="input input--data"
                value={tension}
                onChange={(evento) => setTension(evento.target.value)}
                placeholder="110 / 70"
              />
            </Field>
            <Field label="Hemoglobina" htmlFor="donacion-hb" ancho={3}>
              <div className="input-row">
                <input
                  id="donacion-hb"
                  className="input input--data"
                  type="number"
                  step="0.1"
                  value={hemoglobina}
                  onChange={(evento) => setHemoglobina(evento.target.value)}
                />
                <span className="input-row__suffix">g/dl</span>
              </div>
            </Field>
            <Field label="Operador" htmlFor="donacion-operador" ancho={6}>
              <input
                id="donacion-operador"
                className="input"
                value={operador}
                onChange={(evento) => setOperador(evento.target.value)}
              />
            </Field>
            <Field label="Grupo y factor" htmlFor="donacion-gf" ancho={6}>
              <select id="donacion-gf" className="select" defaultValue="">
                <option value="">{persona ? grupoFactorLegible(persona.grupoFactor) : "Sin determinar"}</option>
                {(catalogos.data?.gruposFactor ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {[item.grupo, item.factor].filter(Boolean).join("")}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        <Section
          title="G y F, PCI y serología"
          description="Al seleccionar PCI o Serología se abre la carga para esta donación en “Donaciones y estudios”."
        >
          <div className="link-list">
            <Link className="link-list__item" to={donacionId ? `${rutas.donacionesEstudios}?donacion=${donacionId}` : rutas.donacionesEstudios}>
              <span>PCI (carga diferida)</span>
              <span>Pendiente · Cargar →</span>
            </Link>
            <Link className="link-list__item" to={donacionId ? `${rutas.donacionesEstudios}?donacion=${donacionId}` : rutas.donacionesEstudios}>
              <span>Serología 1ra muestra</span>
              <span>Pendiente · Cargar →</span>
            </Link>
            <Link className="link-list__item" to={donacionId ? `${rutas.donacionesEstudios}?donacion=${donacionId}` : rutas.donacionesEstudios}>
              <span>Serología 2da muestra</span>
              <span>Pendiente · Cargar →</span>
            </Link>
          </div>
        </Section>

        <Section title="Observaciones">
          <Field label="Observaciones" htmlFor="donacion-observaciones" ancho={12}>
            <textarea
              id="donacion-observaciones"
              className="textarea"
              value={observaciones}
              onChange={(evento) => setObservaciones(evento.target.value)}
              placeholder="Sin reacciones adversas durante la extracción."
            />
          </Field>
          <FormActions
            submitLabel="Guardar donación"
            loading={guardar.isPending}
            disabled={!persona}
            onCancel={() => {
              setPersona(null);
              setTermino("");
            }}
          />
        </Section>
      </form>
    </>
  );
}
