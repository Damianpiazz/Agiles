const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screens = [
  ['screen-01-login', '/login', ['INICIO DE SESIÓN', 'Nombre y apellido', 'Contraseña', 'INGRESAR']],
  ['screen-02-dashboard', '/', ['Resumen general', 'Solicitudes de transfusión pendientes', 'Donaciones en análisis']],
  ['screen-03-personas', '/personas', ['Personas', 'Buscar persona', 'DNI', 'Nombre y apellido', 'Registrar persona']],
  ['screen-04-posta-fija', '/posta-fija', ['Posta fija', 'Buscar persona', 'Registrar donación', 'Donaciones registradas']],
  ['screen-14-donaciones', '/donaciones-estudios', ['Donaciones y estudios', 'Lote de procesamiento', 'Registrar donación', 'Estudios serológicos']],
  ['screen-05-unidad', '/unidad-transfusional', ['Unidad transfusional', 'Solicitudes de transfusión', 'Registrar solicitud', 'Stock de hemoderivados']],
  ['screen-06-gestantes', '/gestantes', ['Gestantes', 'Buscar gestante', 'Nueva gestante', 'Control prenatal']],
  ['screen-08-maternidad', '/maternidad', ['Maternidad', 'Buscar por DNI, nombre o HC', 'Consultar', 'HISTORIA CLÍNICA']],
  ['screen-13-sangrias', '/sangrias', ['Sangrías', 'Buscar persona', 'Registrar sangría', 'Sangrías registradas']],
  ['screen-07-reportes', '/reportes', ['Reportes', 'Planillas generadas', 'HEMO 1 · Donantes', 'Descargar CSV', 'Generar planilla']],
  ['screen-09-usuarios', '/usuarios', ['Usuarios y permisos', 'Nombre y apellido', 'Nombre de usuario', 'Contraseña', 'Rol', 'CREAR USUARIO']],
  ['screen-10-auditoria', '/auditoria', ['Auditoría', 'Buscar', 'FECHA Y HORA', 'USUARIO', 'ACCIÓN', 'TABLA / REGISTRO']],
  ['screen-12-catalogos', '/catalogos', ['Catálogos', 'Provincias y ciudades', 'Grupo y factor', 'Obras sociales', 'Agregar']],
];

(async () => {
  const outDir = 'C:/damian/Repo/Agiles/.artifacts/screenshots';
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'es-AR' });
  const page = await ctx.newPage();
  await page.route('**/api/v1/**', route => {
    if (route.request().url().includes('formato=csv')) return route.fulfill({ status: 200, body: 'a,b\n1,2' });
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":{}}' });
  });
  await page.addInitScript(() => localStorage.setItem('florhema.token.v1', 'test-token'));

  for (const [name, url, texts] of screens) {
    await page.goto('http://127.0.0.1:5173' + url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const missing = [];
    for (const t of texts) {
      if (await page.getByText(t, { exact: false }).count() === 0) missing.push(t);
    }
    console.log(name, missing.length ? 'MISSING: ' + missing.join(' | ') : 'OK');
    await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: true });
  }

  await page.evaluate(() => localStorage.removeItem('florhema.token.v1'));
  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outDir, 'screen-01-login-public.png'), fullPage: true });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
