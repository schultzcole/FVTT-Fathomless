# Fathomless - Proof of Concept :test_tube:

Fathomless is a FoundryVTT module that allow active effect changes to depend on actor data, even actor data that is modified by other active effects, so long as there are no cyclical dependencies.

## Installation

Install via manifest, link on the [Releases page](https://www.github.com/schultzcole/FVTT-Fathomless/releases).

## Functionality

Fathomless allows active effect changes to depend on other actor data, even actor data that is modified by other active effects.
This is accomplished by constructing a [directed graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph) that encapsulates the dependency relationships between actor properties, then using that graph to perform a [Topological Sort](https://en.wikipedia.org/wiki/Topological_sorting) in order to apply the effect changes in the correct order so that all dependencies are taken into account.

The nature of this implementation is such that any changes "downstream" of an actor property that is involved in a dependency cycle are ignored.

Referencing an actor property in an effect change is done with the syntax `&my.actor.property.path`.
Note the use of `&` rather than `@`, which is deliberate (see the related caveat below).

### Performance

Going into this project, I was concerned that a more complex implementation might be prohibitively more computationally expensive.
However, this does not seem to be the case.
In my testing, Fathomless performs extremely closely with the current core implementation.

The table below shows my rudimentary attempts at statistics.
The numbers along the top indicate the number of active effect changes being applied to a single actor.
The test cases are as follows:

 - "constants targeting same key": there are `N` effect changes, all targeting the same property with `ADD` `"1"`.
 - "constants targeting different keys": there are `N` effect changes, each of which targets a separate property with `ADD` `"1"`.
 - "properties targeting different keys": there are `N` effect changes, each of which depends on change `n+1` (this case of course has no visible effect with the core implementation, though it does run).

The durations listed here are the mean of 5 test runs per test case per implementation per value of N.

|                                     |     100 |            |    1000 |            |    10000 |            |
|-------------------------------------|--------:|-----------:|--------:|-----------:|---------:|-----------:|
|                                     |    Core | Fathomless |    Core | Fathomless |     Core | Fathomless |
| constants targeting same key        |  0.6 ms |    0.54 ms | 4.12 ms |     3.8 ms | 30.92 ms |   22.56 ms |
| constants targeting different keys  | 0.52 ms |    0.44 ms |  3.3 ms |    3.04 ms | 29.28 ms |   31.32 ms |
| properties targeting different keys | 0.64 ms |    0.44 ms |  3.6 ms |     3.1 ms |  30.3 ms |   31.12 ms |

Based on these results, I'd be willing to say that Fathomless and the core implementation are pretty much within margin of error of one another, though I haven't officially done statistical analysis to back that up.

For the amount of effects I would expect to see on actors in a real-world scenario, the total preparation time for all effects on all actors should be quite low, regardless of implementation.

## Caveats

There are some caveats to this implementation that are not unsurmountable, but might be counterintuitive to end users (which is why I consider this a proof of concept):

1. This does not change the order in which actor data is prepared.
   Thus, active effect changes cannot depend upon derived data, as that is computed after embedded documents have been prepared.
   In practice, this is actually a pretty significant limitation.
3. The syntax for referencing an actor data property is different from what users might expect due to their previous experience with referencing actor roll data in formulas.
   This is a necessary limitation with the current state of things since the actor roll data does not exist at the time of embedded document preparation.
   I have tried to highlight the difference between referencing actor roll data and referencing an actor property in an active effect by using a different symbol prefix: `@` for actor roll data, `&` for actor data properties.
   This solution does have a problem in that technically it is impossible to tell whether the user wants the actor property value or the literal string prefixed with a `&`.
   I have made the judgement that the latter option is likely to be vanishingly uncommon, and thus I am ignoring the problem.
4. As with core active effects, you cannot use mathematical operations in effect changes.
   This is not a serious issue with core active effects because the change values are always constants.
   However when potentially dynamic values come in to play, users may want to combine them in ways that are not currently (or at least easily) supported.

## Compatibility

Core compatibility: v9

No explicit conflicts known. Systems that override `applyActiveEffects` may conflict.

Known compatible systems: `dnd5e`

## Running Tests

Note: Tests are not included in the release distribution.
To run the tests, download the repository source code and either place it or symlink it into your Foundry modules directory manually, and make sure the folder is named `fathomless`.
When you do so, the version number will display in Foundry as `0.0.0`, but this should not be an issue.
If you wish to return to the release version, delete the `fathomless` folder before installing via manifest, just to be safe.

There is a [Quench](https://github.com/Ethaks/FVTT-Quench) test suite that includes tests for the core `applyActiveEffects` implementation and the Fathomless implementation to ensure that both have the same basic behavior. There are also tests specific to the dependent effects features of Fathomless.

Note: When Quench is enabled, the Fathomless implementation of `applyActiveEffects` is *only* used in tests. If you want to try out the Fathomless implementation in a "real-world" situation with actual actors, disable Quench.

## License

Licensed under GPLv2. See [LICENSE](LICENSE).

Feel free to depend on this module or use this module's code for whatever you wish, so long as you abide by the terms of the license above.
