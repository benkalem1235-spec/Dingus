# Free hosting for Dingus

Checked 27 October 2026. No cloud account, subscription or external server has been created.

The current public game still runs on the owner's PC. GitHub contains the source and deployment setup. A private migration archive carries the owned game assets, accounts and inventories directly to a host; it must not go in the public repository.

## Closest option: Oracle Always Free

Oracle's [current Always Free resource documentation](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm) lists Ampere A1 allowances equivalent to **2 ARM OCPUs and 12 GB RAM** for Always Free tenancies, plus up to two small AMD micro instances. Capacity may be unavailable, and idle free instances can be reclaimed. Its [Free Tier guide](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm) explains that paid resources/trial allocations are different from Always Free resources. Other Oracle pricing pages show different allowances for paid tenancies; use the limits shown for the actual free account.

The ARM VM has useful memory for this game, but the present native engine/plugins are built for Linux x86. The deployment script intentionally refuses ARM: an ARM port or an emulation proof of concept must be built and tested first. A free AMD micro has only 1 GB and a small shared CPU allocation; the full set of simultaneous maps and bots is not a realistic fit. A reduced one-room configuration would need its own performance test.

## Why the usual free website hosts do not fit

[Render Free](https://render.com/docs/free) spins down after 15 idle minutes and loses local filesystem changes on restart/redeploy. It cannot attach a free persistent disk. That would not preserve the current file-based accounts and inventory storage.

[Google Compute Engine's free offer](https://cloud.google.com/products/compute) includes an e2-micro VM, 30 GB of standard disk and only 1 GB outbound data per month. One fresh game download is about 281 MB, so the bandwidth allowance is unsuitable for many new players, even before multiplayer traffic. The full server layout is also too heavy for this tiny VM.

GitHub Pages is static hosting, and a tunnel only forwards traffic to another running computer; neither replaces the game engine host.

## Prepared handoff

- Public repository: https://github.com/benkalem1235-spec/Dingus
- `deployment/deploy.sh`: x86 Linux Docker Compose deployment with HTTPS.
- `scripts/make-transfer.py`: creates a private migration pack, including player records.
- `scripts/restore-transfer.py`: restores assets and private records onto the new host.
- `deployment/live.json`: moves the permanent ChatGPT Site launcher to a verified new host.

An actual move needs a host account and a reachable VM. For a strict zero-cost plan, Oracle A1 is the strongest candidate to investigate next, with the architecture work above. There is no verified free, drop-in host for this full build yet.
