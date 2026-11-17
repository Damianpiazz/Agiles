#!/bin/sh
set -e

echo "[entrypoint] Generando cliente Prisma desde prisma/schema.prisma..."
npx prisma generate

echo "[entrypoint] Aplicando migraciones pendientes..."
npx prisma migrate deploy

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "[entrypoint] Ejecutando seeders..."
  npx prisma db seed
else
  echo "[entrypoint] RUN_SEED != true: se omiten los seeders."
fi

echo "[entrypoint] Iniciando: $*"
exec "$@"
