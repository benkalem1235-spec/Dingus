# Hosting shortlist — 28 October 2026

Target: eight humans total, at most three simultaneous on-demand rooms; free preferred, CHF 5/month maximum fallback. Oracle signup is blocked by card verification. The PC is the active host for now.

## New free candidates

| Provider | Advertised offer | Catch / verification still needed |
|---|---|---|
| [Openworld](https://openworld.eu.org/faq) | No card, root SSH, Docker and game servers permitted, NAT IPv4 plus IPv6 | Renew every seven days. CPU/RAM/disk and live capacity are not published on the public pages checked; inspect the dashboard before choosing. Community project, keep private backups. |
| [Switched.cloud](https://switched.cloud/) | Docker-capable free containers; advertised shared account ceiling of 4 CPU cores, 12 GB RAM, 50 GB disk; five TCP/UDP ports | Starts with three runtime days. Earn more by completing ad links; each token adds a day. Stopped VPSes also consume runtime; deletion three days after runtime expires. Capacity varies. Not tested. |
| [Vyce.cloud](https://vyce.cloud/) | No card; 1 core, 2 GB RAM, 6 GB disk, SSH and forwarded ports | Daily renewal; GitHub account must be 30 days old; first-come free slots. Small disk and CPU need a real deployment check. Deleted after three stopped days. Not tested. |

These are provider claims, not verified hosting or performance. Start with a disposable test before copying real account records. Do not assume eight-player performance from advertised RAM alone.

## Paid fallback

[AlphaVPS C4G](https://alphavps.com/cheap-vps): 2 vCPU, 4 GB RAM, 40 GB NVMe, 5 TB traffic, €3.99 monthly before applicable tax. PayPal is accepted. Select monthly billing; the lower headline price is annual prepayment. CHF total depends on tax and conversion at checkout. No order has been placed.

## Not selected

- [HidenCloud](https://www.hidencloud.com/service/free-server) now advertises ARM64, 2 cores, 3 GB and 15 GB with weekly renewal. Its public docs/terms disagree about renewal and six-hour shutdown; custom native server support is unconfirmed.
- [Blitz.cloud](https://blitz.cloud/pricing/) offers free Docker hosting with 512 MB and 10 GB but shared resources/storage behavior and native-game suitability remain untested. It is a lead, not a recommendation for three matches.
- GratisVPS public/signup resource and trial descriptions were inconsistent in earlier checking; no validated permanent free service.
- Tunnels and free server-management panels do not supply the actual computer.

## Prepared deployment

The repository supports x86-64 builds and prebuilt ARM64 images. `deployment/deploy.sh` supports a domain with Caddy or `--tunnel` for shared-IP/NAT hosts with no published ports. Both retain private accounts, run rooms on demand, and cap three rooms/eight humans. No external host is connected; provider allocation, Docker support, CPU architecture, storage and real gameplay must be checked there.
