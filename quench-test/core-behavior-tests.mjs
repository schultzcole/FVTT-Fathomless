const ActorClass = CONFIG.Actor.documentClass;
const ActiveEffectClass = CONFIG.ActiveEffect.documentClass;

export function coreBehaviorTests(context, func) {
    const { describe, it, before, after, assert } = context;

    function _defineActiveEffectChangeTest(changes, expected, { actorData = {}, debug = false } = {}) {
        return () => {
            if (debug) debugger;
            const actor = new ActorClass(foundry.utils.mergeObject({
                name: "Test Actor",
                type: "character"
            }, actorData));
            const effect = new ActiveEffectClass({ changes });

            actor.effects.set(effect.id, effect, { modifySource: false });
            actor.applyActiveEffects();

            const actual = expected.map((exp) => foundry.utils.getProperty(actor, "data." + exp.key));
            assert.deepEqual(actual, expected.map((exp) => exp.value));
        }
    }

    describe("Core Parity", () => {
        let oldApplyActiveEffects = null;

        before(() => {
            console.log("Overwriting Actor.prototype.applyActiveEffects with", func);
            oldApplyActiveEffects = Actor.prototype.applyActiveEffects;
            Actor.prototype.applyActiveEffects = func;
        });

        after(() => {
            Actor.prototype.applyActiveEffects = oldApplyActiveEffects;
        });

        describe("ADD Change Mode", () => {
            it('should add to existing value',
                _defineActiveEffectChangeTest(
                    [ { key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "1" } ],
                    [ { key: "data.currency.pp", value: 1 } ]
                )
            );

            it('should subtract from existing value when value is negative',
                _defineActiveEffectChangeTest(
                    [ { key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-1" } ],
                    [ { key: "data.currency.pp", value: 42 } ],
                    { actorData: { "data.currency.pp": 43 } }
                )
            );
        });

        describe("MULTIPLY Change Mode", () => {
            it('should add to existing value',
                _defineActiveEffectChangeTest(
                    [ { key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: "2" } ],
                    [ { key: "data.currency.pp", value: 20 } ],
                    { actorData: { "data.currency.pp": 10 } }
                )
            );
        });

        describe("OVERRIDE Change Mode", () => {
            it('should override existing value',
                _defineActiveEffectChangeTest(
                    [ { key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "1" } ],
                    [ { key: "data.currency.pp", value: 1 } ]
                )
            );
        });

        describe("UPGRADE Change Mode", () => {
            it('should upgrade lower existing value',
                _defineActiveEffectChangeTest(
                    [ { key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE, value: "15" } ],
                    [ { key: "data.currency.pp", value: 15 } ],
                    { actorData: { "data.currency.pp": 10 } }
                )
            );

            it('should not upgrade higher existing value',
                _defineActiveEffectChangeTest(
                    [ { key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE, value: "15" } ],
                    [ { key: "data.currency.pp", value: 20 } ],
                    { actorData: { "data.currency.pp": 20 } }
                )
            );
        });

        describe("DOWNGRADE Change Mode", () => {
            it('should downgrade higher existing value',
                _defineActiveEffectChangeTest(
                    [ { key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.DOWNGRADE, value: "15" } ],
                    [ { key: "data.currency.pp", value: 15 } ],
                    { actorData: { "data.currency.pp": 20 } }
                )
            );

            it('should not downgrade lower existing value',
                _defineActiveEffectChangeTest(
                    [ { key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.DOWNGRADE, value: "15" } ],
                    [ { key: "data.currency.pp", value: 10 } ],
                    { actorData: { "data.currency.pp": 10 } }
                )
            );
        });

        describe("Multiple changes, different keys", () => {
            it('should apply changes to the appropriate keys ',
                _defineActiveEffectChangeTest(
                    [
                        { key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "7" },
                        { key: "data.currency.gp", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "13" },
                    ],
                    [
                        { key: "data.currency.pp", value: 42 },
                        { key: "data.currency.gp", value: 13 }
                    ],
                    { actorData: { "data.currency.pp": 35, "data.currency.gp": 999 } }
                )
            )
        });

        describe("Multiple changes, same key", () => {
            it('should apply multiple ADD changes',
                _defineActiveEffectChangeTest(
                    [
                        { key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "2" },
                        { key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "3" },
                    ],
                    [ { key: "data.currency.pp", value: 5 } ]
                )
            );

            it('should apply ADD and MULTIPLY changes in order of implicit priority',
                _defineActiveEffectChangeTest(
                    [
                        { key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "3" },
                        { key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: "5" },
                    ],
                    [ { key: "data.currency.pp", value: 38 } ],
                    { actorData: { "data.currency.pp": 7 } }
                )
            );

            it('should apply OVERRIDE and ADD changes in order of given priority',
                _defineActiveEffectChangeTest(
                    [
                        { key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "40", priority: 0 },
                        { key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "2", priority: 1 },
                    ],
                    [ { key: "data.currency.pp", value: 42 } ],
                    { actorData: { "data.currency.pp": 100 } }
                )
            );
        });
    });
}
