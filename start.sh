#!/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  ResearchOS — ISEF"
echo "  ────────────────────────────────"

# Build frontend
echo "  → Building frontend…"
cd "$ROOT/frontend"
npm run build --silent 2>/dev/null

# Start SearXNG
echo "  → Starting search engine (port 8080)…"
SEARXNG_SETTINGS_PATH="$ROOT/searxng/searxng-settings.yml" \
  "$ROOT/searxng/venv/bin/python3" -m searx.webapp \
  > "$ROOT/searxng/searxng.log" 2>&1 &
SEARXNG_PID=$!

# Give SearXNG a moment to boot
sleep 2

# Start backend (serves API + frontend)
echo "  → Starting backend (port 8000)…"
cd "$ROOT/backend"
venv/bin/uvicorn main:app --port 8000 --log-level warning \
  > "$ROOT/backend/backend.log" 2>&1 &
BACKEND_PID=$!

sleep 2

echo ""
echo "  ✓ Ready → http://localhost:8000"
echo ""
echo "  Logs:"
echo "    backend: backend/backend.log"
echo "    search:  searxng/searxng.log"
echo ""
echo "  Press Ctrl+C to stop."
echo ""

# Open browser
open "http://localhost:8000" 2>/dev/null || true

trap "echo '  Stopping…'; kill $SEARXNG_PID $BACKEND_PID 2>/dev/null; exit" INT TERM
wait
