# Florhema — Sistema del Servicio de Hemoterapia

Proyecto de la materia **Agiles** (Grupo 12). Implementa las historias de usuario del
[Product Backlog](docs/Backlog%20Agiles.pdf) para la gestión de donantes, calificación biológica,
inventario de hemocomponentes, pacientes/receptores y proceso de transfusión.

## Stack

| Capa         | Tecnología                                   |
| ------------ | -------------------------------------------- |
| Backend      | Node.js + Express + TypeScript               |
| ORM          | Prisma                                       |
| Base de datos| PostgreSQL 16 (Docker)                       |
| Frontend     | React + TypeScript (Vite)                    |

## Estructura del repositorio 
(a chequear)
```
Agiles/
├── docker-compose.yml     # PostgreSQL
├── .env.example           # variables de entorno de referencia
├── backend/               # API Express + Prisma
│   ├── prisma/            # schema y migraciones
│   └── src/
│       ├── config/        # configuración y variables de entorno
│       ├── lib/           # cliente Prisma y utilidades
│       ├── middlewares/   # validación, manejo de errores
│       └── modules/       # un módulo por feature (F-01 .. F-06)
│           ├── donantes/       # F-01
│           ├── donaciones/     # F-02
│           ├── calificacion/   # F-02
│           ├── inventario/     # F-03
│           ├── pacientes/      # F-04
│           └── transfusion/    # F-05
└── frontend/              # aplicación React
    └── src/
        ├── api/           # cliente HTTP
        ├── components/    # componentes reutilizables
        ├── pages/         # páginas por feature
        ├── hooks/         # hooks propios
        └── types/         # tipos compartidos
```

## Puesta en marcha

1. Levantar la base de datos:

   ```bash
   cd backend && docker compose up -d
   cd ../frontend && npm run dev
   ```

   PostgreSQL queda disponible en `localhost:5432`
   (usuario/clave/base: `florhema`).

## Límites conocidos

### HU-001 · Alta de donante
- **Autorización pendiente (CA1):** hoy `POST /api/donantes` no valida usuario ni rol.
  Se agrega con las HU-020 (login) y HU-021 (roles).
- **Documento:** solo DNI. Pasaporte queda fuera por ahora (el CA2 lo contempla).
- **Sexo biológico:** solo MASCULINO / FEMENINO.

## Progreso

### ✅ Punto 1 — entorno Frontend

`npm create vite@latest frontend2 -- --template react-ts`

### ✅ Punto 2 — entorno Backend

```bash
mkdir backend && cd backend
npm init -y

# Express + TypeScript
npm install express
npm install -D typescript tsx @types/node @types/express

# Prisma
npm install -D prisma@7.9.1
npm install @prisma/client@7.9.1 @prisma/adapter-pg pg dotenv
npm install -D @types/pg

# Genera prisma/schema.prisma, prisma.config.ts y .env
npx prisma init --datasource-provider postgresql

# Estructura en capas
mkdir -p src/types src/services src/controllers src/routes
touch src/index.ts Dockerfile .dockerignore .env.example
```

### ✅ Punto 3 — HU-001 · Modelo y migración

- `backend/prisma/schema.prisma`: enum `SexoBiologico` (MASCULINO/FEMENINO) y modelo `Donante`
  (`@@map("donantes")`), con `dni` `@unique` (CA2) e `id` autoincremental (CA3).
- Migración `20261007224939_crear_donante` aplicada contra `florhema_db`
  (tabla `donantes` + enum `SexoBiologico` + índice único sobre `dni`).

```bash
docker compose exec api npx prisma migrate dev --name crear-donante
```
