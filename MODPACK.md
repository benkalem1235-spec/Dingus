# Optional CSGOMod cosmetics for the browser game

Source: [TheDoctor0/CSGOMod](https://github.com/TheDoctor0/CSGOMod), pinned to `a28f3dc5ad81ac4e8db73d45aa2f83efc823fd96`. Its MIT code notice is retained in `licenses/CSGOMod-MIT.txt`. The upstream credits CS:GO Ports and Valve for original art. The downloaded model and texture assets remain private, excluded from this source repository.

This integration adapts cosmetic models to our existing Metamod-FWGS plugin and standard WASM browser client. It does not install AMX Mod X, the upstream shop/database or additional native binaries.

On the home game-host PC, after pulling the source:

```sh
python3 scripts/install-csgomod.py /path/to/owned/Half-Life --fetch
```

Python 3, Pillow and Git are required. The installer fetches only pinned input models/textures, verifies every SHA-256 in `scripts/csgomod-lock.json`, bakes skin bodygroups, removes unused texture banks and packages the private browser ZIP. It keeps skeleton/animation data and native CS gameplay. Missing CS:GO-only sound references are removed; normal native weapon sounds remain.

It adds:

- Higher-detail first-person AK-47, M4A1, Desert Eagle and standard knife models using the four existing finish IDs.
- A first-person Butterfly Knife cosmetic, with its native-model draw/slash animations. Third-person held/world knife geometry uses the existing CS models.
- Crimson Web and Blue Steel glove finishes, composited into first-person viewmodels for all four supported weapons and the Butterfly knife.

Every knife and glove item is Legendary. Epic, Aurum and Legendary crates can contain optional rewards once installed; previews list the actual installed pool and exact chances. The 500-point Legendary crate retains 80% Legendary / 20% Epic odds. Existing accounts, skins and balances survive installation.

Rebuild the web and native server images, then restart the game host after generating the pack. Both sides must be updated together. The generated `data/skins.json` feature flags prevent uninstalled optional rewards from being awarded. Re-running `build-skins.py` creates the basic pack and disables optional drops; already owned optional items remain saved and become equippable again after reinstalling the pack.

Native equipment codes preserve existing variants 0–4; Butterfly uses 5. Gloves add 6 (Crimson Web) or 12 (Blue Steel) to the base variant. Missing viewmodels fall back to the original CS model. Only installed viewmodels are precached; unused upstream bodygroups/textures are stripped to limit resource use. The import rejects external animation groups, malformed offsets and model outputs beyond its memory budget.

Validation covers Studio v10 structure, bodygroup selection, texture pruning, glove replacement and malformed models. Real source models were downloaded and processed in the workspace, and the native plugin was compiled against the pinned Metamod headers. Private host installation and live first-person gameplay still need verification.
