#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
BASE="$PWD"
ENGINE=localhost/cs16-room-engine
WEB=localhost/cs16-room-web
WEB_NAME=codex-cs16-web
ENGINE_NAME=codex-cs16-engine
SOURCE=$(python3 -c 'import json; print(json.load(open("data/source.json"))["installation"])')
PUBLIC_IP=${CS16_PUBLIC_IP:-$(ip -4 route get 1.1.1.1 | awk '{for(i=1;i<=NF;i++)if($i=="src"){print $(i+1);exit}}')}
if [[ -z "$PUBLIC_IP" ]]; then PUBLIC_IP=127.0.0.1; fi
if [[ ! -f "$BASE/data/skins.zip" || ! -f "$BASE/data/skins.json" ]]; then python3 "$BASE/scripts/build-skins.py" "$SOURCE"; fi
if [[ ! -f "$SOURCE/cstrike/maps/de_dust2.bsp" ]]; then echo 'Local CS 1.6 installation is missing.' >&2; exit 1; fi
podman image exists "$ENGINE" || podman build -t "$ENGINE" server
podman image exists "$WEB" || podman build -t "$WEB" web
if podman container exists "$ENGINE_NAME"; then podman rm -f "$ENGINE_NAME" >/dev/null; fi
if podman container exists "$WEB_NAME"; then podman rm -f "$WEB_NAME" >/dev/null; fi
mkdir -p "$BASE/accounts" "$BASE/runtime/events"
chmod 777 "$BASE/runtime/events"
chmod 700 "$BASE/accounts"
# Writable account records survive container recreation; mail credentials stay outside source.
MAIL_ENV=()
if [[ -f "$BASE/config/accounts.env" ]]; then MAIL_ENV=(--env-file "$BASE/config/accounts.env"); fi
podman run -d --name "$WEB_NAME" "${MAIL_ENV[@]}" --userns keep-id --user "$(id -u):$(id -g)" -v "$BASE/accounts:/accounts:rw" -v "$BASE/runtime/events:/events:ro" --restart unless-stopped --security-opt label=disable --security-opt no-new-privileges --cap-drop ALL --read-only --tmpfs /tmp:rw,size=64m --memory 512m --pids-limit 256 -p 27016:27016/tcp -p 27018:27018/udp -e PUBLIC_IP="$PUBLIC_IP" -v "$BASE/data:/data:ro" -v "$BASE/config:/config:ro" "$WEB" >/dev/null
podman run -d --name "$ENGINE_NAME" --restart unless-stopped --network "container:$WEB_NAME" --security-opt label=disable --security-opt no-new-privileges --cap-drop ALL --memory 4096m --pids-limit 512 -v "$BASE/runtime/events:/events:rw" -v "$SOURCE:/juego:ro" -v "$BASE/config:/config:ro" -v "$BASE/custom/cstrike:/mapas:ro" "$ENGINE" >/dev/null
python3 - <<'PY'
import time,urllib.request,json,sys
for i in range(60):
 try:
  d=json.load(urllib.request.urlopen('http://127.0.0.1:27016/api/rooms',timeout=2))
  if all(r['online'] for r in d['rooms']):print('Classic rooms are online.');break
 except Exception:pass
 time.sleep(1)
else:print('Engine startup is still pending. Check ./status.sh.');sys.exit(1)
PY
printf '\nPlay here: http://127.0.0.1:27016\nShare on your network: http://%s:27016\nStop: ./stop.sh\n' "$PUBLIC_IP"
