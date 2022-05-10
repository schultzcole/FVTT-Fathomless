import { MODULE_ID } from "../scripts/constants.mjs";
import { fathomless_applyActiveEffects } from "../scripts/implementation.mjs";
import { coreBehaviorTests } from "./core-behavior-tests.mjs";

const batchConfigs = [
    {
        id: "core",
        func: Actor.prototype.applyActiveEffects,
    },
    {
        id: MODULE_ID,
        func: function applyActiveEffects_testHarness() {
            fathomless_applyActiveEffects(this);
        },
    },
];

Hooks.once("quenchReady", (quench) => {
    for ( const batchConfig of batchConfigs ) {
        quench.registerBatch(
            `fathomless.parity.${batchConfig.id}-impl`,
            (context) => coreBehaviorTests(context, batchConfig),
            {
                displayName: `FATHOMLESS: Core Parity (${batchConfig.id.titleCase()} Implementaiton)`,
            },
        );
    }
});
