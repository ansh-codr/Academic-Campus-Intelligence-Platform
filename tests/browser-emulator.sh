#!/usr/bin/env bash
# Invoked by firebase emulators:exec from the repository root.
set -eu
[[ "${GCLOUD_PROJECT:-}" == demo-solvesphere && -n "${FIREBASE_AUTH_EMULATOR_HOST:-}" && -n "${FIRESTORE_EMULATOR_HOST:-}" ]]
export VITE_FIREBASE_API_KEY=demo-key VITE_FIREBASE_PROJECT_ID=demo-solvesphere
export VITE_FIREBASE_STORAGE_BUCKET=demo-solvesphere.appspot.com VITE_USE_FIREBASE_EMULATOR=true
export ADMIN_EMAIL=admin.browser@example.test
ADMIN_PASSWORD=$(node -e "console.log(require('crypto').randomUUID())")
export ADMIN_PASSWORD
npm run admin:bootstrap
preview_dir=$(mktemp -d)
trap 'rm -rf "$preview_dir"' EXIT
npm run build --workspace=@solvesphere/web -- --outDir "$preview_dir"
node node_modules/vite/bin/vite.js preview apps/web --outDir "$preview_dir" --host 127.0.0.1 --strictPort --port 5173 &
preview_pid=$!
trap 'kill "$preview_pid" 2>/dev/null || true; rm -rf "$preview_dir"' EXIT
for attempt in {1..30}; do
  kill -0 "$preview_pid"
  if curl -fsS http://127.0.0.1:5173/ >/dev/null 2>&1; then break; fi
  sleep 1
done
python3 tests/browser_emulator.py
