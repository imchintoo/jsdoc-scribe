"use strict";

/**
 * ast-utils unit tests -- tests lib/ast-utils.js in isolation.
 * Covers the fixture table required by task-a10-01/02: nested-function
 * boundary behavior, short-circuiting, and the two type-guard wrappers.
 */

const ts = require("typescript");
const assert = require("assert");
const { getDescendantsOfKind, findFirstDescendant, asClass, asFunctionLike } = require("../lib/ast-utils.js");

function parse(src) {
    return ts.createSourceFile("fixture.ts", src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function firstFunctionBody(sourceFile) {
    const fn = findFirstDescendant(sourceFile, (n) => ts.isFunctionDeclaration(n));
    return fn && fn.body;
}

module.exports = function runAstUtilsTests(check) {

    // -----------------------------------------------------------------
    // findFirstDescendant -- reproduces hasReturnWithValue's exact contract
    // -----------------------------------------------------------------

    check("ast-utils: findFirstDescendant returns undefined on an empty block (no return)", () => {
        const sf = parse("function f() {}\n");
        const body = firstFunctionBody(sf);
        const found = findFirstDescendant(body, (n) => ts.isReturnStatement(n) && !!n.expression);
        assert.strictEqual(found, undefined);
    });

    check("ast-utils: findFirstDescendant finds a single top-level return with a value", () => {
        const sf = parse("function f() { return 1; }\n");
        const body = firstFunctionBody(sf);
        const found = findFirstDescendant(body, (n) => ts.isReturnStatement(n) && !!n.expression);
        assert.ok(found, "expected a return statement to be found");
    });

    check("ast-utils: findFirstDescendant finds a return nested inside if/for", () => {
        const sf = parse("function f(x) { for (let i = 0; i < x; i++) { if (i === 2) { return i; } } }\n");
        const body = firstFunctionBody(sf);
        const found = findFirstDescendant(body, (n) => ts.isReturnStatement(n) && !!n.expression);
        assert.ok(found, "expected a nested return statement to be found");
    });

    check("ast-utils: findFirstDescendant's stopAt param reproduces hasReturnWithValue's function-boundary behavior (real helper, not a hand-rolled walker)", () => {
        const sf = parse("function f() { const g = function() { return 1; }; }\n");
        const body = firstFunctionBody(sf);
        const found = findFirstDescendant(
            body,
            (n) => ts.isReturnStatement(n) && !!n.expression,
            (n) => ts.isFunctionLike(n),
        );
        assert.strictEqual(found, undefined, "should not find return inside nested function expression");
    });

    check("ast-utils: findFirstDescendant without stopAt DOES descend into nested function expressions (opt-in boundary, not default)", () => {
        const sf = parse("function f() { const g = function() { return 1; }; }\n");
        const body = firstFunctionBody(sf);
        const found = findFirstDescendant(body, (n) => ts.isReturnStatement(n) && !!n.expression);
        assert.ok(found, "without stopAt, the nested return should be found");
    });

    check("ast-utils: findFirstDescendant short-circuits -- stops at the first of multiple returns", () => {
        const sf = parse("function f(x) { if (x) { return 1; } return 2; }\n");
        const body = firstFunctionBody(sf);
        let visitCount = 0;
        const found = findFirstDescendant(body, (n) => {
            if (ts.isReturnStatement(n)) visitCount += 1;
            return ts.isReturnStatement(n) && !!n.expression;
        });
        assert.ok(found, "expected a match");
        assert.strictEqual(visitCount, 1, "should not have visited the second return after finding the first");
    });

    check("ast-utils: findFirstDescendant returns undefined, never throws, when nothing matches", () => {
        const sf = parse("const x = 1;\n");
        assert.doesNotThrow(() => {
            const found = findFirstDescendant(sf, (n) => ts.isReturnStatement(n));
            assert.strictEqual(found, undefined);
        });
    });

    // -----------------------------------------------------------------
    // getDescendantsOfKind -- unconditional full descent (no boundary)
    // -----------------------------------------------------------------

    check("ast-utils: getDescendantsOfKind returns an empty array when no node of that kind exists", () => {
        const sf = parse("function f() {}\n");
        const results = getDescendantsOfKind(sf, ts.SyntaxKind.ReturnStatement);
        assert.strictEqual(results.length, 0);
    });

    check("ast-utils: getDescendantsOfKind finds all matches, including inside nested functions (unconditional descent)", () => {
        const sf = parse("function f() { const g = function() { return 1; }; return 2; }\n");
        const results = getDescendantsOfKind(sf, ts.SyntaxKind.ReturnStatement);
        assert.strictEqual(results.length, 2, "expected both the outer and the nested-function return to be collected");
    });

    // -----------------------------------------------------------------
    // asClass / asFunctionLike
    // -----------------------------------------------------------------

    check("ast-utils: asClass returns the node for a class declaration", () => {
        const sf = parse("class Foo {}\n");
        const cls = findFirstDescendant(sf, (n) => ts.isClassDeclaration(n));
        assert.strictEqual(asClass(cls), cls);
    });

    check("ast-utils: asClass returns null for a non-class node", () => {
        const sf = parse("function f() {}\n");
        const fn = findFirstDescendant(sf, (n) => ts.isFunctionDeclaration(n));
        assert.strictEqual(asClass(fn), null);
    });

    check("ast-utils: asFunctionLike returns the node for an arrow function and a function expression", () => {
        const sf = parse("const a = () => 1; const b = function() { return 2; };\n");
        const arrow = findFirstDescendant(sf, (n) => ts.isArrowFunction(n));
        const funcExpr = findFirstDescendant(sf, (n) => ts.isFunctionExpression(n));
        assert.strictEqual(asFunctionLike(arrow), arrow);
        assert.strictEqual(asFunctionLike(funcExpr), funcExpr);
    });

    check("ast-utils: asFunctionLike returns null for a function declaration (handled as a separate case in extractor.js)", () => {
        const sf = parse("function f() {}\n");
        const fn = findFirstDescendant(sf, (n) => ts.isFunctionDeclaration(n));
        assert.strictEqual(asFunctionLike(fn), null);
    });
};
