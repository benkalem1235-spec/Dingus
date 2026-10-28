#!/bin/sh
set -eu
# Do not put real player records on Render's disposable filesystem.
if [ "${DINGUS_DISPOSABLE_TEST:-0}" != 1 ]; then
 echo 'Cloud persistence is not configured yet. Production startup is blocked to protect accounts and skins.' >&2
 exit 1
fi
# Test-only provisioning must mount /data, /config and owned /game-files privately.
if [ ! -f /data/assets.json ] || [ ! -f /game-files/valve/delta.lst ] || [ ! -f /config/rooms.json ]; then
 echo 'This test image needs private game data and configuration before it can start.' >&2
 exit 1
fi
export SALAS_CONF=/config/salas.conf
/usr/local/bin/servidor-cs &
engine=$!
node /app/server.mjs &
web=$!
trap 'kill -TERM "$web" "$engine" 2>/dev/null || true; wait; exit 0' INT TERM
# Exit if either coordinator dies; the host may restart the service.
while kill -0 "$web" 2>/dev/null && kill -0 "$engine" 2>/dev/null; do sleep 1; done
kill -TERM "$web" "$engine" 2>/dev/null || true
wait || true
exit 1
