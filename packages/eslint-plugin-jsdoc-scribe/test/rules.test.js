"use strict";

const { RuleTester } = require("eslint");
const plugin = require("../index.js");

const ruleTester = new RuleTester({
    languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

let assertions = 0;
function run(ruleName, cases) {
    ruleTester.run(ruleName, plugin.rules[ruleName], cases);
    assertions += cases.valid.length + cases.invalid.length;
}

// ---------------------------------------------------------------------------
// require-jsdoc — no fixer (inserting a brand-new block is --write's job)
// ---------------------------------------------------------------------------
run("require-jsdoc", {
    valid: [
        "/**\n * Does a thing.\n */\nfunction foo() {}",
        "/**\n * Does a thing.\n */\nconst foo = function () {};",
        "/**\n * Does a thing.\n */\nconst foo = () => {};",
        "/**\n * A class.\n */\nclass Foo {\n  /**\n   * A method.\n   */\n  bar() {}\n}",
        "/**\n * A class.\n */\nclass Foo {\n  get x() { return 1; }\n}", // getters excluded from scope
    ],
    invalid: [
        { code: "function foo() {}", errors: [{ messageId: "missing" }] },
        { code: "const foo = function () {};", errors: [{ messageId: "missing" }] },
        { code: "const foo = () => {};", errors: [{ messageId: "missing" }] },
        { code: "class Foo {}", errors: [{ messageId: "missing" }] },
        { code: "class Foo {\n  bar() {}\n}", errors: [{ messageId: "missing" }, { messageId: "missing" }] },
    ],
});

// ---------------------------------------------------------------------------
// require-param
// ---------------------------------------------------------------------------
run("require-param", {
    valid: [
        "/**\n * Adds.\n * @param {number} a\n * @param {number} b\n */\nfunction add(a, b) {}",
        "function noDocsAtAll(a) {}", // no comment at all — require-jsdoc's job
    ],
    invalid: [
        {
            code: "/**\n * Adds.\n * @param {number} a\n */\nfunction add(a, b) {}",
            errors: [{ messageId: "missing", data: { name: "b" } }],
            output: "/**\n * Adds.\n * @param {number} a - TODO: describe parameter \"a\".\n * @param {*} b - TODO: describe parameter \"b\".\n */\nfunction add(a, b) {}",
        },
    ],
});

// ---------------------------------------------------------------------------
// require-param-description
// ---------------------------------------------------------------------------
run("require-param-description", {
    valid: ["/**\n * Adds.\n * @param {number} a - the first number\n */\nfunction add(a) {}"],
    invalid: [
        {
            code: "/**\n * Adds.\n * @param {number} a\n */\nfunction add(a) {}",
            errors: [{ messageId: "missing", data: { name: "a" } }],
            output: "/**\n * Adds.\n * @param {number} a - TODO: describe parameter \"a\".\n */\nfunction add(a) {}",
        },
    ],
});

// ---------------------------------------------------------------------------
// check-param-names
// ---------------------------------------------------------------------------
run("check-param-names", {
    valid: [
        "/**\n * Subtracts.\n * @param {number} a\n * @param {number} b\n */\nfunction subtract(a, b) {}",
    ],
    invalid: [
        {
            code: "/**\n * Subtracts.\n * @param {number} b\n * @param {number} a\n */\nfunction subtract(a, b) {}",
            errors: [{ messageId: "mismatch" }],
            output: "/**\n * Subtracts.\n * @param {number} a - TODO: describe parameter \"a\".\n * @param {number} b - TODO: describe parameter \"b\".\n */\nfunction subtract(a, b) {}",
        },
    ],
});

// ---------------------------------------------------------------------------
// require-returns
// ---------------------------------------------------------------------------
run("require-returns", {
    valid: [
        "/**\n * No return.\n */\nfunction log() { console.log(1); }",
        "/**\n * Has one.\n * @returns {number} the value\n */\nfunction get() { return 1; }",
    ],
    invalid: [
        {
            code: "/**\n * Missing.\n */\nfunction get() { return 1; }",
            errors: [{ messageId: "missing" }],
            output: "/**\n * Missing.\n * @returns {*} TODO: describe the return value.\n */\nfunction get() { return 1; }",
        },
    ],
});

// ---------------------------------------------------------------------------
// require-returns-description
// ---------------------------------------------------------------------------
run("require-returns-description", {
    valid: ["/**\n * Has one.\n * @returns {number} the value\n */\nfunction get() { return 1; }"],
    invalid: [
        {
            code: "/**\n * Missing desc.\n * @returns {number}\n */\nfunction get() { return 1; }",
            errors: [{ messageId: "missing" }],
            output: "/**\n * Missing desc.\n * @returns {number} TODO: describe the return value.\n */\nfunction get() { return 1; }",
        },
    ],
});

// ---------------------------------------------------------------------------
// require-returns-check
// ---------------------------------------------------------------------------
run("require-returns-check", {
    valid: [
        "/**\n * Has one.\n * @returns {number} the value\n */\nfunction get() { return 1; }",
        "/**\n * No return.\n */\nfunction log() { console.log(1); }",
    ],
    invalid: [
        {
            code: "/**\n * Unnecessary.\n * @returns {void}\n */\nfunction log() { console.log(1); }",
            errors: [{ messageId: "unnecessary" }],
            output: "/**\n * Unnecessary.\n */\nfunction log() { console.log(1); }",
        },
    ],
});

// ---------------------------------------------------------------------------
// require-description
// ---------------------------------------------------------------------------
run("require-description", {
    valid: ["/**\n * A description.\n */\nfunction foo() {}"],
    invalid: [
        {
            code: "/**\n * @param {number} a\n */\nfunction foo(a) {}",
            errors: [{ messageId: "missing" }],
            output: "/**\n * TODO: describe what this does.\n * @param {number} a - TODO: describe parameter \"a\".\n */\nfunction foo(a) {}",
        },
        {
            code: "/**\n * @readonly\n */\nclass Foo {}",
            errors: [{ messageId: "missing" }],
            output: "/**\n * TODO: describe what this does.\n * @readonly\n */\nclass Foo {}",
        },
    ],
});

// ---------------------------------------------------------------------------
// check-tag-names — no fixer (renaming a typo'd tag would be guessing intent)
// ---------------------------------------------------------------------------
run("check-tag-names", {
    valid: ["/**\n * Deprecated thing.\n * @deprecated\n */\nfunction foo() {}"],
    invalid: [
        {
            code: "/**\n * @totallymadeup foo\n */\nfunction foo() {}",
            errors: [{ messageId: "unknown", data: { tag: "totallymadeup" } }],
        },
    ],
});

// ---------------------------------------------------------------------------
// empty-tags
// ---------------------------------------------------------------------------
run("empty-tags", {
    valid: ["/**\n * A thing.\n * @readonly\n */\nclass Foo {}"],
    invalid: [
        {
            code: "/**\n * A thing.\n * @readonly should not have text\n */\nclass Foo {}",
            errors: [{ messageId: "unexpected", data: { tag: "readonly" } }],
            output: "/**\n * A thing.\n * @readonly\n */\nclass Foo {}",
        },
    ],
});

// ---------------------------------------------------------------------------
// no-multi-asterisks
// ---------------------------------------------------------------------------
run("no-multi-asterisks", {
    valid: ["/**\n * A normal line.\n */\nfunction foo() {}"],
    invalid: [
        {
            code: "/**\n ** A bad line.\n */\nfunction foo() {}",
            errors: [{ messageId: "extra" }],
            output: "/**\n * A bad line.\n */\nfunction foo() {}",
        },
    ],
});

// ---------------------------------------------------------------------------
// no-blank-block-descriptions
// ---------------------------------------------------------------------------
run("no-blank-block-descriptions", {
    valid: ["/**\n * Not blank.\n */\nfunction foo() {}"],
    invalid: [
        {
            code: "/**\n *\n */\nfunction foo() {}",
            errors: [{ messageId: "empty" }],
            output: "/**\n * TODO: describe what this does.\n *\n */\nfunction foo() {}",
        },
    ],
});

// ---------------------------------------------------------------------------
// Autofix-specific behavior — verified directly via ESLint's Linter, not
// RuleTester's single-pass `output` field, since these check properties that
// span the whole recommended config or need multiple internal fix passes.
// ---------------------------------------------------------------------------

const { Linter } = require("eslint");

function fixAll(code) {
    const linter = new Linter();
    const rules = Object.fromEntries(Object.keys(plugin.rules).map((r) => ["jsdoc-scribe/" + r, "error"]));
    const result = linter.verifyAndFix(code, {
        languageOptions: { ecmaVersion: 2022, sourceType: "module" },
        plugins: { "jsdoc-scribe": plugin },
        rules,
    });
    return result;
}

function autofixCheck(label, fn) {
    try {
        fn();
        assertions += 1;
        console.log("  ok - " + label);
    } catch (err) {
        console.error("  FAIL - " + label + "\n       " + err.message);
        process.exitCode = 1;
    }
}

autofixCheck("autofix: an unknown/typo'd tag survives verifyAndFix verbatim, never renamed", () => {
    const code = "/**\n * Adds.\n * @parm {number} a\n * @param {number} b\n */\nfunction add(a, b) { return a + b; }\n";
    const result = fixAll(code);
    if (!result.output.includes("@parm {number} a")) {
        throw new Error("unknown tag text was not preserved verbatim:\n" + result.output);
    }
    const stillHasUnknown = result.messages.some((m) => m.ruleId === "jsdoc-scribe/check-tag-names");
    if (!stillHasUnknown) throw new Error("check-tag-names should still report after verifyAndFix");
});

autofixCheck("autofix: a marker tag not otherwise reconstructed (e.g. @readonly) survives a full rebuild", () => {
    const code = "/**\n * A thing.\n * @readonly\n * @param {number} a\n */\nfunction get(a, b) { return a; }\n";
    const result = fixAll(code);
    if (!result.output.includes("@readonly")) {
        throw new Error("marker tag @readonly was dropped during rebuild:\n" + result.output);
    }
    if (!/@param \{\*\} b/.test(result.output)) {
        throw new Error("missing @param for b was not added:\n" + result.output);
    }
});

autofixCheck("autofix: verifyAndFix converges (a second run over the fixed output makes no further change)", () => {
    const code = "/**\n * @param {number} b\n * @param {number} a\n */\nfunction subtract(a, b) { return a - b; }\n";
    const first = fixAll(code);
    const second = fixAll(first.output);
    if (first.output !== second.output) {
        throw new Error("fix output is not stable across a second run:\nfirst:\n" + first.output + "\nsecond:\n" + second.output);
    }
});

console.log("eslint-plugin-jsdoc-scribe: RuleTester passed for all " + Object.keys(plugin.rules).length + " rules (" + assertions + " cases).");
