#!/usr/bin/env bash
set -euo pipefail
for container in codex-cs16-public codex-cs16-engine codex-cs16-web; do
 if podman container exists "$container"; then podman stop -t 5 "$container"; fi
done
