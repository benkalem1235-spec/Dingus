# ARM64 migration investigation

Status: experimental investigation; not ready to deploy. The live x86 server is unchanged by these experiments.

- Xash3D FWGS publishes an official Linux ARM64 dedicated server (`xashds-linux-arm64.tar.gz`).
- The CS16 client project builds ReGameDLL and YaPB from source. Its release assets inspected here include Linux i386/x86_64, but no Linux ARM64 game bundle.
- YaPB source has an explicit aarch64 target and 64-bit build support.
- Metamod-FWGS and the Dingus native events/skins module also need ARM64 builds. Metamod currently supplies an x86-specific `-fcf-protection=none` flag that must be gated before ARM compilation.
- The current room entrypoint uses the i386 loader `/lib/ld-linux.so.2`; it must select the native loader, and library names/engine executable must be checked before using an ARM image.
- Node's WebRTC transport dependency must also install and run on ARM64.

Dependency retrieval was attempted locally, but source and compiler-package downloads stalled/timed out before compilation. No ARM64 runtime success is claimed. The deployment script deliberately continues to require x86_64.

Next: obtain the pinned sources/toolchain, build all native libraries, launch one isolated map under ARM64 emulation, verify bots + native events, and test a browser joining before making a cloud image.

Sources inspected:
- https://github.com/FWGS/xash3d-fwgs/releases/tag/continuous
- https://github.com/FWGS/cs16-client/blob/main/CMakeLists.txt
- https://github.com/yapb/yapb/blob/7985904584a0755b216e17cc5de8c5fd28953895/CMakeLists.txt
- https://github.com/FWGS/metamod-fwgs

Pinned CS source inspected: a238ef131803ed7592c4ba701499027c862889ee
ReGameDLL submodule: 52d2ab885aff5974d124382a989e01c22da5f920
YaPB submodule: 7985904584a0755b216e17cc5de8c5fd28953895
