#!/bin/sh
# File leases are written only by the authenticated web coordinator.
set -eu
CONTROL=${DINGUS_CONTROL_DIR:-/control}
MAX=${DINGUS_MAX_ROOMS:-3}
case "$MAX" in 1|2|3) ;; *) MAX=3;; esac
mkdir -p "$CONTROL" /tmp/dingus-demand
DINGUS_ON_DEMAND=0 SOLO_LISTAR_SALAS=1 /usr/local/bin/servidor-cs > /tmp/dingus-demand/rooms
cleanup(){ rm -f "$CONTROL/ready"; for p in /tmp/dingus-demand/*.pid; do [ -f "$p" ] || continue; kill -TERM "$(cat "$p")" 2>/dev/null || true; done; }
trap 'cleanup; exit 0' INT TERM
while :; do
 touch "$CONTROL/ready"
 active=0
 for p in /tmp/dingus-demand/*.pid; do
  [ -f "$p" ] || continue
  if kill -0 "$(cat "$p")" 2>/dev/null; then active=$((active+1)); else rm -f "$p"; fi
 done
 while IFS='|' read -r id name base slots bots difficulty port; do
  request="$CONTROL/$id.run"; pidfile="/tmp/dingus-demand/$id.pid"; wanted=''
  if [ -f "$request" ] && [ "$(( $(date +%s) - $(stat -c %Y "$request") ))" -le 45 ]; then
   wanted=$(head -n 1 "$request")
   case "$wanted" in ''|*[!A-Za-z0-9_-]*) wanted='';; esac
   if [ -n "$wanted" ] && ! grep -Fq "|$wanted|" /tmp/dingus-demand/rooms; then wanted=''; fi
  fi
  running=''; [ ! -f "/tmp/dingus-demand/$id.map" ] || running=$(cat "/tmp/dingus-demand/$id.map")
  if [ -f "$pidfile" ] && { [ -z "$wanted" ] || [ "$running" != "$wanted" ]; }; then
   kill -TERM "$(cat "$pidfile")" 2>/dev/null || true
   # timeout forwards TERM to the whole room process group.
   wait "$(cat "$pidfile")" 2>/dev/null || true
   rm -f "$pidfile"; active=$((active-1))
  fi
  if [ -n "$wanted" ] && [ ! -f "$pidfile" ] && [ "$active" -lt "$MAX" ]; then
   printf '%s|%s|%s|%s|%s|%s\n' "$id" "$name" "$wanted" "$slots" "$bots" "$difficulty" > "/tmp/dingus-demand/$id.conf"
   printf '%s\n' "$wanted" > "/tmp/dingus-demand/$id.map"
   DINGUS_ON_DEMAND=0 CS16_PORT_BASE="$port" SALAS_CONF="/tmp/dingus-demand/$id.conf" timeout --signal=TERM --kill-after=5s 24h /usr/local/bin/servidor-cs > "/tmp/dingus-demand/$id.log" 2>&1 &
   echo "$!" > "$pidfile"; active=$((active+1))
  fi
 done < /tmp/dingus-demand/rooms
 sleep 1
done
