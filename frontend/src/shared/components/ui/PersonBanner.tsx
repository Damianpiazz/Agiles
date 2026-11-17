import { StatusChip, type Tono } from "./StatusChip";
import { documentoLegible, formatoFecha, grupoFactorLegible, nombreCompleto } from "@/shared/utils/formato";

interface PersonaParaBanner {
  id: number;
  apellido?: string | null;
  nombre?: string | null;
  dni?: string | null;
  fechaNacimiento?: string | null;
  edad?: number | null;
  grupoFactor?: { grupo?: string | null; factor?: string | null } | null;
}

interface PersonBannerProps {
  persona: PersonaParaBanner;
  estado?: { etiqueta: string; tono: Tono; icono: string };
  datosExtra?: string[];
}

export function PersonBanner({ persona, estado, datosExtra = [] }: PersonBannerProps) {
  const datos = [
    `DNI ${documentoLegible(persona.dni)}`,
    persona.edad != null ? `${persona.edad} años` : null,
    formatoFecha(persona.fechaNacimiento) === "Sin dato" ? null : `Nac. ${formatoFecha(persona.fechaNacimiento)}`,
    `G y F ${grupoFactorLegible(persona.grupoFactor)}`,
    ...datosExtra,
  ].filter((dato): dato is string => Boolean(dato));

  return (
    <div className="person-banner">
      <div>
        <div className="person-banner__name">{nombreCompleto(persona).toUpperCase()}</div>
        <div className="person-banner__meta">
          {datos.map((dato, indice) => (
            <span key={`${dato}-${indice}`} className={indice === 0 ? "person-banner__id" : undefined}>
              {dato}
            </span>
          ))}
        </div>
      </div>
      <div className="person-banner__side">
        {estado ? (
          <StatusChip tono={estado.tono} icono={estado.icono}>
            {estado.etiqueta}
          </StatusChip>
        ) : null}
      </div>
    </div>
  );
}
