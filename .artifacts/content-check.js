async (page) => {
  const BASE = 'http://127.0.0.1:5173';
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => { localStorage.setItem('florhema.token.v1', 'mock-token'); });

  const persona = {
    id: 1, dni: '35489123', historiaClinica: '1001', nombre: 'Juan Carlos', apellido: 'Pérez',
    telefono: '221-555-1234', fechaNacimiento: '1990-05-14', lugarNacimiento: 'La Plata',
    sexoBiologico: 'MASCULINO', idDireccion: 1, idGrupoFactor: 1, edad: 36,
    grupoFactor: { id: 1, grupo: 'O', factor: '+' },
    direccion: { id: 1, calle: 'Calle 7', numero: '1234', ciudad: { id: 1, nombre: 'La Plata', provincia: { id: 1, nombre: 'Buenos Aires' } } },
    semaforo: { estado: 'APTO', color: 'VERDE', colorHex: '#1C7A45', motivo: 'Apto para donar' },
    resumen: { donaciones: 3, transfusiones: 0, estudiosGestante: 0, recienNacidos: 0, sangrias: 0 }
  };
  const historial = { persona, semaforo: persona.semaforo, resumen: persona.resumen, donaciones: [{ id: 1025, fecha: '2026-03-12' }], transfusiones: [], estudiosGestante: [], estudiosRecienNacido: [], sangriasTerapeuticas: [] };
  const admin = { id: 1, nombre: 'Facundo', apellido: 'Pérez', usuario: 'fperez', rol: 'ADMINISTRADOR', estado: 'ACTIVO', ultimoAcceso: null };
  const resumenHemo = {
    desde: '2026-06-01', hasta: '2026-06-30', donantesAtendidos: 128, donantesUnicos: 121,
    hemocomponentesTransfundidos: 64, unidadesDescartadas: 7, gestantesEstudiadas: 42,
    recienNacidosEstudiados: 39, sangriasTerapeuticas: 11, aptitud: { aptos: 120, excluidos: 3, enRevision: 2 }
  };
  const catalogo = {
    provincias: [{ id: 1, nombre: 'Buenos Aires' }], ciudades: [{ id: 1, nombre: 'La Plata' }, { id: 2, nombre: 'Berisso' }, { id: 3, nombre: 'Ensenada' }],
    gruposFactor: [{ id: 1, grupo: 'O', factor: '+' }], obrasSociales: [{ id: 1, nombre: 'IOMA' }],
    medicos: [{ id: 1, nombre: 'Dr. Gutierrez, Luis' }], determinacionesSerologicas: [{ id: 1, nombre: 'VIH' }],
    determinacionesPcd: [{ id: 1, nombre: 'PCD' }], antigenos: [{ id: 1, nombre: 'Anti-D' }],
    fenotipos: [{ id: 1, nombre: 'R1r' }], tiposTransfusion: [{ id: 1, nombre: 'Concentrado de glóbulos rojos' }]
  };
  const vistas = [];
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname.replace('/api/v1', '');
    vistas.push(p + (url.search || ''));
    const ok = (data, meta) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(meta ? { data, meta } : { data }) });
    const meta = { page: 1, limit: 20, total: 1, totalPages: 1 };
    if (p === '/auth/me' || p === '/auth/login') return ok(admin);
    if (p === '/auth/logout') return ok(null);
    if (['/personas/buscar', '/personas', '/personas/revision'].includes(p)) return ok([persona], meta);
    if (p === '/personas/1/historial') return ok(historial);
    if (p.startsWith('/personas/')) return ok(p.endsWith('/semaforo') ? persona.semaforo : persona);
    if (p === '/donaciones' || p === '/donaciones/completa') return ok([{ id: 1025, numero: 'DON-1025', fecha: '2026-03-12', estado: 'EN_CARGA', personaId: 1, donante: 'Gómez, María Elena', dni: '28765432', tipo: 'Voluntario' }], meta);
    if (p.startsWith('/donaciones/')) return ok({ id: 1025, fecha: '2026-03-12', estado: 'EN_CARGA' });
    if (p.startsWith('/transfusiones')) return ok([{ id: 1, fecha: '2026-06-10' }], meta);
    if (p.startsWith('/sangrias-terapeuticas')) return ok([{ id: 1, fecha: '2026-06-12', diagnostico: 'Hemocromatosis', volumen: 450 }], meta);
    if (p.startsWith('/gestantes')) return ok([{ id: 1, personaId: 1, fecha: '2026-06-10' }], meta);
    if (p.startsWith('/recien-nacidos')) return ok([{ id: 1, personaId: 1, fecha: '2026-06-10' }], meta);
    if (p.startsWith('/usuarios')) return ok([{ id: 1, nombre: 'Facundo', apellido: 'Pérez', usuario: 'fperez', rol: 'ADMINISTRADOR', estado: 'ACTIVO' }], meta);
    if (p === '/auditoria') return ok([{ id: 1, fechaHora: '2026-06-16T14:32:00', usuario: 'mlopez', accion: 'Alta', entidad: 'Donación', entidadId: 'DON-1025', detalle: 'Registro voluntario (DNI 28.765.432)' }], { ...meta, total: 1 });
    if (p === '/auditoria/opciones') return ok({ acciones: ['Alta'], entidades: ['Donación'], usuarios: ['mlopez'] });
    if (p === '/reportes/hemo/resumen') return ok(resumenHemo);
    if (p.startsWith('/reportes/hemo/')) return ok({ desde: '2026-06-01', hasta: '2026-06-30', totales: { donantes: 128 }, detalle: [{ donante: 'Pérez, Juan Carlos' }] });
    if (p === '/catalogos') return ok(catalogo);
    if (p.startsWith('/catalogos/')) return ok([{ id: 1, nombre: 'La Plata' }], meta);
    if (p === '/provincias' || p === '/ciudades' || p === '/domicilios') return ok(catalogo[p.slice(1)] ?? []);
    if (p.includes('csv')) return route.fulfill({ status: 200, contentType: 'text/csv', body: 'a,b\n1,2\n' });
    return ok([]);
  });

  const esperado = {
    '/login': ['Constantes', 'Servicio de Hemoterapia · Hospital de Las Flores', 'Acceso exclusivo para personal autorizado. Cada acción queda registrada para trazabilidad.', 'Nombre y apellido', 'Contraseña', 'Ingresar', 'Ej.: Facundo Pérez', 'Ingresá tu contraseña'],
    '/': ['Búsqueda unificada', 'Buscar por DNI, nombre o HC (Ctrl K)', 'Buscar persona', 'Resultado', 'Accesos rápidos', 'Donantes en revisión', '2 casos con serología dudosa pendientes de segunda muestra.', 'Registrar donación (Posta fija)', 'Registrar transfusión', 'Cargar estudio de gestante', 'Ingresá el DNI para ver historial clínico, donaciones, transfusiones y antecedentes obstétricos.'],
    '/personas': ['Personas · Consulta, alta y edición', 'Nueva persona', 'Buscar por DNI, nombre o HC (Ctrl K)', 'Datos de la persona (precargados por DNI)', 'Alta y edición (domicilio editable)', 'Historial', 'Guardar', 'Cancelar'],
    '/posta-fija': ['Posta fija: registro de donante y donación', 'Identificación y datos personales', 'Tipo de donación y destino', 'Controles físicos', 'G y F, PCI y serología', 'Observaciones', 'Guardar donación', 'Cancelar', 'Los datos de persona se precargan por DNI'],
    '/donaciones-estudios': ['Donaciones, serologías y PCI', 'Buscar donación, DNI o ID', 'Resultados para DON-1025', 'Serología · 1ra muestra', 'Serología · 2da muestra', 'PCI (carga diferida)', 'Guardar resultados', 'Volver a Posta fija', 'Guardar actualiza solo esta donación.'],
    '/unidad-transfusional': ['Unidad transfusional', 'Paciente y determinaciones', 'Hemocomponente y resultado', 'Guardar registro', 'Cancelar', 'Registro de paciente, determinaciones, compatibilidad y hemocomponente transfundido.'],
    '/gestantes': ['Gestantes y recién nacidos', 'Estudio de gestante', 'Estudio de recién nacido', 'Guardar estudios', 'Estudios inmunohematológicos, antecedentes obstétricos, compatibilidad conyugal y estudios de RN.'],
    '/maternidad': ['Consulta de estudios de gestantes', 'Buscar paciente (DNI o nombre)', 'Buscar', 'Resultado en tiempo real', 'Gestantes', 'Busque por DNI o nombre para ver el estado actualizado del estudio.', 'Esta vista no permite editar ni exportar acciones de carga.'],
    '/sangrias': ['Sangrías terapéuticas', 'Nueva sangría', 'Apellido y nombre', 'Diagnóstico', 'Extracción', 'Acciones', 'Ver · Editar', 'Registro y consulta: paciente, indicación médica, diagnóstico, extracción y reposición.'],
    '/reportes': ['Informes estadísticos (HEMO 1–5)', 'Exportar período', 'Donantes atendidos', 'Hemocomponentes transfundidos', 'Unidades descartadas', 'Gestantes estudiadas', 'Planillas generadas (junio 2026)', 'Datos consolidados automáticamente', 'HEMO 1 · Donantes atendidos y aptitud', 'HEMO 2 · Hemocomponentes obtenidos y descartes', 'HEMO 3–5 · Transfusiones, reacciones, gestantes/RN', 'Ver / Descargar', '128', '64', '7', '42', 'Consolidación automática para el Instituto de Hemoterapia.'],
    '/usuarios': ['Usuarios y técnicos', 'Nuevo usuario', 'Alta / edición', 'Nombre y apellido', 'Usuario', 'Rol', 'Estado', 'Acciones', 'Editar', 'Guardar', 'Gestión de cuentas (técnicos Hemoterapia y acceso consulta Gestantes/Maternidad). Sin usuarios donantes.'],
    '/auditoria': ['Auditoría y trazabilidad', 'Desde', 'Hasta', 'Aplicar', 'Fecha y hora', 'Acción', 'Entidad', 'Detalle', 'Registro de quién, qué y cuándo. Solo lectura.'],
    '/catalogos': ['Catálogos maestros', 'Nuevo registro', 'Provincias y ciudades', 'Grupo y factor (G y F)', 'Obras sociales y médicos', 'Determinaciones, antígenos, fenotipos y tipos', 'ABM', 'La Plata, Berisso, Ensenada…', 'Serológicas/PCD, antígenos, fenotipos (R1r, rr) y tipos de transfusión.', 'ABM de entidades de referencia del DER: ubicación, G y F, obras sociales, médicos, determinaciones, antígenos, fenotipos y tipos.']
  };

  const resultados = [];
  for (const [ruta, textos] of Object.entries(esperado)) {
    await page.goto(BASE + ruta, { waitUntil: 'networkidle' });
    const texto = await page.locator('body').innerText();
    const faltan = textos.filter((t) => !texto.includes(t));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    resultados.push({ ruta, faltan, overflow, chars: texto.length, texto: texto.slice(0, 1600) });
  }

  // Descarga CSV: verificar que el request use ?formato=csv
  await page.goto(BASE + '/reportes', { waitUntil: 'networkidle' });
  const descargas = [];
  page.on('request', (req) => { if (req.url().includes('formato=csv')) descargas.push(req.url()); });
  const botones = page.getByRole('button', { name: /Descargar|Ver \/ Descargar/ });
  const nBotones = await botones.count();
  if (nBotones > 0) await botones.first().click().catch(() => {});
  await page.waitForTimeout(400);

  // Guardas por rol: usuario de consulta maternidad
  await page.evaluate(() => localStorage.setItem('florhema.token.v1', 'token-consulta'));
  await page.unroute('**/api/v1/**');
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname.replace('/api/v1', '');
    const ok = (data, meta) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(meta ? { data, meta } : { data }) });
    if (p === '/auth/me') return ok({ ...admin, usuario: 'maternidad', rol: 'CONSULTA_MATERNIDAD' });
    return ok([]);
  });
  await page.goto(BASE + '/maternidad', { waitUntil: 'networkidle' });
  const maternidadOk = (await page.locator('h1').first().textContent() || '').includes('Consulta de estudios');
  await page.goto(BASE + '/usuarios', { waitUntil: 'networkidle' });
  const usuariosBloqueado = page.url().includes('sin-acceso');

  return { resultados, descargas: descargas.slice(0, 3), nBotones, maternidadOk, usuariosBloqueado, peticiones: [...new Set(vistas)].slice(0, 40) };
}
