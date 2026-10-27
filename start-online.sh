#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
if ! podman inspect -f '{{.State.Running}}' codex-cs16-web 2>/dev/null | grep -qx true; then ./start.sh; fi
if ! podman container exists codex-cs16-public; then
 podman run -d --name codex-cs16-public --network host --restart unless-stopped --read-only --security-opt no-new-privileges --cap-drop ALL --memory 192m --pids-limit 64 docker.io/cloudflare/cloudflared:latest tunnel --no-autoupdate --protocol http2 --url http://127.0.0.1:27016 >/dev/null
elif ! podman inspect -f '{{.State.Running}}' codex-cs16-public | grep -qx true; then
 podman start codex-cs16-public >/dev/null
fi
python3 - <<'PY'
import subprocess,re,time,pathlib,sys
for _ in range(45):
 logs=subprocess.run(['podman','logs','codex-cs16-public'],capture_output=True,text=True)
 matches=re.findall(r'https://[a-z0-9-]+\.trycloudflare\.com',logs.stdout+logs.stderr)
 if matches:
  url=matches[-1];pathlib.Path('runtime/public-url.txt').write_text(url+'\n');print('\nPublic game: '+url+'\nNo player login. Keep this PC and the app running.\nThe URL changes when the tunnel is recreated or restarted.');break
 time.sleep(1)
else:print('Tunnel address is not ready. Check podman logs codex-cs16-public.');sys.exit(1)
PY
