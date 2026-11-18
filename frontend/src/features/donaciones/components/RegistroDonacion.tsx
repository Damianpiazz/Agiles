import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SelectorPersona } from "@/features/personas/components/SelectorPersona";
import { donacionesApi } from "@/features/donaciones/api/donaciones.api";
import type { EstudiosInput } from "@/features/donaciones/types";
import type { Persona } from "@/features/personas/types";
import { presentacionSemaforo } from "@/features/personas/model/semaforo";
import { mensajeDeError } from "@/infrastructure/api/errors";
import { Button } from "@/shared/components/ui/Button";
import { Field } from "@/shared/components/ui/Field";
import { FormActions } from "@/shared/components/ui/FormActions";
import { Notice } from "@/shared/components/ui/Notice";
import { PersonBanner } from "@/shared/components/ui/PersonBanner";
import { Section } from "@/shared/components/ui/Section";
import { fechaParaInput, grupoFactorLegible, nombreCompleto, soloDigitos } from "@/shared/utils/formato";

type TipoDonacion = "VOLUNTARIO" | "REPOSICION";

export type FocoEstudios = "PCI" | "PRIMERA" | "SEGUNDA" | "TODOS";

interface RegistroDonacionProps {
  onDonacionCreada: (id: number) => void;
  onAbrirEstudios: (foco: FocoEstudios) => void;
  donacionId: number | null;
  borrador: EstudiosInput | null;
  onBorradorCambiado: (estudios: EstudiosInput | null) => void;
}

const FECHA_POR_DEFECTO = fechaParaInput(new Date().toISOString());

export function RegistroDonacion({
  onDonacionCreada,
  onAbrirEstudios,
  donacionId,
  borrador,
  onBorradorCambiado,
}: RegistroDonacionProps) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [termino, setTermino] = useState("");
  const [tipo, setTipo] = useState<TipoDonacion>("VOLUNTARIO");
  const [dniReceptor, setDniReceptor] = useState("");
  const [peso, setPeso] = useState("");
  const [tension, setTension] = useState("");
  const [hemoglobina, setHemoglobina] = useState("");
  const [fecha, setFecha] = useState(FECHA_POR_DEFECTO);
  const [operador, setOperador] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [errorReceptor, setErrorReceptor] = useState("");
  const queryClient = useQueryClient();

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
          ...(tipo === "REPOSICION" ? { dniReceptorReposicion: soloDigitos(dniReceptor) } : {}),
          observaciones: observaciones || undefined,
          operador: operador || undefined,
        },
        ...(borrador ? { serologias: borrador.serologias, pci: borrador.pci } : {}),
      }),
    onSuccess: async (resultado) => {
      await queryClient.invalidateQueries({ queryKey: ["donaciones", "listar"] });
      onBorradorCambiado(null);
      onDonacionCreada(resultado.donacion.id);
    },
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!persona || guardar.isPending) return;

    if (tipo === "REPOSICION" && !/^\d{5,12}$/.test(soloDigitos(dniReceptor))) {
      setErrorReceptor("Indicá el DNI del paciente receptor de la reposición.");
      return;
    }
    setErrorReceptor("");
    guardar.mutate();
  }

  return (
    <>
      {guardar.isError ? (
        <Notice tono="danger" titulo="No se pudo registrar la donación">
          {mensajeDeError(guardar.error)}
        </Notice>
      ) : null}

      {donacionId ? (
        <Notice tono="info" titulo="Donación registrada">
          Donación DON-{donacionId}. Los botones de PCI y serologías cargan los resultados de esta donación.
        </Notice>
      ) : null}

      <Section
        title="Identificación y datos personales"
        description="Buscar donante por DNI, nombre o historia clínica"
      >
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
              ]}
            />
          </div>
        ) : null}
      </Section>

      <form onSubmit={enviar}>
        <div className="posta-form-grid">
          <Section title="Tipo de donación y destino" description="Indicá el tipo y, si corresponde, el receptor">
            <div className="checkbox-row">
              {(
                [
                  ["VOLUNTARIO", "Voluntario"],
                  ["REPOSICION", "Reposición"],
                ] as const
              ).map(([valor, etiqueta]) => (
                <label className="checkbox" key={valor}>
                  <input
                    type="radio"
                    name="tipo-donacion"
                    value={valor}
                    checked={tipo === valor}
                    onChange={() => {
                      setTipo(valor);
                      setErrorReceptor("");
                    }}
                  />
                  {etiqueta}
                </label>
              ))}
            </div>

            {tipo === "REPOSICION" ? (
              <Field
                label="DNI del paciente receptor"
                htmlFor="donacion-dni-receptor"
                ancho={12}
                hint="Obligatorio cuando la donación es para reposición."
                error={errorReceptor}
              >
                <input
                  id="donacion-dni-receptor"
                  className="input input--data"
                  inputMode="numeric"
                  value={dniReceptor}
                  onChange={(evento) => {
                    setDniReceptor(soloDigitos(evento.target.value));
                    setErrorReceptor("");
                  }}
                  placeholder="DNI de quien recibe la sangre"
                  aria-invalid={Boolean(errorReceptor)}
                />
              </Field>
            ) : null}
          </Section>

          <Section title="Controles físicos y G y F" description="Datos de la extracción">
            <div className="form-grid">
              <Field label="Fecha" htmlFor="donacion-fecha" ancho={4}>
                <input
                  id="donacion-fecha"
                  className="input"
                  type="date"
                  value={fecha}
                  onChange={(evento) => setFecha(evento.target.value)}
                />
              </Field>
              <Field label="Peso" htmlFor="donacion-peso" ancho={4}>
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
              <Field label="Tensión arterial" htmlFor="donacion-ta" ancho={4}>
                <input
                  id="donacion-ta"
                  className="input input--data"
                  value={tension}
                  onChange={(evento) => setTension(evento.target.value)}
                  placeholder="110 / 70"
                />
              </Field>
              <Field label="Hemoglobina" htmlFor="donacion-hb" ancho={4}>
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
              <Field label="Operador" htmlFor="donacion-operador" ancho={8}>
                <input
                  id="donacion-operador"
                  className="input"
                  value={operador}
                  onChange={(evento) => setOperador(evento.target.value)}
                />
              </Field>
              <Field label="G y F (según donante)" htmlFor="donacion-gf" ancho={4}>
                <input
                  id="donacion-gf"
                  className="input input--data"
                  readOnly
                  value={persona ? grupoFactorLegible(persona.grupoFactor) : "Sin donante"}
                />
              </Field>
            </div>
          </Section>
        </div>

        <Section
          title="G y F, PCI y serología"
          description={
            borrador
              ? "Resultados listos para guardarse junto con la donación."
              : "Los resultados se cargan en un modal; podés hacerlo antes o después de guardar."
          }
        >
          <div className="estudios-acciones">
            <Button type="button" variant="secondary" onClick={() => onAbrirEstudios("PCI")}>
              PCI <span className="muted">· Cargar →</span>
            </Button>
            <Button type="button" variant="secondary" onClick={() => onAbrirEstudios("PRIMERA")}>
              Serología 1ra muestra <span className="muted">· Cargar →</span>
            </Button>
            <Button type="button" variant="secondary" onClick={() => onAbrirEstudios("SEGUNDA")}>
              Serología 2da muestra <span className="muted">· Cargar →</span>
            </Button>
          </div>
          {borrador ? (
            <div className="estudios-borrador">
              <Notice tono="info" titulo="Estudios cargados">
                Se guardarán con la donación al presionar “Guardar donación”.
              </Notice>
              <Button type="button" size="sm" variant="ghost" onClick={() => onBorradorCambiado(null)}>
                Quitar resultados
              </Button>
            </div>
          ) : null}
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
              setDniReceptor("");
            }}
          />
        </Section>
      </form>
    </>
  );
}
