"use strict";

/**
 * Drift detector unit tests — tests lib/drift.js in isolation.
 * Uses hand-built moduleData fixtures (the shape extractModule() returns)
 * rather than parsing files, since detectDrift() is a pure data function.
 */

const assert = require("assert");
const { detectDrift } = require("../lib/drift.js");

function fn(overrides) {
    return Object.assign({
        name: "example",
        line: 10,
        params: [],
        jsdocParams: [],
        returnType: "void",
        returns: null,
    }, overrides);
}

module.exports = function runDriftTests(check) {

    check("drift: AST param missing from jsdoc produces one missing-param issue", () => {
        const moduleData = {
            functions: [fn({
                params: [{ name: "a" }, { name: "b" }],
                jsdocParams: [{ name: "a" }],
                returns: { type: "void" }, // gives it a jsdoc block so it's in scope
            })],
            classes: [],
        };
        const issues = detectDrift(moduleData);
        const missing = issues.filter(i => i.kind === "missing-param");
        assert.strictEqual(missing.length, 1, "expected exactly one missing-param issue");
        assert.strictEqual(missing[0].detail.param, "b");
        assert.strictEqual(missing[0].symbol, "example");
    });

    check("drift: jsdoc param not in AST produces one removed-param issue", () => {
        const moduleData = {
            functions: [fn({
                params: [{ name: "a" }],
                jsdocParams: [{ name: "a" }, { name: "old" }],
            })],
            classes: [],
        };
        const issues = detectDrift(moduleData);
        const removed = issues.filter(i => i.kind === "removed-param");
        assert.strictEqual(removed.length, 1, "expected exactly one removed-param issue");
        assert.strictEqual(removed[0].detail.param, "old");
    });

    check("drift: return type mismatch (non-'any' docType differing from astType) flagged", () => {
        const moduleData = {
            functions: [fn({
                returnType: "number",
                returns: { type: "string" },
            })],
            classes: [],
        };
        const issues = detectDrift(moduleData);
        const mismatches = issues.filter(i => i.kind === "return-type-mismatch");
        assert.strictEqual(mismatches.length, 1);
        assert.strictEqual(mismatches[0].detail.astType, "number");
        assert.strictEqual(mismatches[0].detail.docType, "string");
    });

    check("drift: @returns {any} never flags a return-type-mismatch", () => {
        const moduleData = {
            functions: [fn({
                returnType: "number",
                returns: { type: "any" },
            })],
            classes: [],
        };
        const issues = detectDrift(moduleData);
        assert.strictEqual(issues.filter(i => i.kind === "return-type-mismatch").length, 0);
    });

    check("drift: renamed param produces exactly one missing + one removed, no fuzzy match", () => {
        const moduleData = {
            functions: [fn({
                params: [{ name: "newName" }],
                jsdocParams: [{ name: "oldName" }],
            })],
            classes: [],
        };
        const issues = detectDrift(moduleData);
        assert.strictEqual(issues.length, 2, "expected exactly 2 issues for a rename");
        assert.ok(issues.some(i => i.kind === "missing-param" && i.detail.param === "newName"));
        assert.ok(issues.some(i => i.kind === "removed-param" && i.detail.param === "oldName"));
    });

    check("drift: purity — same input produces same output across two calls", () => {
        const moduleData = {
            functions: [fn({
                params: [{ name: "a" }, { name: "b" }],
                jsdocParams: [{ name: "a" }],
                returnType: "number",
                returns: { type: "string" },
            })],
            classes: [],
        };
        const first = detectDrift(moduleData);
        const second = detectDrift(moduleData);
        assert.deepStrictEqual(first, second, "detectDrift is not pure/deterministic");
    });

    check("drift: AC5 — no jsdoc block at all (empty jsdocParams, null returns) yields zero issues", () => {
        const moduleData = {
            functions: [fn({
                params: [{ name: "a" }, { name: "b" }],
                jsdocParams: [],
                returns: null,
            })],
            classes: [],
        };
        const issues = detectDrift(moduleData);
        assert.strictEqual(issues.length, 0, "undocumented functions are --check territory, not drift");
    });

    check("drift: class method symbol is 'ClassName.methodName'", () => {
        const moduleData = {
            functions: [],
            classes: [{
                name: "Dog",
                constructor: null,
                methods: [{
                    name: "bark",
                    line: 5,
                    params: [{ name: "loud" }],
                    jsdocParams: [],
                    returnType: "void",
                    returns: { type: "void" },
                }],
            }],
        };
        const issues = detectDrift(moduleData);
        assert.ok(issues.some(i => i.symbol === "Dog.bark" && i.kind === "missing-param"));
    });

    check("drift: constructor symbol is 'ClassName.constructor', no return-type check applied", () => {
        const moduleData = {
            functions: [],
            classes: [{
                name: "Dog",
                constructor: {
                    params: [{ name: "name" }, { name: "age" }],
                    jsdocParams: [{ name: "name" }],
                },
                methods: [],
            }],
        };
        const issues = detectDrift(moduleData);
        assert.strictEqual(issues.length, 1);
        assert.strictEqual(issues[0].symbol, "Dog.constructor");
        assert.strictEqual(issues[0].kind, "missing-param");
        assert.strictEqual(issues[0].detail.param, "age");
        assert.strictEqual(issues[0].line, null, "constructor has no line field — must pass null, not invent one");
    });

    check("drift: KNOWN GAP — getter/setter drift is not detected (detectDrift only walks cls.methods)", () => {
        // extractModule() returns getters/setters as separate arrays (lib/extractor.js:272-273),
        // but detectDrift() (lib/drift.js) never reads moduleData.classes[i].getters/.setters.
        // A renamed setter param or a drifted getter return type produces zero issues today.
        // This test documents the gap so it can't regress silently and so it's visible for
        // triage (v1 scope limitation vs. bug — see report to tech-lead).
        const moduleData = {
            functions: [],
            classes: [{
                name: "Box",
                constructor: null,
                methods: [],
                getters: [{ name: "value", returnType: "number", jsdocParams: [], returns: { type: "string" }, line: 3 }],
                setters: [{ name: "value", params: [{ name: "v" }], jsdocParams: [{ name: "oldName" }], line: 7 }],
            }],
        };
        const issues = detectDrift(moduleData);
        assert.strictEqual(issues.length, 0, "documents current behavior: getters/setters are invisible to drift detection");
    });

    check("drift: astType 'any' vs docType 'any' never flags return-type-mismatch", () => {
        const moduleData = {
            functions: [fn({
                returnType: "any",
                returns: { type: "any" },
            })],
            classes: [],
        };
        const issues = detectDrift(moduleData);
        assert.strictEqual(issues.filter(i => i.kind === "return-type-mismatch").length, 0);
    });

    check("drift: astType 'any' (untyped .js inference fallback) with concrete documented @returns type is NOT drift", () => {
        // Regression for QA-found bug: plain .js functions get returnType: "any"
        // from inferReturnType()'s syntactic fallback almost always. A human-
        // written concrete @returns type there is more precise than the parser,
        // not evidence of drift — it must not be flagged.
        const moduleData = {
            functions: [fn({
                returnType: "any",
                returns: { type: "string" },
            })],
            classes: [],
        };
        const issues = detectDrift(moduleData);
        assert.strictEqual(issues.filter(i => i.kind === "return-type-mismatch").length, 0,
            "documented concrete type against AST 'any' fallback must not be flagged as drift");
    });

    check("drift: module with only interfaces (no functions/classes) yields zero issues, no crash", () => {
        const moduleData = {
            functions: [],
            classes: [],
            interfaces: [{ name: "Shape", properties: [{ name: "sides", type: "number" }] }],
        };
        const issues = detectDrift(moduleData);
        assert.strictEqual(issues.length, 0, "interfaces have no drift surface (no AST-vs-doc param/return diff applies)");
    });

};
