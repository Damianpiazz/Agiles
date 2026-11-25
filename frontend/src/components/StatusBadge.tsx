const estados: Record<string, { etiqueta: string; tono: string }> = {
  PENDIENTE: { etiqueta: "Pendiente", tono: "warning" },
  EN_PROCESO: { etiqueta: "En proceso", tono: "info" },
  EN_CALIFICACION: { etiqueta: "En calificación", tono: "info" },
  REGISTRADA: { etiqueta: "Registrada", tono: "info" },
  CALIFICADA: { etiqueta: "Calificada", tono: "success" },
  APROBADA: { etiqueta: "Aprobada", tono: "success" },
  ADMITIDO: { etiqueta: "Admitido", tono: "success" },
  APTA: { etiqueta: "Apta", tono: "success" },
  LIBERADA: { etiqueta: "Liberada", tono: "success" },
  DISPONIBLE: { etiqueta: "Disponible", tono: "success" },
  TRANSFUNDIDA: { etiqueta: "Transfundida", tono: "success" },
  RECHAZADA: { etiqueta: "No apta / rechazada", tono: "danger" },
  DIFERIDO: { etiqueta: "Diferido", tono: "warning" },
  BLOQUEADA: { etiqueta: "Bloqueada", tono: "danger" },
  CANCELADA: { etiqueta: "Cancelada", tono: "neutral" },
  VENCIDA: { etiqueta: "Vencida", tono: "danger" },
  DADA_DE_BAJA: { etiqueta: "Dada de baja", tono: "neutral" },
  EMITIDA: { etiqueta: "Emitida", tono: "info" },
  RESERVADA: { etiqueta: "Reservada", tono: "info" },
  POSITIVO: { etiqueta: "Reactivo / positivo", tono: "danger" },
  NEGATIVO: { etiqueta: "No reactivo / negativo", tono: "success" },
};

type Props = {
  estado: string;
  etiqueta?: string;
};

export function StatusBadge({ estado, etiqueta }: Props) {
  const config = estados[estado] ?? {
    etiqueta: estado.replaceAll("_", " "),
    tono: "neutral",
  };

  return (
    <span className={`ui-badge ui-badge-${config.tono}`}>
      {etiqueta ?? config.etiqueta}
    </span>
  );
}
