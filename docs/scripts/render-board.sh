#!/usr/bin/env bash
# Renders a design board (design/Project/{Board}.dc.html) to a phone-sized PNG
# for the docs flows. Usage, from the repo root:
#   docs/scripts/render-board.sh StudentsList                    # → docs/public/screens/boards/StudentsList.png
#   docs/scripts/render-board.sh StudentsList StudentsRequests '{"tab":"requests"}'
# The third argument is JSON merged into the board's state (another tab, an open sheet…).
set -euo pipefail

board="$1"
name="${2:-$1}"
state="${3:-}"
repo="$(cd "$(dirname "$0")/../.." && pwd)"
chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

cp "$repo/design/Project/$board.dc.html" "$work/"
cp "$repo/docs/scripts/boards/support.js" "$work/"

url="file://$work/$board.dc.html"
if [ -n "$state" ]; then
  url="$url#$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$state")"
fi

"$chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --window-size=390,844 --virtual-time-budget=4000 \
  --screenshot="$repo/docs/public/screens/boards/$name.png" "$url" >/dev/null 2>&1
echo "docs/public/screens/boards/$name.png"
