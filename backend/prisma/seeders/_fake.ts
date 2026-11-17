import { Faker, es } from "@faker-js/faker";

/**
 * Generador de datos falsos determinista para los seeders no enumerativos.
 * Usamos el locale español y una semilla distinta por seeder para que cada
 * archivo sea reproducible e independiente del orden de ejecución.
 */
export const faker = new Faker({ locale: es });

/** Cantidad de registros generados por cada seeder no enumerativo. */
export const CANTIDAD = 60;

/** DNIs y números de unidad ya usados por los registros "base" de los seeders. */
const DNI_RESERVADOS = [
  "30111222",
  "28444555",
  "35999888",
  "27123456",
  "31222333",
  "60000001",
];
const UNIDADES_RESERVADAS = Array.from({ length: 8 }, (_, i) => `U-${1001 + i}`);

let dniUsados = new Set<string>();
let historiaClinicaUsada = new Set<string>();
let unidadesUsadas = new Set<string>();
let emailsUsados = new Set<string>();
let lotesUsados = new Set<string>();

/** Reinicia el generador con una semilla fija y limpia los valores únicos. */
export function resetFake(seed: number): void {
  faker.seed(seed);
  dniUsados = new Set(DNI_RESERVADOS);
  historiaClinicaUsada = new Set();
  unidadesUsadas = new Set(UNIDADES_RESERVADAS);
  emailsUsados = new Set();
  lotesUsados = new Set();
}

function único(set: Set<string>, generar: () => string): string {
  for (let intento = 0; intento < 1000; intento++) {
    const valor = generar();
    if (!set.has(valor)) {
      set.add(valor);
      return valor;
    }
  }
  throw new Error("No se pudo generar un valor único");
}

export function dni(): string {
  return único(dniUsados, () => String(faker.number.int({ min: 40000000, max: 99999999 })));
}

export function historiaClinica(): string {
  return único(historiaClinicaUsada, () => `HC-${faker.number.int({ min: 10000000, max: 99999999 })}`);
}

export function numeroUnidad(): string {
  return único(unidadesUsadas, () => `U-${faker.number.int({ min: 2000, max: 9999 })}`);
}

export function numeroLote(): string {
  return único(lotesUsados, () => `L-2026-${faker.number.int({ min: 1000, max: 9999 })}`);
}

const sinAcentos = (valor: string): string =>
  valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");

export function slug(valor: string): string {
  return sinAcentos(valor);
}

export function email(nombre: string, apellido: string): string {
  return único(emailsUsados, () =>
    faker.internet
      .email({
        firstName: sinAcentos(nombre) || "usuario",
        lastName: `${sinAcentos(apellido) || "demo"}${faker.number.int({ min: 1, max: 9999 })}`,
        provider: "example.com",
      })
      .toLowerCase(),
  );
}

const CALLES = [
  "Av. 9 de Julio",
  "San Martín",
  "Güemes",
  "Sarmiento",
  "Belgrano",
  "Mitre",
  "Rivadavia",
  "Corrientes",
  "Independencia",
  "25 de Mayo",
  "Alberdi",
  "Libertad",
];
const LOCALIDADES = ["Resistencia", "Barranqueras", "Corrientes"];
const CODIGOS_POSTALES = ["3500", "3503", "3400"];
const OPERADORES = ["Seeder", "admin", "fperez", "maternidad", "msosa", "jramirez"];
const OBSERVACIONES = [
  "Sin observaciones",
  "Control de rutina",
  "Paciente estable",
  "Requiere seguimiento",
  "Datos verificados en entrevista",
  "Derivado por médico tratante",
  "Se completan datos en próxima visita",
];
const DIAGNOSTICOS = [
  "Hemocromatosis",
  "Policitemia vera",
  "Talasemia mayor",
  "Sideroblastos en anillo",
  "Enfermedad de Wilson",
  "Anemia de Fanconi",
];
const REPOSICIONES = ["Suero fisiológico", "Dextrán", "Albúmina", "No requiere", "Solución salina isotónica"];
const TOLERANCIAS = ["Buena", "Regular", "Mala", "Sin incidencias"];

export const ESTADOS_DONACION = ["REGISTRADA", "EN_CALIFICACION", "CALIFICADA", "RECHAZADA"] as const;
export const GRUPOS_ABO = ["A", "B", "AB", "O"] as const;
export const FACTORES_RH = ["POSITIVO", "NEGATIVO"] as const;
export const HEMOCOMPONENTES = ["GLOBULOS_ROJOS", "PLASMA", "PLAQUETAS", "CRIOPRECIPITADO"] as const;
export const ESTADOS_SOLICITUD = ["PENDIENTE", "APROBADA", "CANCELADA"] as const;
export const ESTADOS_UNIDAD = ["DISPONIBLE", "RESERVADA", "BLOQUEADA", "VENCIDA", "DADA_DE_BAJA"] as const;
export const ROLES_USUARIO = ["ADMINISTRADOR", "TECNICO_HEMOTERAPIA", "CONSULTA_MATERNIDAD"] as const;
export const RESULTADOS_SEROLOGICOS = ["NO_REACTIVO", "REACTIVO"] as const;
export const SEXOS = ["MASCULINO", "FEMENINO"] as const;

export function pick<T>(valores: readonly T[]): T {
  return faker.helpers.arrayElement(valores);
}

export function muestra<T>(valores: readonly T[], min: number, max: number): T[] {
  return faker.helpers.arrayElements(valores, { min, max });
}

export function entero(min: number, max: number): number {
  return faker.number.int({ min, max });
}

export function booleano(probabilidad = 0.5): boolean {
  return faker.datatype.boolean({ probability: probabilidad });
}

export function nombre(): string {
  return faker.person.firstName();
}

export function apellido(): string {
  return faker.person.lastName();
}

export function sexo(): (typeof SEXOS)[number] {
  return pick(SEXOS);
}

export function calle(): string {
  return pick(CALLES);
}

export function numeroCalle(): string {
  return String(entero(100, 9999));
}

export function localidad(): string {
  return pick(LOCALIDADES);
}

export function codigoPostal(): string {
  return pick(CODIGOS_POSTALES);
}

export function telefono(): string {
  return `3624${entero(10000, 99999)}`;
}

export function operador(): string {
  return pick(OPERADORES);
}

export function observacion(): string | null {
  return booleano(0.75) ? pick(OBSERVACIONES) : null;
}

export function diagnostico(): string {
  return pick(DIAGNOSTICOS);
}

export function reposicion(): string {
  return pick(REPOSICIONES);
}

export function tolerancia(): string {
  return pick(TOLERANCIAS);
}

export function fechaNacimiento(): Date {
  return faker.date.between({ from: "1950-01-01T00:00:00Z", to: "2005-12-31T00:00:00Z" });
}

export function fechaReciente(): Date {
  return faker.date.between({ from: "2025-01-01T00:00:00Z", to: "2026-11-17T00:00:00Z" });
}

export function hora(): Date {
  return new Date(Date.UTC(1970, 0, 1, entero(7, 20), entero(0, 59), 0));
}

export function tensionArterial(): string {
  return `${entero(110, 140)}/${entero(70, 90)}`;
}

/** Devuelve la hemoglobina como string (modelo Donacion). */
export function hemoglobinaTexto(): string {
  return (entero(120, 175) / 10).toFixed(1);
}

/** Devuelve la hemoglobina como número (modelo DonacionDer). */
export function hemoglobinaNumero(): number {
  return entero(120, 175) / 10;
}

export function peso(): number {
  return entero(55, 110);
}

export function enDias(cantidad: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + cantidad);
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}
