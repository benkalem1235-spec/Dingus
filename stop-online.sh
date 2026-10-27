#!/usr/bin/env bash
set -euo pipefail
if podman container exists codex-cs16-public; then podman stop -t 5 codex-cs16-public; fi
