# Armory and game hub verification

- Auth/economy/recorder suite: six passing checks covering authentication, persistence, ownership, crate odds, reward replay and retry idempotency.
- A disposable account earned credits from native round events, opened a 100-credit crate, equipped a Copper knife, and sold it for 20 credits.
- Native diagnostics confirmed `v_knife_1.mdl` and `p_knife_1.mdl` while alive.
- Kill credits are covered by native-journal tests; no manual human kill was performed in the UI playtest.
- All 48 generated model files preserve every non-palette byte of their installed source models.
- Landing, game hub and shop serve successfully over the restored public HTTPS tunnel.
- The permanent Sites launcher was republished to the restored host. Guest access and optional accounts remain; email signup is disabled.
- The disposable account and its inventory are removed after QA.
