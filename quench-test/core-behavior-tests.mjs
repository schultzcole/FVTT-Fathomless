const ActorClass = CONFIG.Actor.documentClass;
const ActiveEffectClass = CONFIG.ActiveEffect.documentClass;

export function coreBehaviorTests(context, func) {
    const {describe, it, before, after, assert} = context;

    function _defineActiveEffectChangeTest(changes, expected, {actorData = {}, debug = false} = {}) {
        return () => {
            if (debug) debugger;
            const actor = new ActorClass(foundry.utils.mergeObject({
                name: "Test Actor",
                type: "character"
            }, actorData));
            const effect = new ActiveEffectClass({changes});

            actor.effects.set(effect.id, effect, {modifySource: false});
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
                    [{key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "1"}],
                    [{key: "data.currency.pp", value: 1}]
                )
            );

            it('should subtract from existing value when value is negative',
                _defineActiveEffectChangeTest(
                    [{key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-1"}],
                    [{key: "data.currency.pp", value: 42}],
                    {actorData: {data: {currency: {pp: 43}}}}
                )
            );

        });

        describe("OVERRIDE Change Mode", () => {
            it('should override existing value',
                _defineActiveEffectChangeTest(
                    [{key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "1"}],
                    [{key: "data.currency.pp", value: 1}]
                )
            );
        });

        describe("Multiple changes, same key", () => {
            it('should apply multiple ADD changes',
                _defineActiveEffectChangeTest(
                    [
                        {key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "2"},
                        {key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "3"},
                    ],
                    [{key: "data.currency.pp", value: 5}]
                )
            );

            it('should apply OVERRIDE and ADD changes in order of priority',
                _defineActiveEffectChangeTest(
                    [
                        {key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "40", priority: 0},
                        {key: "data.currency.pp", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "2", priority: 1},
                    ],
                    [{key: "data.currency.pp", value: 42}],
                    {actorData: {data: {currency: {pp: 100}}}}
                )
            );
        });
    });
}
