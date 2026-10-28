# On-demand game rooms

The website and map catalog stay available while native game rooms sleep. Opening a room or creating an invite starts it. Browsing the catalog and reading status never start a room.

- At most three native rooms, including rooms still starting.
- At most eight human game connections total in this mode; bot population is separate.
- All eleven maps remain selectable.
- Empty rooms stop after about two minutes; a new join gets up to ten minutes to download game data and connect.
- Bots do not keep an empty room alive.
- Engine leases expire if the web coordinator disappears; shutdown clears them immediately.
- A cold room takes a few seconds to start. A free host's own wake-up delay can add to this.

Local: `DINGUS_ON_DEMAND=1 ./start.sh`.
Docker Compose: add `-f deployment/compose.on-demand.yaml` to the base Compose command. Create `runtime/control`, writable by the web and engine users. Also add `compose.arm64.yaml` on an ARM64 machine.

Validation: three lifecycle tests plus the seven existing focused checks passed. Isolated native testing confirmed zero rooms on browsing, explicit startup of Dust II/Office/Stalkyard, refusal of a fourth room, and shutdown of all game processes when leases were released.

A combined local container was also exercised with 512 MiB and a 0.1 CPU quota. Three rooms fit in memory (~459 MB), but initial status queries became intermittent under that CPU limit. The coordinator now retains recent successful status briefly and uses longer queries in on-demand mode. Eight-player gameplay under this limit has not been tested; this is not a claim that three loaded matches will run smoothly on free Render.

## Free-host deployment still needed

Render's free disk is disposable. Production startup in `render-entrypoint.sh` is deliberately blocked until private durable account/inventory storage is connected. The disposable test flag is for isolated tests only. Game data must also be provided privately; never put the transfer archive or accounts in the public Git repository.

`Dockerfile.render` is initial single-container packaging, built from the repository root after preparing the browser runtime. It is not a completed Render deployment. The current account format and owned assets have not been migrated to any cloud provider.

The ARM64 build already passed separately (see ARM64-STATUS.md). Oracle can use persistent VM disks and the normal two-container Compose setup, avoiding Render's disposable-storage constraint. Account verification must use a valid payment method accepted by Oracle; generated card numbers are not a deployment option.
