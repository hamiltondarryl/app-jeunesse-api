#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL est requis}"
: "${JWT_SECRET:?JWT_SECRET est requis}"

if [ "${#JWT_SECRET}" -lt 16 ]; then
  echo "JWT_SECRET doit contenir au moins 16 caractères." >&2
  exit 1
fi

UPLOADS_DIR="${UPLOADS_DIR:-/app/uploads}"
mkdir -p "${UPLOADS_DIR}/organisations/public"

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Application des migrations Prisma..."
  ./node_modules/.bin/prisma migrate deploy
fi

exec node dist/src/main.js
