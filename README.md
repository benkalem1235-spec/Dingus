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

## Gameplay footage and director mode

The front page uses a roughly 30-second, silent background reel behind the hero text, combining real first-person, follow-camera and aerial A-site captures from expert bot matches. The original capture ran at about 17 fps; the published reel uses motion interpolation for steadier 30 fps playback. Playback is muted, can be paused and respects reduced-motion/data-saving preferences. This is a test reel; no user-submitted test recordings are included.

Open `/play?room=dust2&director=1` for numbered camera shortcuts: 1 spectate (ends a live life), 2 next player, 3 first person, 4 chase camera, 5 slow pan, 6 stop pan, 7 record/stop, 8 free flight, 9 aerial A site, 0 aerial B site. In free flight use WASD, Space up, F down and mouse look. Director commands stay disabled until the client has joined the server. The capture room has eight YaPB bots at expert difficulty (4). The aerial presets are fixed spectator viewpoints on Dust II, below the map sky ceiling; they do not move live players. Press 8 to leave a fixed aerial view. A planting-specific clip is not yet confirmed in the reel.

The regular game toolbar also has Record clip, with 15/30/60 second options. Saved WebM clips contain video only and download to the player's device. Chat hiding is enabled by default and covers the HUD chat area in the saved frames. Use a regular desktop browser for fullscreen and pointer lock; the in-app browser may not support those reliably.
