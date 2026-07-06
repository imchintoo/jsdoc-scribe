"use strict";

/**
 * Lint engine unit tests — tests lib/lint.js in isolation.
 * Uses hand-built moduleData fixtures (the shape extractModule() returns,
 * now including rawComment/badComment) rather than parsing files, since
 * lintModule() is a pure data function. Mirrors test/drift.test.js's style.
 */

const assert = require("assert");
const { lintModule, KNOWN_TAGS } = require("../lib/lint.js");

function fn(overrides) {
    return Object.assign({
        name: "example",
        line: 10,
        params: [],
        jsdocParams: [],
        returnType: "void",
        returns: null,
        description: null,
        rawComment: null,
        badComment: null,
    }, overrides);
}

function issuesOf(moduleData, rule) {
    return lintModule(moduleData).filter((i) => i.rule === rule);
}

module.exports = function runLintTests(check) {

    // -- require-jsdoc -------------------------------------------------------

    check("lint: require-jsdoc fires when a function has no block at all", () => {
        const moduleData = { functions: [fn({ rawComment: null, jsdocParams: [], returns: null, description: null })], classes: [] };
        const issues = issuesOf(moduleData, "require-jsdoc");
        assert.strictEqual(issues.length, 1);
        assert.strictEqual(issues[0].symbol, "example");
    });

    check("lint: require-jsdoc does not fire when a rawComment exists, even with no tags", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * Does a thing.\n */",
                description: "Does a thing.",
            })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "require-jsdoc").length, 0);
    });

    check("lint: require-jsdoc, once fired, suppresses param/returns/description checks for that symbol", () => {
        const moduleData = {
            functions: [fn({ params: [{ name: "a" }], rawComment: null, jsdocParams: [], returns: null, description: null })],
            classes: [],
        };
        const issues = lintModule(moduleData);
        assert.strictEqual(issues.length, 1, "only require-jsdoc should fire, not require-param etc.");
        assert.strictEqual(issues[0].rule, "require-jsdoc");
    });

    // -- require-param family -------------------------------------------------

    check("lint: require-param fires for an AST param with no matching @param", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * Adds.\n * @param {number} a\n * @returns {number}\n */",
                description: "Adds.",
                params: [{ name: "a" }, { name: "b" }],
                jsdocParams: [{ name: "a", description: null }],
                returnType: "number",
                returns: { type: "number", description: "sum" },
            })],
            classes: [],
        };
        const issues = issuesOf(moduleData, "require-param");
        assert.strictEqual(issues.length, 1);
        assert.match(issues[0].message, /"b"/);
    });

    check("lint: require-param-description fires when a @param has no description", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * Adds.\n * @param {number} a\n * @returns {number} sum\n */",
                description: "Adds.",
                params: [{ name: "a" }],
                jsdocParams: [{ name: "a", description: null }],
                returnType: "number",
                returns: { type: "number", description: "sum" },
            })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "require-param-description").length, 1);
    });

    check("lint: require-param-description does not fire when the @param has a description", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * Adds.\n * @param {number} a - first\n * @returns {number} sum\n */",
                description: "Adds.",
                params: [{ name: "a" }],
                jsdocParams: [{ name: "a", description: "first" }],
                returnType: "number",
                returns: { type: "number", description: "sum" },
            })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "require-param-description").length, 0);
    });

    check("lint: check-param-names fires when the same param set is documented out of order", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * Adds.\n * @param {number} b - second\n * @param {number} a - first\n * @returns {number} sum\n */",
                description: "Adds.",
                params: [{ name: "a" }, { name: "b" }],
                jsdocParams: [{ name: "b", description: "second" }, { name: "a", description: "first" }],
                returnType: "number",
                returns: { type: "number", description: "sum" },
            })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "check-param-names").length, 1);
    });

    check("lint: check-param-names does not fire when the name sets differ (that's --check-drift's job)", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * Adds.\n * @param {number} a - first\n * @returns {number} sum\n */",
                description: "Adds.",
                params: [{ name: "a" }, { name: "b" }],
                jsdocParams: [{ name: "a", description: "first" }],
                returnType: "number",
                returns: { type: "number", description: "sum" },
            })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "check-param-names").length, 0);
    });

    // -- require-returns family -----------------------------------------------

    check("lint: require-returns fires when a real-return function has no @returns", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * Adds.\n * @param {number} a - first\n */",
                description: "Adds.",
                params: [{ name: "a" }],
                jsdocParams: [{ name: "a", description: "first" }],
                returnType: "number",
                returns: null,
            })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "require-returns").length, 1);
    });

    check("lint: require-returns does not fire for a void function", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * Logs.\n */",
                description: "Logs.",
                returnType: "void",
                returns: null,
            })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "require-returns").length, 0);
    });

    check("lint: require-returns-description fires when @returns has no description", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * Adds.\n * @returns {number}\n */",
                description: "Adds.",
                returnType: "number",
                returns: { type: "number", description: null },
            })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "require-returns-description").length, 1);
    });

    check("lint: require-returns-check fires when @returns is present but function has no return value", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * Logs.\n * @returns {void} nothing\n */",
                description: "Logs.",
                returnType: "void",
                returns: { type: "void", description: "nothing" },
            })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "require-returns-check").length, 1);
    });

    // -- require-description --------------------------------------------------

    check("lint: require-description fires when a block exists but has no description text", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * @param {number} a\n */",
                description: null,
                params: [{ name: "a" }],
                jsdocParams: [{ name: "a", description: "x" }],
            })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "require-description").length, 1);
    });

    // -- check-tag-names --------------------------------------------------------

    check("lint: check-tag-names fires on an unknown/misspelled tag", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * Adds.\n * @parm {number} a\n */",
                description: "Adds.",
            })],
            classes: [],
        };
        const issues = issuesOf(moduleData, "check-tag-names");
        assert.strictEqual(issues.length, 1);
        assert.match(issues[0].message, /@parm/);
    });

    check("lint: check-tag-names does not fire on standard tags (KNOWN_TAGS floor)", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * Adds.\n * @param {number} a - first\n * @returns {number} sum\n * @throws {Error} bad\n * @since 1.0.0\n * @deprecated use x instead\n * @example\n * add(1, 2)\n */",
                description: "Adds.",
            })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "check-tag-names").length, 0);
    });

    check("lint: KNOWN_TAGS includes every tag lib/extractor.js's parseJSDocBlock recognizes", () => {
        ["param", "returns", "return", "throws", "example", "deprecated", "since", "module", "description"]
            .forEach((t) => assert.ok(KNOWN_TAGS.has(t), `KNOWN_TAGS missing floor tag "${t}"`));
    });

    // -- empty-tags ---------------------------------------------------------

    check("lint: empty-tags fires when a no-description tag carries trailing text", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * Does a thing.\n * @abstract should not have text\n */",
                description: "Does a thing.",
            })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "empty-tags").length, 1);
    });

    check("lint: empty-tags does not fire on a bare no-description tag", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * Does a thing.\n * @abstract\n */",
                description: "Does a thing.",
            })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "empty-tags").length, 0);
    });

    // -- no-multi-asterisks --------------------------------------------------

    check("lint: no-multi-asterisks fires on an interior line with extra leading asterisks", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n ** Does a thing.\n */",
                description: "Does a thing.",
            })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "no-multi-asterisks").length, 1);
    });

    check("lint: no-multi-asterisks does not fire on a normally-formatted block", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * Does a thing.\n * @returns {void}\n */",
                description: "Does a thing.",
            })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "no-multi-asterisks").length, 0);
    });

    // -- no-blank-block-descriptions -----------------------------------------

    check("lint: no-blank-block-descriptions fires on a fully empty block", () => {
        const moduleData = {
            functions: [fn({ rawComment: "/**\n */", description: null })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "no-blank-block-descriptions").length, 1);
    });

    check("lint: no-blank-block-descriptions does not fire when tags are present (even with no prose)", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * @param {number} a\n */",
                description: null,
                params: [{ name: "a" }],
                jsdocParams: [{ name: "a", description: "x" }],
            })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "no-blank-block-descriptions").length, 0);
    });

    // -- no-bad-blocks --------------------------------------------------------

    check("lint: no-bad-blocks fires when extractor surfaced a malformed near-miss comment", () => {
        const moduleData = {
            functions: [fn({ rawComment: null, badComment: "/*** @param a bad ***/", description: null })],
            classes: [],
        };
        assert.strictEqual(issuesOf(moduleData, "no-bad-blocks").length, 1);
    });

    // -- structural coverage: constructor / methods / classes / generic kinds --

    check("lint: class constructor is checked for params but not returns", () => {
        const moduleData = {
            functions: [],
            classes: [{
                name: "Dog",
                rawComment: "/**\n * A dog.\n */",
                description: "A dog.",
                constructor: {
                    params: [{ name: "name" }, { name: "age" }],
                    jsdocParams: [{ name: "name", description: "n" }],
                    description: "Makes a dog.",
                    rawComment: "/**\n * Makes a dog.\n * @param {string} name - n\n */",
                    badComment: null,
                },
                methods: [], getters: [], setters: [], properties: [],
            }],
        };
        const issues = lintModule(moduleData);
        const ctorIssues = issues.filter((i) => i.symbol === "Dog.constructor");
        assert.ok(ctorIssues.some((i) => i.rule === "require-param" && i.message.includes("age")));
        assert.strictEqual(ctorIssues.some((i) => i.rule === "require-returns"), false, "constructors have no returnType/returns field, must never be checked");
    });

    check("lint: class method symbol is 'ClassName.methodName'", () => {
        const moduleData = {
            functions: [],
            classes: [{
                name: "Dog",
                rawComment: "/**\n * A dog.\n */",
                description: "A dog.",
                constructor: null,
                methods: [fn({ name: "bark", rawComment: null, jsdocParams: [], returns: null, description: null })],
                getters: [], setters: [], properties: [],
            }],
        };
        const issues = lintModule(moduleData);
        assert.ok(issues.some((i) => i.symbol === "Dog.bark" && i.rule === "require-jsdoc"));
    });

    check("lint: generic kinds (interfaces/typeAliases/enums/variables) get require-jsdoc + text-level checks", () => {
        const moduleData = {
            functions: [], classes: [],
            interfaces: [{ name: "Shape", rawComment: null, description: null }],
            typeAliases: [{ name: "Id", rawComment: "/**\n * @parm bad tag\n */", description: null }],
            enums: [{ name: "Color", rawComment: "/**\n * Colors.\n */", description: "Colors." }],
            variables: [{ name: "X", rawComment: null, description: null }],
        };
        const issues = lintModule(moduleData);
        assert.ok(issues.some((i) => i.symbol === "Shape" && i.rule === "require-jsdoc"));
        assert.ok(issues.some((i) => i.symbol === "Id" && i.rule === "check-tag-names"));
        assert.ok(!issues.some((i) => i.symbol === "Color"), "fully documented enum should have zero issues");
        assert.ok(issues.some((i) => i.symbol === "X" && i.rule === "require-jsdoc"));
    });

    // -- purity ---------------------------------------------------------------

    check("lint: purity — same input produces same output across two calls", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * Adds.\n * @param {number} a\n * @returns {number}\n */",
                description: "Adds.",
                params: [{ name: "a" }, { name: "b" }],
                jsdocParams: [{ name: "a", description: null }],
                returnType: "number",
                returns: { type: "number", description: null },
            })],
            classes: [],
        };
        const first = lintModule(moduleData);
        const second = lintModule(moduleData);
        assert.deepStrictEqual(first, second, "lintModule is not pure/deterministic");
    });

    check("lint: a fully-documented, well-formed function yields zero issues", () => {
        const moduleData = {
            functions: [fn({
                rawComment: "/**\n * Adds two numbers.\n * @param {number} a - first\n * @param {number} b - second\n * @returns {number} the sum\n */",
                description: "Adds two numbers.",
                params: [{ name: "a" }, { name: "b" }],
                jsdocParams: [{ name: "a", description: "first" }, { name: "b", description: "second" }],
                returnType: "number",
                returns: { type: "number", description: "the sum" },
            })],
            classes: [],
        };
        assert.deepStrictEqual(lintModule(moduleData), []);
    });

};
