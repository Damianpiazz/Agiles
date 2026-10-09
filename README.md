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
│   ├── prisma/              # schema.prisma y migraciones
│   ├── src/
│   │   ├── config/          # conexión a Prisma
│   │   ├── types/           # forma de los datos y validaciones (Zod)
│   │   ├── services/        # lógica y acceso a datos (no conocen HTTP)
│   │   ├── controllers/     # traducen HTTP y eligen el status code
│   │   ├── routes/          # verbo + ruta → controller
│   │   └── index.ts         # levanta el server y monta las rutas
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

| Método | Ruta | Descripción | Éxito | Errores |

|--------|------|-------------|-------|---------|
| GET | `/` | Estado de la API | 200 | |
| POST | `/api/donantes` | Alta de donante (HU-001) | 201 | 400, 409, 500 |
| GET | `/api/donantes?dni={dni}` | Buscar donante por DNI (HU-002) | 200 | 400, 500 |
| GET | `/api/donantes?nombre={nombre}&apellido={apellido}` | Buscar donante por nombre y apellido (HU-002) | 200 | 400, 500 |
| GET | `/api/donantes/:id` | Consultar datos de un donante (HU-002) | 200 | 400, 404, 500 |

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

Cada archivo tiene una única responsabilidad:

| Capa | Hace | No hace |
|------|------|---------|
| `routes` | Declara verbo + ruta y a qué controller va | No tiene lógica |
| `controllers` | Lee params/body, valida, elige el status code | No busca ni guarda datos |
| `services` | Lógica y acceso a la base | No usa `req`, `res` ni status codes |
| `types` | Define la forma de los datos y sus validaciones | No tiene lógica |

**Regla de oro:** si un `service` menciona `req`, `res` o un status code, está mal.

Convenciones de rutas REST: sustantivos en plural (`/api/donantes`), el verbo lo pone HTTP, y los filtros van en el query string.

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

### HU-001 · Alta de donante

- **Autorización pendiente (CA1):** hoy `POST /api/donantes` no valida usuario ni rol. Se agrega con las HU-020 (login) y HU-021 (roles).
- **Documento:** solo DNI. Pasaporte queda fuera por ahora, aunque el CA2 lo contempla.
- **Sexo biológico:** solo `MASCULINO` / `FEMENINO`.