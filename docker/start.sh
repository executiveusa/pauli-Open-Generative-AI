#!/bin/sh
set -e

export API_PORT="${API_PORT:-8000}"
export STORAGE_ROOT="${STORAGE_ROOT:-/app/storage}"
export DATABASE_URL="${DATABASE_URL:-file:/app/data/mol.db}"
export NODE_ENV="${NODE_ENV:-production}"

mkdir -p "$STORAGE_ROOT" /app/data

echo "[mol] Starting API server on :${API_PORT}"
node /app/apps/api/src/index.js &
API_PID=$!

echo "[mol] Starting Next.js on :${PORT:-3000}"
/app/node_modules/.bin/next start -p "${PORT:-3000}" &
NEXT_PID=$!

trap 'echo "[mol] Shutting down…"; kill "$API_PID" "$NEXT_PID" 2>/dev/null; wait "$API_PID" "$NEXT_PID" 2>/dev/null; exit 0' TERM INT

# Wait for either process to exit; if one dies, stop both
wait -n "$API_PID" "$NEXT_PID" 2>/dev/null || true
echo "[mol] A process exited — stopping remaining…"
kill "$API_PID" "$NEXT_PID" 2>/dev/null || true
wait "$API_PID" "$NEXT_PID" 2>/dev/null || true
