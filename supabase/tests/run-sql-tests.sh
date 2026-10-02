#!/usr/bin/env bash
# Runs the SQL test files in supabase/tests/*.test.sql against a disposable
# Postgres container: platform stubs → every migration in order → each test.
# Usage: supabase/tests/run-sql-tests.sh [test-file ...]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IMAGE="${PG_IMAGE:-postgres:16-alpine}"
NAME="evolync-sql-tests-$$"

cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker run -d --name "$NAME" -e POSTGRES_PASSWORD=postgres "$IMAGE" >/dev/null
for _ in $(seq 1 60); do
  docker exec "$NAME" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 0.5
done
sleep 1

psql_run() {
  docker exec -i "$NAME" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"
}

psql_run < "$ROOT/supabase/tests/supabase-stubs.sql"
for migration in "$ROOT"/supabase/migrations/*.sql; do
  psql_run < "$migration" || { echo "Migration failed: $(basename "$migration")" >&2; exit 1; }
done
echo "Applied $(ls "$ROOT"/supabase/migrations/*.sql | wc -l | tr -d ' ') migrations"

if [ "$#" -gt 0 ]; then tests=("$@"); else tests=("$ROOT"/supabase/tests/*.test.sql); fi
for test in "${tests[@]}"; do
  echo "== $(basename "$test")"
  psql_run < "$test"
done
echo "All SQL tests passed"
