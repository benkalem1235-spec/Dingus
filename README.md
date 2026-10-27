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

WASD move, mouse aim, click shoot, Space jump, Ctrl crouch, E use, Tab scores. B opens the visual shop; N opens the original menu. Purchases still require the correct team, funds and a buy zone. Connected players can vote for a headcrab wave using the room toolbar; majority vote, 90-second cooldown, 60-second creature lifetime. This is a small custom chase/jump implementation, not Half-Life's complete original NPC AI.

## Project structure

- `web/`: browser lobby, shop, guest room API, WebSocket game transport.
- `server/`: Xash/CS dedicated-server image, YaPB and Metamod event plugin.
- `config/`: room definitions and public configuration templates.
- `scripts/`: private asset preparation and experimental map converters.
- `site/`: published stable ChatGPT launcher source.
- `deployment/`: current host pointer and Docker Compose + HTTPS setup.

See [third-party notices](THIRD-PARTY.md) and [LICENSE](LICENSE). Do not publish game or Workshop assets without the necessary rights.
