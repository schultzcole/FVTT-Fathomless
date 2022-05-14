import { defineActiveEffectChangeTest, setupApplyActiveEffectsMethodOverride } from "./test-helpers.mjs";
import { fathomless_applyActiveEffects } from "../scripts/implementation.mjs";

export function coreBehaviorTests(context) {
    const { describe, it, before, after } = context;

    [
        {
            name: "Core",
            func: function(old_applyActiveEffects) { return old_applyActiveEffects.call(this) },
        },
        {
            name: "Fathomless",
            func: function applyActiveEffects_testHarness(_) {
                return fathomless_applyActiveEffects(this);
            },
        },
    ].forEach((implementationConfig) => {

        describe(`Core Parity (${implementationConfig.name})`, () => {
            setupApplyActiveEffectsMethodOverride(before, after, implementationConfig.func);

            describe("ADD Change Mode", () => {
                it("should add to existing value",
                    defineActiveEffectChangeTest(
                        [ { key: "data.currency.pp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "1" } ],
                        [ { key: "data.currency.pp", value: 42 } ],
                        { actorData: { "data.currency.pp": 41 } },
                    ),
                );

                it("should subtract from existing value when value is negative",
                    defineActiveEffectChangeTest(
                        [ { key: "data.currency.pp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "-1" } ],
                        [ { key: "data.currency.pp", value: 42 } ],
                        { actorData: { "data.currency.pp": 43 } },
                    ),
                );
            });

            describe("MULTIPLY Change Mode", () => {
                it("should add to existing value",
                    defineActiveEffectChangeTest(
                        [ {
                            key: "data.currency.pp",
                            mode: globalThis.CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
                            value: "2"
                        } ],
                        [ { key: "data.currency.pp", value: 20 } ],
                        { actorData: { "data.currency.pp": 10 } },
                    ),
                );
            });

            describe("OVERRIDE Change Mode", () => {
                it("should override existing value",
                    defineActiveEffectChangeTest(
                        [ { key: "data.currency.pp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "1" } ],
                        [ { key: "data.currency.pp", value: 1 } ],
                    ),
                );
            });

            describe("UPGRADE Change Mode", () => {
                it("should upgrade lower existing value",
                    defineActiveEffectChangeTest(
                        [ {
                            key: "data.currency.pp",
                            mode: globalThis.CONST.ACTIVE_EFFECT_MODES.UPGRADE,
                            value: "15"
                        } ],
                        [ { key: "data.currency.pp", value: 15 } ],
                        { actorData: { "data.currency.pp": 10 } },
                    ),
                );

                it("should not upgrade higher existing value",
                    defineActiveEffectChangeTest(
                        [ {
                            key: "data.currency.pp",
                            mode: globalThis.CONST.ACTIVE_EFFECT_MODES.UPGRADE,
                            value: "15"
                        } ],
                        [ { key: "data.currency.pp", value: 20 } ],
                        { actorData: { "data.currency.pp": 20 } },
                    ),
                );
            });

            describe("DOWNGRADE Change Mode", () => {
                it("should downgrade higher existing value",
                    defineActiveEffectChangeTest(
                        [ {
                            key: "data.currency.pp",
                            mode: globalThis.CONST.ACTIVE_EFFECT_MODES.DOWNGRADE,
                            value: "15"
                        } ],
                        [ { key: "data.currency.pp", value: 15 } ],
                        { actorData: { "data.currency.pp": 20 } },
                    ),
                );

                it("should not downgrade lower existing value",
                    defineActiveEffectChangeTest(
                        [ {
                            key: "data.currency.pp",
                            mode: globalThis.CONST.ACTIVE_EFFECT_MODES.DOWNGRADE,
                            value: "15"
                        } ],
                        [ { key: "data.currency.pp", value: 10 } ],
                        { actorData: { "data.currency.pp": 10 } },
                    ),
                );
            });

            describe("Multiple changes, different keys", () => {
                it("should apply changes to the appropriate keys ",
                    defineActiveEffectChangeTest(
                        [
                            { key: "data.currency.pp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "7" },
                            {
                                key: "data.currency.gp",
                                mode: globalThis.CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                value: "13"
                            },
                        ],
                        [
                            { key: "data.currency.pp", value: 42 },
                            { key: "data.currency.gp", value: 13 },
                        ],
                        { actorData: { "data.currency.pp": 35, "data.currency.gp": 999 } },
                    ),
                );
            });

            describe("Multiple changes, same key", () => {
                it("should apply multiple ADD changes",
                    defineActiveEffectChangeTest(
                        [
                            { key: "data.currency.pp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "2" },
                            { key: "data.currency.pp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "3" },
                        ],
                        [ { key: "data.currency.pp", value: 5 } ],
                    ),
                );

                it("should apply ADD and MULTIPLY changes in order of implicit priority",
                    defineActiveEffectChangeTest(
                        [
                            { key: "data.currency.pp", mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD, value: "3" },
                            {
                                key: "data.currency.pp",
                                mode: globalThis.CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
                                value: "5"
                            },
                        ],
                        [ { key: "data.currency.pp", value: 38 } ],
                        { actorData: { "data.currency.pp": 7 } },
                    ),
                );

                it("should apply OVERRIDE and ADD changes in order of given priority",
                    defineActiveEffectChangeTest(
                        [
                            {
                                key: "data.currency.pp",
                                mode: globalThis.CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                value: "40",
                                priority: 0
                            },
                            {
                                key: "data.currency.pp",
                                mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD,
                                value: "2",
                                priority: 1
                            },
                        ],
                        [ { key: "data.currency.pp", value: 42 } ],
                        { actorData: { "data.currency.pp": 100 } },
                    ),
                );
            });

            describe("Weird Cases", () => {
                it("should create the target effect path if it does not already exist",
                    defineActiveEffectChangeTest(
                        [
                            {
                                key: "flags.myCustomKey1",
                                mode: globalThis.CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                value: "Hello, world!"
                            },
                            {
                                key: "flags.myCustomKey2",
                                mode: globalThis.CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                value: "Something else"
                            },
                        ],
                        [
                            { key: "flags.myCustomKey1", value: "Hello, world!" },
                            { key: "flags.myCustomKey2", value: "Something else" },
                        ],
                    ),
                );

                it("should add to target effect path even if the target key is not defined in the schema",
                    defineActiveEffectChangeTest(
                        [
                            {
                                key: "flags.myCustomKey",
                                mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD,
                                value: ", world!"
                            },
                        ],
                        [ { key: "flags.myCustomKey", value: "Hello, world!" } ],
                        { actorData: { "flags.myCustomKey": "Hello" } },
                    ),
                );
            });
        });
    });
}
