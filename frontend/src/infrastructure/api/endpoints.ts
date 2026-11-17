export const endpoints = {
  auth: {
    base: "/auth",
    login: "/auth/login",
    me: "/auth/me",
    logout: "/auth/logout",
  },
  personas: {
    base: "/personas",
    buscar: "/personas/buscar",
    revision: "/personas/revision",
    porDni: (dni: string) => `/personas/dni/${encodeURIComponent(dni)}`,
    historial: (id: number) => `/personas/${id}/historial`,
    semaforo: (id: number) => `/personas/${id}/semaforo`,
    grupoFactor: (id: number) => `/personas/${id}/grupo-factor`,
    detalle: (id: number) => `/personas/${id}`,
  },
  donaciones: {
    base: "/donaciones",
    completa: "/donaciones/completa",
    estudios: (id: number) => `/donaciones/${id}/estudios`,
    detalle: (id: number) => `/donaciones/${id}`,
  },
  transfusiones: {
    base: "/transfusiones",
    porPersona: (id: number) => `/transfusiones/persona/${id}`,
    detalle: (id: number) => `/transfusiones/${id}`,
  },
  sangrias: {
    base: "/sangrias-terapeuticas",
    porPersona: (id: number) => `/sangrias-terapeuticas/persona/${id}`,
    detalle: (id: number) => `/sangrias-terapeuticas/${id}`,
  },
  gestantes: {
    base: "/gestantes",
    completa: "/gestantes/completa",
    porPersona: (id: number) => `/gestantes/paciente/${id}`,
    detalle: (id: number) => `/gestantes/${id}`,
  },
  recienNacidos: {
    base: "/recien-nacidos",
    completa: "/recien-nacidos/completa",
    detalle: (id: number) => `/recien-nacidos/${id}`,
  },
  usuarios: {
    base: "/usuarios",
    detalle: (id: number) => `/usuarios/${id}`,
  },
  auditoria: {
    base: "/auditoria",
    opciones: "/auditoria/opciones",
  },
  reportes: {
    resumen: "/reportes/hemo/resumen",
    hemo: (numero: 1 | 2 | 3 | 4 | 5) => `/reportes/hemo/${numero}`,
  },
  catalogos: {
    base: "/catalogos",
    gruposFactor: "/catalogos/grupos-factor",
    obrasSociales: "/catalogos/obras-sociales",
    medicos: "/catalogos/medicos",
    determinacionesSerologicas: "/catalogos/determinaciones-serologicas",
    determinacionesPcd: "/catalogos/determinaciones-pcd",
    antigenos: "/catalogos/antigenos",
    fenotipos: "/catalogos/fenotipos",
    tiposTransfusion: "/catalogos/tipos-transfusion",
  },
  ubicaciones: {
    provincias: "/provincias",
    ciudades: "/ciudades",
    domicilios: "/domicilios",
  },
} as const;
