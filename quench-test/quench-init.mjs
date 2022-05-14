import { coreBehaviorTests } from "./core-behavior-tests.mjs";
import { dependentBehaviorTests } from "./dependent-behavior-tests.mjs";
import { performanceTests } from "./performance-tests.mjs";

Hooks.once("quenchReady", (quench) => {
    quench.registerBatch(`fathomless.parity`, coreBehaviorTests, { displayName: `FATHOMLESS: Core Parity` });
    quench.registerBatch("fathomless.dependent-changes", dependentBehaviorTests, { displayName: "FATHOMLESS: Dependent Changes" });
    quench.registerBatch("fathomless.performance-tests", performanceTests, { displayName: "FATHOMLESS: Performance Tests" });
});
