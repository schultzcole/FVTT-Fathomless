/**
 * Applies ActiveEffect changes to the given actor, including changes that depend on other properties of the given
 * actor, even those that are affected by other ActiveEffect changes, so long as the dependency graph does not contain
 * any cycles.
 * The current behavior is that if a cycle is detected, no active effect changes will be applied.
 *
 * This both applies the modifications and updates `actor.overrides`.
 * @param actor {Actor | BaseActor}
 */
export function fathomless_applyActiveEffects(actor) {
    actor.overrides = {};
    if ( actor.effects.size === 0 ) return;

    // This implementation uses Kahn's Algorithm for topologically sorting a directed acyclic graph

    /**
     * Each actor data property targeted by an active effect change is a node in the dependency graph
     * Each node in the map is keyed by actor data path and contains references to the changes on which it depends
     * as well as the nodes that depend on it.
     * @type {Map<string,{key: string, inDegree: number, changes: EffectChangeData[], children: string[]}>}
     */
    const nodes = new Map();

    // Build the DAG
    for ( const effect of actor.effects.values() ) {
        if ( effect.data.disabled || effect.isSuppressed ) continue;

        const changes = effect.data.changes;
        for ( let ci = 0; ci < changes.length; ci++ ) {
            const change = {
                ...changes[ci],
                effect: effect,
            };

            change.dependsOnProperty = change.value.charAt(0) === "&";
            if ( change.dependsOnProperty ) change.value = change.value.slice(1);

            if ( change.key?.length > 0 && change.key === change.value ) {
                console.warn(`Change ${ci} on ActiveEffect ${effect.id} is not valid because it references itself.`);
                continue;
            }
            change.priority ??= change.mode * 10;

            let targetNode = nodes.get(change.key);
            if ( targetNode !== undefined ) {
                targetNode.inDegree += change.dependsOnProperty ? 1 : 0;
                targetNode.changes.push(change);
            } else {
                targetNode = {
                    key: change.key,
                    inDegree: change.dependsOnProperty ? 1 : 0,
                    changes: [ change ],
                    children: [],
                };
                nodes.set(change.key, targetNode);
            }

            if ( change.dependsOnProperty ) {
                let parentNode = nodes.get(change.value);
                if ( parentNode !== undefined ) {
                    parentNode.children.push(change.key);
                } else {
                    parentNode = {
                        key: change.value,
                        inDegree: 0,
                        changes: [],
                        children: [ change.key ],
                    };
                    nodes.set(change.value, parentNode);
                }
            }
        }
    }

    if ( nodes.size === 0 ) return;

    // Build queue of nodes that depend on no other nodes (inDegree is 0)
    let queueStart = 0;
    let queueEnd = 0;
    const queue = new Array(nodes.size);
    for ( const node of nodes.values() ) {
        if ( node.inDegree !== 0 ) continue;
        queue[queueEnd] = node;
        queueEnd++;
    }

    // Pull nodes off the queue, adding them to the ordered list,
    // and adding their dependent nodes to the queue if they have no other parent nodes.
    // Nodes in a cycle always have at least one parent, thus they are not enqueued, and thus effects targeting them
    // or dependent upon them are not applied
    let orderedNodesLen = 0;
    const orderedNodes = new Array(nodes.size);
    while ( queueStart < queueEnd ) {
        let node = queue[queueStart];
        queueStart++;
        orderedNodes[orderedNodesLen] = node;
        orderedNodesLen++;
        for ( const childKey of node.children ) {
            const childNode = nodes.get(childKey);
            if ( childNode === undefined ) continue;
            childNode.inDegree--;

            if ( childNode.inDegree === 0 ) {
                queue[queueEnd] = childNode;
                queueEnd++;
            }
        }
    }

    // Apply changes in topologically sorted order
    for ( let i = 0; i < orderedNodesLen; i++ ) {
        const node = orderedNodes[i];
        nodes.delete(node.key);
        if ( node.changes.length > 1 ) {
            node.changes.sort((a, b) => a.priority - b.priority);
        }
        for ( const change of node.changes ) {
            if ( change.dependsOnProperty ) {
                change.value = foundry.utils.getProperty(actor.data, change.value);
            }
            const result = change.effect.apply(actor, change);
            if ( result ) {
                foundry.utils.setProperty(actor.overrides, change.key, result);
            }
        }
    }

    // Warn the user about any changes that were not applied due to the presence of a cycle
    if ( nodes.size > 0 ) {
        ui.notifications?.warn(`Could not apply active effects changes to ${nodes.size} properties on Actor ${actor.name} (${actor.id}), likely due to a cycle. Check the console for more details`);
        console.warn(`The following active effects changes on actor ${actor.id} were could not be applied, likely due to a cycle:`, Array.from(nodes.values()).flatMap(n => n.changes));
    }
}
