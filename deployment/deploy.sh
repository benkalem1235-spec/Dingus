#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")/.."
if [[ "$(uname -m)" != x86_64 ]]; then
 echo 'This build needs Linux x86-64. ARM free-tier hosts require a separate engine port and validation.' >&2;exit 1
fi
if [[ $# != 2 ]]; then echo 'Usage: deployment/deploy.sh /path/private-transfer.tar.gz game.your-domain.example' >&2;exit 1;fi
DOMAIN=$2
if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]+$ ]]; then echo 'Supply a DNS hostname without scheme or path.' >&2;exit 1;fi
command -v docker >/dev/null
python3 scripts/restore-transfer.py "$1"
python3 scripts/build-skins.py "$PWD/game-files"
python3 - "$DOMAIN" <<'PY'
from pathlib import Path
import os,sys
root=Path.cwd();domain=sys.argv[1]
p=root/'deployment/.env';p.write_text(f'GAME_INSTALLATION={root}/game-files\nGAME_DOMAIN={domain}\nPUBLIC_URL=https://{domain}\nHOST_UID={os.getuid()}\nHOST_GID={os.getgid()}\n');p.chmod(0o600)
PY
docker compose --env-file deployment/.env -f deployment/compose.yaml up -d --build
printf '\nGame host starting: https://%s\nCheck: docker compose --env-file deployment/.env -f deployment/compose.yaml logs --tail 30\n' "$DOMAIN"
echo 'After verifying this host, update deployment/live.json to its HTTPS origin to move the permanent game link.'
