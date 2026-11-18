import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogosApi } from "@/features/catalogos/api/catalogos.api";
import { donacionesApi } from "@/features/donaciones/api/donaciones.api";
import type { EstudiosInput } from "@/features/donaciones/types";
import { mensajeDeError } from "@/infrastructure/api/errors";
import { Button } from "@/shared/components/ui/Button";
import { Field } from "@/shared/components/ui/Field";
import { Notice } from "@/shared/components/ui/Notice";
import { documentoLegible, fechaParaInput, formatoFecha, nombreCompleto } from "@/shared/utils/formato";
import type { FocoEstudios } from "./RegistroDonacion";
import { SelectorResultados, type ResultadoElegido } from "./SelectorResultados";

const FECHA_POR_DEFECTO = fechaParaInput(new Date().toISOString());
const HORA_POR_DEFECTO = new Date().toTimeString().slice(0, 5);

interface EstudiosModalProps {
  /** `null` = carga directa: los resultados se guardan con la donación nueva. */
  donacionId: number | null;
  foco: FocoEstudios;
  onCerrar: () => void;
  onGuardarBorrador?: (estudios: EstudiosInput) => void;
}

export function EstudiosModal({ donacionId, foco, onCerrar, onGuardarBorrador }: EstudiosModalProps) {
  const [panel, setPanel] = useState<Exclude<FocoEstudios, "TODOS">>(
    foco === "TODOS" ? "PRIMERA" : foco,
  );
  const [fecha, setFecha] = useState(FECHA_POR_DEFECTO);
  const [hora, setHora] = useState(HORA_POR_DEFECTO);
  const [operador, setOperador] = useState("");
  const [serologia1, setSerologia1] = useState<ResultadoElegido[]>([]);
  const [serologia2, setSerologia2] = useState<ResultadoElegido[]>([]);
  const [pci, setPci] = useState<ResultadoElegido[]>([]);
  const queryClient = useQueryClient();

  const estudios = useQuery({
    queryKey: ["donaciones", "estudios", donacionId],
    queryFn: () => donacionesApi.estudios(donacionId ?? 0),
    enabled: donacionId !== null,
  });
  const catalogos = useQuery({ queryKey: ["catalogos", "consolidado"], queryFn: () => catalogosApi.consolidado() });

  useEffect(() => {
    if (donacionId === null || !estudios.data) return;
    setOperador(estudios.data.donacion.operador ?? "");
    setSerologia1(resultadosDesde(estudios.data.serologiaPrimera?.resultados, "determinacionSerologica"));
    setSerologia2(resultadosDesde(estudios.data.serologiaSegunda?.resultados, "determinacionSerologica"));
    setPci(resultadosDesde(estudios.data.pci?.resultados, "antigeno"));
  }, [donacionId, estudios.data]);

  useEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onCerrar]);

  const guardar = useMutation({
    mutationFn: () => {
      const input = construirInput({ fecha, hora, operador, serologia1, serologia2, pci });
      return donacionesApi.guardarEstudios(donacionId ?? 0, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["donaciones", "estudios", donacionId] });
      await queryClient.invalidateQueries({ queryKey: ["donaciones", "listar"] });
    },
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (donacionId === null) {
      onGuardarBorrador?.(construirInput({ fecha, hora, operador, serologia1, serologia2, pci }));
      onCerrar();
      return;
    }
    if (!guardar.isPending) guardar.mutate();
  }

  const contexto = estudios.data;
  const determinaciones = catalogos.data?.determinacionesSerologicas ?? [];
  const antigenos = catalogos.data?.antigenos ?? [];

  return (
    <div className="modal-backdrop" onMouseDown={(evento) => evento.target === evento.currentTarget && onCerrar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="estudios-modal-titulo">
        <div className="modal__head">
          <div>
            <h2 id="estudios-modal-titulo" className="modal__title">
              PCI y serologías {donacionId !== null ? `· DON-${donacionId}` : "· carga directa"}
            </h2>
            {contexto ? (
              <p className="modal__subtitle">
                {nombreCompleto(contexto.persona)} (DNI {documentoLegible(contexto.persona?.dni)}) ·{" "}
                {formatoFecha(contexto.donacion.fecha)} · G y F{" "}
                {contexto.grupoFactor
                  ? [contexto.grupoFactor.grupo, contexto.grupoFactor.factor].filter(Boolean).join("")
                  : "—"}
              </p>
            ) : (
              <p className="modal__subtitle">
                Elegí solo las determinaciones a cargar. Se guardan junto con la donación nueva.
              </p>
            )}
          </div>
          <button type="button" className="modal__cerrar" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </div>

        <form onSubmit={enviar} className="modal__body">
          <div className="form-grid modal__metadata">
            <Field label="Fecha" htmlFor="estudios-fecha" ancho={4}>
              <input
                id="estudios-fecha"
                className="input"
                type="date"
                value={fecha}
                onChange={(evento) => setFecha(evento.target.value)}
              />
            </Field>
            <Field label="Hora" htmlFor="estudios-hora" ancho={4}>
              <input
                id="estudios-hora"
                className="input input--data"
                type="time"
                value={hora}
                onChange={(evento) => setHora(evento.target.value)}
              />
            </Field>
            <Field label="Operador" htmlFor="estudios-operador" ancho={4}>
              <input
                id="estudios-operador"
                className="input"
                value={operador}
                onChange={(evento) => setOperador(evento.target.value)}
              />
            </Field>
          </div>

          <div className="modal__tabs" role="tablist" aria-label="Tipo de estudio">
            {(
              [
                ["PRIMERA", "Serología 1ra"],
                ["SEGUNDA", "Serología 2da"],
                ["PCI", "PCI"],
              ] as const
            ).map(([id, etiqueta]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={panel === id}
                className={`modal__tab ${panel === id ? "modal__tab--activo" : ""}`}
                onClick={() => setPanel(id)}
              >
                {etiqueta}
              </button>
            ))}
          </div>

          <div className="modal__panel" role="tabpanel">
            {panel === "PRIMERA" ? (
              <SelectorResultados
                items={determinaciones}
                valores={serologia1}
                onChange={setSerologia1}
                etiquetaItem="determinación"
                idAyuda="ayuda-serologia-1"
              />
            ) : null}
            {panel === "SEGUNDA" ? (
              <SelectorResultados
                items={determinaciones}
                valores={serologia2}
                onChange={setSerologia2}
                etiquetaItem="determinación"
                idAyuda="ayuda-serologia-2"
              />
            ) : null}
            {panel === "PCI" ? (
              <SelectorResultados
                items={antigenos}
                valores={pci}
                onChange={setPci}
                etiquetaItem="antígeno"
                idAyuda="ayuda-pci"
              />
            ) : null}
          </div>

          {guardar.isError ? (
            <Notice tono="danger" titulo="No se pudieron guardar los resultados">
              {mensajeDeError(guardar.error)}
            </Notice>
          ) : null}
          {guardar.isSuccess ? (
            <Notice tono="info" titulo="Resultados guardados">
              Estado de la donación: {guardar.data.estado.etiqueta}.
            </Notice>
          ) : null}

          <div className="modal__actions">
            <Button type="button" variant="ghost" onClick={onCerrar}>
              Cerrar
            </Button>
            <Button type="submit" variant="primary" loading={guardar.isPending}>
              {donacionId === null ? "Aplicar a la donación" : "Guardar resultados"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DatosInput {
  fecha: string;
  hora: string;
  operador: string;
  serologia1: ResultadoElegido[];
  serologia2: ResultadoElegido[];
  pci: ResultadoElegido[];
}

function construirInput({ fecha, hora, operador, serologia1, serologia2, pci }: DatosInput): EstudiosInput {
  return {
    serologias: [
      {
        tipoMuestra: "PRIMERA",
        fecha,
        hora,
        operador: operador || undefined,
        resultados: serologia1.map((fila) => ({
          determinacionSerologicaId: fila.id,
          resultado: fila.resultado,
          observacion: fila.observacion || undefined,
        })),
      },
      {
        tipoMuestra: "SEGUNDA",
        fecha,
        hora,
        operador: operador || undefined,
        resultados: serologia2.map((fila) => ({
          determinacionSerologicaId: fila.id,
          resultado: fila.resultado,
          observacion: fila.observacion || undefined,
        })),
      },
    ],
    pci: {
      fecha,
      hora,
      operador: operador || undefined,
      resultados: pci.map((fila) => ({
        antigenoId: fila.id,
        resultado: fila.resultado,
        observacion: fila.observacion || undefined,
      })),
    },
  };
}

function resultadosDesde(
  resultados:
    | Array<{
        id?: number;
        resultado: string;
        observacion?: string | null;
        determinacionSerologica?: { id?: number; nombre?: string | null } | null;
        antigeno?: { id?: number; nombre?: string | null } | null;
      }>
    | undefined,
  clave: "determinacionSerologica" | "antigeno",
): ResultadoElegido[] {
  return (resultados ?? []).flatMap((item) => {
    const detalle = item[clave];
    const id = detalle?.id;
    if (!id) return [];
    const resultado = item.resultado.toLowerCase().includes("posit") ? "Positivo" : "Negativo";
    return [
      {
        id,
        nombre: detalle?.nombre ?? `${clave} ${id}`,
        resultado,
        observacion: item.observacion ?? "",
      },
    ];
  });
}
