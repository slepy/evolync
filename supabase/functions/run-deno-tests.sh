#!/usr/bin/env bash
# Runs the Edge Function unit tests (*.test.ts) with Deno. Uses a local `deno`
# when installed, otherwise the official Docker image.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TARGETS=("${@:-supabase/functions}")

if command -v deno >/dev/null 2>&1; then
  cd "$ROOT" && deno test --allow-env --allow-net=deno.land "${TARGETS[@]}"
else
  docker run --rm -v "$ROOT":/app -w /app "${DENO_IMAGE:-denoland/deno:2.1.4}" \
    test --allow-env --allow-net=deno.land "${TARGETS[@]}"
fi
