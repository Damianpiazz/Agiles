const decimal = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
const entero = new Intl.NumberFormat("es-AR");

export function formatoNumero(valor: number | null | undefined, decimales = true): string {
  if (valor === null || valor === undefined) return "Sin dato";
  return (decimales ? decimal : entero).format(valor);
}

export function formatoFecha(iso: string | null | undefined): string {
  if (!iso) return "Sin dato";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "Sin dato";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fecha);
}

export function formatoFechaHora(iso: string | null | undefined): string {
  if (!iso) return "Sin dato";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "Sin dato";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(fecha);
}

export function fechaParaInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toISOString().slice(0, 10);
}

export function nombreCompleto(persona: { apellido?: string | null; nombre?: string | null } | null | undefined): string {
  if (!persona) return "Sin persona";
  return [persona.apellido, persona.nombre].filter(Boolean).join(", ") || "Sin nombre";
}

export function apellidoNombre(persona: { apellido?: string | null; nombre?: string | null } | null | undefined): string {
  const nombre = nombreCompleto(persona);
  return nombre.includes(", ") ? nombre : nombre;
}

export function documentoLegible(dni: string | null | undefined): string {
  if (!dni) return "Sin DNI";
  const soloDigitos = dni.replace(/\D/g, "");
  if (soloDigitos.length <= 8) return soloDigitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return dni;
}

export function grupoFactorLegible(grupoFactor: { grupo?: string | null; factor?: string | null } | null | undefined): string {
  if (!grupoFactor?.grupo) return "Sin grupo";
  return `${grupoFactor.grupo}${grupoFactor.factor ?? ""}`;
}

export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}
