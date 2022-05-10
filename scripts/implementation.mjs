/**
 * Applies ActiveEffect changes to the given actor, including changes that depend on other properties of the given actor,
 * even those that are affected by other ActiveEffect changes, so long as the dependency tree does not contain any cycles.
 *
 * This both applies the modifications and updates `actor.overrides`.
 * @param actor {Actor | BaseActor}
 */
export function fathomless_applyActiveEffects(actor) {
    /** Maps each property to the properties on which it depends
     * this is the actual DAG data structure
     * @type Map<String,Set<String>>
     */
    const changeDependencies = new Map();

    // Stores the final list of changes to be applied
    const allChanges = [];

    // Build the DAG
    for ( const effect of actor.effects.values() ) {
        if ( effect.data.disabled || effect.isSuppressed ) continue;

        const changes = effect.data.changes;
        for ( let ci = 0; ci < changes.length; ci++ ) {
            const change = changes[ci];
            if ( change.key === change.value ) {
                console.warn(`Change ${ci} on ActiveEffect ${effect.id} is not valid because it references itself.`);
                continue;
            }
            change._priority = change.priority ?? change.mode * 10;
            allChanges.push(change);

            if ( isObjectKey(actor, change.value) ) {
                const existingDeps = changeDependencies.get(change.key);
                if ( existingDeps !== undefined ) {
                    existingDeps.add(change.value);
                } else {
                    const newDeps = new Set([ change.value ]);
                    changeDependencies.set(change.key, newDeps);
                }
            }
        }
    }

    // Use the DAG to determine sort order. Changes that depend on other changes will be sorted later
    allChanges.sort((a, b) => {
        if ( changeDependencies.get(a.key)?.has(b.key) ) {
            return 1;
        } else if ( changeDependencies.get(b.key)?.has(a.key) ) {
            return -1;
        } else {
            return a._priority - b._priority;
        }
    });

    // Apply Effects
    actor.overrides = {};
    for ( const change of allChanges ) {
        const result = change.document.apply(actor, change);
        delete change._priority;
        if ( result ) {
            foundry.utils.setProperty(actor.overrides, change.key, result)
        }
    }
}

/**
 * Returns whether the given string is a data key in the given object.
 * This function assumes that data keys always begin with an alphabetic character.
 * @param object {object}
 * @param key {string}
 * @return {boolean}
 */
function isObjectKey(object, key) {
    // In the majority of cases, we can eliminate a change value from being a valid property key
    // based on whether it is alphabetical. We don't need to test the full string; just testing the
    // first character is enough to eliminate the vast majority of cases and is pretty fast.
    // If it passes that first test, then we do a full check to see if it is a valid key.
    const char1 = key.charAt(0);
    const firstCharIsAlpha = (char1 >= "a" && char1 <= "z") || (char1 >= "A" && char1 <= "Z");

    return firstCharIsAlpha && foundry.utils.getProperty(object, key) !== undefined;
}
