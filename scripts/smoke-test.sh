#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "=== Cynthia Studio LatAm — Smoke Test Suite ==="
echo ""

echo "--- Shared Package Tests ---"
cd "$ROOT/packages/shared" && node --test tests/*.test.mjs 2>&1 || echo "SHARED TESTS: Some failures (see above)"

echo ""
echo "--- Cynthia Smoke Tests ---"
cd "$ROOT" && node --test packages/shared/tests/cynthia-smoke.test.mjs 2>&1 || echo "SMOKE TESTS: Some failures (see above)"

echo ""
echo "=== Done ==="
