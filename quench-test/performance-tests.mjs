import { fathomless_applyActiveEffects } from "../scripts/implementation.mjs";
import { ActiveEffectClass, ActorClass, setupApplyActiveEffectsMethodOverride } from "./test-helpers.mjs";

export function performanceTests(context) {
    const { describe, it, before, after } = context;

    const N_ITERATIONS = 5;
    const N_CHANGES = [ 100, 1000, 10000 ];

    // Note that a success or fail on these tests is essentially meaningless.
    // The value arises from inspecting the reported performance numbers in the console.

    function _perfTest(changes) {
        for ( let i = 0; i < N_ITERATIONS; i++ ) {
            const effect = new ActiveEffectClass({ changes });
            const actor = new ActorClass({
                name: "Test Actor",
                type: "character",
                effects: [ effect.toObject() ],
            });
        }

        globalThis.chai.assert.ok(true);
    }

    const implementationConfigs = [
        {
            name: "Core",
            func: function core_applyActiveEffects_perfHarness(old_applyActiveEffects) {
                const start = performance.now();
                old_applyActiveEffects.call(this);
                console.log(`[CORE] Applied active effects in ms:`, performance.now() - start);
            },
        },
        {
            name: "Fathomless",
            func: function fathomless_applyActiveEffects_perfHarness(_) {
                const start = performance.now();
                fathomless_applyActiveEffects(this);
                console.log(`[FATHOMLESS] Applied active effects in ms:`, performance.now() - start);
            },
        },
    ];

    implementationConfigs.forEach((implementationConfig) => {

        describe(`${implementationConfig.name} implementation`, () => {
            setupApplyActiveEffectsMethodOverride(before, after, implementationConfig.func);
            for ( const n of N_CHANGES ) {
                describe(`${n} Changes`, () => {
                    it(`Constant changes affecting same key`, () => {
                        const changes = new Array(n);

                        for ( let i = 0; i < n; i++ ) {
                            changes[i] = {
                                key: "data.currency.pp",
                                mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD,
                                value: "1",
                            };
                        }

                        _perfTest(changes);
                    });

                    it(`Constant changes affecting different keys`, () => {
                        const changes = new Array(n);

                        for ( let i = 0; i < n; i++ ) {
                            changes[i] = {
                                key: `flags.testKey${n}`,
                                mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD,
                                value: "1",
                            };
                        }

                        _perfTest(changes);
                    });

                    it(`Dynamic changes affecting different keys`, () => {
                        const changes = new Array(n);

                        for ( let i = 0; i < n; i++ ) {
                            changes[i] = {
                                key: `flags.testKey${n}`,
                                mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD,
                                value: `flags.testKey${n + 1}`,
                            };
                        }

                        _perfTest(changes);
                    });
                });
            }
        });
    });
}
