export const ActorClass = CONFIG.Actor.documentClass;
export const ActiveEffectClass = CONFIG.ActiveEffect.documentClass;

export function defineActiveEffectChangeTest(changes, expected, { actorData = {}, debug = false } = {}) {
    return () => {
        if ( debug ) debugger;

        const effect = new ActiveEffectClass({ changes });
        const actor = new ActorClass(foundry.utils.mergeObject({
            name: "Test Actor",
            type: "character",
            effects: [effect.toObject()]
        }, actorData));

        const actual = expected.map((exp) => ({ key: exp.key, value: foundry.utils.getProperty(actor.data, exp.key) }));
        globalThis.chai.assert.deepEqual(actual, expected);
    };
}


const baseApplyActiveEffects = Actor.prototype.applyActiveEffects;
export function setupApplyActiveEffectsMethodOverride(before, after, impl) {

    before(() => {
        console.log("Overwriting Actor.prototype.applyActiveEffects with", impl);
        Actor.prototype.applyActiveEffects = function() { impl.call(this, baseApplyActiveEffects) };
    });

    after(() => {
        Actor.prototype.applyActiveEffects = baseApplyActiveEffects;
    });
}
