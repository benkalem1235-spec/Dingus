# Skin and crate mod research

Checked 27 October 2026. Research only: no mod installed or purchased.

| Candidate | What it provides | Requirements and fit |
| --- | --- | --- |
| [CSGO Remake](https://github.com/ShadowsAdi/CSGORemake) | Open-source GPL-3.0; skin collections, case opening, crafting, trading, StatTrak and MySQL storage. | Explicitly requires AMXX 1.9.0-5271+, ReHLDS 3.13.0.788+, ReGameDLL 5.26.0.668+ and ReAPI 5.24.0.300+. Strongest ready-made case system found, but not a supported drop-in for the current Xash3D host. |
| [TheDoctor0 CSGOMod](https://github.com/TheDoctor0/CSGOMod) | MIT-licensed code; configurable weapon models and textures, skins inventory/market, random skin draws and StatTrak. | AMXX 1.8.3/1.9/1.10; installation adds Unprecacher and database configuration. The [core source](https://raw.githubusercontent.com/TheDoctor0/CSGOMod/master/cstrike/addons/amxmodx/scripting/csgo_core.sma) imports fakemeta, hamsandwich, cstrike, engine and sqlx rather than ReAPI. No verified browser/Xash compatibility; a random draw is not the same as a complete crate/key system. Better source to investigate for a port. |
| [Weapons Skins Ultimate](https://tornadoamxxhub.com/skinsultimate) | Paid skin selection and custom models, including dropped weapons. | Listed at €4.99 per server, requires AMXX 1.9+, ReHLDS 3.11+, ReAPI and compatible ReGameDLL. No complete crate system advertised. A separate license per server would matter for this multi-room host. |

## Recommendation for Dingus

Keep the existing engine and implement a small cosmetic-only inventory and earned-crate feature around the website accounts, with a native model-selection bridge. This is an engineering recommendation, not a tested implementation. Existing plugins are useful references but none of these has been verified in the current WASM client/native Xash3D pairing.

A proof of concept should first load one alternate weapon model in both the browser and native server, verify first-person, third-person, dropped weapon and spectator views, and survive a map change. Account ownership must be enforced by the host and a short-lived authenticated game connection, rather than trusting the player's nickname. The current accounts only pre-fill nicknames.

After that works, add server-owned inventory, equip selections and free crates earned from play. Keep damage and weapon balance unchanged. Check model/texture distribution permissions separately from the plugin's code license. Browser asset download size and engine precache limits must be measured before adding a large collection.

[Xash3D's AMXX support request](https://github.com/FWGS/xash3d-fwgs/issues/2243) is closed as not planned; this does not establish that every individual AMXX module is impossible to port, but it is not a compatibility guarantee. [ReAPI](https://github.com/rehlds/ReAPI) targets ReHLDS/ReGameDLL APIs. Switching the host engine would be a separate project and would require validating the browser network protocol, room isolation, headcrab events and current maps again.
