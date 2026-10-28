# Dingus Armory

The entry page `/` or `/account.html` is name/password sign-in or registration over the gameplay video. Signed-in players automatically skip it and reach `/hub.html` for public servers, invite hosting and all maps. `/shop.html` contains crates, collection and point activity. An account is required before entering the hub or a game. The stable launcher opens the direct host so saved first-party login sessions work. Email signup remains disabled.

## Credits

- Enemy player elimination: 20. Bot elimination: 5.
- Completed round: 25. Winning team bonus: 15.
- A player must spend at least 15 seconds on T or CT that round; spectators, suicides and team kills do not earn rewards. Dead teammates can earn the completed-round reward.
- Cosmetic credits persist across rounds and visits and are separate from the match's weapon-buy dollars. No payment or cash-out feature.

## Collection

16 local palette finishes: Copper, Tidal, Violet, Aurum on AK-47, M4A1, Desert Eagle and knife. Their suggested listing values are 20, 55, 150 and 450 points respectively; sellers choose their own prices. Listing a copy puts it in escrow and clears it if equipped. Points are paid only by another player who buys it. Equip is per weapon; finish changes apply within a few seconds, on the next update while alive. Damage, geometry, animations and hitboxes are unchanged. First-person and held third-person models use the finish; dropped guns do not carry inventory ownership and use original world models.

The shop calls the existing cosmetic credit balance **points**; stored balances and owned skins are preserved.

| Crate | Points | Eligible weapons/finishes | Common / Rare / Epic / Legendary |
|---|---:|---|---|
| Field | 500 | Guns only, Copper and Tidal | 65 / 35 / 0 / 0% |
| Rifle | 600 | AK-47 and M4A1, every finish | 25 / 50 / 20 / 5% |
| Close Quarters | 600 | Desert Eagle finishes; knives only in Legendary | 25 / 50 / 20 / 5% |
| Epic | 750 | All weapons, Rare or better | 0 / 35 / 55 / 10% |
| Aurum | 1,000 | Guns and knives, Epic or Legendary | 0 / 0 / 80 / 20% |
| Legendary | 500 | Epic guns and Legendary guns/knives | 0 / 0 / 20 / 80% |

Epic retains the internal `elite` ID for compatibility. Each eligible skin is equally likely within its rarity. The catalog explicitly lists the skin pool for each crate, and the server draws only from that pool. Contents previews show every eligible skin with its exact per-item chance. All 16 existing model IDs remain unchanged, and no new private model pack is required.

Every crate yields one item; duplicates are allowed. A 4.6-second reel reveals the server-awarded item at its center marker, with a skip control and a short reduced-motion reveal. Animation never determines rewards, and opening retries reuse the same transaction ID. All prices and odds are shown before opening. Nothing can be purchased with real money.

## Adaptation

Focused port of TheDoctor0/CSGOMod's model selection/deployment and weighted draws to native Metamod-FWGS and JavaScript; see `licenses/`. This does not install the original AMXX mod or its bundled textures. Local model generation: `python3 scripts/build-skins.py /path/to/Half-Life`. Start generates missing skin assets automatically. Models and the skin ZIP remain outside public Git.

## Persistence and trust

`accounts/economy.json` stores balances, unique item instances, equipment, transaction retries, recent activity and native event cursors. It is private and mounted writable for the web host, surviving recreation. Password records remain in `accounts/accounts.json`. Back up both files together.

The native Metamod plugin captures DeathMsg/TeamInfo/HLTV/TextMsg and writes per-room event journals to `runtime/events/`. Only the engine has a writable container mount. The web host reads them and resolves the actor's real loopback UDP endpoint to the authenticated WebSocket session. Nicknames and browser-submitted scores are not trusted. At most one connected game per account. Session logout/revocation stops rewards and clears equipment on sync. No public reward-grant endpoint exists. Native equipment commands are server/RCON only.

The journals and economy cursors must be backed up together. Do not delete journals independently while preserving stale read cursors in a live process. Restart the web host after any manual recovery. Normal map and container restarts use distinct event stream IDs and do not replay rewards.

## Verification

Automated auth/economy/recorder checks cover ownership, insufficient funds, retry idempotency, sell/equip state, rarity boundaries, native journal identity resolution, guest/session revocation, restart persistence and replay prevention. Live testing additionally verifies native round rewards, crate debit, equip deployment and sell-back through the browser. Live test account earned 120 credits from native round events, bought a 100-credit Field crate, equipped a Copper knife, and sold it back for 20 credits. Native diagnostics confirmed both `models/dingus/v_knife_1.mdl` and `p_knife_1.mdl` while alive. Kill rewards are covered by journal tests; no manual human kill was performed in the UI playtest. All 48 generated model files were checked to preserve all non-palette bytes.


Crate refresh verification: catalog and economy checks cover the 500/750 point prices, normalized drop probabilities, restricted weapon pools, rarity boundaries, higher-tier resale balance, and reel alignment. A local Chromium fixture verified desktop/mobile previews, server-awarded reveals, skip and reduced motion, equip, insufficient points, and a deliberately lost response that retries without charging twice. Private weapon thumbnails were substituted in this UI fixture; final visual matching uses the host’s installed assets.


All four existing knife finishes now have Legendary rarity, independent of their preserved model variant IDs. This also reclassifies owned knife copies without changing equipment or model compatibility. Glove item types are Legendary. Optional glove and butterfly rewards are enabled only after installing the corresponding private model pack. The 500-point Legendary crate is an intentionally generous crate requested by the owner; existing Aurum and other crate prices are unchanged.


## Player marketplace

Instant game buyback is disabled. Players list an owned skin for any whole-point price from 1 to 1,000,000, with no listing fee. Listed copies leave the inventory and cannot be equipped or listed twice. The owner can cancel an unsold listing. A purchase atomically debits the buyer, credits the seller, transfers the exact item and removes the listing in the same private economy file. Self-purchases, duplicate purchases, insufficient balances and full inventories are rejected. Retry IDs cover listing, cancellation and purchase. Public listings show seller usernames, never private account IDs. Existing completed buybacks remain in history; no balances are reset.

## Optional CSGOMod cosmetic pack

See [MODPACK.md](MODPACK.md). The importer adds enhanced first-person gun models, a Butterfly knife and Crimson Web / Blue Steel gloves. Knife/glove drops remain Legendary-only. The 16 existing skin IDs and owned copies are preserved. A host without this pack offers only installed rewards. New assets stay outside public Git and require the private host rebuild/restart; a real browser match remains required to validate final appearance and animation timing.
