# PC hosting

Permanent launcher: https://dingus-counter-strike.benkalem1235.chatgpt.site/
Local game: http://127.0.0.1:27016/

The game and Cloudflare tunnel are running in local containers. Keep this PC awake and connected for friends to play. Accounts and inventory remain in the private accounts folder across restarts.

From the cs16-web directory:
- `./start-online.sh` starts the local game if needed and opens its public tunnel.
- `./stop-online.sh` closes public access; `./stop.sh` stops the game.

A quick tunnel gets a new address after restarting. Update `deployment/live.json` in GitHub to that address for the permanent launcher to follow it. The startup script prints the current address and saves it in `runtime/public-url.txt`.

At most three rooms run together, with eight actual human connections total. A room starts when joined and stops when empty.
