# Florhema

Sistema de gestión para el Servicio de Hemoterapia. Proyecto del Grupo 12, materia Ágiles (UTN).

Cubre donantes, calificación biológica, inventario de hemocomponentes, pacientes/receptores, proceso de transfusión y autenticación con roles. El detalle está en el Product Backlog.

## Stack

| Parte | Tecnología |
|-------|------------|
| Frontend | React + TypeScript (Vite), Zod |
| Backend | Node.js 22, Express, TypeScript |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma 7 |
| Infraestructura | Docker Compose (API + base de datos) |

## Estructura del repositorio

```
.
├── backend/
│   ├── prisma/              # schema.prisma, migraciones y seeders
│   ├── src/
│   │   ├── config/          # entorno y conexión a Prisma
│   │   ├── features/        # un módulo por recurso: *.schema, *.service, *.routes
│   │   ├── lib/             # CRUD genérico, errores, HTTP, seguridad, CSV, auditoría
│   │   ├── middlewares/     # auth, validación, auditoría, errores, logging
│   │   ├── routes/          # router central de /api/v1
│   │   ├── utils/           # formato de fechas, documentos y nombres
│   │   ├── validators/      # esquemas Zod reutilizables
│   │   ├── app.ts           # arma Express (testeable sin abrir puerto)
│   │   └── index.ts         # levanta el servidor
│   ├── Dockerfile
│   ├── .env.example
│   └── prisma.config.ts
├── frontend/               # app React
├── docker-compose.yml       # servicios: api + db
└── README.md
```

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) abierto y corriendo
- Node.js 22 (solo para el editor y el frontend; el backend corre en Docker)
- Git

## Cómo levantar el proyecto

La primera vez, en este orden. Resumen en dos terminales:

```bash
git clone <URL-del-repo>
cd <carpeta-del-repo>

# Terminal 1 — API + PostgreSQL (el entrypoint genera el cliente, migra y siembra)
docker compose up -d --build

# Terminal 2 — frontend (desde la raíz del repo)
cd frontend
npm install
npm run dev
```

### 1. Clonar y configurar variables

```bash
git clone <URL-del-repo>
cd <carpeta-del-repo>
```

Los `.env` **no se suben a Git**. Docker Compose lee `backend/.env` (el `.env.example` de la raíz quedó viejo: no lo uses). Copiá el ejemplo o pegá directamente los valores de abajo.

```bash
# Git Bash / Linux / macOS
cp backend/.env.example backend/.env

# PowerShell
copy backend\.env.example backend\.env
```

**`backend/.env`** — valores listos para desarrollo local:

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_segura
POSTGRES_DB=florhema_db
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:tu_password_segura@db:5432/florhema_db

AUTH_REQUIRED=false
AUTH_SECRET=cambiame-por-un-secreto-largo-y-aleatorio
AUTH_TOKEN_TTL_HOURS=12
AUDIT_ENABLED=true
REQUEST_LOGGING=true
```

| Variable | Para qué sirve |
|----------|----------------|
| `FRONTEND_URL` | Origen permitido por CORS. Con el proxy de Vite alcanza con `http://localhost:5173`; si el frontend pega directo a `:3000`, tiene que coincidir con ese origen. |
| `POSTGRES_*` | Usuario, password y base que crea el contenedor `db` la primera vez. |
| `DATABASE_URL` | Conexión que usa la API. El host es **`db`** (nombre del servicio en Docker), no `localhost`. Si corrés el backend en el host, usá `localhost`. |
| `AUTH_REQUIRED` | `false` permite escribir sin token con el usuario de desarrollo; `true` exige login. |
| `AUTH_SECRET` | Firma de los tokens HMAC. Cambiarlo invalida las sesiones existentes. |
| `AUTH_TOKEN_TTL_HOURS` | Horas de vigencia del token. |
| `AUDIT_ENABLED` / `REQUEST_LOGGING` | Auditoría automática de mutaciones y logs de requests. |

Si cambiás `POSTGRES_USER`, `POSTGRES_PASSWORD` o `POSTGRES_DB`, replicá el cambio en `DATABASE_URL`. El password se guarda en el volumen `pgdata` la primera vez: si lo cambiás después, recreá el volumen (`docker compose down -v`, **borra la base**, solo para desarrollo).

**`frontend/.env`** — con el proxy de Vite, el browser llama a `/api/v1/...` y Vite lo reenvía a `:3000`:

```env
VITE_API_URL=/api/v1
```

Si querés que el browser hable directo con la API, usá `VITE_API_URL=http://localhost:3000/api/v1` y mantené `FRONTEND_URL=http://localhost:5173`. El destino del proxy se define en `frontend/vite.config.ts` y se puede sobrescribir con la variable de **shell** `VITE_API_PROXY_TARGET` (no va en `.env`).

### 2. Levantar la API y la base de datos

```bash
docker compose up -d --build
```

Verificá que ambos servicios estén en `Up`:

```bash
docker compose ps
```

Y que la API responda: abrí <http://localhost:3000>. Tiene que devolver un JSON con `"ok": true`.

### 3. Modelos, tablas y datos demo (automático)

El contenedor `api` tiene un entrypoint que, en cada arranque:

1. `npx prisma generate` → regenera el cliente desde `prisma/schema.prisma` (los modelos siempre están al día).
2. `npx prisma migrate deploy` → aplica las migraciones pendientes.
3. `npx prisma db seed` → corre los seeders 01-23 (son idempotentes: usan `upsert` y no duplican datos).

El servicio `db` tiene un healthcheck y la API espera a que Postgres esté listo, así que no hay que repetir estos comandos a mano. `docker-compose.yml` monta `backend/prisma` y `prisma.config.ts` dentro del contenedor: cambiar el schema o un seeder se refleja con `docker compose restart api`, sin reconstruir la imagen.

Para saltear los seeders (por ejemplo, si querés una base vacía):

```bash
# Git Bash / Linux / macOS
RUN_SEED=false docker compose up -d --force-recreate api
```

```powershell
# PowerShell
$env:RUN_SEED="false"
docker compose up -d --force-recreate api
```

Carga catálogos, personas, donaciones, estudios y usuarios de prueba. Los usuarios demo son `admin` / `Admin.123`, `fperez` / `Tecnico.123` y `maternidad` / `Consulta.123` (solo para desarrollo). Tienen la particularidad de que el seed los **refresca** en cada arranque: si cambiás una contraseña demo, volvé a ponerla después de reiniciar la API.

Los seeders no enumerativos generan **60 registros cada uno** con [`@faker-js/faker`](https://fakerjs.dev/) (locale español, una semilla fija por seeder en `backend/prisma/seeders/_fake.ts`). Están en `domicilios`, `personas`, `donantes`, `pacientes`, `donaciones`, `PCI`, `serologías`, `PCD`, `estudios inmunohematológicos`, `sangrías`, `transfusiones`, `solicitudes/unidades` y `usuarios`; así las tablas tienen volumen suficiente para probar filtros y paginación. Los catálogos enumerativos (provincias, ciudades, grupo/factor, antígenos, determinaciones, obras sociales, médicos, fenotipos y tipos de transfusión) se mantienen chicos a propósito. Los 57 usuarios generados comparten la contraseña de desarrollo `Demo.123`; las credenciales demo de arriba no cambian.

### 4. Preparar el editor (solo para VS Code)

El cliente de Prisma se genera dentro del contenedor, pero el editor lee tu carpeta local. Sin este paso VS Code marca errores en los imports de Prisma aunque todo funcione:

```bash
cd backend
npm install
npx prisma generate
cd ..
```

Después, en VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server".

### 5. Levantar el frontend

Ya tenés `frontend/.env` del paso 1 (`VITE_API_URL=/api/v1`). Desde la raíz del repo:

```bash
cd frontend
npm install
npm run dev
```

Vite sirve en <http://localhost:5173> y hace de proxy de `/api` → `http://localhost:3000`. Ingresá con `admin` / `Admin.123`, `fperez` / `Tecnico.123` o `maternidad` / `Consulta.123` (después de correr el seed del paso 3.1).

### URLs

| Servicio | URL |
|----------|-----|
| Frontend | <http://localhost:5173> |
| API | <http://localhost:3000> |
| PostgreSQL | `localhost:5432` |

### Backend en el host (alternativa a Docker)

Si querés correr la API con `npm run dev` en lugar del contenedor, necesitás Postgres levantado (`docker compose up -d db`) y un `DATABASE_URL` con host `localhost`: `db` solo resuelve dentro de la red de Docker. Dejá `backend/.env` como está (para Compose) y sobrescribí la variable en la terminal:

```powershell
# PowerShell, desde backend/
$env:DATABASE_URL="postgresql://postgres:tu_password_segura@localhost:5432/florhema_db"
npx prisma migrate dev
npm run dev
```

```bash
# Git Bash / Linux / macOS, desde backend/
export DATABASE_URL="postgresql://postgres:tu_password_segura@localhost:5432/florhema_db"
npx prisma migrate dev
npm run dev
```

`dotenv` no pisa las variables ya definidas en el shell, así que el override funciona sin tocar el `.env`. Si el cliente Prisma local está viejo, generalo antes: `npx prisma generate`.

## Endpoints

La API vigente está versionada en `/api/v1`. Todas las respuestas exitosas usan el sobre `{ data }` o `{ data, meta }`; los errores usan `{ error: { code, message, details? } }`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Estado de la API |
| GET | `/health` | Chequeo de salud |
| POST | `/api/v1/auth/login` | Inicio de sesión (devuelve token HMAC) |
| GET | `/api/v1/auth/me` | Perfil del usuario autenticado |
| POST | `/api/v1/auth/logout` | Cierre de sesión del lado del cliente |
| GET | `/api/v1/personas` | Listado con búsqueda, filtros, paginación y semáforo |
| GET | `/api/v1/personas/buscar?q=` | Búsqueda unificada por DNI, HC, nombre o apellido |
| GET | `/api/v1/personas/dni/:dni` | Búsqueda exacta por DNI |
| GET | `/api/v1/personas/revision` | Donantes con serología dudosa pendiente |
| GET | `/api/v1/personas/:id/historial` | Historial completo de la persona |
| GET | `/api/v1/personas/:id/semaforo` | Aptitud calculada (verde/amarillo/rojo/gris) |
| — | `/api/v1/personas` | CRUD completo de personas |
| GET/POST/PUT/PATCH/DELETE | `/api/v1/donaciones` | CRUD de donaciones |
| POST | `/api/v1/donaciones/completa` | Alta de donación con persona y estudios |
| GET/PUT | `/api/v1/donaciones/:id/estudios` | Serologías y PCI consolidados de la donación |
| — | `/api/v1/serologias`, `/api/v1/pci`, `/api/v1/pcd` | CRUD de estudios y resultados |
| — | `/api/v1/serologia-resultados`, `/api/v1/pci-resultados`, `/api/v1/pcd-resultados` | CRUD de resultados |
| — | `/api/v1/gestantes`, `/api/v1/gestantes-pci`, `/api/v1/recien-nacidos` | Estudios de gestantes, PCI asociados y RN |
| POST | `/api/v1/gestantes/completa` | Alta de gestante con PCI y compatibilidad conyugal |
| GET | `/api/v1/gestantes/paciente/:idPersona` | Estudios de una gestante |
| POST | `/api/v1/recien-nacidos/completa` | Alta de RN con PCD/PCI |
| — | `/api/v1/transfusiones` | CRUD de unidad transfusional |
| GET | `/api/v1/transfusiones/persona/:idPersona` | Transfusiones del paciente |
| — | `/api/v1/sangrias-terapeuticas` | CRUD de sangrías terapéuticas |
| GET | `/api/v1/sangrias-terapeuticas/persona/:idPersona` | Sangrías del paciente |
| — | `/api/v1/provincias`, `/api/v1/ciudades`, `/api/v1/domicilios` | CRUD de ubicaciones |
| GET | `/api/v1/catalogos` | Catálogos maestros consolidados |
| — | `/api/v1/catalogos/{grupos-factor,obras-sociales,medicos,...}` | CRUD de catálogos |
| — | `/api/v1/usuarios` | CRUD de usuarios (solo administrador) |
| GET | `/api/v1/auditoria` | Consulta de auditoría con filtros (solo lectura) |
| GET | `/api/v1/auditoria/opciones` | Acciones, entidades y usuarios para filtros |
| GET | `/api/v1/reportes/hemo/resumen` | Tarjetas de la pantalla de reportes |
| GET | `/api/v1/reportes/hemo/1..5` | Planillas HEMO 1 a 5 (acepta `formato=csv`) |

Los listados aceptan `page`, `limit`, `all`, `sort`, `order` y `q` cuando el recurso lo permite. Los reportes y consultas por fecha aceptan `desde` y `hasta` en formato ISO (`YYYY-MM-DD`).

## Comandos del día a día

```bash
docker compose up -d                 # levantar todo en segundo plano
docker compose ps                    # ver estado de los servicios
docker compose logs -f api           # ver logs de la API
docker compose restart api           # reiniciar solo la API
docker compose down                  # apagar (los datos de la DB se conservan)
docker compose down -v               # apagar y BORRAR la base de datos
docker compose exec api sh           # terminal dentro del contenedor de la API
docker compose exec db psql -U postgres -d florhema_db   # consola de Postgres
```

Los cambios en `backend/src` se recargan solos (`tsx watch`). No hace falta reiniciar.

### Frontend

```bash
cd frontend
npm run dev        # servidor de desarrollo en :5173
npm run build      # type-check (tsc -b) + bundle de producción
npm run lint       # oxlint
npm run test       # Vitest
npm run preview    # servir el build localmente
```

### Tests

```bash
cd backend && npm test     # Vitest: reglas de negocio, CRUD y utilidades
cd frontend && npm test    # Vitest: schemas de formularios
```

## Trabajar con la base de datos

### Cambiar el schema

1. Editá `backend/prisma/schema.prisma`.
2. Creá la migración dentro del contenedor:
   ```bash
   docker compose exec api npx prisma migrate dev --name descripcion-del-cambio
   ```
3. Regenerá el cliente local para el editor: `cd backend && npx prisma generate`.
4. Commiteá la carpeta `backend/prisma/migrations`.
5. Reiniciá la API para que el entrypoint aplique la migración: `docker compose restart api`.

### Cuando un compañero cambió el schema

Después de hacer `git pull`:

```bash
docker compose restart api
cd backend && npx prisma generate
```

El restart alcanza porque `prisma/` está montado y el entrypoint corre `generate` + `migrate deploy`.

### Cuando cambian las dependencias (`package.json`)

`node_modules` vive dentro de la imagen, así que hay que reconstruirla:

```bash
docker compose build api
docker compose up -d
```

Y en el host, `npm install` dentro de `backend/` y/o `frontend/`.

## Arquitectura del backend

La API sigue una organización por funcionalidades (feature-based) con capas internas:

| Capa | Hace | No hace |
|------|------|---------|
| `features/<recurso>/*.routes.ts` | Declara verbo + ruta, valida y arma la respuesta HTTP | No accede directamente a la base |
| `features/<recurso>/*.service.ts` | Lógica de negocio y acceso a datos | No usa `req`, `res` ni status codes |
| `features/<recurso>/*.schema.ts` | Valida el body con Zod y expone los DTO | No tiene lógica de negocio |
| `lib/crud*.ts` | CRUD reutilizable para catálogos y recursos simples | No conoce reglas específicas de cada módulo |
| `middlewares/` | Auth, auditoría, validación y manejo central de errores | No contiene reglas de negocio |

**Regla de oro:** si un `service` menciona `req`, `res` o un status code, está mal.

Convenciones de rutas REST: sustantivos en plural (`/api/v1/personas`), el verbo lo pone HTTP, y los filtros van en el query string. Los recursos complejos suman subrutas explícitas (`/donaciones/:id/estudios`, `/gestantes/completa`).

## Flujo de trabajo en equipo

- Una rama por historia de usuario: `feature/alta-donante`.
- Commits chicos y descriptivos.
- Pull Request con review cruzado de al menos un compañero.
- Al mergear, mover la tarjeta correspondiente a "Done" en Trello.
- Nunca subir `.env`, `node_modules` ni `generated`.

## Problemas frecuentes

| Síntoma | Causa y solución |
|---------|------------------|
| `port is already allocated` al levantar la DB | Tenés un Postgres local usando el 5432. Apagalo o cambiá el puerto publicado en `docker-compose.yml` |
| `TypeError: Cannot convert undefined or null to object` al iniciar el backend (`Object.values(...)` en un `*.schema.ts`) | Cliente Prisma local desactualizado (el enum ya no existe en `generated/prisma`). Corré `cd backend && npx prisma generate`. |
| `502 Bad Gateway` al login desde el frontend | El proxy de Vite no encuentra la API en `:3000`. Levantá el stack con `docker compose up -d` (o la API en el host) y verificá con `curl http://localhost:3000/`. |
| VS Code marca errores en imports de Prisma | Falta `npx prisma generate` en `backend/` y reiniciar el TS Server |
| Error de conexión a la base | Revisá que `DATABASE_URL` use el host `db` y que `docker compose ps` muestre `db` en `Up` |
| `req.body` llega `undefined` | `express.json()` tiene que ir antes de las rutas en `index.ts`, y el request debe llevar `Content-Type: application/json` |
| Error de CORS en el navegador | `FRONTEND_URL` en `backend/.env` debe ser `http://localhost:5173`. Después: `docker compose up -d --force-recreate api` |
| Cambié el `.env` y no pasa nada | Los contenedores leen el `.env` al crearse: `docker compose up -d --force-recreate api` |
| Aparecen contenedores viejos o huérfanos | `docker compose up -d --remove-orphans` |
| "Module not found" dentro del contenedor | Se agregó una dependencia: `docker compose build api && docker compose up -d` |

## Límites conocidos

### HU-004 · Registrar resultado diferido

- Las evaluaciones guardan el resultado, el tipo y la causa del diferimiento cuando corresponde, además del nombre del personal entrevistador. El historial se consulta en el detalle del donante; solo las evaluaciones admitidas crean un registro de donación.
- La autenticación y autorización de personal sanitario todavía no están implementadas; el nombre del entrevistador se registra manualmente hasta las HU-020 y HU-021.

### HU-001 · Alta de donante

- **Autorización pendiente (CA1):** hoy `POST /api/donantes` no valida usuario ni rol. Se agrega con las HU-020 (login) y HU-021 (roles).
- **Documento:** solo DNI. Pasaporte queda fuera por ahora, aunque el CA2 lo contempla.
- **Sexo biológico:** solo `MASCULINO` / `FEMENINO`.

### HU-008 · Registrar donación

- **Operador sin autenticación:** hoy `operador` se ingresa como texto en el formulario. Se reemplaza por la identidad autenticada cuando estén las HU-020 (login) y HU-021 (roles).
- **Calificación biológica:** la donación se crea en estado `REGISTRADA`. Los estados `EN_CALIFICACION`, `CALIFICADA` y `RECHAZADA` quedan modelados para la historia de calificación.
- **Datos clínicos:** el modelo guarda donante, fecha/hora, operador y observaciones. Tipo de donación y datos de la entrevista pre-donación quedan para sus historias.

### HU-022 · Registrar recepción de unidades

- **API abierta y operador sin autenticación:** hoy `POST /api/inventario-unidades` y `GET /api/inventario-unidades` no validan sesión ni rol (el login y los permisos corresponden a las HU-020 y HU-021), y el campo `operador` se registra como texto libre ingresado en el formulario hasta que esté implementada la autenticación.
- **Estado en la recepción:** las unidades recepcionadas se incorporan al inventario en estado `DISPONIBLE`. La liberación/bloqueo por calificación biológica corresponde a la HU-013 y la baja de unidades a la HU-023.