# Half-Life map adaptations

Enabled alongside the eight CS maps, in both public and invite rooms:

- **Crossfire**: the full original multiplayer layout. No added collision borders. All 18 original spawns become 9 CT / 9 T spawns. Seven Half-Life shotgun/SMG pickup piles.
- **Stalkyard**: the full original multiplayer layout. No added collision borders. All 21 original spawns become 10 CT / 11 T spawns. Seven pickup piles.
- **Office Complex Sector**: a bounded part of the `c1a2` campaign map. Arena limits: X 1344–3008, Y -1152–-416, Z -608–-400 (GoldSrc units). Six collision-tested spawns per team, split across a connected floor sector. Four pickup piles.

All three retain CS characters and team-elimination rules. Campaign transitions, original enemies and scripted progression are removed. Office doors open on touch. Crossfire's nuke activation scripts are removed. These rooms have no bots configured; invite another player or use the headcrab event.

Walk over a pickup to collect it. Press **G** to drop your current primary first. The floor pickup uses the owned Half-Life shotgun or SMG model. Collection grants CS's M3 or MP5, with CS mechanics and ammunition. Half-Life's original alternate firing modes and first-person weapon models are not implemented. Each pile supplies two players and replenishes at the next round.

The Office Complex crop is a collision boundary, not a visible new wall. Surrounding source geometry may still be visible. The converter prepends crop nodes to the BSP trees so GoldSrc's headnode range checks remain valid. Multiplayer maps preserve all non-entity BSP lumps byte-for-byte.

The setup script generates these BSPs and preview images from your owned installation. They are deliberately excluded from GitHub. Original Steam files are never modified.

Validation: all three public servers loaded; server traces reported zero blocked team spawns; all three maps started in invite rooms. In-browser Office Complex playtest confirmed the CS Urban player model, movement, MP5 pickup, dropping it, and M3 pickup. Native and browser builds passed. The cloud deployment recipe has not been deployed to a paid cloud server.
