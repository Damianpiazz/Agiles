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

La primera vez, en este orden.

### 1. Clonar y configurar variables

```bash
git clone <URL-del-repo>
cd <carpeta-del-repo>
```

Copiá el archivo de variables del backend (el `.env` **no se sube a Git**):

```bash
# Git Bash / Linux / macOS
cp backend/.env.example backend/.env

# PowerShell
copy backend\.env.example backend\.env
```

Los valores por defecto sirven tal cual para desarrollo. Si cambiás `POSTGRES_USER`, `POSTGRES_PASSWORD` o `POSTGRES_DB`, mantené el mismo valor en `DATABASE_URL`. El host de la base dentro de `DATABASE_URL` es `db` (el nombre del servicio en Docker), no `localhost`.

### 2. Levantar la API y la base de datos

```bash
docker compose up -d --build
```

Verificá que ambos servicios estén en `Up`:

```bash
docker compose ps
```

Y que la API responda: abrí <http://localhost:3000>. Tiene que devolver un JSON con `"ok": true`.

### 3. Crear las tablas

```bash
docker compose exec api npx prisma migrate dev
```

Aplica todas las migraciones que hay en `backend/prisma/migrations`.

### 3.1. Datos de demostración (opcional)

```bash
docker compose exec api npx prisma db seed
```

Carga catálogos, personas, donaciones, estudios y usuarios de prueba. Los usuarios demo son `admin` / `Admin.123`, `fperez` / `Tecnico.123` y `maternidad` / `Consulta.123` (solo para desarrollo).

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

Creá `frontend/.env` con:

```env
VITE_API_URL=http://localhost:3000
```

```bash
cd frontend
npm install
npm run dev
```

### URLs

| Servicio | URL |
|----------|-----|
| Frontend | <http://localhost:5173> |
| API | <http://localhost:3000> |
| PostgreSQL | `localhost:5432` |

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
3. Regenerá el cliente local: `cd backend && npx prisma generate`.
4. Commiteá la carpeta `backend/prisma/migrations`.

### Cuando un compañero cambió el schema

Después de hacer `git pull`:

```bash
docker compose exec api npx prisma migrate dev
cd backend && npx prisma generate
```

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