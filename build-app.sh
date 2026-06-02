#!/bin/bash
# Build ResearchOS.app — a double-clickable macOS app that launches the whole
# stack and opens a native window. The project path is baked in, so the .app
# can be moved anywhere (e.g. /Applications).
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
APP="$ROOT/ResearchOS.app"

echo "Building $APP …"
echo "  project dir: $ROOT"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

# Info.plist
cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>ResearchOS</string>
  <key>CFBundleDisplayName</key><string>ResearchOS</string>
  <key>CFBundleIdentifier</key><string>com.isef.researchos</string>
  <key>CFBundleVersion</key><string>1.0</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleExecutable</key><string>ResearchOS</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST

# Launcher — PROJECT_DIR is baked in at build time so the bundle is movable.
cat > "$APP/Contents/MacOS/ResearchOS" <<LAUNCH
#!/bin/bash
PROJECT_DIR="$ROOT"
export PATH="/opt/homebrew/bin:/usr/local/bin:\$HOME/.bun/bin:\$PATH"
export RESEARCHOS_APP_MODE=1
export RESEARCHOS_NO_OPEN=1

LOG="\$PROJECT_DIR/app-launch.log"
echo "=== ResearchOS launch \$(date) ===" >> "\$LOG"

if [ ! -x "\$PROJECT_DIR/start.sh" ]; then
  osascript -e 'display dialog "ResearchOS: project files not found. Rebuild with build-app.sh." buttons {"OK"} with icon caution' >/dev/null 2>&1
  exit 1
fi

# start services in the background (no browser — we open our own window)
"\$PROJECT_DIR/start.sh" >> "\$LOG" 2>&1 &
SVC_PID=\$!

cleanup() { kill \$SVC_PID 2>/dev/null; }
trap cleanup EXIT INT TERM

# wait for the backend
UP=0
for i in \$(seq 1 90); do
  if curl -s http://localhost:8000/health >/dev/null 2>&1; then UP=1; break; fi
  sleep 1
done
if [ "\$UP" != "1" ]; then
  osascript -e 'display dialog "ResearchOS could not start the backend. See app-launch.log." buttons {"OK"} with icon caution' >/dev/null 2>&1
  exit 1
fi

# open the native window (blocks until closed); fall back to the browser
VENV_PY="\$PROJECT_DIR/backend/venv/bin/python3"
if "\$VENV_PY" -c "import webview" >/dev/null 2>&1; then
  "\$VENV_PY" "\$PROJECT_DIR/app/window.py" >> "\$LOG" 2>&1
else
  open "http://localhost:8000"
  wait \$SVC_PID
fi
LAUNCH

chmod +x "$APP/Contents/MacOS/ResearchOS"

echo "✓ Built ResearchOS.app"
echo "  Double-click it, or run: open ResearchOS.app"
echo "  You can move it to /Applications if you like — the project path is baked in."
