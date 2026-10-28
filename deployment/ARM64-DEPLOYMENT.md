# Dingus ARM64 deployment

This build targets a real Linux ARM64 machine, including Oracle Ampere A1. It includes the current on-demand room manager: up to three game rooms, eight human connections total, all maps available, idle rooms stopped.

## Host

- Ubuntu 24.04 ARM64; suggested starting allocation: 2 OCPUs, 4 GB RAM, 50 GB boot disk.
- Docker with the Compose plugin, Python 3.12+, Git. Python Pillow is only needed if regenerating skins.
- Public IP; inbound TCP 22 for SSH and TCP 80/443 for HTTPS.
- A DNS hostname pointing to this VM for Caddy's HTTPS certificate.
- Native game UDP ports remain internal.

Oracle setup must use legitimate identity/card verification. Keep the tenancy on Free Tier; do not upgrade to Pay As You Go. Resource quotas can limit provisioning; budget alerts alone are not a spending cutoff. No Oracle resource has been created or configured by this preparation.

## Files

1. Clone https://github.com/benkalem1235-spec/Dingus onto the VM.
2. Download and unzip the latest `dingus-arm64` GitHub Actions artifact. It contains `dingus-arm64-images.tar.gz` and `SHA256SUMS`.
3. Copy the private transfer archive directly from this PC to the VM over SSH. It includes owned game assets, private accounts, inventory and server credentials. Never upload it to a public repository or artifact.
4. Verify the image file: `sha256sum -c SHA256SUMS` in its extracted directory.
5. From the Dingus checkout, run:

```bash
bash deployment/deploy.sh /private/path/dingus-private-server-transfer.tar.gz game.your-domain.example /private/path/dingus-arm64-images.tar.gz
```

The script detects ARM64, loads the prebuilt images, restores private data, writes a private environment file, and combines the base, ARM64 and on-demand Compose configurations. It runs Caddy for HTTPS. It does not switch the permanent launcher automatically.

## Verify before switching

- `/healthz` reports ready with zero native rooms running.
- Sign in and confirm credits/inventory survived.
- Open a room and test movement, shooting, bots, skin equipment and native rewards.
- Invite another browser; confirm room sharing and mouse capture.
- Confirm an empty room stops and a fourth active room is rejected.
- Monitor memory and CPU under an actual match.

Then update `deployment/live.json` in GitHub to the new HTTPS origin. The permanent public game URL stays https://dingus-counter-strike.benkalem1235.chatgpt.site/ . Keep the PC running until the migrated server passes these checks.

## Current verification boundary

Native ARM64 compilation, library checks, WebRTC module loading and automated application checks passed on GitHub. On-demand room behavior was exercised locally with native x86 engines, including a 512 MiB / 0.1 CPU test. An actual ARM64 match with owned maps still needs testing on the new VM.
