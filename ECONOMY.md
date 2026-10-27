# Dingus Armory

The landing page `/` is the video introduction. Play opens `/hub.html` for accounts, public servers, invite hosting and all maps. `/shop.html` contains crates, collection and credit activity. Guest play remains available; persistent rewards require signing in **before** joining a game. Account/shop links leave the launcher iframe so browser third-party cookie restrictions do not block sign-in.

## Credits

- Enemy player elimination: 20. Bot elimination: 5.
- Completed round: 25. Winning team bonus: 15.
- A player must spend at least 15 seconds on T or CT that round; spectators, suicides and team kills do not earn rewards. Dead teammates can earn the completed-round reward.
- Cosmetic credits persist across rounds and visits and are separate from the match's weapon-buy dollars. No payment or cash-out feature.

## Collection

16 local palette finishes: Copper, Tidal, Violet, Aurum on AK-47, M4A1, Desert Eagle and knife. Their sell-back values are 20, 55, 150 and 450 credits respectively. Selling one copy removes that exact item and clears it if equipped. Equip is per weapon; finish changes apply within a few seconds, on the next update while alive. Damage, geometry, animations and hitboxes are unchanged. First-person and held third-person models use the finish; dropped guns do not carry inventory ownership and use original world models.

Field crate costs 100 credits; rarity odds 70/25/4/1%. Elite costs 250; odds 0/75/22/3%. Each of the four weapons is equally likely within a rarity. Every crate yields one item; duplicates are allowed. All prices and odds are shown before opening. Nothing can be purchased with real money.

## Adaptation

Focused port of TheDoctor0/CSGOMod's model selection/deployment and weighted draws to native Metamod-FWGS and JavaScript; see `licenses/`. This does not install the original AMXX mod or its bundled textures. Local model generation: `python3 scripts/build-skins.py /path/to/Half-Life`. Start generates missing skin assets automatically. Models and the skin ZIP remain outside public Git.

## Persistence and trust

`accounts/economy.json` stores balances, unique item instances, equipment, transaction retries, recent activity and native event cursors. It is private and mounted writable for the web host, surviving recreation. Password records remain in `accounts/accounts.json`. Back up both files together.

The native Metamod plugin captures DeathMsg/TeamInfo/HLTV/TextMsg and writes per-room event journals to `runtime/events/`. Only the engine has a writable container mount. The web host reads them and resolves the actor's real loopback UDP endpoint to the authenticated WebSocket session. Nicknames and browser-submitted scores are not trusted. At most one connected game per account. Session logout/revocation stops rewards and clears equipment on sync. No public reward-grant endpoint exists. Native equipment commands are server/RCON only.

The journals and economy cursors must be backed up together. Do not delete journals independently while preserving stale read cursors in a live process. Restart the web host after any manual recovery. Normal map and container restarts use distinct event stream IDs and do not replay rewards.

## Verification

Automated auth/economy/recorder checks cover ownership, insufficient funds, retry idempotency, sell/equip state, rarity boundaries, native journal identity resolution, guest/session revocation, restart persistence and replay prevention. Live testing additionally verifies native round rewards, crate debit, equip deployment and sell-back through the browser. Live test account earned 120 credits from native round events, bought a 100-credit Field crate, equipped a Copper knife, and sold it back for 20 credits. Native diagnostics confirmed both `models/dingus/v_knife_1.mdl` and `p_knife_1.mdl` while alive. Kill rewards are covered by journal tests; no manual human kill was performed in the UI playtest. All 48 generated model files were checked to preserve all non-palette bytes.
