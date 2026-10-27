# CSGOMod browser adaptation

Upstream: https://github.com/TheDoctor0/CSGOMod , author Dawid Janik / O'Zone, MIT.

The upstream `csgo_core.sma` deployment flow (select owned model; replace view model on weapon deploy; restore original when unequipped) and weighted skin draw approach were adapted to `server/events/economy.hpp` and `web/economy.mjs`. This is a focused native/JavaScript port of those behaviors, not the full AMXX mod. AMXX, Unprecacher, SQL and GoldSrc private-data offsets are not used. The native event journal, browser account integration, crate UI and persistent credit accounting are new code.

Models are generated locally from the owner's installed models. The generator changes texture palettes without changing geometry, animation, hitboxes, damage or timing. Model derivatives are excluded from the public source, as are the original game files. No third-party skin pack or CS:GO texture pack was imported.
