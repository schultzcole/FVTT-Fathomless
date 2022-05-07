import {libWrapper} from "../lib/libWrapper/shim.js";
import {MODULE_ID} from "./constants.mjs";
import {FathomlessImpl} from "./implementation.mjs";

Hooks.once('init', () => {
    libWrapper.register(MODULE_ID, "Actor.prototype.applyActiveEffects",
        function applyActiveEffectsWrapper() { FathomlessImpl.applyActiveEffects(this); },
        libWrapper.MIXED);
});
