import type { Rol } from "./roles";

export interface ItemNav {
  to: string;
  label: string;
  icon: string;
  roles?: Rol[];
  grupo: "Operación" | "Administración";
}

export const ITEMS_NAV: ItemNav[] = [
  { to: "/", label: "Búsqueda", icon: "⌕", grupo: "Operación" },
  { to: "/personas", label: "Personas", icon: "◫", grupo: "Operación" },
  { to: "/posta-fija", label: "Posta fija", icon: "♥", grupo: "Operación" },
  { to: "/donaciones-estudios", label: "Donaciones y estudios", icon: "◉", grupo: "Operación" },
  { to: "/unidad-transfusional", label: "Unidad transfusional", icon: "⊕", grupo: "Operación" },
  { to: "/gestantes", label: "Gestantes y RN", icon: "◌", grupo: "Operación", roles: ["ADMINISTRADOR", "TECNICO_HEMOTERAPIA"] },
  { to: "/maternidad", label: "Consulta de estudios", icon: "👁", grupo: "Operación", roles: ["ADMINISTRADOR", "CONSULTA_MATERNIDAD"] },
  { to: "/sangrias", label: "Sangrías terapéuticas", icon: "↧", grupo: "Operación", roles: ["ADMINISTRADOR", "TECNICO_HEMOTERAPIA"] },
  { to: "/reportes", label: "Reportes HEMO", icon: "▤", grupo: "Operación" },
  { to: "/usuarios", label: "Usuarios y técnicos", icon: "♙", grupo: "Administración", roles: ["ADMINISTRADOR"] },
  { to: "/catalogos", label: "Catálogos maestros", icon: "☰", grupo: "Administración", roles: ["ADMINISTRADOR"] },
  { to: "/auditoria", label: "Auditoría", icon: "◷", grupo: "Administración", roles: ["ADMINISTRADOR"] },
];

export function itemsParaRol(rol: Rol | null): ItemNav[] {
  return ITEMS_NAV.filter((item) => !item.roles || (rol !== null && item.roles.includes(rol)));
}

export function puedeAcceder(ruta: string, rol: Rol | null): boolean {
  const item = ITEMS_NAV.find((entrada) => entrada.to === ruta);
  if (!item?.roles) return true;
  return rol !== null && item.roles.includes(rol);
}
