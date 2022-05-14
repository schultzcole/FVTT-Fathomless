import { defineActiveEffectChangeTest, setupApplyActiveEffectsMethodOverride } from "./test-helpers.mjs";
import { fathomless_applyActiveEffects } from "../scripts/implementation.mjs";

export function dependentBehaviorTests(context) {
    const { describe, it, before, after } = context;

    setupApplyActiveEffectsMethodOverride(before, after, function applyActiveEffects_testHarness(_) {
        return fathomless_applyActiveEffects(this);
    });

    describe("Single Layer Dependency", () => {
        it("ADD adds property value to target",
            defineActiveEffectChangeTest(
                [ { key: "data.currency.pp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&data.currency.gp" } ],
                [ { key: "data.currency.pp", value: 54 } ],
                { actorData: { "data.currency.pp": 15, "data.currency.gp": 39 } },
            ),
        );
    });

    describe("Multi Layer Dependency", () => {
        it("ADD adds property value to target after property is updated",
            defineActiveEffectChangeTest(
                [
                    { key: "data.currency.pp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&data.currency.gp" },
                    { key: "data.currency.gp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "7" },
                ],
                [ { key: "data.currency.pp", value: 61 } ],
                { actorData: { "data.currency.pp": 15, "data.currency.gp": 39 } },
            ),
        );

        it("Dependent change applies after change it depends on, despite manually set priority",
            defineActiveEffectChangeTest(
                [
                    {
                        key: "data.currency.pp",
                        mode: globalThis.CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                        value: "&data.currency.gp",
                        priority: 0,
                    },
                    { key: "data.currency.gp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "42", priority: 1 },
                ],
                [ { key: "data.currency.pp", value: 42 } ],
            ),
        );

        it("Branching dependency",
            defineActiveEffectChangeTest(
                [
                    {
                        key: "data.currency.gp",
                        mode: globalThis.CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                        value: "&data.currency.cp",
                        priority: 0,
                    },
                    { key: "data.currency.gp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: "2" },
                    {
                        key: "data.currency.ep",
                        mode: globalThis.CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                        value: "&data.currency.cp",
                        priority: 0,
                    },
                    { key: "data.currency.ep", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "13" },
                    { key: "data.currency.ep", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: "&data.currency.sp" },
                    {
                        key: "data.currency.pp",
                        mode: globalThis.CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                        value: "&data.currency.sp",
                        priority: 0,
                    },
                    { key: "data.currency.pp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&data.currency.ep" },
                    { key: "data.currency.pp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&data.currency.gp" },
                ],
                [ { key: "data.currency.pp", value: 67 }, {
                    key: "data.currency.ep",
                    value: 48,
                }, { key: "data.currency.gp", value: 14 } ],
                { actorData: { "data.currency.cp": 7, "data.currency.sp": 5 } },
            ),
        );
    });

    describe("Cycles Test", () => {
        it("Change is ignored when it depends on its own target",
            defineActiveEffectChangeTest(
                [
                    { key: "data.currency.pp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&data.currency.pp" },
                ],
                [ { key: "data.currency.pp", value: 4 } ],
                { actorData: { "data.currency.pp": 4 } },
            ),
        );

        it("Changes belonging to a length 2 cycle are not applied",
            defineActiveEffectChangeTest(
                [
                    { key: "data.currency.pp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&data.currency.gp" },
                    { key: "data.currency.gp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&data.currency.pp" },
                ],
                [ { key: "data.currency.pp", value: 3 }, { key: "data.currency.gp", value: 9 } ],
                { actorData: { "data.currency.pp": 3, "data.currency.gp": 9 } },
            ),
        );


        it("Changes belonging to a length 5 cycle are not applied",
            defineActiveEffectChangeTest(
                [
                    { key: "flags.custom.a", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&flags.custom.b" },
                    { key: "flags.custom.b", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&flags.custom.c" },
                    { key: "flags.custom.c", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&flags.custom.d" },
                    { key: "flags.custom.d", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&flags.custom.e" },
                    { key: "flags.custom.e", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&flags.custom.a" },
                ],
                [
                    { key: "flags.custom.a", value: "A" },
                    { key: "flags.custom.b", value: "B" },
                    { key: "flags.custom.c", value: "C" },
                    { key: "flags.custom.d", value: "D" },
                    { key: "flags.custom.e", value: "E" },
                ],
                {
                    actorData: {
                        "flags.custom.a": "A",
                        "flags.custom.b": "B",
                        "flags.custom.c": "C",
                        "flags.custom.d": "D",
                        "flags.custom.e": "E",
                    },
                },
            ),
        );

        it("Changes that depend on a properties that belong to a cycle are not applied",
            defineActiveEffectChangeTest(
                [
                    { key: "data.currency.pp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&data.currency.gp" },
                    { key: "data.currency.gp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&data.currency.pp" },
                    { key: "data.currency.ep", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "&data.currency.pp" },
                ],
                [ { key: "data.currency.ep", value: 5 } ],
                { actorData: { "data.currency.pp": 3, "data.currency.gp": 9, "data.currency.ep": 5 } },
            ),
        );

        it("Changes that don't depend on properties that belong to a cycle are applied",
            defineActiveEffectChangeTest(
                [
                    { key: "data.currency.pp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&data.currency.gp" },
                    { key: "data.currency.gp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&data.currency.pp" },
                    { key: "data.currency.cp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "&data.currency.ep" },
                ],
                [ { key: "data.currency.cp", value: 10 } ],
                {
                    actorData: {
                        "data.currency.pp": 3,
                        "data.currency.gp": 9,
                        "data.currency.ep": 10,
                        "data.currency.cp": 1,
                    },
                },
            ),
        );

        it("Changes that target a property within a cycle are not applied",
            defineActiveEffectChangeTest(
                [
                    { key: "data.currency.pp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&data.currency.ep" },
                    { key: "data.currency.pp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&data.currency.gp" },
                    { key: "data.currency.gp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&data.currency.pp" },
                ],
                [ { key: "data.currency.pp", value: 3 } ],
                { actorData: { "data.currency.pp": 3, "data.currency.gp": 9, "data.currency.ep": 10 } },
            ),
        );

        it("Changes in a cycle that is connected to a larger graph are not applied, but changes to 'upstream' nodes are",
            defineActiveEffectChangeTest(
                [
                    { key: "flags.custom.b", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&flags.custom.a" },
                    { key: "flags.custom.c", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&flags.custom.b" },
                    { key: "flags.custom.d", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&flags.custom.c" },
                    { key: "flags.custom.e", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&flags.custom.d" },
                    { key: "flags.custom.c", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&flags.custom.e" },
                ],
                [
                    { key: "flags.custom.b", value: "BA" },
                    { key: "flags.custom.c", value: "C" },
                    { key: "flags.custom.d", value: "D" },
                    { key: "flags.custom.e", value: "E" },
                ],
                {
                    actorData: {
                        "flags.custom.a": "A",
                        "flags.custom.b": "B",
                        "flags.custom.c": "C",
                        "flags.custom.d": "D",
                        "flags.custom.e": "E",
                    },
                },
            ),
        );

        it("Changes to nodes 'downstream' of a cycle are not applied",
            defineActiveEffectChangeTest(
                [
                    { key: "flags.custom.a", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&flags.custom.b" },
                    { key: "flags.custom.b", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&flags.custom.c" },
                    { key: "flags.custom.c", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&flags.custom.a" },
                    { key: "flags.custom.d", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&flags.custom.c" },
                    { key: "flags.custom.e", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "&flags.custom.d" },
                ],
                [
                    { key: "flags.custom.a", value: "A" },
                    { key: "flags.custom.b", value: "B" },
                    { key: "flags.custom.c", value: "C" },
                    { key: "flags.custom.d", value: "D" },
                    { key: "flags.custom.e", value: "E" },
                ],
                {
                    actorData: {
                        "flags.custom.a": "A",
                        "flags.custom.b": "B",
                        "flags.custom.c": "C",
                        "flags.custom.d": "D",
                        "flags.custom.e": "E",
                    },
                },
            ),
        );
    });
}
