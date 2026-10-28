# Third-party software

- Native engine: Xash3D FWGS, GPL-3.0. https://github.com/FWGS/xash3d-fwgs
- CS16Client and its bundled ReGameDLL_CS/YaPB: GPL-2.0+ / GPL-3.0 / MIT. https://github.com/Velaron/cs16-client ; https://github.com/rehlds/ReGameDLL_CS ; https://github.com/yapb/yapb
- WASM engine and SDK modules: webxash3d-fwgs (wrapper MIT, compiled components retain upstream licenses), original source https://github.com/yohimik/webxash3d-fwgs (currently unavailable). The setup script obtains the pinned upstream modules into ignored `web/public/assets`.
- Browser bundle and bridge: CSweb and sla-cs16-web, MIT. https://github.com/santiagoPostacchini/CSweb ; https://github.com/shugavibes/sla-cs16-web . Copyright notices in LICENSE and web/LICENCIA-CSweb.txt.
- Metamod-FWGS, GPL-3.0. https://github.com/FWGS/metamod-fwgs
- node-datachannel 0.33.4, MPL-2.0. https://github.com/murat-dogan/node-datachannel
- ws 8.22.0, MIT. https://github.com/websockets/ws
- fflate (within upstream bundle), MIT. https://github.com/101arrowz/fflate
- Original game assets, map overview images, maps, models and sound: Valve Corporation. Obtained from this PC's local installation. Not included in third-party code licenses.

Game data is served by the configured game host to browser players and is excluded from this source repository.

- Optional cosmetic adapter: TheDoctor0/CSGOMod, source revision `a28f3dc5ad81ac4e8db73d45aa2f83efc823fd96`, MIT code notice retained in `licenses/CSGOMod-MIT.txt`. Upstream art credits: CS:GO Ports and Valve. Pinned model/texture inputs are fetched into ignored private storage, not redistributed in this repository; see `MODPACK.md`.
