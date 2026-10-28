#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")/.."
if [[ $# -lt 2 || $# -gt 3 ]]; then echo 'Usage: deployment/deploy.sh /path/private-transfer.tar.gz game.your-domain.example|--tunnel [/path/dingus-arm64-images.tar.gz]' >&2;exit 1;fi
TUNNEL=0
DOMAIN=$2
COMPOSE_FILES=(-f deployment/compose.yaml)
if [[ "$DOMAIN" == --tunnel ]]; then TUNNEL=1;DOMAIN=tunnel.invalid;COMPOSE_FILES=(-f deployment/compose.tunnel.yaml);fi
case "$(uname -m)" in
 x86_64) if [[ $# == 3 ]]; then echo 'The prebuilt image archive is ARM64 only.' >&2;exit 1;fi ;;
 aarch64|arm64) COMPOSE_FILES+=(-f deployment/compose.arm64.yaml) ;;
 *) echo 'Supported hosts: Linux x86-64 or ARM64.' >&2;exit 1;;
esac
COMPOSE_FILES+=(-f deployment/compose.on-demand.yaml)
if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]+$ ]]; then echo 'Supply a DNS hostname without scheme or path.' >&2;exit 1;fi
command -v docker >/dev/null
docker compose version >/dev/null
python3 -c "import sys; assert sys.version_info >= (3,12), 'Python 3.12+ is required'"
[[ -f "$1" ]] || { echo 'Private transfer archive is missing.' >&2;exit 1; }
if [[ $# == 3 ]]; then [[ -f "$3" ]] || { echo 'ARM64 image archive is missing.' >&2;exit 1; };docker load -i "$3";fi
python3 scripts/restore-transfer.py "$1"
if [[ ! -f data/skins.zip || ! -f data/skins.json ]]; then python3 scripts/build-skins.py "$PWD/game-files";fi
mkdir -p runtime/control
chmod 777 runtime/control
python3 - "$DOMAIN" <<'PY'
from pathlib import Path
import os,sys
root=Path.cwd();domain=sys.argv[1]
p=root/'deployment/.env';p.write_text(f'GAME_INSTALLATION={root}/game-files\nGAME_DOMAIN={domain}\nPUBLIC_URL=https://{domain}\nHOST_UID={os.getuid()}\nHOST_GID={os.getgid()}\n');p.chmod(0o600)
PY
if [[ $# == 3 ]]; then
 docker image inspect dingus-engine:arm64 dingus-web:arm64 >/dev/null
 docker compose --env-file deployment/.env "${COMPOSE_FILES[@]}" up -d --no-build
else
 docker compose --env-file deployment/.env "${COMPOSE_FILES[@]}" up -d --build
fi
if [[ "$TUNNEL" == 1 ]]; then
 echo 'Game host starting behind an outbound HTTPS tunnel; no domain or inbound ports needed.'
 echo 'Read the trycloudflare.com URL from the tunnel service logs. It changes when the tunnel restarts.'
else
 printf '\nGame host starting: https://%s\nCheck /healthz, sign in and join a room before changing the permanent launcher.\n' "$DOMAIN"
fi
echo 'After verifying this host, update deployment/live.json to its HTTPS origin to move the permanent game link.'
