-- Snapshot operativo del dashboard en una sola llamada a PostgreSQL.
-- La función agrega inventario, donaciones, solicitudes, transfusiones, alertas
-- y trazabilidad en una única ida/vuelta de red. El estado actual del inventario
-- no se filtra por período; las métricas de actividad sí.

CREATE OR REPLACE FUNCTION florhema_dashboard_snapshot(
  p_desde timestamptz,
  p_hasta timestamptz,
  p_componente text DEFAULT '',
  p_grupo text DEFAULT '',
  p_estado text DEFAULT ''
)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $function$
WITH params AS (
  SELECT
    p_desde AS desde,
    p_hasta AS hasta,
    p_desde - (p_hasta - p_desde) AS desde_anterior,
    (CURRENT_DATE + INTERVAL '30 days') AS corte_vencimiento,
    (CURRENT_DATE + INTERVAL '7 days') AS corte_alerta
),
unidades_base AS (
  SELECT
    u.*,
    u."grupoABO" || CASE WHEN u."factorRhD" = 'POSITIVO' THEN '+' ELSE '-' END AS grupo,
    (p_componente = '' OR u."tipoHemocomponente"::text = p_componente) AS ok_componente,
    (
      p_grupo = ''
      OR u."grupoABO" || CASE WHEN u."factorRhD" = 'POSITIVO' THEN '+' ELSE '-' END = p_grupo
    ) AS ok_grupo,
    (
      p_estado = ''
      OR split_part(p_estado, ':', 1) <> 'unidades'
      OR p_estado = 'unidades:' || u.estado::text
    ) AS ok_estado
  FROM unidades_sangre u
),
uf AS (SELECT * FROM unidades_base WHERE ok_componente AND ok_grupo AND ok_estado),
donaciones_base AS (
  SELECT
    d.*,
    (
      p_estado = ''
      OR split_part(p_estado, ':', 1) <> 'donaciones'
      OR p_estado = 'donaciones:' || d.estado::text
    ) AS ok_estado
  FROM donaciones d
),
df AS (SELECT * FROM donaciones_base WHERE ok_estado),
solicitudes_base AS (
  SELECT
    s.*,
    (
      p_estado = ''
      OR split_part(p_estado, ':', 1) <> 'solicitudes'
      OR p_estado = 'solicitudes:' || s.estado::text
    ) AS ok_estado
  FROM solicitudes_transfusion s
),
sf AS (
  SELECT * FROM solicitudes_base
  WHERE ok_estado
    AND (p_componente = '' OR "tipoHemocomponente"::text = p_componente)
),
kpis AS (
  SELECT jsonb_build_object(
    'unidadesDisponibles', (SELECT count(*)::int FROM uf WHERE estado = 'DISPONIBLE'),
    'calificacionesPendientes', (
      SELECT count(*)::int FROM df d
      WHERE d.estado IN ('REGISTRADA', 'EN_CALIFICACION')
        AND NOT EXISTS (
          SELECT 1 FROM calificaciones_biologicas c WHERE c."donacionId" = d.id
        )
    ),
    'solicitudesPendientes', (SELECT count(*)::int FROM sf WHERE estado = 'PENDIENTE'),
    'unidadesProximasVencer', (
      SELECT count(*)::int FROM uf, params p
      WHERE estado IN ('DISPONIBLE', 'RESERVADA')
        AND "fechaVencimiento" >= CURRENT_DATE
        AND "fechaVencimiento" <= p.corte_vencimiento
    ),
    'donacionesPeriodo', (
      SELECT count(*)::int FROM df d, params p
      WHERE d."fechaHora" >= p.desde AND d."fechaHora" < p.hasta
    ),
    'unidadesEmitidas', (SELECT count(*)::int FROM uf WHERE estado = 'EMITIDA')
  ) AS value
),
comparativos AS (
  SELECT jsonb_build_object(
    'donacionesAnterior', (
      SELECT count(*)::int FROM df d, params p
      WHERE d."fechaHora" >= p.desde_anterior AND d."fechaHora" < p.desde
    ),
    'solicitudesAnterior', (
      SELECT count(*)::int FROM sf s, params p
      WHERE s."fechaHora" >= p.desde_anterior AND s."fechaHora" < p.desde
    )
  ) AS value
),
inv_totales AS (
  SELECT jsonb_build_object(
    'disponible', count(*) FILTER (WHERE estado = 'DISPONIBLE')::int,
    'reservada', count(*) FILTER (WHERE estado = 'RESERVADA')::int,
    'bloqueada', count(*) FILTER (WHERE estado = 'BLOQUEADA')::int,
    'emitida', count(*) FILTER (WHERE estado = 'EMITIDA')::int,
    'vencida', count(*) FILTER (WHERE estado = 'VENCIDA')::int,
    'dadaDeBaja', count(*) FILTER (WHERE estado = 'DADA_DE_BAJA')::int,
    'proximasVencer', count(*) FILTER (
      WHERE estado IN ('DISPONIBLE', 'RESERVADA')
        AND "fechaVencimiento" >= CURRENT_DATE
        AND "fechaVencimiento" <= p.corte_vencimiento
    )::int
  ) AS value
  FROM uf CROSS JOIN params p
),
inv_componente AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'tipo', tipo,
    'disponible', disponible,
    'reservada', reservada,
    'bloqueada', bloqueada
  ) ORDER BY tipo), '[]'::jsonb) AS value
  FROM (
    SELECT
      "tipoHemocomponente" AS tipo,
      count(*) FILTER (WHERE estado = 'DISPONIBLE')::int AS disponible,
      count(*) FILTER (WHERE estado = 'RESERVADA')::int AS reservada,
      count(*) FILTER (WHERE estado = 'BLOQUEADA')::int AS bloqueada
    FROM uf GROUP BY "tipoHemocomponente"
  ) x
),
inv_grupo AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'label', grupo,
    'value', total
  ) ORDER BY grupo), '[]'::jsonb) AS value
  FROM (
    SELECT grupo, count(*)::int AS total
    FROM uf WHERE estado = 'DISPONIBLE' GROUP BY grupo
  ) x
),
inv_estado AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'label', estado,
    'value', total
  ) ORDER BY total DESC), '[]'::jsonb) AS value
  FROM (
    SELECT estado::text, count(*)::int AS total FROM uf GROUP BY estado
  ) x
),
movimientos AS (
  SELECT
    date_trunc('day', u."fechaRecepcion" AT TIME ZONE 'America/Argentina/Buenos_Aires')::date AS dia,
    1 AS entradas, 0 AS salidas, 0 AS emitidas
  FROM uf u CROSS JOIN params p
  WHERE u."fechaRecepcion" >= p.desde AND u."fechaRecepcion" < p.hasta
  UNION ALL
  SELECT
    date_trunc('day', u."fechaBaja" AT TIME ZONE 'America/Argentina/Buenos_Aires')::date,
    0, 1, 0
  FROM uf u CROSS JOIN params p
  WHERE u."fechaBaja" >= p.desde AND u."fechaBaja" < p.hasta
  UNION ALL
  SELECT
    date_trunc('day', e."fechaHora" AT TIME ZONE 'America/Argentina/Buenos_Aires')::date,
    0, 0, 1
  FROM emisiones_unidad e
  JOIN uf u ON u.id = e."unidadSangreId"
  CROSS JOIN params p
  WHERE e."fechaHora" >= p.desde AND e."fechaHora" < p.hasta
),
inv_evolucion AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'fecha', to_char(dia, 'YYYY-MM-DD'),
    'entradas', entradas,
    'salidas', salidas,
    'emitidas', emitidas
  ) ORDER BY dia), '[]'::jsonb) AS value
  FROM (
    SELECT
      d.dia::date AS dia,
      COALESCE(sum(m.entradas), 0)::int AS entradas,
      COALESCE(sum(m.salidas), 0)::int AS salidas,
      COALESCE(sum(m.emitidas), 0)::int AS emitidas
    FROM params p
    CROSS JOIN LATERAL generate_series(p.desde::date, p.hasta::date - INTERVAL '1 day', INTERVAL '1 day') AS d(dia)
    LEFT JOIN movimientos m ON m.dia = d.dia::date
    GROUP BY d.dia
  ) x
),
inv_vencimientos AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id,
    'numeroUnidad', "numeroUnidad",
    'tipo', "tipoHemocomponente",
    'grupo', grupo,
    'fechaVencimiento', to_char("fechaVencimiento", 'YYYY-MM-DD'),
    'estado', estado,
    'diasRestantes', ("fechaVencimiento" - CURRENT_DATE)
  ) ORDER BY "fechaVencimiento", id), '[]'::jsonb) AS value
  FROM (
    SELECT * FROM uf, params p
    WHERE estado NOT IN ('EMITIDA', 'DADA_DE_BAJA', 'VENCIDA')
      AND "fechaVencimiento" <= p.corte_vencimiento
    ORDER BY "fechaVencimiento" LIMIT 25
  ) v
),
don_totales AS (
  SELECT jsonb_build_object(
    'periodo', count(*) FILTER (WHERE d."fechaHora" >= p.desde AND d."fechaHora" < p.hasta)::int,
    'registradas', count(*) FILTER (WHERE d.estado = 'REGISTRADA')::int,
    'enCalificacion', count(*) FILTER (WHERE d.estado = 'EN_CALIFICACION')::int,
    'calificadas', count(*) FILTER (WHERE d.estado = 'CALIFICADA')::int,
    'rechazadas', count(*) FILTER (WHERE d.estado = 'RECHAZADA')::int,
    'calificacionesIniciadas', (
      SELECT count(*)::int FROM calificaciones_biologicas c
      JOIN df x ON x.id = c."donacionId"
      CROSS JOIN params pp
      WHERE c."fechaInicio" >= pp.desde AND c."fechaInicio" < pp.hasta
    ),
    'sinCalificacion', count(*) FILTER (
      WHERE NOT EXISTS (
        SELECT 1 FROM calificaciones_biologicas c WHERE c."donacionId" = d.id
      )
    )::int,
    'pendientesLiberacion', count(*) FILTER (WHERE d."estadoUnidad" = 'PENDIENTE')::int,
    'unidadesBloqueadas', count(*) FILTER (WHERE d."estadoUnidad" = 'BLOQUEADA')::int
  ) AS value
  FROM df d CROSS JOIN params p
),
don_evolucion AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'fecha', to_char(dia, 'YYYY-MM-DD'),
    'cantidad', cantidad
  ) ORDER BY dia), '[]'::jsonb) AS value
  FROM (
    SELECT dia.dia::date AS dia, count(d.id)::int AS cantidad
    FROM params p
    CROSS JOIN LATERAL generate_series(p.desde::date, p.hasta::date - INTERVAL '1 day', INTERVAL '1 day') AS dia(dia)
    LEFT JOIN df d
      ON date_trunc('day', d."fechaHora" AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = dia.dia::date
     AND d."fechaHora" >= p.desde AND d."fechaHora" < p.hasta
    GROUP BY dia.dia
  ) x
),
don_calificacion AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'label', estado,
    'value', total
  ) ORDER BY total DESC), '[]'::jsonb) AS value
  FROM (
    SELECT COALESCE(c.estado::text, 'SIN_INICIO') AS estado, count(*)::int AS total
    FROM df d LEFT JOIN calificaciones_biologicas c ON c."donacionId" = d.id
    GROUP BY COALESCE(c.estado::text, 'SIN_INICIO')
  ) x
),
don_flujo AS (
  SELECT jsonb_build_array(
    jsonb_build_object('label', 'Donación registrada', 'value', (
      SELECT count(*)::int FROM df
    )),
    jsonb_build_object('label', 'Calificación iniciada', 'value', (
      SELECT count(*)::int FROM calificaciones_biologicas c JOIN df d ON d.id = c."donacionId"
    )),
    jsonb_build_object('label', 'Estudios registrados', 'value', (
      SELECT count(DISTINCT x."donacionId")::int FROM (
        SELECT "donacionId" FROM pci_donaciones UNION SELECT "donacionId" FROM serologia_donaciones
      ) x JOIN df d ON d.id = x."donacionId"
    )),
    jsonb_build_object('label', 'Anticuerpo registrado', 'value', (
      SELECT count(*)::int FROM df d
      WHERE EXISTS (SELECT 1 FROM anticuerpos_irregulares a WHERE a."donacionId" = d.id)
    )),
    jsonb_build_object('label', 'Unidad liberada o bloqueada', 'value', (
      SELECT count(*)::int FROM df d WHERE d."estadoUnidad" IN ('LIBERADA', 'BLOQUEADA')
    ))
  ) AS value
),
don_pendientes AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id,
    'donante', donante,
    'dni', dni,
    'fecha', to_char(fecha, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'estado', estado,
    'calificacion', calificacion,
    'estadoUnidad', estado_unidad,
    'anticuerpo', anticuerpo,
    'discrepancia', discrepancia
  ) ORDER BY fecha DESC), '[]'::jsonb) AS value
  FROM (
    SELECT
      d.id,
      concat(do_.apellido, ', ', do_.nombre) AS donante,
      do_.dni,
      d."fechaHora" AT TIME ZONE 'UTC' AS fecha,
      d.estado::text AS estado,
      c.estado::text AS calificacion,
      d."estadoUnidad"::text AS estado_unidad,
      a.resultado::text AS anticuerpo,
      COALESCE(d."observacionDiscrepancia" IS NOT NULL AND NOT d."discrepanciaResuelta", false) AS discrepancia
    FROM df d
    JOIN donantes do_ ON do_.id = d."donanteId"
    LEFT JOIN calificaciones_biologicas c ON c."donacionId" = d.id
    LEFT JOIN anticuerpos_irregulares a ON a."donacionId" = d.id
    WHERE d.estado IN ('REGISTRADA', 'EN_CALIFICACION') OR d."estadoUnidad" = 'PENDIENTE'
    ORDER BY d."fechaHora" DESC LIMIT 25
  ) x
),
sol_totales AS (
  SELECT jsonb_build_object(
    'pacientesRegistrados', (SELECT count(*)::int FROM pacientes),
    'periodo', count(*)::int,
    'pendientes', count(*) FILTER (WHERE estado = 'PENDIENTE')::int,
    'aprobadas', count(*) FILTER (WHERE estado = 'APROBADA')::int,
    'canceladas', count(*) FILTER (WHERE estado = 'CANCELADA')::int,
    'conUnidadesReservadas', (
      SELECT count(DISTINCT s.id)::int FROM sf s
      WHERE EXISTS (
        SELECT 1 FROM uf u WHERE u."solicitudId" = s.id AND u.estado = 'RESERVADA'
      )
    )
  ) AS value
  FROM sf s CROSS JOIN params p
  WHERE s."fechaHora" >= p.desde AND s."fechaHora" < p.hasta
),
sol_estado AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object('label', estado, 'value', total)
    ORDER BY total DESC), '[]'::jsonb) AS value
  FROM (
    SELECT estado::text, count(*)::int AS total FROM sf GROUP BY estado
  ) x
),
sol_evolucion AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'fecha', to_char(dia, 'YYYY-MM-DD'),
    'cantidad', cantidad
  ) ORDER BY dia), '[]'::jsonb) AS value
  FROM (
    SELECT dia.dia::date AS dia, count(s.id)::int AS cantidad
    FROM params p
    CROSS JOIN LATERAL generate_series(p.desde::date, p.hasta::date - INTERVAL '1 day', INTERVAL '1 day') AS dia(dia)
    LEFT JOIN sf s
      ON date_trunc('day', s."fechaHora" AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = dia.dia::date
     AND s."fechaHora" >= p.desde AND s."fechaHora" < p.hasta
    GROUP BY dia.dia
  ) x
),
sol_componente AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object('label', tipo, 'value', total)
    ORDER BY total DESC), '[]'::jsonb) AS value
  FROM (
    SELECT "tipoHemocomponente" AS tipo, count(*)::int AS total
    FROM sf s CROSS JOIN params p
    WHERE s."fechaHora" >= p.desde AND s."fechaHora" < p.hasta
    GROUP BY "tipoHemocomponente"
  ) x
),
sol_recientes AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id,
    'paciente', paciente,
    'fecha', to_char(fecha, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'tipo', tipo,
    'cantidad', cantidad,
    'estado', estado
  ) ORDER BY fecha DESC), '[]'::jsonb) AS value
  FROM (
    SELECT
      s.id,
      s."nombrePaciente" AS paciente,
      s."fechaHora" AT TIME ZONE 'UTC' AS fecha,
      s."tipoHemocomponente"::text AS tipo,
      s.cantidad,
      s.estado::text AS estado
    FROM sf s CROSS JOIN params p
    WHERE s."fechaHora" >= p.desde AND s."fechaHora" < p.hasta
    ORDER BY s."fechaHora" DESC LIMIT 25
  ) x
),
tra_totales AS (
  SELECT jsonb_build_object(
    'aprobadasSinEstudios', (
      SELECT count(*)::int FROM sf s CROSS JOIN params p
      WHERE s.estado = 'APROBADA'
        AND s."fechaHora" >= p.desde AND s."fechaHora" < p.hasta
        AND NOT EXISTS (
          SELECT 1 FROM estudios_pretransfusionales e WHERE e."solicitudId" = s.id
        )
    ),
    'unidadesReservadas', (SELECT count(*)::int FROM uf WHERE estado = 'RESERVADA'),
    'unidadesEmitidas', (SELECT count(*)::int FROM uf WHERE estado = 'EMITIDA'),
    'bajasPorTransfusion', (
      SELECT count(*)::int FROM uf u CROSS JOIN params p
      WHERE u."motivoBaja" = 'TRANSFUNDIDA'
        AND u."fechaBaja" >= p.desde AND u."fechaBaja" < p.hasta
    )
  ) AS value
),
tra_estado AS (
  SELECT jsonb_build_array(
    jsonb_build_object('label', 'RESERVADA', 'value', (SELECT count(*)::int FROM uf WHERE estado = 'RESERVADA')),
    jsonb_build_object('label', 'EMITIDA', 'value', (SELECT count(*)::int FROM uf WHERE estado = 'EMITIDA')),
    jsonb_build_object('label', 'BAJA_TRANSFUNDIDA', 'value', (SELECT count(*)::int FROM uf WHERE "motivoBaja" = 'TRANSFUNDIDA'))
  ) AS value
),
tra_actividad AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'paciente', paciente,
    'solicitudId', solicitud_id,
    'numeroUnidad', numero_unidad,
    'tipo', tipo,
    'estadoUnidad', estado_unidad,
    'fecha', to_char(fecha, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'responsable', responsable
  ) ORDER BY fecha DESC), '[]'::jsonb) AS value
  FROM (
    SELECT
      e."nombrePaciente" AS paciente,
      e."solicitudId" AS solicitud_id,
      e."numeroUnidad" AS numero_unidad,
      e."tipoHemocomponente"::text AS tipo,
      u.estado::text AS estado_unidad,
      e."fechaHora" AT TIME ZONE 'UTC' AS fecha,
      e.responsable
    FROM emisiones_unidad e
    JOIN uf u ON u.id = e."unidadSangreId"
    CROSS JOIN params p
    WHERE e."fechaHora" >= p.desde AND e."fechaHora" < p.hasta
    ORDER BY e."fechaHora" DESC LIMIT 25
  ) x
),
alertas AS (
  SELECT COALESCE(jsonb_agg(a.doc ORDER BY
    CASE a.doc->>'prioridad' WHEN 'Crítica' THEN 1 WHEN 'Alta' THEN 2 WHEN 'Advertencia' THEN 3 ELSE 4 END,
    COALESCE(a.doc->>'fecha', '') DESC
  ), '[]'::jsonb) AS value
  FROM (
    SELECT jsonb_build_object(
      'tipo', 'Unidades vencidas',
      'descripcion', format('%s unidades registradas como VENCIDA requieren retiro del inventario', (SELECT count(*) FROM uf WHERE estado = 'VENCIDA')),
      'registroId', NULL::int,
      'fecha', NULL::timestamptz,
      'prioridad', 'Crítica',
      'vista', 'recepcion'
    ) WHERE EXISTS (SELECT 1 FROM uf WHERE estado = 'VENCIDA')
    UNION ALL
    SELECT jsonb_build_object(
      'tipo', 'Discrepancia inmunohematológica sin resolver',
      'descripcion', format('%s donaciones con observación de discrepancia y sin resolución registrada', (SELECT count(*) FROM df WHERE "observacionDiscrepancia" IS NOT NULL AND NOT "discrepanciaResuelta")),
      'registroId', NULL::int,
      'fecha', NULL::timestamptz,
      'prioridad', 'Crítica',
      'vista', 'consultaResultados'
    ) WHERE EXISTS (SELECT 1 FROM df WHERE "observacionDiscrepancia" IS NOT NULL AND NOT "discrepanciaResuelta")
    UNION ALL
    SELECT jsonb_build_object(
      'tipo', 'Unidades bloqueadas',
      'descripcion', format('%s unidades se encuentran BLOQUEADAS', (SELECT count(*) FROM uf WHERE estado = 'BLOQUEADA')),
      'registroId', NULL::int,
      'fecha', NULL::timestamptz,
      'prioridad', 'Alta',
      'vista', 'liberacion'
    ) WHERE EXISTS (SELECT 1 FROM uf WHERE estado = 'BLOQUEADA')
    UNION ALL
    SELECT jsonb_build_object(
      'tipo', 'Resultado de anticuerpo irregular registrado',
      'descripcion', format('%s donaciones tienen un resultado POSITIVO registrado en el sistema', (SELECT count(*) FROM df d JOIN anticuerpos_irregulares a ON a."donacionId" = d.id WHERE a.resultado = 'POSITIVO')),
      'registroId', NULL::int,
      'fecha', NULL::timestamptz,
      'prioridad', 'Alta',
      'vista', 'consultaResultados'
    ) WHERE EXISTS (
      SELECT 1 FROM df d JOIN anticuerpos_irregulares a ON a."donacionId" = d.id WHERE a.resultado = 'POSITIVO'
    )
    UNION ALL
    SELECT jsonb_build_object(
      'tipo', 'Solicitudes pendientes de gestión',
      'descripcion', format('%s solicitudes continúan en estado PENDIENTE', (SELECT count(*) FROM sf WHERE estado = 'PENDIENTE')),
      'registroId', NULL::int,
      'fecha', NULL::timestamptz,
      'prioridad', 'Alta',
      'vista', 'solicitudesTransfusion'
    ) WHERE EXISTS (SELECT 1 FROM sf WHERE estado = 'PENDIENTE')
    UNION ALL
    SELECT jsonb_build_object(
      'tipo', 'Donaciones sin calificación iniciada',
      'descripcion', format('%s donaciones registradas no tienen calificación biológica iniciada', (SELECT count(*) FROM df d WHERE d.estado IN ('REGISTRADA','EN_CALIFICACION') AND NOT EXISTS (SELECT 1 FROM calificaciones_biologicas c WHERE c."donacionId" = d.id))),
      'registroId', NULL::int,
      'fecha', NULL::timestamptz,
      'prioridad', 'Advertencia',
      'vista', 'calificacion'
    ) WHERE EXISTS (
      SELECT 1 FROM df d WHERE d.estado IN ('REGISTRADA','EN_CALIFICACION')
        AND NOT EXISTS (SELECT 1 FROM calificaciones_biologicas c WHERE c."donacionId" = d.id)
    )
    UNION ALL
    SELECT jsonb_build_object(
      'tipo', 'Vencimientos próximos',
      'descripcion', format('%s unidades disponibles o reservadas vencen en los próximos 30 días', (SELECT count(*) FROM uf, params p WHERE estado IN ('DISPONIBLE','RESERVADA') AND "fechaVencimiento" >= CURRENT_DATE AND "fechaVencimiento" <= p.corte_vencimiento)),
      'registroId', NULL::int,
      'fecha', NULL::timestamptz,
      'prioridad', CASE WHEN EXISTS (
        SELECT 1 FROM uf, params p WHERE estado IN ('DISPONIBLE','RESERVADA')
          AND "fechaVencimiento" >= CURRENT_DATE AND "fechaVencimiento" <= p.corte_alerta
      ) THEN 'Alta' ELSE 'Advertencia' END,
      'vista', 'recepcion'
    ) WHERE EXISTS (
      SELECT 1 FROM uf, params p WHERE estado IN ('DISPONIBLE','RESERVADA')
        AND "fechaVencimiento" >= CURRENT_DATE AND "fechaVencimiento" <= p.corte_vencimiento
    )
    UNION ALL
    SELECT jsonb_build_object(
      'tipo', 'Solicitudes aprobadas sin estudios registrados',
      'descripcion', format('%s solicitudes aprobadas no tienen estudios pretransfusionales cargados', (SELECT count(*) FROM sf s WHERE s.estado = 'APROBADA' AND NOT EXISTS (SELECT 1 FROM estudios_pretransfusionales e WHERE e."solicitudId" = s.id))),
      'registroId', NULL::int,
      'fecha', NULL::timestamptz,
      'prioridad', 'Advertencia',
      'vista', 'estudiosPretransfusionales'
    ) WHERE EXISTS (
      SELECT 1 FROM sf s WHERE s.estado = 'APROBADA'
        AND NOT EXISTS (SELECT 1 FROM estudios_pretransfusionales e WHERE e."solicitudId" = s.id)
    )
  ) AS a(doc)
),
actividad AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'tipo', tipo,
    'descripcion', descripcion,
    'fecha', to_char(fecha, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'usuario', usuario,
    'registroId', registro_id,
    'vista', vista
  ) ORDER BY fecha DESC), '[]'::jsonb) AS value
  FROM (
    SELECT 'Donación' AS tipo, concat('Donación #', d.id) AS descripcion,
      d."createdAt" AT TIME ZONE 'UTC' AS fecha, d.operador AS usuario, d.id AS registro_id, 'calificacion' AS vista
    FROM df d CROSS JOIN params p
    WHERE d."createdAt" >= p.desde AND d."createdAt" < p.hasta
    UNION ALL
    SELECT 'Paciente', concat(pac.nombre, ' ', pac.apellido),
      pac."createdAt" AT TIME ZONE 'UTC', pac.operador, pac.id, 'buscarPaciente'
    FROM pacientes pac CROSS JOIN params p
    WHERE pac."createdAt" >= p.desde AND pac."createdAt" < p.hasta
    UNION ALL
    SELECT 'Solicitud', concat('Solicitud #', s.id),
      s."createdAt" AT TIME ZONE 'UTC', s.operador, s.id, 'solicitudesTransfusion'
    FROM sf s CROSS JOIN params p
    WHERE s."createdAt" >= p.desde AND s."createdAt" < p.hasta
    UNION ALL
    SELECT 'Estudio pretransfusional', concat(e.tipo::text, ' · solicitud #', e."solicitudId"),
      e."createdAt" AT TIME ZONE 'UTC', e.operador, e.id, 'estudiosPretransfusionales'
    FROM estudios_pretransfusionales e CROSS JOIN params p
    WHERE e."createdAt" >= p.desde AND e."createdAt" < p.hasta
    UNION ALL
    SELECT 'Recepción de unidad', concat(u."numeroUnidad", ' · ', u."tipoHemocomponente"::text),
      u."fechaRecepcion" AT TIME ZONE 'UTC', u.operador, u.id, 'recepcion'
    FROM uf u CROSS JOIN params p
    WHERE u."fechaRecepcion" >= p.desde AND u."fechaRecepcion" < p.hasta
    UNION ALL
    SELECT 'Baja de unidad', concat(u."numeroUnidad", ' · ', u."motivoBaja"::text),
      u."fechaBaja" AT TIME ZONE 'UTC', COALESCE(u."operadorBaja", ''), u.id, 'baja'
    FROM uf u CROSS JOIN params p
    WHERE u."fechaBaja" >= p.desde AND u."fechaBaja" < p.hasta
    UNION ALL
    SELECT 'Emisión', concat(e."numeroUnidad", ' · solicitud #', e."solicitudId"),
      e."fechaHora" AT TIME ZONE 'UTC', e.responsable, e.id, 'emision'
    FROM emisiones_unidad e JOIN uf u ON u.id = e."unidadSangreId" CROSS JOIN params p
    WHERE e."fechaHora" >= p.desde AND e."fechaHora" < p.hasta
    UNION ALL
    SELECT 'Calificación biológica', concat('Donación #', c."donacionId"),
      c."fechaInicio" AT TIME ZONE 'UTC', c.operador, c.id, 'calificacion'
    FROM calificaciones_biologicas c JOIN df d ON d.id = c."donacionId" CROSS JOIN params p
    WHERE c."fechaInicio" >= p.desde AND c."fechaInicio" < p.hasta
    ORDER BY 3 DESC LIMIT 30
  ) eventos
)
SELECT jsonb_build_object(
  'generadoEn', now(),
  'periodo', jsonb_build_object('desde', p_desde, 'hasta', p_hasta),
  'kpis', (SELECT value FROM kpis),
  'comparativos', (SELECT value FROM comparativos),
  'inventario', jsonb_build_object(
    'totales', (SELECT value FROM inv_totales),
    'porComponente', (SELECT value FROM inv_componente),
    'porGrupo', (SELECT value FROM inv_grupo),
    'porEstado', (SELECT value FROM inv_estado),
    'evolucion', (SELECT value FROM inv_evolucion),
    'vencimientos', (SELECT value FROM inv_vencimientos)
  ),
  'donaciones', jsonb_build_object(
    'totales', (SELECT value FROM don_totales),
    'evolucion', (SELECT value FROM don_evolucion),
    'estadosCalificacion', (SELECT value FROM don_calificacion),
    'flujo', (SELECT value FROM don_flujo),
    'pendientes', (SELECT value FROM don_pendientes)
  ),
  'solicitudes', jsonb_build_object(
    'totales', (SELECT value FROM sol_totales),
    'porEstado', (SELECT value FROM sol_estado),
    'evolucion', (SELECT value FROM sol_evolucion),
    'porComponente', (SELECT value FROM sol_componente),
    'recientes', (SELECT value FROM sol_recientes)
  ),
  'transfusiones', jsonb_build_object(
    'totales', (SELECT value FROM tra_totales),
    'porEstado', (SELECT value FROM tra_estado),
    'actividad', (SELECT value FROM tra_actividad)
  ),
  'alertas', (SELECT value FROM alertas),
  'actividad', (SELECT value FROM actividad)
);
$function$;
