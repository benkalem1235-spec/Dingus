# ARM64 build completed

Built on GitHub's native ARM64 runner on 28 October 2026.

Build and logs: https://github.com/benkalem1235-spec/Dingus/actions/runs/40640956070
Download: https://github.com/benkalem1235-spec/Dingus/actions/runs/40640956070/artifacts/12796115983

- Native CS game DLL and YaPB bots compiled.
- Native Metamod and Dingus events/skins plugin compiled.
- Official ARM64 dedicated engine packaged; SHA-256 verified.
- ARM64 executable/library architecture and missing-library checks passed.
- Native web container built and node-datachannel loaded successfully.
- All seven auth, economy, bot-policy and mouse tests passed.
- Two Docker images exported in the `dingus-arm64` artifact (about 186 MB).

This is a successful build and automated check, not a live-match validation. Joining an ARM host with the real maps, bot navigation and native rewards still needs testing. No external game server has been provisioned. Oracle was ruled out by the owner; hosting research now targets at most eight human players and CHF 5 per month.

The GitHub artifact expires 31 October 2026. The source/build workflow stays in the repository and can reproduce it. Game assets and private account data are not in this artifact.
