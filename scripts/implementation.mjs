export function fathomless_applyActiveEffects(actor) {
    /** Maps each property to the properties on which it depends
     * @type Map<String,Set<String>>
     */
    const changeDependencies = new Map();

    // Stores the final list of changes to be applied
    const allChanges = [];

    const effects = actor.effects;
    for ( let ei = 0; ei < effects.length; ei++ ) {
        const effect = effects[ei];
        if ( effect.data.disabled || effect.isSuppressed ) continue;

        const changes = effect.data.changes;
        for ( let ci = 0; ci < changes.length; ci++ ) {
            const change = changes[ci];
            if ( change.key === change.value ) {
                console.warn(`Change ${ci} on ActiveEffect ${effect.id} is not valid because it references itself.`);
                continue;
            }
            change.priority ??= change.mode * 10;
            allChanges.push(change);

            // In the majority of cases, we can eliminate a change value from being a valid property key
            // based on whether it is alphabetical. We don't need to test the full string; just testing the
            // first character is enough to eliminate the vast majority of cases and is extremely fast.
            // If it passes that first test, then we do a full check to see if it is a valid key.
            const char1 = change.value.charAt(0);
            const firstCharIsAlpha = (char1 >= 'a' && char1 <= 'z') || (char1 >= 'A' && char1 <= 'Z');
            if ( firstCharIsAlpha && foundry.utils.getProperty(actor, change.value) !== undefined ) {
                const existingDeps = changeDependencies.get(change.key);
                if ( existingDeps !== undefined ) {
                    existingDeps.add(change.value);
                } else {
                    const newDeps = new Set([change.value]);
                    changeDependencies.set(change.key, newDeps);
                }
            }
        }
    }
}
