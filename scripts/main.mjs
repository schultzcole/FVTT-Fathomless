import {libWrapper} from "../lib/libWrapper/shim.js";
import {MODULE_ID} from "./constants.mjs";

Hooks.once('init', async function () {
    libWrapper.register(
        MODULE_ID,
        "Actor.prototype.applyActiveEffects",
        function fathomlessApplyActiveEffects(wrapped, ...args) {
            console.log("COLE-DEBUG Overridden applyActiveEffects")
            return wrapped(...args);
        },
        libWrapper.WRAPPER
    )
});
