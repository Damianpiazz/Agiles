# HU-018 – Emitir sangre para transfusión

Feature: F-05 Proceso de Transfusión · Prioridad: Must · Estimación: 5 · Branch: `feature/hu-018-emitir-sangre` · Test runner: backend `docker compose exec api npm test` (vitest), frontend `npm --prefix frontend test` (vitest)

## Specs

- **S1 (CA1)** — «Dado que existe una unidad reservada, cuando el operador registra su emisión, entonces el sistema cambia su estado a "Emitida".»
- **S2 (CA2)** — «Dado que se realiza una emisión, cuando se confirma la operación, entonces el sistema registra paciente, unidad y responsable.» Incluye además los datos de trazabilidad y etiqueta exigidos por las Normas Técnicas 2026 (grupos ABO/Rh de receptor y unidad, caducidad, requisitos especiales, resultado de compatibilidad y fecha/hora de salida).
- **S3 (CA3)** — «Dado que una unidad no está disponible o liberada, cuando se intenta emitirla, entonces el sistema impide la operación.» Se rechaza con `409` toda unidad que no esté en estado `RESERVADA` para esa solicitud aprobada con paciente, esté vencida, sea incompatible ABO/RhD o tenga última prueba cruzada `INCOMPATIBLE` (incluso en carácter `EMERGENCIA`).
- **S4 (CA4)** — «Dado que una emisión fue registrada, cuando se consulta la unidad, entonces el sistema muestra el historial correspondiente.» Expuesto vía `GET /api/inventario-unidades/:id/emisiones` (ordenado `fechaHora desc`) y `GET /api/solicitudes-transfusiones/:solicitudId/emisiones`, con acceso a la etiqueta de transfusión imprimible.

### Supuestos (assumptions)

- **A1 ("Liberada" en CA3)** — `UnidadSangre` no está vinculada al flujo de liberación de donaciones de HU-013. No se inventa un vínculo inexistente: "disponible o liberada" se interpreta como unidad en estado `RESERVADA` para la solicitud aprobada correspondiente, no vencida, no bloqueada ni dada de baja.
- **A2 (Rechazo de solicitudes — Parte A)** — Rechazar una solicitud incompleta o inadecuada se resuelve cancelándola con motivo obligatorio (`POST /api/solicitudes-transfusiones/:id/cancelar`, auditado). No se introduce un estado `RECHAZADA`.
- **A3 (Prueba cruzada `INCOMPATIBLE`)** — Las Normas 2026 no contemplan emitir una unidad con prueba cruzada incompatible; por criterio de seguridad bloquea siempre (`409`), incluso en carácter `EMERGENCIA`.
- **A4 (Emisión sin prueba cruzada)** — En solicitudes no urgentes/programadas/urgentes sin prueba cruzada registrada se permite emitir con `compatibilidadCompleta = false` y advertencia explícita. En solicitudes de carácter `EMERGENCIA`, según Normas 2026, se emite registrando `compatibilidadCompleta = false` e incluyendo la leyenda normativa *"Prueba de compatibilidad no completada al momento de la liberación"* en la advertencia y el rótulo.
- **A5 (Cierre de trazabilidad en baja de unidad `EMITIDA`)** — Hasta que exista HU-019 (registrar transfusión), una unidad `EMITIDA` puede darse de baja únicamente con motivo `TRANSFUNDIDA` o `DESCARTADA` (rechazando `VENCIDA`), cumpliendo el requisito normativo de destino final.
- **A6 (Revocación por edición — Parte A)** — Modificar una solicitud `APROBADA` (sin unidades reservadas ni emitidas) la devuelve a `PENDIENTE`, limpia `aprobadaPor`/`fechaHoraAprobacion`/`opinionMedica` y registra `APROBACION_REVOCADA` en auditoría.
- **A7 (Operador/responsable sin autenticación)** — Hasta las HU-020 y HU-021 (login y roles), el campo `responsable` se ingresa manualmente como texto libre (1–120 caracteres).

## Tasks

- **T0** — Rama `feature/hu-018-emitir-sangre` desde `main` con Parte A mergeada (`ecc5a73`) + `prisma migrate deploy` — **DONE**.
- **T1** — [S1, S2, S4] Prisma: valor `EMITIDA` en `EstadoUnidadSangre`, modelo `EmisionUnidad` (`emisiones_unidad`), relaciones inversas e índices + migración aditiva `20261125000932_hu018_emitir_sangre` — **DONE** (`56e968d`).
- **T2** — [S1–S4] Tipos Zod `backend/src/types/emisionUnidad.types.ts` + tests (`6/6`) — **DONE** (`c33138d`).
- **T3** — [S1–S4] Servicio `backend/src/services/emisionUnidad.service.ts` (`emitir`, `listarPorUnidad`, `listarPorSolicitud`, `construirEtiqueta`) + suite TDD (`17/17`) — **DONE** (`7faaed3`).
- **T4** — [S1–S4] Controller `emisionUnidad.controller.ts` + rutas (`POST /api/solicitudes-transfusiones/:solicitudId/unidades/:unidadId/emitir`, `GET /api/solicitudes-transfusiones/:solicitudId/emisiones`, `GET /api/inventario-unidades/:id/emisiones`) + tests (`7/7`) — **DONE** (`fac1f3c`).
- **T5** — Ajustes cruzados (B1.8): `bajaUnidad` (EMITIDA solo `TRANSFUNDIDA`/`DESCARTADA` + `DarDeBajaUnidad.tsx`), `solicitudTransfusion.service` (bloquear editar/cancelar con `RESERVADA` o `EMITIDA`), `estudioPretransfusional.service` (rechazar unidades `EMITIDA`/`DADA_DE_BAJA`/`VENCIDA`/`BLOQUEADA`) y etiquetas `EMITIDA` en `RecepcionUnidad.tsx` / `SeleccionarComponente.tsx` + tests de regresión — **DONE** (`69b6aa7`).
- **T6** — [S1–S4] Frontend: `EmitirSangre.tsx`, `EmitirSangre.css` (con `@media print` para la etiqueta), schema Zod `emisionUnidad.ts` + tests (`3/3`), entrada `"Emitir sangre"` en `App.tsx` — **DONE** (`1907578`).
- **T7** — Seeder de demo idempotente `backend/prisma/seed-emision.ts` + scripts `db:seed:emision` / `db:seed:emision:reset` — **DONE** (`bccaadd`).
- **T8** — Documentación (`odd/tasks/hu-018-emitir-sangre.md` y `README.md`) y verificación integral (B4) — **DONE**.

## Log

- **L1 (prerrequisito — Parte A)** — Se implementó y mergeó a `main` la PR #21 (`ecc5a73`, rama `feature/hu-015b-aprobar-solicitud-transfusion`) para aprobar solicitudes de transfusión con médico aprobador, opinión médica, auditoría y revocación por edición.
- **L2 (migración aditiva)** — `20261125000932_hu018_emitir_sangre/migration.sql` solo agrega `'EMITIDA'` al enum y crea `emisiones_unidad` con índices y FKs (sin `UPDATE` sobre el nuevo valor enum en la misma transacción). `prisma migrate status` confirma 20 migraciones aplicadas sin pendientes.
- **L3 (suites automatizadas)** — Backend: `docker compose exec api npm test` → **31 archivos / 227 tests en verde**. Backend `npx tsc --noEmit`: 0 errores nuevos (solo los 2 preexistentes en `src/services/recepcionUnidad.service.test.ts` líneas 21–22). Frontend: `npm --prefix frontend test` → **9 archivos / 44 tests en verde**; `npm --prefix frontend run build` OK; `npm --prefix frontend run lint` → 0 errores y 0 warnings nuevos (5 preexistentes en otras pantallas).
- **L4 (E2E contra el compose)** — Verificado en vivo sobre el escenario del seeder (`db:seed:emision`):
  - `U-EMIS-01` (reservada + prueba cruzada `COMPATIBLE`): `201`, pasa a `EMITIDA`, devuelve etiqueta completa y `advertencias: []`.
  - Reintento sobre `U-EMIS-01` (`EMITIDA`): `409`.
  - `U-EMIS-06` (`DISPONIBLE`), `U-EMIS-07` (`DADA_DE_BAJA`), `U-EMIS-05` desde otra solicitud, unidad vencida temporal (`2020-01-01`), `U-EMIS-02` (prueba cruzada `INCOMPATIBLE`): todos `409`.
  - `U-EMIS-03` (sin prueba cruzada, `PROGRAMADA`): `201` con `compatibilidadCompleta: false` y advertencia.
  - `U-EMIS-05` (sin prueba cruzada, `EMERGENCIA`): `201` con `compatibilidadCompleta: false` y leyenda normativa en advertencia y etiqueta.
  - Baja de `U-EMIS-04` (`EMITIDA`): con `VENCIDA` → `409`; con `TRANSFUNDIDA` → `200` (`DADA_DE_BAJA`).
  - Historial CA4 (`GET /api/inventario-unidades/:id/emisiones` y `GET /api/solicitudes-transfusiones/:id/emisiones`): `200` con paciente, unidad, responsable, fecha y etiqueta.
  - Escenario restaurado con `docker compose exec api npm run db:seed:emision:reset`.
