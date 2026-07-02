"use strict";

/**
 * lib/drift.js
 * ----------------------------------------
 * Pure, synchronous diff between AST-truth and JSDoc-truth for a single
 * module. Consumes the shape extractModule() (lib/extractor.js) already
 * returns — no new parsing, no I/O, no external dependency.
 *
 * See docs/backlog/adr-phase-i-drift-detection.md for the DriftIssue schema
 * and rationale (no fuzzy rename matching, no type-string normalization —
 * both explicit v1 scope limits, not bugs).
 */

/**
 * Diff AST-truth vs JSDoc-truth for every function/method/constructor in a
 * module and return the list of drift issues found.
 * @param {object} moduleData - extractModule() output for one file.
 * @returns {Array<{symbol: string, kind: string, detail: object, line: (number|null)}>}
 */
function detectDrift(moduleData) {
    var issues = [];

    function diffParams(symbol, params, jsdocParams, line) {
        var astNames = (params || []).map(function (p) { return p.name; });
        var docNames = (jsdocParams || []).map(function (p) { return p.name; });
        astNames.forEach(function (n) {
            if (docNames.indexOf(n) === -1) issues.push({ symbol: symbol, kind: "missing-param", detail: { param: n }, line: line });
        });
        docNames.forEach(function (n) {
            if (astNames.indexOf(n) === -1) issues.push({ symbol: symbol, kind: "removed-param", detail: { param: n }, line: line });
        });
    }

    function diffReturn(symbol, returnType, returns, line) {
        // Both sides must carry real, non-"any" type information to compare.
        // "any" on the AST side is the normal syntactic fallback for plain
        // (untyped) .js files — inferReturnType() can't infer a concrete type
        // without an explicit annotation, so a documented concrete @returns
        // type there is the human being *more* precise than the parser, not
        // evidence of drift. Only flag when neither side is "any" and they
        // actually disagree.
        if (returns && returns.type && returns.type !== "any" && returnType !== "any" && returns.type !== returnType) {
            issues.push({ symbol: symbol, kind: "return-type-mismatch", detail: { astType: returnType, docType: returns.type }, line: line });
        }
    }

    function hasBlock(jsdocParams, returns) {
        return (jsdocParams && jsdocParams.length > 0) || !!returns;
    }

    (moduleData.functions || []).forEach(function (fn) {
        if (!hasBlock(fn.jsdocParams, fn.returns)) return; // AC5: no block, out of scope (that's --check territory)
        diffParams(fn.name, fn.params, fn.jsdocParams, fn.line);
        diffReturn(fn.name, fn.returnType, fn.returns, fn.line);
    });

    (moduleData.classes || []).forEach(function (cls) {
        if (cls.constructor && hasBlock(cls.constructor.jsdocParams, null)) {
            diffParams(cls.name + ".constructor", cls.constructor.params, cls.constructor.jsdocParams, null);
        }
        (cls.methods || []).forEach(function (m) {
            if (!hasBlock(m.jsdocParams, m.returns)) return;
            var symbol = cls.name + "." + m.name;
            diffParams(symbol, m.params, m.jsdocParams, m.line);
            diffReturn(symbol, m.returnType, m.returns, m.line);
        });
    });

    return issues;
}

module.exports = { detectDrift };
