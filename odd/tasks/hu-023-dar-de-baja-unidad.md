# HU-023 – Dar de baja unidad

Feature: F-03 Inventario de Hemocomponentes · Branch: `feature/HU-023–Dar-de-baja-unidad` · Delivery: `ask-on-risk` (forecast ≈ 650 líneas autoradas) · Test runner: backend `npm test` (vitest), frontend `npm test` (vitest)

## Specs

- **S1 (CA1)** — «Dado que existe una unidad registrada en el inventario, cuando el operador selecciona la opción de darla de baja, entonces el sistema permite registrar el motivo de la baja.»
- **S2 (CA2)** — «Dado que una unidad puede dejar de estar disponible por diferentes causas, cuando el operador registra la baja, entonces el sistema permite indicar si la unidad fue vencida, transfundida o descartada.» Motivos admitidos: `VENCIDA`, `TRANSFUNDIDA`, `DESCARTADA`.
- **S3 (CA3)** — «Dado que se confirma la baja de una unidad, cuando finaliza la operación, entonces el sistema actualiza su estado para que no figure como disponible en el inventario.»
- **S4 (CA4)** — «Dado que una unidad ya fue dada de baja, cuando un usuario intenta utilizarla o seleccionarla como disponible, entonces el sistema impide la operación.»
- **S5 (CA5)** — «Dado que se realiza la baja de una unidad, cuando el operador confirma la operación, entonces el sistema registra el motivo, el usuario, la fecha y la hora para garantizar la trazabilidad.»

### Supuestos (assumptions)

- **A1** — La baja es terminal: el estado siempre pasa a `DADA_DE_BAJA` y el motivo (vencida/transfundida/descartada) se guarda en un campo aparte. El valor `VENCIDA` del enum `EstadoUnidadSangre` no se usa en esta HU.
- **A2** — No se puede dar de baja dos veces la misma unidad: la segunda intento responde conflicto (409).
- **A3** — S4 se apoya en la lógica existente de selección de componentes, que ya solo considera unidades en estado `DISPONIBLE`; se agrega un test de regresión que lo comprueba con una unidad `DADA_DE_BAJA`.

## Tasks

- T1 — [S1-S5] Prisma: enum `MotivoBajaUnidad` + columnas `motivoBaja`, `operadorBaja`, `fechaBaja` en `unidades_sangre` + migración SQL. route: inline — **DONE**. `prisma validate` OK; cliente regenerado. Migración `backend/prisma/migrations/20261119120000_hu023_baja_unidad/migration.sql` (DDL nullable, no destructiva).
- T2 — [S1,S2,S5] Backend: tipos Zod, servicio, controller y ruta `POST /api/inventario-unidades/:id/baja` + tests. route: inline — **DONE**. RED: `Cannot find module '../types/bajaUnidad.types'`. GREEN: `bajaUnidad.service.test.ts` 9/9. Controller 400/404/409/500 cubierto.
- T3 — [S4] Backend: test de regresión que prueba que una unidad `DADA_DE_BAJA` no se lista ni se reserva. route: inline — **DONE**. Dos casos: `listarUnidadesCompatibles` filtra `estado: "DISPONIBLE"`; `reservarUnidad` no llama `updateMany`.
- T4 — [S1-S5] Frontend: página «Dar de baja unidad», schema Zod, estilos, entrada de navegación + test. route: inline — **DONE**. RED: `Cannot find module './bajaUnidad'`. GREEN: 6/6 schema. `npm run build` OK.

## Log

- **L1 (request original, verbatim)** — «Quiero implementar la [HU-023] – Dar de baja unidad que esta en trello usa el mcp de trello para conectarte sacar que dice la tarjeta e implementarlo»
- **L2 (fuente, verbatim)** — Tarjeta Trello `https://trello.com/c/ysDVA5ep/34-hu-023-dar-de-baja-unidad` (board `2026-UTN-GRUPO-12`, lista *In Development*):
  > Como operador del Servicio de Hemoterapia quiero dar de baja una unidad de hemocomponente para registrar su disposición final y evitar que una unidad que ya no está disponible pueda ser utilizada.
  >
  > **Feature:** [F-03] Inventario de Hemocomponentes · **Prioridad:** Must · **Estimación:** 3
- **L3 (análisis)** — El modelo `UnidadSangre` ya tiene el estado `DADA_DE_BAJA` en el enum `EstadoUnidadSangre` (sin uso previo) y la lógica de selección (`seleccionComponente.service.ts`) ya filtra por `estado: "DISPONIBLE"`. Falta: campos de trazabilidad de la baja, endpoint de baja y UI.
- **L4 (decisión)** — Se sigue el patrón de `liberacionUnidad` (`POST /:id/estado`): la baja se expone como `POST /api/inventario-unidades/:id/baja` y se resuelve con un módulo `bajaUnidad` (types/service/controller) manteniendo el router del recurso `inventario-unidades`.
- **L5 (verificación independiente)** — Verificador `gentle-ai-verify` sobre el baseline `58009945010ad177645adc295564903ad56dfa97`: **sin blockers**, S1–S5 todos MET con evidencia `path:line`. Invariante probado: una baja rechazada (404/409) no llama `update` y deja el registro almacenado idéntico. Suites: backend 22 archivos/142 tests, frontend 7/34, `npm run build` OK, `prisma validate` OK.
- **L6 (advisories aceptados)** — (1) Dar de baja una unidad `RESERVADA` conserva `solicitudId`, así que sigue figurando en `listarUnidadesReservadas`; queda **fuera del alcance de S4** (que habla de seleccionarla como *disponible*) y CA2 admite explícitamente el motivo «transfundida» → se acepta como limitación conocida, no se expande el alcance. (2) Las columnas nullable nuevas agregan claves `null` aditivas a las respuestas `findMany` existentes: aditivo y requerido por la UI, no es cambio de formato.
- **L7 (gap de entorno)** — Docker/PostgreSQL no están levantados: `migration.sql` no se aplicó y no hubo E2E HTTP/DB. `prisma validate` pasa y el SQL coincide con el schema; el verificador lo califica **advisory (gap de verificación de entorno), no blocker**. Comando faltante: `prisma migrate deploy` contra un Postgres vivo.
- **L8 (tests de regresión del verificador)** — Se commitearon los probes del verificador como tests: `backend/src/controllers/bajaUnidad.controller.test.ts` (5), `backend/src/types/bajaUnidad.types.test.ts` (3) y 2 casos agregados a `frontend/src/schemas/bajaUnidad.test.ts`. Suites finales: backend **150/150**, frontend **36/36**.
- **L9 (baseline pre-existente)** — `npx tsc --noEmit` en `backend/` ya fallaba en el baseline sobre `src/services/recepcionUnidad.service.test.ts` (líneas 21–22), archivo no tocado por esta HU. No lo introduce este cambio.
