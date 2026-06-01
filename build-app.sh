#!/bin/bash
# Build ResearchOS.app — a double-clickable macOS launcher for the whole stack.
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
APP="$ROOT/ResearchOS.app"

echo "Building $APP …"
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
  <key>LSUIElement</key><false/>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST

# Launcher executable — resolves repo root from its own location, then runs start.sh
cat > "$APP/Contents/MacOS/ResearchOS" <<'LAUNCH'
#!/bin/bash
# repo root = three levels up from Contents/MacOS/ResearchOS
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.bun/bin:$PATH"
export RESEARCHOS_APP_MODE=1

LOG="$ROOT/app-launch.log"
{
  echo "=== ResearchOS launch $(date) ==="
  if [ ! -x "$ROOT/start.sh" ]; then
    osascript -e 'display dialog "ResearchOS: start.sh not found. Did the project folder move?" buttons {"OK"} with icon caution' >/dev/null 2>&1
    exit 1
  fi
  "$ROOT/start.sh"
} >> "$LOG" 2>&1 &
SVC_PID=$!

# wait for the backend to answer, then we're done bootstrapping
for i in $(seq 1 60); do
  if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -s http://localhost:8000/health >/dev/null 2>&1; then
  osascript -e 'display dialog "ResearchOS could not start the backend. See app-launch.log in the project folder." buttons {"OK"} with icon caution' >/dev/null 2>&1
fi

# keep the .app process alive so quitting it stops the services
trap 'kill $SVC_PID 2>/dev/null' EXIT INT TERM
wait $SVC_PID
LAUNCH

chmod +x "$APP/Contents/MacOS/ResearchOS"

echo "✓ Built ResearchOS.app"
echo "  Double-click it (or: open ResearchOS.app) to launch everything in a dedicated window."
