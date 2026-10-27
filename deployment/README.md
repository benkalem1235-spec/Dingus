# Permanent multiplayer host

GitHub stores this source. GitHub Pages cannot run the native dedicated servers or WebSocket-to-UDP relay. The ChatGPT Site is a stable launcher; it fetches `deployment/live.json` from this repository on each visit. Updating its `origin` moves the game without changing the Site URL. This is a runtime configuration link, not automatic deployment of arbitrary GitHub code to Sites.

Use a Linux x86-64 server with Docker Compose, approximately 4–6 GB available memory, and a DNS hostname pointing at it. No hosting account or billable server has been created by this project.

1. Clone this repository onto the server.
2. Privately copy your owned `Half-Life` installation (both `valve/` and `cstrike/`) to the server. Do not upload it to the public repository.
3. Install Python 3, Pillow, Git, Docker and the Compose plugin. Run `python3 scripts/prepare.py /srv/owned-games/Half-Life` from the repository root.
4. Copy `deployment/.env.example` to `deployment/.env` and set the installation path, real domain and matching HTTPS URL.
5. Allow inbound TCP 80/443. Run `docker compose --env-file deployment/.env -f deployment/compose.yaml up -d --build`. Caddy obtains HTTPS certificates and proxies WebSocket connections. Native game UDP ports stay inside the shared container network.
6. Check `https://YOUR-DOMAIN/healthz`, then test joining a room in a browser.
7. Change `deployment/live.json` to `{"origin":"https://YOUR-DOMAIN"}` and commit to `main`. The existing ChatGPT Site then loads this host.

For updates, pull source and run the Compose command again. Image rebuilds are deliberately manual. Back up your private game data and `.env`. Build scripts verify upstream native downloads using checksums; if a moving upstream `continuous` release changes, the build fails until the new artifact is reviewed and its digest updated.

Current live origin is a temporary Cloudflare tunnel to the owner's PC. It stops when that PC or tunnel stops. A recreated tunnel requires updating `live.json`.


## Transfer this running setup

On the PC: `python3 scripts/make-transfer.py /private/path/dingus-private-server-transfer.tar.gz`. Copy the archive directly to a Linux x86-64 VM using SSH/SCP. It includes private accounts, inventory and host credentials; never commit it.

On the host, clone Dingus, install Docker Compose and Python 3.12+, point a hostname at the VM, allow TCP 80/443, then run `deployment/deploy.sh /path/to/dingus-private-server-transfer.tar.gz game.example.com`. The script restores data, creates private environment settings and launches the containers. Verify `/healthz`, sign in, join a map and check inventory before updating `deployment/live.json`.

The current build is x86-64 only. Oracle A1 free ARM machines need a separate port or emulation performance test. See [FREE-HOSTING.md](../FREE-HOSTING.md). No always-on external host has been provisioned yet.
