#!/bin/bash
# One-command setup for ResearchOS. Run this once after cloning:
#   ./setup.sh
# Then start it with ./start.sh (or double-click ResearchOS.app).
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.bun/bin:$PATH"

say()  { printf "\n\033[1m%s\033[0m\n" "$1"; }
ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; }
warn() { printf "  \033[33m!\033[0m %s\n" "$1"; }

say "ResearchOS setup"

# ---- 1. prerequisites -------------------------------------------------------
MISSING=0
check() {
  if command -v "$1" >/dev/null 2>&1; then ok "$1 found"; else
    warn "$1 is NOT installed — $2"; MISSING=1
  fi
}
say "1/5  Checking prerequisites"
check python3 "install Python 3.11+ from python.org or 'brew install python3'"
check node    "install Node.js from nodejs.org or 'brew install node'"
check npm     "comes with Node.js"
check git     "install from 'brew install git' or Xcode tools"
check ollama  "install the local AI from https://ollama.com/download"

if [ "$MISSING" = "1" ]; then
  warn "Install the missing tools above, then run ./setup.sh again."
  exit 1
fi

# ---- 2. python backend ------------------------------------------------------
say "2/5  Backend (Python)"
cd "$ROOT/backend"
[ -d venv ] || python3 -m venv venv
venv/bin/pip install --quiet --upgrade pip
venv/bin/pip install --quiet -r requirements.txt
ok "backend dependencies installed"

# ---- 3. searxng (local search engine) --------------------------------------
say "3/5  Search engine (SearXNG)"
if [ ! -d "$ROOT/searxng/.git" ]; then
  git clone --depth=1 https://github.com/searxng/searxng.git "$ROOT/searxng"
fi
cd "$ROOT/searxng"
[ -d venv ] || python3 -m venv venv
venv/bin/pip install --quiet --upgrade pip setuptools msgspec
venv/bin/pip install --quiet -r requirements.txt
venv/bin/pip install --quiet -e . --no-build-isolation
ok "SearXNG installed (config: searxng-settings.yml)"

# ---- 4. frontend ------------------------------------------------------------
say "4/5  Frontend (React)"
cd "$ROOT/frontend"
npm install --silent
ok "frontend dependencies installed"

# ---- 5. models + env + app --------------------------------------------------
say "5/5  AI models, config & app"
# start ollama if needed, then pull models
if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
  ollama serve >/dev/null 2>&1 &
  sleep 3
fi
for m in llama3.2 nomic-embed-text; do
  if ollama list 2>/dev/null | grep -q "$m"; then ok "model $m ready"; else
    echo "  pulling $m (one-time download)…"; ollama pull "$m" && ok "model $m ready"
  fi
done

# optional .env
[ -f "$ROOT/backend/.env" ] || cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
ok "config ready (backend/.env — optional, no keys required)"

# build the Mac app with THIS machine's path baked in
if [ -x "$ROOT/build-app.sh" ]; then
  "$ROOT/build-app.sh" >/dev/null && ok "ResearchOS.app built for this machine"
fi

say "Done! 🎉"
echo "  Start it:   ./start.sh        (opens http://localhost:8000)"
echo "  Or:         open ResearchOS.app"
echo ""
echo "  No API keys needed — search and papers work out of the box."
