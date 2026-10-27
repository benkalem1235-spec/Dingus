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
- Mouse capture: explicit Lock mouse button and gameplay click-to-capture implemented; browser interaction still needs a hands-on check.
- Bot slot replacement: native configuration checked; human joining a full room still needs a live check.
- Latest bot, menu, mouse and migration changes published to GitHub (commit 07c890d). Seven focused automated checks passed; public health check passed.
- ARM64 investigation: official engine exists; the game DLL, bots and plugins still need a native rebuild. Dependency downloads stalled before compilation; no ARM deployment validated. See deployment/ARM64-STATUS.md in the source.

## Added: adaptive bots
- Measure recent actual-human performance separately for each team, including kills/deaths and round results.
- Adjust bot strength to balance against the opposing team's human performance, also considering human skill on the bot's own team.
- Use several rounds of evidence, gradual changes between rounds, and minimum/maximum difficulty limits.
- Handle mixed teams, uneven numbers and no-human rooms without feedback loops from bot-only matches.
- Keep population/slot replacement separate from skill adjustment.
- Status: planned; not implemented yet.

## Hosting remaining
- Free hosting only. A compatible cloud VM/account is still needed; the public game currently runs on the PC.
- Never store passwords, sessions, credits or inventories in the public GitHub repository.
- ARM64 may fit Oracle's free compute offering, but the game DLL, bots and Metamod must work together before migration.
