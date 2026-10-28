# Dingus project status

Game: https://dingus-counter-strike.benkalem1235.chatgpt.site/
Source: https://github.com/benkalem1235-spec/Dingus

## Available
- Video landing page and separate name/password sign-in and registration. Email registration disabled.
- Server browser, invite rooms, 11 maps, CS characters and Half-Life arenas/events/pickups.
- Earned credits, crates, skin collection, equip and sell-back.
- Neighboring Servers and Crates tabs, improved crate artwork.
- Bots populated on all maps, map-specific counts with slow variation, bot chat/radio disabled, fill policy configured to make room for humans.
- Private server transfer archive and restore tools; accounts and owned game assets excluded from public source.

## Current work and checks
- Explicit mouse capture implemented; automated behavior check passed. Physical aiming still needs hands-on browser testing.
- Bot fill/slot replacement configured; a human joining a full bot room still needs a live check.
- Bot, menu, mouse and private migration source published to GitHub.
- Native ARM64 game DLL, bots, Metamod, events/skins plugin and web transport built successfully on GitHub run 40640956070; all seven automated checks passed. Actual ARM match validation remains.

## Added: adaptive bots
- Measure recent actual-human performance separately for each team, including kills/deaths and round results.
- Adjust bot strength to balance against the opposing team's human performance, also considering human skill on the bot's own team.
- Use several rounds of evidence, gradual changes between rounds, and minimum/maximum difficulty limits.
- Handle mixed teams, uneven numbers and no-human rooms without feedback loops from bot-only matches.
- Keep population/slot replacement separate from skill adjustment.
- Status: planned; not implemented yet.

## Hosting target
- Eight actual human players maximum; bot counts can vary separately.
- Budget up to CHF 5/month. Oracle ruled out; no card verification for a free cloud trial.
- Prefer a small fixed-price Linux VPS. AlphaVPS C4G is shortlisted at about CHF 4/month including estimated Swiss VAT and conversion; provider checkout must confirm final cost.
- ChatGPT Sites continues to host the launcher. Its Worker runtime cannot run the current native CS processes; no game rewrite has been selected.
- No external game server has been provisioned. Public matches still run on this PC.
- Accounts, credits, inventories, sessions and owned game assets stay private and move directly to the host over SSH.
- ARM artifact and validation details: ARM64-BUILD.md. The artifact expires 31 October 2026; source/build workflow remains in GitHub.
