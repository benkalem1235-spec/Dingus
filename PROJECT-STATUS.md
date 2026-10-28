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
- Budget up to CHF 5/month. Oracle signup failed because of the card; searching no-card free VPS alternatives again.
- Fixed-price fallback: AlphaVPS C4G was shortlisted at about CHF 4/month including estimated Swiss VAT and conversion; provider checkout must confirm final cost.
- ChatGPT Sites continues to host the launcher. Its Worker runtime cannot run the current native CS processes; no game rewrite has been selected.
- No external game server has been provisioned. Public matches still run on this PC.
- Accounts, credits, inventories, sessions and owned game assets stay private and move directly to the host over SSH.
- ARM artifact and validation details: ARM64-BUILD.md. The artifact expires 31 October 2026; source/build workflow remains in GitHub.

## On-demand rooms implemented
- Three-room cap, explicit join/host startup, idle stop, eight-human cap and all-map catalog implemented. Native startup/shutdown integration checks and ten focused tests passed.
- Free Render CPU-limit testing exposed intermittent status queries with three rooms; query resilience improved. Real eight-player performance remains untested.
- Oracle is unavailable because of the card. No provider VM or SSH access exists yet.
- See cs16-web/deployment/ON-DEMAND.md for cloud storage/deployment limitations.

## ARM deployment refresh — 28 October 2026
- Recovered and checksum-verified the native ARM64 images. Real map startup testing found a bot-library path crash missed by build checks.
- Fixed YaPB installation to its expected addons/yapb/bin path. Under ARM64 emulation, Dust II (8 bots), Office (6 bots), and Crossfire (8 bots) ran concurrently and answered real server queries.
- ARM-aware deployment script can load prebuilt images and restore private accounts/assets directly from the private transfer.
- Corrected images passed GitHub run 40647925342; download saved locally and checksums verified. See ARM64-BUILD.md. Full human gameplay and Oracle deployment remain untested.
