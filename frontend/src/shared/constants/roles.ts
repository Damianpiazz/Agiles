export type Rol = "ADMINISTRADOR" | "TECNICO_HEMOTERAPIA" | "CONSULTA_MATERNIDAD";

export const ROL_LABELS: Record<Rol, string> = {
  ADMINISTRADOR: "Administración",
  TECNICO_HEMOTERAPIA: "Hemoterapia",
  CONSULTA_MATERNIDAD: "Consulta (solo lectura)",
};

export function esRol(valor: string | undefined | null): valor is Rol {
  return valor === "ADMINISTRADOR" || valor === "TECNICO_HEMOTERAPIA" || valor === "CONSULTA_MATERNIDAD";
}
