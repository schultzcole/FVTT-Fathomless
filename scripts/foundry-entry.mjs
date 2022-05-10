import {libWrapper} from "../lib/libWrapper/shim.js";
import {MODULE_ID} from "./constants.mjs";
import {fathomless_applyActiveEffects} from "./implementation.mjs";

Hooks.once('init', () => {
    if (!game.modules.get("quench")?.active) {
        libWrapper.register(MODULE_ID, "Actor.prototype.applyActiveEffects",
            function applyActiveEffectsWrapper() { return fathomless_applyActiveEffects(this); },
            libWrapper.OVERRIDE);
    }
});
