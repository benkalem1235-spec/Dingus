#!/usr/bin/env bash
set -euo pipefail
podman ps -a --filter name=codex-cs16 --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
python3 - <<'PY'
import json,urllib.request
try:
 d=json.load(urllib.request.urlopen('http://127.0.0.1:27016/api/rooms',timeout=3))
 for r in d['rooms']: print(r['name'], 'ONLINE' if r['online'] else 'OFFLINE',str(r['players'])+'/'+str(r['max'])+' browser players')
except Exception as e: print('Web host unavailable:',e)
PY
