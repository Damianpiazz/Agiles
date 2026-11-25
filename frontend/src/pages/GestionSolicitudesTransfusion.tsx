import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Banner } from "../components/Banner";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { FormSteps } from "../components/FormSteps";
import { PageHeader } from "../components/PageHeader";
import { EmptyState, LoadingState } from "../components/States";
import { StatusBadge } from "../components/StatusBadge";
import {
  aprobarSolicitudTransfusionSchema,
  solicitudTransfusionFormSchema,
  type SolicitudTransfusionFormInput,
} from "../schemas/solicitudTransfusion";
import "../styles/GestionSolicitudesTransfusion.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");
const EDAD_PEDIATRICA_MIN = 0;
const EDAD_PEDIATRICA_MAX = 17;

const PASOS_SOLICITUD = [
  "Paciente y modalidad",
  "Diagnóstico y componente",
  "Pedido y prescripción",
] as const;

const ESTADOS_ANTECEDENTE = ["SI", "NO", "IGNORADO"] as const;
const COMPONENTES = [
  ["GLOBULOS_ROJOS", "Glóbulos rojos"],
  ["PLASMA", "Plasma"],
  ["PLAQUETAS", "Plaquetas"],
  ["CRIOPRECIPITADO", "Crioprecipitado"],
] as const;

 type Paciente = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
};

type Auditoria = {
  id: number;
  accion: string;
  datoModificado: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  motivo: string | null;
  operador: string;
  fechaHora: string;
};

type Solicitud = {
  id: number;
  pacienteId: number | null;
  paciente: Paciente | null;
  dniPaciente: string;
  nombrePaciente: string;
  grupoABO: string;
  factorRhD: string;
  tipoHemocomponente: string;
  cantidad: number;
  estado: "PENDIENTE" | "APROBADA" | "CANCELADA";
  observaciones: string | null;
  operador: string;
  fechaHora: string;
  fechaHoraRecepcion: string | null;
  modalidad: string | null;
  servicioSolicitante: string | null;
  sala: string | null;
  cama: string | null;
  piso: string | null;
  sector: string | null;
  unidadRealizacion: string | null;
  servicioDerivante: string | null;
  domicilioRealizacion: string | null;
  localidadReferencia: string | null;
  diagnosticoBase: string | null;
  diagnosticoIndicacion: string | null;
  antecedenteTransfusional: string | null;
  reaccionTransfusionalPrev: string | null;
  sensibilizacionObstetrica: string | null;
  hematocrito: number | null;
  hemoglobina: number | null;
  plaquetas: number | null;
  fechaHoraLaboratorio: string | null;
  volumenMl: number | null;
  irradiado: boolean;
  lavado: boolean;
  desleucocitado: boolean;
  fraccionadoPediatrico: boolean;
  caracter: string | null;
  medicoPrescriptor: string | null;
  firmaAclarada: string | null;
  matriculaPrescriptor: string | null;
  aprobadaPor: string | null;
  fechaHoraAprobacion: string | null;
  opinionMedica: string | null;
  auditoria?: Auditoria[];
};

type FormState = {
  pacienteId: string;
  modalidad: string;
  servicioSolicitante: string;
  sala: string;
  cama: string;
  piso: string;
  sector: string;
  unidadRealizacion: string;
  servicioDerivante: string;
  domicilioRealizacion: string;
  localidadReferencia: string;
  diagnosticoBase: string;
  diagnosticoIndicacion: string;
  antecedenteTransfusional: string;
  reaccionTransfusionalPrev: string;
  sensibilizacionObstetrica: string;
  grupoABO: string;
  factorRhD: string;
  hematocrito: string;
  hemoglobina: string;
  plaquetas: string;
  fechaHoraLaboratorio: string;
  tipoHemocomponente: string;
  cantidad: string;
  volumenMl: string;
  irradiado: boolean;
  lavado: boolean;
  desleucocitado: boolean;
  fraccionadoPediatrico: boolean;
  caracter: string;
  fechaHoraPedido: string;
  medicoPrescriptor: string;
  firmaAclarada: string;
  matriculaPrescriptor: string;
  operador: string;
  observaciones: string;
  motivoModificacion: string;
};

type Banner = { tipo: "ok" | "error"; texto: string } | null;

const ETIQUETAS_CAMPOS: Record<string, string> = {
  pacienteId: "Paciente",
  modalidad: "Modalidad",
  servicioSolicitante: "Servicio solicitante",
  sala: "Sala",
  cama: "Cama",
  piso: "Piso",
  sector: "Sector",
  unidadRealizacion: "Servicio o unidad de realización",
  servicioDerivante: "Servicio o médico derivante",
  domicilioRealizacion: "Domicilio de realización",
  localidadReferencia: "Localidad o referencia",
  diagnosticoBase: "Diagnóstico de base",
  diagnosticoIndicacion: "Diagnóstico de indicación",
  antecedenteTransfusional: "Antecedentes transfusionales",
  reaccionTransfusionalPrev: "Reacciones transfusionales/alérgicas",
  sensibilizacionObstetrica: "Sensibilización obstétrica/transfusional",
  grupoABO: "Grupo ABO",
  factorRhD: "Factor RhD",
  hematocrito: "Hematocrito",
  hemoglobina: "Hemoglobina",
  plaquetas: "Plaquetas",
  fechaHoraLaboratorio: "Fecha y hora del laboratorio",
  tipoHemocomponente: "Componente sanguíneo",
  cantidad: "Cantidad",
  volumenMl: "Volumen",
  caracter: "Carácter de la transfusión",
  fechaHoraPedido: "Fecha y hora del pedido",
  medicoPrescriptor: "Médico prescriptor",
  firmaAclarada: "Firma aclarada",
  matriculaPrescriptor: "Matrícula",
  operador: "Operador",
  motivoModificacion: "Motivo de modificación",
};

function describirErrores(
  errores: Array<{ path: PropertyKey[]; message: string }>,
) {
  return [...new Set(errores.map((error) => {
    const campo = String(error.path[0] ?? "solicitud");
    const nombre = ETIQUETAS_CAMPOS[campo] ?? campo;
    return `${nombre}: ${error.message}`;
  }))];
}

function erroresDelServidor(campos: unknown) {
  if (!campos || typeof campos !== "object") return [];
  return Object.entries(campos as Record<string, unknown>).flatMap(([campo, mensajes]) => {
    if (!Array.isArray(mensajes)) return [];
    return mensajes.filter((mensaje): mensaje is string => typeof mensaje === "string")
      .map((mensaje) => `${ETIQUETAS_CAMPOS[campo] ?? campo}: ${mensaje}`);
  });
}

function ahoraLocal() {
  const fecha = new Date();
  fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
  return fecha.toISOString().slice(0, 16);
}

function edadEnAnios(fechaNacimiento: string): number | null {
  const nacimiento = new Date(`${fechaNacimiento.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(nacimiento.getTime())) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  if (
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())
  ) {
    edad -= 1;
  }
  return edad;
}

function aFechaLocal(valor: string | null | undefined) {
  if (!valor) return "";
  const fecha = new Date(valor);
  fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
  return fecha.toISOString().slice(0, 16);
}

function formularioInicial(): FormState {
  const ahora = ahoraLocal();
  return {
    pacienteId: "",
    modalidad: "INTERNACION",
    servicioSolicitante: "",
    sala: "",
    cama: "",
    piso: "",
    sector: "",
    unidadRealizacion: "",
    servicioDerivante: "",
    domicilioRealizacion: "",
    localidadReferencia: "",
    diagnosticoBase: "",
    diagnosticoIndicacion: "",
    antecedenteTransfusional: "",
    reaccionTransfusionalPrev: "",
    sensibilizacionObstetrica: "",
    grupoABO: "",
    factorRhD: "",
    hematocrito: "",
    hemoglobina: "",
    plaquetas: "",
    fechaHoraLaboratorio: ahora,
    tipoHemocomponente: "",
    cantidad: "1",
    volumenMl: "",
    irradiado: false,
    lavado: false,
    desleucocitado: false,
    fraccionadoPediatrico: false,
    caracter: "PROGRAMADA",
    fechaHoraPedido: ahora,
    medicoPrescriptor: "",
    firmaAclarada: "",
    matriculaPrescriptor: "",
    operador: "",
    observaciones: "",
    motivoModificacion: "",
  };
}

function pacienteDeSolicitud(solicitud: Solicitud): Paciente | null {
  if (solicitud.paciente) return solicitud.paciente;
  return null;
}

function lugarSolicitud(solicitud: Solicitud) {
  if (solicitud.modalidad === "INTERNACION") {
    return [
      solicitud.servicioSolicitante,
      solicitud.sala ? `Sala ${solicitud.sala}` : null,
      solicitud.cama ? `Cama ${solicitud.cama}` : null,
      solicitud.piso ? `Piso ${solicitud.piso}` : null,
      solicitud.sector,
    ].filter(Boolean).join(" · ");
  }
  if (solicitud.modalidad === "AMBULATORIA") {
    return [solicitud.unidadRealizacion, solicitud.servicioDerivante]
      .filter(Boolean)
      .join(" · ");
  }
  if (solicitud.modalidad === "DOMICILIARIA") {
    return [solicitud.domicilioRealizacion, solicitud.localidadReferencia]
      .filter(Boolean)
      .join(" · ");
  }
  return "Lugar no registrado";
}

function formatearFechaHora(valor: string | null | undefined) {
  if (!valor) return "No registrada";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}

function etiqueta(valor: string | null | undefined) {
  if (!valor) return "No especificado";
  return valor.replaceAll("_", " ").toLowerCase().replace(/^\p{L}/u, (letra) => letra.toUpperCase());
}

export default function GestionSolicitudesTransfusion() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [filtroComponenteTabla, setFiltroComponenteTabla] = useState("");
  const [form, setForm] = useState<FormState>(formularioInicial);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [pacienteBusqueda, setPacienteBusqueda] = useState({ dni: "" });
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [solicitudEditando, setSolicitudEditando] = useState<number | null>(null);
  const [solicitudEditandoEstado, setSolicitudEditandoEstado] =
    useState<Solicitud["estado"] | null>(null);
  const [solicitudAprobando, setSolicitudAprobando] = useState<number | null>(null);
  const [operadorAprobacion, setOperadorAprobacion] = useState("");
  const [opinionAprobacion, setOpinionAprobacion] = useState("");
  const [solicitudCancelando, setSolicitudCancelando] = useState<number | null>(null);
  const [operadorCancelacion, setOperadorCancelacion] = useState("");
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [banner, setBanner] = useState<Banner>(null);
  const [erroresCampos, setErroresCampos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [confirmacionPediatricaAbierta, setConfirmacionPediatricaAbierta] = useState(false);
  const [solicitudPediatricaPendiente, setSolicitudPediatricaPendiente] =
    useState<SolicitudTransfusionFormInput | null>(null);
  const [paso, setPaso] = useState(0);
  const [cancelacionConfirmando, setCancelacionConfirmando] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const edadPaciente = pacienteSeleccionado
    ? edadEnAnios(pacienteSeleccionado.fechaNacimiento)
    : null;
  const fraccionadoFueraRangoPediatrico =
    form.fraccionadoPediatrico &&
    edadPaciente !== null &&
    (edadPaciente < EDAD_PEDIATRICA_MIN || edadPaciente > EDAD_PEDIATRICA_MAX);

  useEffect(() => {
    let activo = true;
    async function cargarSolicitudes() {
      setCargando(true);
      try {
        const params = new URLSearchParams();
        if (estadoFiltro) params.set("estado", estadoFiltro);
        const respuesta = await fetch(`${API_URL}/api/solicitudes-transfusiones?${params}`);
        const datos = await respuesta.json().catch(() => null);
        if (!respuesta.ok || !Array.isArray(datos)) {
          throw new Error(datos?.error ?? "No se pudieron cargar las solicitudes.");
        }
        if (activo) setSolicitudes(datos as Solicitud[]);
      } catch (error) {
        if (activo) {
          setBanner({
            tipo: "error",
            texto: error instanceof Error ? error.message : "No se pudo conectar con el servidor.",
          });
        }
      } finally {
        if (activo) setCargando(false);
      }
    }
    void cargarSolicitudes();
    return () => { activo = false; };
  }, [estadoFiltro]);

  function cambiarCampo<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
    setErroresCampos([]);
    setBanner(null);
  }

  function cambiarModalidad(modalidad: string) {
    setErroresCampos([]);
    setBanner(null);
    setForm((actual) => ({
      ...actual,
      modalidad,
      servicioSolicitante: "",
      sala: "",
      cama: "",
      piso: "",
      sector: "",
      unidadRealizacion: "",
      servicioDerivante: "",
      domicilioRealizacion: "",
      localidadReferencia: "",
    }));
  }

  async function buscarPacientes(event: FormEvent) {
    event.preventDefault();
    setBanner(null);
    const dni = pacienteBusqueda.dni.trim();
    if (!/^\d{7,8}$/.test(dni)) {
      setBanner({ tipo: "error", texto: "Ingresá un DNI válido de 7 u 8 dígitos." });
      return;
    }
    const params = new URLSearchParams({ dni });
    setBuscandoPaciente(true);
    try {
      const respuesta = await fetch(`${API_URL}/api/pacientes?${params}`);
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok || !Array.isArray(datos)) {
        throw new Error(datos?.error ?? "No se pudieron consultar los pacientes.");
      }
      setPacientes(datos as Paciente[]);
      if (!datos.length) setBanner({ tipo: "error", texto: "No se encontraron pacientes." });
    } catch (error) {
      setBanner({ tipo: "error", texto: error instanceof Error ? error.message : "No se pudo conectar con el servidor." });
    } finally {
      setBuscandoPaciente(false);
    }
  }

  function agregarSolicitudPaciente(paciente: Paciente) {
    setPaso(0);
    setSolicitudEditando(null);
    setSolicitudEditandoEstado(null);
    setPacienteSeleccionado(paciente);
    setForm({ ...formularioInicial(), pacienteId: String(paciente.id) });
    setPacientes([]);
    setErroresCampos([]);
    setBanner(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nuevaSolicitud() {
    setPaso(0);
    setSolicitudEditando(null);
    setSolicitudEditandoEstado(null);
    setForm(formularioInicial());
    setPacienteSeleccionado(null);
    setErroresCampos([]);
    setBanner(null);
    setPacientes([]);
  }

  function editarSolicitud(solicitud: Solicitud) {
    if (solicitud.estado === "CANCELADA") return;
    const paciente = pacienteDeSolicitud(solicitud);
    setPaso(0);
    setSolicitudEditando(solicitud.id);
    setSolicitudEditandoEstado(solicitud.estado);
    setPacienteSeleccionado(paciente);
    setForm({
      ...formularioInicial(),
      pacienteId: solicitud.pacienteId ? String(solicitud.pacienteId) : "",
      modalidad: solicitud.modalidad ?? "INTERNACION",
      servicioSolicitante: solicitud.servicioSolicitante ?? "",
      sala: solicitud.sala ?? "",
      cama: solicitud.cama ?? "",
      piso: solicitud.piso ?? "",
      sector: solicitud.sector ?? "",
      unidadRealizacion: solicitud.unidadRealizacion ?? "",
      servicioDerivante: solicitud.servicioDerivante ?? "",
      domicilioRealizacion: solicitud.domicilioRealizacion ?? "",
      localidadReferencia: solicitud.localidadReferencia ?? "",
      diagnosticoBase: solicitud.diagnosticoBase ?? "",
      diagnosticoIndicacion: solicitud.diagnosticoIndicacion ?? "",
      antecedenteTransfusional: solicitud.antecedenteTransfusional ?? "",
      reaccionTransfusionalPrev: solicitud.reaccionTransfusionalPrev ?? "",
      sensibilizacionObstetrica: solicitud.sensibilizacionObstetrica ?? "",
      grupoABO: solicitud.grupoABO,
      factorRhD: solicitud.factorRhD,
      hematocrito: solicitud.hematocrito == null ? "" : String(solicitud.hematocrito),
      hemoglobina: solicitud.hemoglobina == null ? "" : String(solicitud.hemoglobina),
      plaquetas: solicitud.plaquetas == null ? "" : String(solicitud.plaquetas),
      fechaHoraLaboratorio: aFechaLocal(solicitud.fechaHoraLaboratorio),
      tipoHemocomponente: solicitud.tipoHemocomponente,
      cantidad: String(solicitud.cantidad),
      volumenMl: solicitud.volumenMl == null ? "" : String(solicitud.volumenMl),
      irradiado: solicitud.irradiado,
      lavado: solicitud.lavado,
      desleucocitado: solicitud.desleucocitado,
      fraccionadoPediatrico: solicitud.fraccionadoPediatrico,
      caracter: solicitud.caracter ?? "PROGRAMADA",
      fechaHoraPedido: aFechaLocal(solicitud.fechaHora),
      medicoPrescriptor: solicitud.medicoPrescriptor ?? "",
      firmaAclarada: solicitud.firmaAclarada ?? "",
      matriculaPrescriptor: solicitud.matriculaPrescriptor ?? "",
      operador: "",
      observaciones: solicitud.observaciones ?? "",
      motivoModificacion: "",
    });
    setBanner(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardar(event: FormEvent) {
    event.preventDefault();
    setBanner(null);
    setErroresCampos([]);
    if (paso < PASOS_SOLICITUD.length - 1) {
      setPaso(paso + 1);
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!pacienteSeleccionado || !form.pacienteId) {
      setBanner({ tipo: "error", texto: "Seleccioná un paciente registrado." });
      return;
    }

    const parseado = solicitudTransfusionFormSchema.safeParse({
      ...form,
      pacienteId: form.pacienteId,
    });
    if (!parseado.success) {
      setErroresCampos(describirErrores(parseado.error.issues));
      setBanner({ tipo: "error", texto: "No se pudo guardar. Revisá los campos indicados." });
      return;
    }
    if (solicitudEditando && !form.motivoModificacion.trim()) {
      setErroresCampos(["Motivo de modificación: es obligatorio para guardar cambios."]);
      setBanner({ tipo: "error", texto: "No se pudo guardar. Revisá los campos indicados." });
      return;
    }

    if (fraccionadoFueraRangoPediatrico) {
      setSolicitudPediatricaPendiente(parseado.data);
      setConfirmacionPediatricaAbierta(true);
      return;
    }

    await enviarSolicitud(parseado.data);
  }

  async function confirmarSolicitudPediatrica() {
    if (!solicitudPediatricaPendiente) return;
    setConfirmacionPediatricaAbierta(false);
    const solicitud = solicitudPediatricaPendiente;
    setSolicitudPediatricaPendiente(null);
    await enviarSolicitud(solicitud);
  }

  async function enviarSolicitud(datosSolicitud: SolicitudTransfusionFormInput) {
    const payload = {
      ...datosSolicitud,
      ...(solicitudEditando ? { motivoModificacion: form.motivoModificacion } : {}),
    };
    setGuardando(true);
    try {
      const respuesta = await fetch(
        solicitudEditando
          ? `${API_URL}/api/solicitudes-transfusiones/${solicitudEditando}`
          : `${API_URL}/api/solicitudes-transfusiones`,
        {
          method: solicitudEditando ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        const errores = erroresDelServidor(datos?.campos);
        if (errores.length > 0) setErroresCampos(errores);
        throw new Error(datos?.error ?? "No se pudo guardar la solicitud.");
      }
      setBanner({
        tipo: "ok",
        texto: solicitudEditando
          ? solicitudEditandoEstado === "APROBADA"
            ? `Solicitud #${datos.id} actualizada. Volvió a estado Pendiente y deberá aprobarse de nuevo.`
            : `Solicitud #${datos.id} actualizada. Se registraron los cambios en auditoría.`
          : `Solicitud #${datos.id} registrada con estado Pendiente.`,
      });
      setForm(formularioInicial());
      setPaso(0);
      setPacienteSeleccionado(null);
      setSolicitudEditando(null);
      setSolicitudEditandoEstado(null);
      setErroresCampos([]);
      const params = new URLSearchParams();
      if (estadoFiltro) params.set("estado", estadoFiltro);
      const lista = await fetch(`${API_URL}/api/solicitudes-transfusiones?${params}`);
      if (lista.ok) setSolicitudes((await lista.json()) as Solicitud[]);
    } catch (error) {
      setBanner({ tipo: "error", texto: error instanceof Error ? error.message : "No se pudo conectar con el servidor." });
    } finally {
      setGuardando(false);
    }
  }

  async function aprobar(event: FormEvent) {
    event.preventDefault();
    if (!solicitudAprobando) return;
    setBanner(null);
    const parseado = aprobarSolicitudTransfusionSchema.safeParse({
      operador: operadorAprobacion,
      opinionMedica: opinionAprobacion,
    });
    if (!parseado.success) {
      setBanner({
        tipo: "error",
        texto: parseado.error.issues[0]?.message ?? "Revisá los datos de aprobación.",
      });
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await fetch(
        `${API_URL}/api/solicitudes-transfusiones/${solicitudAprobando}/aprobar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parseado.data),
        },
      );
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) throw new Error(datos?.error ?? "No se pudo aprobar la solicitud.");
      setBanner({
        tipo: "ok",
        texto: `Solicitud #${datos.id} aprobada por ${datos.aprobadaPor}.`,
      });
      setSolicitudAprobando(null);
      setOperadorAprobacion("");
      setOpinionAprobacion("");
      const params = new URLSearchParams();
      if (estadoFiltro) params.set("estado", estadoFiltro);
      const lista = await fetch(`${API_URL}/api/solicitudes-transfusiones?${params}`);
      if (lista.ok) setSolicitudes((await lista.json()) as Solicitud[]);
    } catch (error) {
      setBanner({
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudo conectar con el servidor.",
      });
    } finally {
      setGuardando(false);
    }
  }

  function confirmarCancelacion(event: FormEvent) {
    event.preventDefault();
    if (!solicitudCancelando) return;
    setCancelacionConfirmando(true);
  }

  async function ejecutarCancelacion() {
    if (!solicitudCancelando) return;
    setCancelacionConfirmando(false);
    setGuardando(true);
    try {
      const respuesta = await fetch(
        `${API_URL}/api/solicitudes-transfusiones/${solicitudCancelando}/cancelar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operador: operadorCancelacion, motivo: motivoCancelacion }),
        },
      );
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) throw new Error(datos?.error ?? "No se pudo cancelar la solicitud.");
      setBanner({ tipo: "ok", texto: `Solicitud #${datos.id} cancelada. El registro y la acción quedaron auditados.` });
      setSolicitudCancelando(null);
      setOperadorCancelacion("");
      setMotivoCancelacion("");
      const lista = await fetch(`${API_URL}/api/solicitudes-transfusiones`);
      if (lista.ok) setSolicitudes((await lista.json()) as Solicitud[]);
    } catch (error) {
      setBanner({ tipo: "error", texto: error instanceof Error ? error.message : "No se pudo conectar con el servidor." });
    } finally {
      setGuardando(false);
    }
  }

  function textoAuditoria(valor: string | null) {
    if (valor == null) return "(sin valor)";
    try {
      return JSON.stringify(JSON.parse(valor));
    } catch {
      return valor;
    }
  }

  const columnasSolicitudes: DataTableColumn<Solicitud>[] = [
    {
      id: "id",
      header: "Número",
      render: (solicitud) => <strong>#{solicitud.id}</strong>,
      sortValue: (solicitud) => solicitud.id,
    },
    {
      id: "paciente",
      header: "Paciente",
      render: (solicitud) => solicitud.nombrePaciente,
      sortValue: (solicitud) => solicitud.nombrePaciente,
    },
    {
      id: "dni",
      header: "DNI",
      render: (solicitud) => solicitud.dniPaciente,
      sortValue: (solicitud) => solicitud.dniPaciente,
    },
    {
      id: "componente",
      header: "Componente",
      render: (solicitud) => etiqueta(solicitud.tipoHemocomponente),
      sortValue: (solicitud) => solicitud.tipoHemocomponente,
    },
    {
      id: "cantidad",
      header: "Cantidad",
      render: (solicitud) => solicitud.cantidad,
      sortValue: (solicitud) => solicitud.cantidad,
    },
    {
      id: "estado",
      header: "Estado",
      render: (solicitud) => <StatusBadge estado={solicitud.estado} />,
      sortValue: (solicitud) => solicitud.estado,
    },
    {
      id: "fecha",
      header: "Fecha y hora",
      render: (solicitud) => formatearFechaHora(solicitud.fechaHora),
      sortValue: (solicitud) => solicitud.fechaHora,
    },
    {
      id: "acciones",
      header: "Acciones",
      className: "ui-col-acciones",
      render: (solicitud) => (
        <div className="ui-row-actions">
          {solicitud.estado === "PENDIENTE" ? (
            <button
              type="button"
              className="ui-btn ui-btn-small ui-btn-primary"
              onClick={() => {
                setSolicitudAprobando(solicitud.id);
                setSolicitudCancelando(null);
                setOperadorAprobacion("");
                setOpinionAprobacion("");
              }}
            >
              Aprobar
            </button>
          ) : null}
          {solicitud.estado !== "CANCELADA" ? (
            <>
              <button
                type="button"
                className="ui-btn ui-btn-small ui-btn-secondary"
                onClick={() => editarSolicitud(solicitud)}
              >
                Editar
              </button>
              <button
                type="button"
                className="ui-btn ui-btn-small ui-btn-danger"
                onClick={() => {
                  setSolicitudCancelando(solicitud.id);
                  setSolicitudAprobando(null);
                  setMotivoCancelacion("");
                  setOperadorCancelacion("");
                }}
              >
                Cancelar
              </button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="solicitudes">
      <PageHeader
        title="Solicitudes de transfusión"
        description="Registrá, aprobá, actualizá y cancelá (rechazá) solicitudes asociadas a pacientes."
      />

      {banner ? <Banner tone={banner.tipo}>{banner.texto}</Banner> : null}
      {erroresCampos.length > 0 && (
        <div className="solicitudes-errores-campos" role="alert" aria-label="Errores del formulario">
          <strong>Revisá estos campos:</strong>
          <ul>{erroresCampos.map((error, indice) => <li key={`${indice}-${error}`}>{error}</li>)}</ul>
        </div>
      )}

      <ConfirmDialog
        open={confirmacionPediatricaAbierta && pacienteSeleccionado !== null && edadPaciente !== null}
        title="Verificar fraccionado pediátrico"
        description={
          <p>
            El paciente tiene {edadPaciente} años y está fuera del rango pediátrico
            configurado ({EDAD_PEDIATRICA_MIN}–{EDAD_PEDIATRICA_MAX} años). Verificá
            la indicación antes de confirmar la solicitud.
          </p>
        }
        confirmLabel="Confirmar y registrar"
        cancelLabel="Revisar solicitud"
        busy={guardando}
        onCancel={() => setConfirmacionPediatricaAbierta(false)}
        onConfirm={() => {
          setConfirmacionPediatricaAbierta(false);
          void confirmarSolicitudPediatrica();
        }}
      />

      <section className="solicitudes-panel">
        <div className="solicitudes-panel-header">
          <h2>{solicitudEditando ? `Editar solicitud #${solicitudEditando}` : "Nueva solicitud"}</h2>
          {solicitudEditando && <button type="button" className="solicitudes-secundario" onClick={nuevaSolicitud}>Dejar de editar</button>}
        </div>

        {!pacienteSeleccionado ? (
          <form className="solicitudes-form" onSubmit={buscarPacientes} noValidate>
            <div className="solicitudes-grid">
              <div className="solicitudes-field"><label htmlFor="buscarPacienteDni">DNI del paciente</label><input id="buscarPacienteDni" inputMode="numeric" autoComplete="off" value={pacienteBusqueda.dni} onChange={(event) => setPacienteBusqueda({ dni: event.target.value })} /></div>
            </div>
            <div className="solicitudes-actions"><button type="submit" disabled={buscandoPaciente}>{buscandoPaciente ? "Buscando…" : "Buscar paciente"}</button></div>
            {pacientes.length > 0 && (
              <div className="solicitudes-pacientes">
                {pacientes.map((paciente) => (
                  <article className="solicitudes-paciente" key={paciente.id}>
                    <div className="solicitudes-paciente-datos">
                      <strong>{paciente.apellido}, {paciente.nombre}</strong>
                      <span>DNI: {paciente.dni}</span>
                      <span>Edad: {edadEnAnios(paciente.fechaNacimiento) ?? "No disponible"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => agregarSolicitudPaciente(paciente)}
                    >
                      Agregar solicitud
                    </button>
                  </article>
                ))}
              </div>
            )}
          </form>
        ) : (
          <form ref={formRef} className="solicitudes-form" onSubmit={guardar} noValidate>
            <div className="solicitudes-paciente-seleccionado"><div><strong>{pacienteSeleccionado.apellido}, {pacienteSeleccionado.nombre}</strong><span>DNI: {pacienteSeleccionado.dni}</span></div><button type="button" className="solicitudes-secundario" onClick={() => { setPacienteSeleccionado(null); cambiarCampo("pacienteId", ""); }}>Cambiar paciente</button></div>
            <input type="hidden" value={form.pacienteId} readOnly />
            <FormSteps pasos={PASOS_SOLICITUD} actual={paso} />

            {paso === 0 && (
            <fieldset>
              <legend>Ámbito / modalidad de transfusión</legend>
              <div className="solicitudes-grid">
                <div className="solicitudes-field">
                  <label htmlFor="modalidad">Modalidad</label>
                  <select id="modalidad" value={form.modalidad} onChange={(event) => cambiarModalidad(event.target.value)}>
                    <option value="INTERNACION">Internación</option>
                    <option value="AMBULATORIA">Ambulatoria</option>
                    <option value="DOMICILIARIA">Domiciliaria</option>
                  </select>
                </div>
              </div>

              {form.modalidad === "INTERNACION" && (
                <div className="solicitudes-grid solicitudes-lugar-condicional">
                  <div className="solicitudes-field">
                    <label htmlFor="servicioSolicitante">Servicio solicitante</label>
                    <input id="servicioSolicitante" list="serviciosHospitalarios" required value={form.servicioSolicitante} onChange={(event) => cambiarCampo("servicioSolicitante", event.target.value)} />
                    <datalist id="serviciosHospitalarios">
                      <option value="Clínica Médica" />
                      <option value="Cirugía" />
                      <option value="Guardia" />
                      <option value="Pediatría" />
                      <option value="Obstetricia" />
                    </datalist>
                  </div>
                  <div className="solicitudes-field">
                    <label htmlFor="sala">Sala</label>
                    <input id="sala" required value={form.sala} onChange={(event) => cambiarCampo("sala", event.target.value)} />
                  </div>
                  <div className="solicitudes-field">
                    <label htmlFor="cama">Cama</label>
                    <input id="cama" required value={form.cama} onChange={(event) => cambiarCampo("cama", event.target.value)} />
                  </div>
                  <div className="solicitudes-field">
                    <label htmlFor="piso">Piso (opcional)</label>
                    <input id="piso" value={form.piso} onChange={(event) => cambiarCampo("piso", event.target.value)} />
                  </div>
                  <div className="solicitudes-field">
                    <label htmlFor="sector">Sector (opcional)</label>
                    <input id="sector" value={form.sector} onChange={(event) => cambiarCampo("sector", event.target.value)} />
                  </div>
                </div>
              )}

              {form.modalidad === "AMBULATORIA" && (
                <div className="solicitudes-grid solicitudes-lugar-condicional">
                  <div className="solicitudes-field">
                    <label htmlFor="unidadRealizacion">Servicio o unidad de realización</label>
                    <input id="unidadRealizacion" required value={form.unidadRealizacion} onChange={(event) => cambiarCampo("unidadRealizacion", event.target.value)} />
                  </div>
                  <div className="solicitudes-field">
                    <label htmlFor="servicioDerivante">Servicio / médico derivante (opcional)</label>
                    <input id="servicioDerivante" value={form.servicioDerivante} onChange={(event) => cambiarCampo("servicioDerivante", event.target.value)} />
                  </div>
                </div>
              )}

              {form.modalidad === "DOMICILIARIA" && (
                <div className="solicitudes-grid solicitudes-lugar-condicional">
                  <div className="solicitudes-field">
                    <label htmlFor="domicilioRealizacion">Domicilio de realización</label>
                    <input id="domicilioRealizacion" required autoComplete="street-address" value={form.domicilioRealizacion} onChange={(event) => cambiarCampo("domicilioRealizacion", event.target.value)} />
                  </div>
                  <div className="solicitudes-field">
                    <label htmlFor="localidadReferencia">Localidad / referencia de acceso o contacto (opcional)</label>
                    <input id="localidadReferencia" value={form.localidadReferencia} onChange={(event) => cambiarCampo("localidadReferencia", event.target.value)} />
                  </div>
                </div>
              )}
            </fieldset>
            )}

            {paso === 1 && (
            <>
            <fieldset><legend>Diagnósticos y antecedentes</legend><div className="solicitudes-grid">
              <div className="solicitudes-field"><label htmlFor="diagnosticoBase">Diagnóstico de base</label><input id="diagnosticoBase" required value={form.diagnosticoBase} onChange={(event) => cambiarCampo("diagnosticoBase", event.target.value)} /></div>
              <div className="solicitudes-field"><label htmlFor="diagnosticoIndicacion">Diagnóstico por el que se indica</label><input id="diagnosticoIndicacion" required value={form.diagnosticoIndicacion} onChange={(event) => cambiarCampo("diagnosticoIndicacion", event.target.value)} /></div>
              {[ ["antecedenteTransfusional", "Transfusiones previas"], ["reaccionTransfusionalPrev", "Reacciones transfusionales/alérgicas"], ["sensibilizacionObstetrica", "Sensibilización obstétrica/transfusional"] ].map(([campo, titulo]) => <div className="solicitudes-field" key={campo}><label htmlFor={campo}>{titulo}</label><select id={campo} required value={form[campo as keyof FormState] as string} onChange={(event) => cambiarCampo(campo as keyof FormState, event.target.value as never)}><option value="">Seleccioná</option>{ESTADOS_ANTECEDENTE.map((estado) => <option key={estado} value={estado}>{estado === "SI" ? "Sí" : estado === "NO" ? "No" : "Se ignora"}</option>)}</select></div>)}
            </div></fieldset>

            <fieldset><legend>Laboratorio justificativo (máximo 12 horas de antigüedad)</legend><div className="solicitudes-grid">
              <div className="solicitudes-field"><label htmlFor="hematocrito">Hematocrito (%)</label><input id="hematocrito" type="number" min="0.1" max="100" step="0.1" required value={form.hematocrito} onChange={(event) => cambiarCampo("hematocrito", event.target.value)} /></div>
              <div className="solicitudes-field"><label htmlFor="hemoglobina">Hemoglobina (g/dL)</label><input id="hemoglobina" type="number" min="0.1" max="30" step="0.1" required value={form.hemoglobina} onChange={(event) => cambiarCampo("hemoglobina", event.target.value)} /></div>
              <div className="solicitudes-field"><label htmlFor="plaquetas">Plaquetas</label><input id="plaquetas" type="number" min="1" step="1" required value={form.plaquetas} onChange={(event) => cambiarCampo("plaquetas", event.target.value)} /></div>
              <div className="solicitudes-field"><label htmlFor="fechaHoraLaboratorio">Fecha y hora del estudio</label><input id="fechaHoraLaboratorio" type="datetime-local" required value={form.fechaHoraLaboratorio} onChange={(event) => cambiarCampo("fechaHoraLaboratorio", event.target.value)} /></div>
            </div></fieldset>

            <fieldset><legend>Componente requerido</legend><div className="solicitudes-grid">
              <div className="solicitudes-field"><label htmlFor="tipoHemocomponente">Componente sanguíneo</label><select id="tipoHemocomponente" required value={form.tipoHemocomponente} onChange={(event) => cambiarCampo("tipoHemocomponente", event.target.value)}><option value="">Seleccioná un componente</option>{COMPONENTES.map(([valor, nombre]) => <option key={valor} value={valor}>{nombre}</option>)}</select></div>
              <div className="solicitudes-field"><label htmlFor="cantidad">Cantidad (unidades)</label><input id="cantidad" type="number" min="1" step="1" required value={form.cantidad} onChange={(event) => cambiarCampo("cantidad", event.target.value)} /></div>
              <div className="solicitudes-field"><label htmlFor="volumenMl">Volumen (mL, opcional)</label><input id="volumenMl" type="number" min="1" step="1" value={form.volumenMl} onChange={(event) => cambiarCampo("volumenMl", event.target.value)} /></div>
            </div><div className="solicitudes-checks">{([["irradiado", "Irradiado"], ["lavado", "Lavado"], ["desleucocitado", "Desleucocitado"], ["fraccionadoPediatrico", "Fraccionado para pediatría"]] as const).map(([campo, texto]) => <label key={campo}><input type="checkbox" checked={form[campo]} onChange={(event) => cambiarCampo(campo, event.target.checked)} />{texto}</label>)}</div>
            {fraccionadoFueraRangoPediatrico && edadPaciente !== null && (
              <p className="solicitudes-alerta-pediatrica" role="alert">
                El paciente tiene {edadPaciente} años y está fuera del rango pediátrico configurado ({EDAD_PEDIATRICA_MIN}–{EDAD_PEDIATRICA_MAX} años). Se solicitará una confirmación antes de guardar.
              </p>
            )}
            </fieldset>
            </>
            )}

            {paso === 2 && (
            <fieldset><legend>Pedido y prescripción</legend><div className="solicitudes-grid">
              <div className="solicitudes-field"><label htmlFor="caracter">Carácter de la transfusión</label><select id="caracter" required value={form.caracter} onChange={(event) => cambiarCampo("caracter", event.target.value)}><option value="PROGRAMADA">Programada</option><option value="NO_URGENTE">No urgente</option><option value="RESERVA">Reserva</option><option value="URGENTE">Urgente</option><option value="EMERGENCIA">Emergencia</option></select></div>
              <div className="solicitudes-field"><label htmlFor="fechaHoraPedido">Fecha y hora del pedido</label><input id="fechaHoraPedido" type="datetime-local" required value={form.fechaHoraPedido} onChange={(event) => cambiarCampo("fechaHoraPedido", event.target.value)} /></div>
              <div className="solicitudes-field"><label htmlFor="grupoABO">Grupo ABO</label><select id="grupoABO" required value={form.grupoABO} onChange={(event) => cambiarCampo("grupoABO", event.target.value)}><option value="">Seleccioná</option>{["A", "B", "AB", "O"].map((grupo) => <option key={grupo}>{grupo}</option>)}</select></div>
              <div className="solicitudes-field"><label htmlFor="factorRhD">Factor RhD</label><select id="factorRhD" required value={form.factorRhD} onChange={(event) => cambiarCampo("factorRhD", event.target.value)}><option value="">Seleccioná</option><option value="POSITIVO">Positivo</option><option value="NEGATIVO">Negativo</option></select></div>
              <div className="solicitudes-field"><label htmlFor="medicoPrescriptor">Médico prescriptor</label><input id="medicoPrescriptor" required value={form.medicoPrescriptor} onChange={(event) => cambiarCampo("medicoPrescriptor", event.target.value)} /></div>
              <div className="solicitudes-field"><label htmlFor="firmaAclarada">Firma aclarada</label><input id="firmaAclarada" required value={form.firmaAclarada} onChange={(event) => cambiarCampo("firmaAclarada", event.target.value)} /></div>
              <div className="solicitudes-field"><label htmlFor="matriculaPrescriptor">Matrícula</label><input id="matriculaPrescriptor" required value={form.matriculaPrescriptor} onChange={(event) => cambiarCampo("matriculaPrescriptor", event.target.value)} /></div>
              <div className="solicitudes-field"><label htmlFor="operadorSolicitud">Operador</label><input id="operadorSolicitud" required value={form.operador} onChange={(event) => cambiarCampo("operador", event.target.value)} /></div>
            </div><p className="solicitudes-nota">La recepción se registra automáticamente al guardar. El estado inicial es Pendiente.</p>
              <div className="solicitudes-field"><label htmlFor="observacionesSolicitud">Observaciones</label><textarea id="observacionesSolicitud" rows={3} value={form.observaciones} onChange={(event) => cambiarCampo("observaciones", event.target.value)} /></div>
              {solicitudEditando && solicitudEditandoEstado === "APROBADA" && (
                <p className="solicitudes-alerta-revocacion" role="alert">
                  Esta solicitud está aprobada. Al guardar la modificación volverá a Pendiente y deberá aprobarse de nuevo.
                </p>
              )}
              {solicitudEditando && <div className="solicitudes-field"><label htmlFor="motivoModificacion">Motivo de modificación</label><textarea id="motivoModificacion" required rows={2} value={form.motivoModificacion} onChange={(event) => cambiarCampo("motivoModificacion", event.target.value)} /></div>}
            </fieldset>
            )}

            <div className="ui-step-actions">
              {paso > 0 && (
                <button
                  type="button"
                  className="solicitudes-secundario"
                  onClick={() => setPaso(paso - 1)}
                >
                  Anterior
                </button>
              )}
              <button type="submit" disabled={guardando}>
                {guardando
                  ? "Guardando…"
                  : paso < PASOS_SOLICITUD.length - 1
                    ? "Siguiente"
                    : solicitudEditando
                      ? "Guardar modificación"
                      : "Registrar solicitud"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="solicitudes-panel">
        <div className="solicitudes-panel-header"><h2>Solicitudes registradas</h2><div className="solicitudes-filtro"><label htmlFor="estadoFiltro">Estado</label><select id="estadoFiltro" value={estadoFiltro} onChange={(event) => setEstadoFiltro(event.target.value)}><option value="">Todos</option><option value="PENDIENTE">Pendiente</option><option value="APROBADA">Aprobada</option><option value="CANCELADA">Cancelada</option></select></div></div>

        <DataTable
          rows={solicitudes}
          columns={columnasSolicitudes}
          rowKey={(solicitud) => solicitud.id}
          searchText={(solicitud) =>
            `${solicitud.id} ${solicitud.nombrePaciente} ${solicitud.dniPaciente} ${solicitud.tipoHemocomponente} ${solicitud.operador}`
          }
          searchPlaceholder="Buscar por número, paciente, DNI, componente u operador…"
          filters={[
            {
              id: "componente",
              label: "Componente",
              value: filtroComponenteTabla,
              options: [
                { value: "", label: "Todos" },
                ...COMPONENTES.map(([valor, nombre]) => ({
                  value: valor,
                  label: nombre,
                })),
              ],
              onChange: setFiltroComponenteTabla,
            },
          ]}
          filterRow={(solicitud) =>
            !filtroComponenteTabla ||
            solicitud.tipoHemocomponente === filtroComponenteTabla
          }
          loading={cargando}
          emptyTitle="No hay solicitudes para mostrar"
          emptyDescription="Las solicitudes registradas aparecerán aquí con su estado y trazabilidad."
          caption="Solicitudes de transfusión con búsqueda, filtros, orden y paginación."
        />

        <h3 className="solicitudes-subtitulo">Detalle y acciones</h3>
        {cargando ? (
          <LoadingState label="Cargando solicitudes…" />
        ) : solicitudes.length === 0 ? (
          <EmptyState
            title="No hay solicitudes para mostrar"
            description="Las solicitudes registradas aparecerán aquí con su estado y trazabilidad."
          />
        ) : (
          <div className="solicitudes-lista">{solicitudes.map((solicitud) => <article className="solicitud-item" key={solicitud.id}>
            <div className="solicitud-item-cabecera"><div><h3>Solicitud #{solicitud.id} · {solicitud.nombrePaciente}</h3><p>DNI: {solicitud.dniPaciente} · Pedido: {formatearFechaHora(solicitud.fechaHora)} · Recepción: {formatearFechaHora(solicitud.fechaHoraRecepcion)}</p></div><StatusBadge estado={solicitud.estado} /></div>
            <div className="solicitud-resumen"><span>{etiqueta(solicitud.tipoHemocomponente)} · {solicitud.cantidad} unidad(es)</span><span>{etiqueta(solicitud.caracter)}</span><span>{solicitud.grupoABO}{solicitud.factorRhD === "POSITIVO" ? "+" : "−"}</span><span>{etiqueta(solicitud.modalidad)} · {lugarSolicitud(solicitud)}</span><span>{solicitud.operador}</span></div>
            {solicitud.estado === "APROBADA" && (
              <div className="solicitud-aprobacion-info">
                <p>
                  Aprobada por <strong>{solicitud.aprobadaPor ?? "No registrado"}</strong> el{" "}
                  {formatearFechaHora(solicitud.fechaHoraAprobacion)}
                </p>
                {solicitud.opinionMedica && (
                  <p className="solicitud-opinion-medica">
                    Opinión sobre la indicación: {solicitud.opinionMedica}
                  </p>
                )}
              </div>
            )}
            <div className="solicitudes-item-acciones">
              {solicitud.estado === "PENDIENTE" && (
                <button
                  type="button"
                  className="solicitudes-aprobar"
                  onClick={() => {
                    setSolicitudAprobando(solicitud.id);
                    setSolicitudCancelando(null);
                    setOperadorAprobacion("");
                    setOpinionAprobacion("");
                  }}
                >
                  Aprobar
                </button>
              )}
              {solicitud.estado !== "CANCELADA" && (
                <>
                  <button type="button" className="solicitudes-secundario" onClick={() => editarSolicitud(solicitud)}>Editar</button>
                  <button type="button" className="solicitudes-peligro" onClick={() => { setSolicitudCancelando(solicitud.id); setSolicitudAprobando(null); setMotivoCancelacion(""); setOperadorCancelacion(""); }}>Cancelar</button>
                </>
              )}
            </div>
            {solicitudAprobando === solicitud.id && (
              <form className="solicitud-aprobacion" onSubmit={aprobar} noValidate>
                <div className="solicitudes-grid">
                  <div className="solicitudes-field">
                    <label htmlFor={`operadorAprobacion-${solicitud.id}`}>Operador (médico del STH)</label>
                    <input
                      id={`operadorAprobacion-${solicitud.id}`}
                      required
                      maxLength={120}
                      value={operadorAprobacion}
                      onChange={(event) => setOperadorAprobacion(event.target.value)}
                    />
                  </div>
                  <div className="solicitudes-field solicitudes-field-span">
                    <label htmlFor={`opinionAprobacion-${solicitud.id}`}>Opinión sobre la indicación (opcional)</label>
                    <textarea
                      id={`opinionAprobacion-${solicitud.id}`}
                      rows={2}
                      maxLength={1000}
                      value={opinionAprobacion}
                      onChange={(event) => setOpinionAprobacion(event.target.value)}
                    />
                  </div>
                </div>
                <div className="solicitudes-actions">
                  <button type="submit" disabled={guardando}>{guardando ? "Aprobando…" : "Confirmar aprobación"}</button>
                  <button type="button" className="solicitudes-secundario" onClick={() => setSolicitudAprobando(null)}>Volver</button>
                </div>
              </form>
            )}
            {solicitudCancelando === solicitud.id && <form className="solicitud-cancelacion" onSubmit={confirmarCancelacion}><p className="solicitudes-nota">Cancelar una solicitud equivale a rechazarla por ser incompleta o inadecuada; el motivo queda registrado en auditoría.</p><div className="solicitudes-grid"><div className="solicitudes-field"><label htmlFor="operadorCancelacion">Operador</label><input id="operadorCancelacion" required value={operadorCancelacion} onChange={(event) => setOperadorCancelacion(event.target.value)} /></div><div className="solicitudes-field"><label htmlFor="motivoCancelacion">Motivo de cancelación / rechazo</label><input id="motivoCancelacion" required value={motivoCancelacion} onChange={(event) => setMotivoCancelacion(event.target.value)} /></div></div><div className="solicitudes-actions"><button type="submit" disabled={guardando}>Confirmar cancelación</button><button type="button" className="solicitudes-secundario" onClick={() => setSolicitudCancelando(null)}>Volver</button></div></form>}
            <details className="solicitud-auditoria"><summary>Ver trazabilidad ({solicitud.auditoria?.length ?? 0})</summary><ol>{solicitud.auditoria?.map((evento) => <li key={evento.id}><strong>{etiqueta(evento.accion)}</strong> · {evento.datoModificado} · {evento.operador} · {formatearFechaHora(evento.fechaHora)}{evento.motivo && <p>Motivo: {evento.motivo}</p>}<p>Anterior: {textoAuditoria(evento.valorAnterior)} → Nuevo: {textoAuditoria(evento.valorNuevo)}</p></li>)}</ol></details>
          </article>)}</div>
        )}
      </section>

      <ConfirmDialog
        open={cancelacionConfirmando && solicitudCancelando !== null}
        title="Confirmar cancelación de solicitud"
        description={
          <>
            <p>
              Se cancelará (rechazará) la solicitud{" "}
              <strong>#{solicitudCancelando}</strong> registrada por{" "}
              <strong>{operadorCancelacion.trim()}</strong>.
            </p>
            <p>Motivo: {motivoCancelacion.trim()}</p>
            <p>La solicitud dejará de estar vigente y la acción quedará auditada.</p>
          </>
        }
        confirmLabel="Confirmar cancelación"
        cancelLabel="Volver"
        destructive
        busy={guardando}
        onCancel={() => setCancelacionConfirmando(false)}
        onConfirm={() => void ejecutarCancelacion()}
      />
    </div>
  );
}
