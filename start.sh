#!/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Finder-launched apps get a minimal PATH — make sure our tools are found.
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.bun/bin:$PATH"

echo ""
echo "  ResearchOS — ISEF"
echo "  ────────────────────────────────"

OLLAMA_STARTED=0

# 1. Ollama (LLM) — start it if it isn't already running
if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
  if command -v ollama >/dev/null 2>&1; then
    echo "  → Starting Ollama…"
    ollama serve > "$ROOT/ollama.log" 2>&1 &
    OLLAMA_PID=$!
    OLLAMA_STARTED=1
    # wait up to ~20s for it to come up
    for i in $(seq 1 20); do
      curl -s http://localhost:11434/api/tags >/dev/null 2>&1 && break
      sleep 1
    done
  else
    echo "  ! Ollama not installed — AI features will be disabled."
    echo "    Install from https://ollama.com/download"
  fi
else
  echo "  → Ollama already running"
fi

# ensure required models exist (only if ollama is reachable)
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
  for m in llama3.2 nomic-embed-text; do
    if ! ollama list 2>/dev/null | grep -q "$m"; then
      echo "  → Pulling model $m (first run only)…"
      ollama pull "$m" || echo "    ! could not pull $m"
    fi
  done
fi

# 2. Build frontend
echo "  → Building frontend…"
cd "$ROOT/frontend"
npm run build --silent 2>/dev/null

# 3. SearXNG (web + paper search)
echo "  → Starting search engine (port 8080)…"
SEARXNG_SETTINGS_PATH="$ROOT/searxng/searxng-settings.yml" \
  "$ROOT/searxng/venv/bin/python3" -m searx.webapp \
  > "$ROOT/searxng/searxng.log" 2>&1 &
SEARXNG_PID=$!
sleep 2

# 4. Backend (serves API + built frontend on one port)
echo "  → Starting backend (port 8000)…"
cd "$ROOT/backend"
venv/bin/uvicorn main:app --port 8000 --log-level warning \
  > "$ROOT/backend/backend.log" 2>&1 &
BACKEND_PID=$!
sleep 2

echo ""
echo "  ✓ Ready → http://localhost:8000"
echo ""
echo "  Logs:  backend/backend.log · searxng/searxng.log · ollama.log"
echo "  Press Ctrl+C to stop."
echo ""

if [ "${RESEARCHOS_APP_MODE:-0}" = "1" ] && [ -d "/Applications/Google Chrome.app" ]; then
  # dedicated, chromeless app window (its own profile so it looks like a native app)
  open -na "Google Chrome" --args \
    --app="http://localhost:8000" \
    --user-data-dir="$HOME/.researchos-window" \
    --no-first-run --no-default-browser-check 2>/dev/null || open "http://localhost:8000"
else
  open "http://localhost:8000" 2>/dev/null || true
fi

cleanup() {
  echo "  Stopping…"
  kill $SEARXNG_PID $BACKEND_PID 2>/dev/null || true
  [ "$OLLAMA_STARTED" = "1" ] && kill $OLLAMA_PID 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM
wait
