async (page) => {
  const BASE = 'http://127.0.0.1:5173';
  const errores = [];
  const resultados = [];
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', (e) => errores.push('PAGEERROR: ' + e.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => { localStorage.setItem('florhema.token.v1', 'mock-token'); });

  const persona = {
    id: 1, dni: '35489123', historiaClinica: '1001', nombre: 'Juan Carlos', apellido: 'Pérez',
    telefono: '221-555-1234', fechaNacimiento: '1990-05-14', lugarNacimiento: 'La Plata',
    sexoBiologico: 'MASCULINO', idDireccion: 1, idGrupoFactor: 1, edad: 36,
    grupoFactor: { id: 1, grupo: 'O', factor: '+' },
    direccion: { id: 1, calle: 'Calle 7', numero: '1234', piso: null, departamento: null, ciudad: { id: 1, nombre: 'La Plata', provincia: { id: 1, nombre: 'Buenos Aires' } } },
    semaforo: { estado: 'APTO', color: 'VERDE', colorHex: '#1C7A45', motivo: 'Apto para donar' },
    resumen: { donaciones: 3, transfusiones: 0, estudiosGestante: 0, recienNacidos: 0, sangrias: 0 }
  };
  const historial = {
    persona, semaforo: persona.semaforo, resumen: persona.resumen,
    donaciones: [{ id: 1025, fecha: '2026-03-12', observaciones: 'Sin reacciones adversas durante la extracción.' }],
    transfusiones: [], estudiosGestante: [], estudiosRecienNacido: [], sangriasTerapeuticas: []
  };
  const usuario = { id: 1, nombre: 'Facundo', apellido: 'Pérez', usuario: 'fperez', rol: 'ADMINISTRADOR', estado: 'ACTIVO', ultimoAcceso: null };
  const resumenHemo = {
    desde: '2026-06-01', hasta: '2026-06-30', donantesAtendidos: 128, donantesUnicos: 121,
    hemocomponentesTransfundidos: 64, unidadesDescartadas: 7, gestantesEstudiadas: 42,
    recienNacidosEstudiados: 39, sangriasTerapeuticas: 11,
    aptitud: { aptos: 120, excluidos: 3, enRevision: 2 }
  };
  const catalogo = {
    provincias: [{ id: 1, nombre: 'Buenos Aires' }],
    ciudades: [{ id: 1, nombre: 'La Plata' }, { id: 2, nombre: 'Berisso' }, { id: 3, nombre: 'Ensenada' }],
    gruposFactor: [{ id: 1, grupo: 'O', factor: '+' }, { id: 2, grupo: 'O', factor: '-' }, { id: 3, grupo: 'A', factor: '+' }],
    obrasSociales: [{ id: 1, nombre: 'IOMA' }],
    medicos: [{ id: 1, nombre: 'Dr. Gutierrez, Luis' }],
    determinacionesSerologicas: [{ id: 1, nombre: 'VIH' }, { id: 2, nombre: 'VHB' }],
    determinacionesPcd: [{ id: 1, nombre: 'PCD' }],
    antigenos: [{ id: 1, nombre: 'Anti-D' }],
    fenotipos: [{ id: 1, nombre: 'R1r' }, { id: 2, nombre: 'rr' }],
    tiposTransfusion: [{ id: 1, nombre: 'Concentrado de glóbulos rojos' }]
  };

  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname.replace('/api/v1', '');
    const ok = (data, meta) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(meta ? { data, meta } : { data }) });
    const meta = { page: 1, limit: 20, total: 1, totalPages: 1 };
    if (p === '/auth/me' || p === '/auth/login') return ok(usuario);
    if (p === '/auth/logout') return ok(null);
    if (p === '/personas/buscar' || p === '/personas' || p === '/personas/revision') return ok([persona], meta);
    if (p === '/personas/1/historial') return ok(historial);
    if (p === '/personas/1/semaforo') return ok(persona.semaforo);
    if (p.startsWith('/personas/dni/')) return ok(persona);
    if (p.startsWith('/personas/1/')) return ok(persona);
    if (p === '/donaciones/completa') return ok([{ id: 1025, numero: 'DON-1025', fecha: '2026-03-12', estado: 'EN_CARGA', personaId: 1, donante: 'Gómez, María Elena', dni: '28765432', tipo: 'Voluntario' }], meta);
    if (p.startsWith('/donaciones/')) return ok({ id: 1025, fecha: '2026-03-12', estado: 'EN_CARGA' });
    if (p === '/transfusiones' || p.startsWith('/transfusiones/')) return ok([{ id: 1, fecha: '2026-06-10', personaId: 1, numeroOLote: 'CG2026-00142' }], meta);
    if (p === '/sangrias-terapeuticas' || p.startsWith('/sangrias-terapeuticas/')) return ok([{ id: 1, fecha: '2026-06-12', personaId: 1, diagnostico: 'Hemocromatosis', volumen: 450 }], meta);
    if (p === '/gestantes/completa' || p === '/gestantes' || p.startsWith('/gestantes/')) return ok([{ id: 1, personaId: 1, fecha: '2026-06-10', semana: 28, hemoglobina: 11.2 }], meta);
    if (p === '/recien-nacidos/completa' || p.startsWith('/recien-nacidos/')) return ok([{ id: 1, personaId: 1, fecha: '2026-06-10', nombre: 'Fernández (RN)' }], meta);
    if (p === '/usuarios' || p.startsWith('/usuarios/')) return ok([
      { id: 1, nombre: 'Facundo', apellido: 'Pérez', usuario: 'fperez', rol: 'ADMINISTRADOR', estado: 'ACTIVO' },
      { id: 2, nombre: 'Usuario', apellido: 'Maternidad', usuario: 'maternidad', rol: 'CONSULTA_MATERNIDAD', estado: 'ACTIVO' }
    ], meta);
    if (p === '/auditoria') return ok([
      { id: 1, fechaHora: '2026-06-16T14:32:00', usuario: 'mlopez', accion: 'Alta', entidad: 'Donación', entidadId: 'DON-1025', detalle: 'Registro voluntario (DNI 28.765.432)' },
      { id: 2, fechaHora: '2026-06-16T15:10:00', usuario: 'mlopez', accion: 'Edición', entidad: 'Serología', entidadId: 'DON-1025', detalle: 'Carga diferida 1ra muestra' }
    ], { ...meta, total: 2 });
    if (p === '/auditoria/opciones') return ok({ acciones: ['Alta', 'Edición'], entidades: ['Donación', 'Serología'], usuarios: ['mlopez'] });
    if (p === '/reportes/hemo/resumen') return ok(resumenHemo);
    if (p.startsWith('/reportes/hemo/')) return ok({ desde: '2026-06-01', hasta: '2026-06-30', totales: { donantes: 128 }, detalle: [{ donante: 'Pérez, Juan Carlos', dni: '35489123', fecha: '2026-06-10' }] });
    if (p === '/catalogos') return ok(catalogo);
    if (p.startsWith('/catalogos/')) return ok([{ id: 1, nombre: 'La Plata' }], meta);
    if (p === '/provincias' || p === '/ciudades' || p === '/domicilios') return ok(catalogo[p.slice(1)] ?? []);
    if (p.includes('csv')) return route.fulfill({ status: 200, contentType: 'text/csv', body: 'a,b\n1,2\n' });
    return ok([]);
  });

  const pantallas = [
    ['01-login', '/login'],
    ['02-busqueda', '/'],
    ['03-personas', '/personas'],
    ['04-posta-fija', '/posta-fija'],
    ['14-estudios', '/donaciones-estudios'],
    ['05-unidad-transfusional', '/unidad-transfusional'],
    ['06-gestantes', '/gestantes'],
    ['08-maternidad', '/maternidad'],
    ['13-sangrias', '/sangrias'],
    ['07-reportes', '/reportes'],
    ['09-usuarios', '/usuarios'],
    ['10-auditoria', '/auditoria'],
    ['12-catalogos', '/catalogos']
  ];
  for (const [nombre, ruta] of pantallas) {
    const antes = errores.length;
    await page.goto(BASE + ruta, { waitUntil: 'networkidle', timeout: 20000 }).catch((e) => errores.push('NAV ' + nombre + ': ' + e.message));
    await page.waitForTimeout(300);
    const titulo = await page.locator('h1').first().textContent().catch(() => null);
    const texto = await page.locator('body').innerText().catch(() => '');
    await page.screenshot({ path: 'C:/damian/Repo/Agiles/.artifacts/visual/' + nombre + '.png', fullPage: true }).catch((e) => errores.push('SHOT ' + nombre + ': ' + e.message));
    resultados.push({ nombre, ruta, titulo: (titulo || '').trim(), chars: texto.length, errores: errores.slice(antes), urlFinal: page.url() });
  }
  return { resultados, errores };
}
