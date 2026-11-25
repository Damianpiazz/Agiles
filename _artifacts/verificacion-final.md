# Verificación final — Rediseño frontend Florhema

Fecha: 2026-11-25. Entorno: API `http://localhost:3001`, frontend `http://localhost:5173`, contenedores `agiles-api-1` / `agiles-db-1`.

## Pruebas ejecutadas

| Comando | Resultado |
| --- | --- |
| `npm run build` (frontend) | OK. `tsc -b` + Vite 8. Sin warning de chunk >500 kB; ~19 módulos lazy. |
| `npm test -- --run` (frontend) | 9 archivos, 44/44 pruebas. |
| `npm run build` (backend) | OK. `tsc`. |
| `npm test -- --run` (backend) | 36 archivos, 246/246 pruebas. |
| `prisma migrate status` | `Database schema is up to date` (23 migraciones encontradas). |

## Playwright (datos reales)

- **Navegación:** 18 vistas + vista interna (`estudios`) cargadas desde la barra lateral; una sola ocurrencia de `<main>` en todas; sin overflow horizontal de página; sin errores de consola ni `pageerror`.
- **DataTable** (`Dar de baja unidad`, 60 registros reales): `60 registros · mostrando 1–10`; búsqueda `U-2171` → `1 registro`; orden ascendente `U-1001` / descendente `U-9844`; `Página 1 de 6`; tamaños de página `10`, `25`, `50`.
- **DataTable** (`Tamizaje de infecciones`, donación 1): `1 registro · mostrando 1–1`, sin overflow; `Tipificación sanguínea` con 0 registros muestra el estado vacío.
- **ConfirmDialog → Liberar unidad** (donación 1 real): diálogo `role="dialog"`, `aria-modal="true"`, foco inicial en el diálogo; `Escape` y `Cancelar` lo cierran y devuelven el foco al botón; **0 peticiones POST**; sin errores de consola.
- **ConfirmDialog → Emitir sangre** (solicitud 1 con 3 unidades reservadas reales): mismo comportamiento; **0 peticiones POST** al endpoint `/emitir`; `Escape` y `Cancelar` cierran sin mutación.
- **Responsive** 1440 / 1024 / 768 / 390 px sobre 4 vistas (resumen, tabla, wizard, pretransfusionales): 16 combinaciones sin overflow de página, un solo `<main>`, botón de menú visible solo ≤1100 px, toggle `app-shell sidebar-open` y cierre con `Escape`. Sin errores de consola.
- **Accesibilidad:** skip link, foco visible, `aria-current`, `aria-sort`, `role="status"` en contadores y `role="alert"` en errores; contraste mínimo medido 4,72:1.
- **Tablas nuevas (datos reales, 1440 px):** `Buscar paciente` 60 registros/6 páginas, `Solicitudes de transfusión` 60/6, `Estudios pretransfusionales` 2 solicitudes activas + 0 estudios globales, `Seleccionar componente` 27, `Emitir sangre` 2 aprobadas + 0 emisiones globales, `Liberar unidad` 60/6. Verificadas búsqueda, filtros, orden, paginación y estados vacíos conectados a la API.
- **Historia integral:** desde `Buscar paciente`, DNI `50647586` abre su historia; consulta directa de `87661052` muestra donante activo, 1 donación y 0 solicitudes/emisiones/estudios. Un click en la tabla de `Emitir sangre` selecciona `Marcos Gómez · DNI 28444555`.
- **Responsive final:** 1024 / 768 / 390 px × 7 vistas (pacientes, solicitudes, estudios, componente, emisiones, inventario e historial): 21 combinaciones con un solo `<main>`, datos reales visibles y sin overflow horizontal de documento; consola sin errores.
- **Baja temporal de donante:** baja real de `Laura Serna Rojas` (DNI `59931461`, id `6`) con confirmación; `listado` pasó de 60 a 59, la búsqueda por DNI devolvió 0 y el donante conservó 2 donaciones. Restaurado con `UPDATE donantes SET activo = true WHERE id = 6`.
- **Donación directa:** wizard de 3 pasos sin entrevista registró `Donación #61`; se verificó 0 entrevistas, se eliminó la donación de prueba y se sincronizó la secuencia (`setval`) para que el próximo id siga siendo 61.
- **Baja terminal de unidad:** desde `Liberar unidad`, `U-2252` (id `55`) se dio de baja con motivo `VENCIDA` y operador `Verificación Playwright`; la API confirmó `DADA_DE_BAJA`. Restaurada vía SQL a `DISPONIBLE` con `motivoBaja`/`operadorBaja`/`fechaBaja` en `NULL` y confirmada de nuevo por API.
- **Smoke de API real:** `/api/pacientes/listado` 60, `/api/donantes/listado` 60, `/api/donaciones` 60, `/api/solicitudes-transfusiones` 60, `/api/inventario-unidades` 60, `/api/estudios-pretransfusionales` 0, `/api/emisiones` 0.

### Evidencias

- `_artifacts/verificacion-dashboard-1440.png`
- `_artifacts/verificacion-tabla-1440.png`
- `_artifacts/verificacion-tabla-390.png`
- `.playwright-mcp/console-2026-11-25T18-57-52-726Z.log`

## Problemas detectados y corregidos

1. Divergencia de Prisma: migración `20261117120000_refactor_der_usuarios_auditoria` registrada sin archivo; se eliminó solo esa fila de `_prisma_migrations` y se aplicaron las 7 migraciones. Backup: `_artifacts/florhema_db_backup.dump`.
2. Error 500 `unidades_sangre.motivoBaja does not exist` y `solicitudes_transfusion.modalidad does not exist`, causado por la divergencia; resuelto con la reparación anterior.
3. Crash de `SeleccionarComponente` por respuestas no arrays; corregido con `Array.isArray`.
4. UTF-8 corrompido en un archivo por `Get-Content -Raw` + `WriteAllText` en PowerShell 5.1; reparado.
5. 17 `<main>` anidados; reducidos a un único landmark en `App.tsx`.
6. Banner de éxito de `LiberacionUnidad` se borraba al re-evaluar; se conserva con `setBanner(prev => prev?.tono === "ok" ? prev : null)`.
7. Warning de chunk >500 kB; eliminado con `React.lazy` + `Suspense` para 19 vistas.
8. **Regresión de CSS detectada en la verificación final:** reglas amplias (`main button:not(.ui-btn)`, `.baja button`) sobreescribían los botones de orden y paginación del `DataTable`, inflando la tabla de 970 px a 1576 px. Se aumentó la especificidad de `.ui-data-table .ui-sort-button` y `.ui-data-table .ui-page-controls button` y se ajustó el padding de celdas a 12 px. Tras el fix: tabla 1006 px, 36 px de scroll interno, botones de orden con `padding: 0` y `font-size: 11px`.

## Notas de datos (no defectos de la app)

- La causa raíz de los wizards inalcanzables se corrigió con un backfill de `pacienteId` **solo** para solicitudes cuyo DNI coincide con un paciente real existente. No se crearon pacientes ficticios; quedan solicitudes legacy con `pacienteId: null` que se muestran con sus datos denormalizados.
- Las solicitudes sin paciente vinculado siguen devolviendo 409 (`SolicitudEstudioSinPacienteError`, regla deliberada del backend). El frontend degrada a `[]` y muestra el estado vacío.
- `/api/estudios-pretransfusionales` y `/api/emisiones` devuelven 0 registros porque no hay estudios/emisiones cargadas en la base; las tablas muestran su estado vacío real.

## Estado final

- Los datos modificados durante las pruebas reales (donante `id 6`, donación `61`, unidad `id 55`) quedaron restaurados; no hay registros de prueba persistidos.
- Los cambios siguen sin commitear; se conservaron las modificaciones preexistentes del usuario en `.env.example`, `README.md`, `docker-compose.yml`, `skills-lock.json` y varios `pages/*.tsx`.
