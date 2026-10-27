# Dingus Counter-Strike

**Play without login:** https://dingus-counter-strike.benkalem1235.chatgpt.site/

Browser CS 1.6 with public rooms, invite links, eight stock maps plus three Half-Life maps, a visual weapon shop, and a server-side headcrab event plugin. Invite rooms offer every configured public map. Three invite rooms can be reserved concurrently. The native CS engine enforces purchases, teams and match rules.

The ChatGPT Site reads [`deployment/live.json`](deployment/live.json) from this repository to find the active game host. Its source is in [`site/`](site/). The current host runs on the owner's PC through a temporary HTTPS tunnel; the PC must stay online. Moving to a cloud server requires a server/hosting account. See [permanent deployment instructions](deployment/README.md).

## Run from this repository

Install Linux x86-64 Podman, Python 3, Pillow and Git. Clone this repository, then:

```sh
python3 scripts/prepare.py '/path/to/Steam/steamapps/common/Half-Life'
./start.sh
# Optional public HTTPS tunnel:
./start-online.sh
```

Open http://127.0.0.1:27016. Share the tunnel URL for remote play. Set the tunnel origin in `deployment/live.json` to keep the stable Site connected after a tunnel change. Stop using `./stop.sh`.

`prepare.py` obtains the pinned browser engine build from its public upstream, packages game data from your local owned installation, generates a private RCON secret, converts the three owned Half-Life maps, and creates map/weapon images. The web Docker build checks JavaScript syntax. Native server binaries are downloaded from official projects with checksum verification.

Valve game content, Workshop maps, converted BSPs/textures, generated archives, personal installation paths and server secrets are excluded from Git. This repository includes the application code and conversion tools, not redistributable copies of those assets. Crossfire and Stalkyard use their complete original geometry with no added borders. Office Complex is a bounded sector of the c1a2 campaign map, with collision-tested six-per-team spawns and campaign exits/scripts removed. Half-Life shotgun and SMG world models mark free pickup piles; collecting them grants the native CS M3 or MP5 with ammunition. Drop an existing primary with G before collecting another. Original HL firing modes are not implemented. These maps have no bots configured; invite another player or trigger a headcrab wave. Minecraft adaptations are still being tested and are not enabled in the room list.

See [Half-Life map details and verification](HALF-LIFE.md).

## Controls and events

WASD move, mouse aim, click shoot, Space jump, C crouch, E use, Tab scores. B opens the visual shop; N opens the original menu. Purchases still require the correct team, funds and a buy zone. Connected players can vote for a headcrab wave using the room toolbar; majority vote, 90-second cooldown, 60-second creature lifetime. This is a small custom chase/jump implementation, not Half-Life's complete original NPC AI.

## Project structure

- `web/`: browser lobby, shop, guest room API, WebSocket game transport.
- `server/`: Xash/CS dedicated-server image, YaPB and Metamod event plugin.
- `config/`: room definitions and public configuration templates.
- `scripts/`: private asset preparation and experimental map converters.
- `site/`: published stable ChatGPT launcher source.
- `deployment/`: current host pointer and Docker Compose + HTTPS setup.

See [third-party notices](THIRD-PARTY.md) and [LICENSE](LICENSE). Do not publish game or Workshop assets without the necessary rights.

## Recording

The front page uses a roughly 26-second edit of the owner's Dust II recording, including first-person and aerial views. Camera changes and the loop seam use short dissolves; the existing chat mask and spectator HUD are cropped out. Recording tools remain available in game; C is the default crouch key.

## Accounts

Optional username/password signup and sign-in: `/account.html`. Email signup remains disabled pending mail setup. See [ACCOUNTS.md](ACCOUNTS.md) for persistence and mail configuration. Guest access remains available.


## Armory and game hub

Play from the video landing page to enter the game hub. Host an invite room, choose any supported map, or sign in to earn cosmetic credits from kills and rounds. Crates, equip selections and sell-back are available in the Armory. Read [ECONOMY.md](ECONOMY.md) for rewards, odds, local model generation and persistence. For Docker Compose, create `accounts` owned by HOST_UID/HOST_GID (default 1000), and `runtime/events` writable by engine uid 10001 before launch (the local start script handles both). Generate the local skin pack before launch.


## Account entry flow

The entry page contains only name/password sign-in or registration over the gameplay video. Email signup is disabled. Signed-in players skip directly to the compact hub; maps, hosting and crates are shown only after sign-in. The stable launcher opens the game host directly so saved first-party login sessions are recognized.
