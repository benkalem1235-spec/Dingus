# ARM64 build completed

Built on GitHub's native ARM64 runner on 28 October 2026.

Build and logs: https://github.com/benkalem1235-spec/Dingus/actions/runs/40647925342
Download: https://github.com/benkalem1235-spec/Dingus/actions/runs/40647925342/artifacts/12797828581

- Native CS game DLL and YaPB bots compiled.
- Native Metamod and Dingus events/skins plugin compiled.
- Official ARM64 dedicated engine packaged; SHA-256 verified.
- ARM64 executable/library architecture and missing-library checks passed.
- Native web container built and node-datachannel loaded successfully.
- All ten auth, economy, bot-policy, mouse and on-demand room tests passed.
- Two Docker images exported in the `dingus-arm64` artifact (about 186 MB).

Real ARM64 engine testing under QEMU loaded Dust II with eight bots, Office with six, and Crossfire with eight concurrently. Both YaPB and Dingus events plugins were running. The full ARM64 web image also passed an authenticated room-start test. This caught and fixed a YaPB installation-path crash missed by build-only checks. A complete human match on a physical ARM host remains untested. No external game server has been provisioned. Oracle is unavailable because the owner’s card was rejected; free alternatives are being evaluated.

A checksum-verified copy is also saved locally in outputs/arm64-build. The GitHub artifact expires 31 October 2026. The source/build workflow stays in the repository and can reproduce it. Game assets and private account data are not in this artifact.
