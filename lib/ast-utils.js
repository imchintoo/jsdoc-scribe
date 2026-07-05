"use strict";

// ---------------------------------------------------------------------------
// lib/ast-utils.js
// Small, purpose-scoped AST traversal/guard helpers, built directly on the
// raw `typescript` Compiler API. Per ADR-010 (docs/backlog/adr-010-checker-
// api-and-ast-ergonomics.md), this deliberately does NOT port ts-morph's
// general-purpose wrapper/manipulation API -- only the handful of traversal
// shapes lib/extractor.js and lib/program.js actually need. Zero new
// dependency: only `typescript` is imported, same as the rest of `lib/`.
// ---------------------------------------------------------------------------

const ts = require("typescript");

/**
 * Collect every descendant of `node` whose `kind` equals `kind`.
 * Unconditional full descent -- does NOT stop at function-like boundaries.
 * Callers that need boundary-stopping behavior (e.g. "only look inside this
 * function, not nested ones") should use `findFirstDescendant` with a
 * predicate that encodes that boundary instead.
 *
 * @param {import("typescript").Node} node - Root node to search from.
 * @param {import("typescript").SyntaxKind} kind - The SyntaxKind to match.
 * @returns {import("typescript").Node[]} All matching descendants, in
 *   depth-first document order. Empty array if none found.
 */
function getDescendantsOfKind(node, kind) {
    const results = [];
    function walk(n) {
        if (n.kind === kind) results.push(n);
        ts.forEachChild(n, walk);
    }
    ts.forEachChild(node, walk);
    return results;
}

/**
 * Depth-first search for the first descendant of `node` matching `predicate`.
 * Short-circuits on first match -- does not continue walking siblings/children
 * once found.
 *
 * An optional `stopAt` predicate lets the caller prune descent into a
 * subtree (checked only when `predicate` did not already match on that same
 * node) -- e.g. to stop at nested function boundaries the way
 * `extractor.js`'s original `hasReturnWithValue` did. Omit it for
 * unconditional full descent.
 *
 * @param {import("typescript").Node} node - Root node to search from.
 * @param {(n: import("typescript").Node) => boolean} predicate - Match test.
 * @param {(n: import("typescript").Node) => boolean} [stopAt] - When true for
 *   a non-matching node, its children are not visited.
 * @returns {import("typescript").Node|undefined} The first matching node, or
 *   `undefined` if none found.
 */
function findFirstDescendant(node, predicate, stopAt) {
    let found;
    function walk(n) {
        if (found) return;
        if (predicate(n)) { found = n; return; }
        if (stopAt && stopAt(n)) return;
        ts.forEachChild(n, walk);
    }
    ts.forEachChild(node, walk);
    return found;
}

/**
 * Narrow `node` to a class declaration, or return `null`.
 * Thin wrapper over `ts.isClassDeclaration` -- exists purely to cut the
 * `ts.isClassDeclaration(node) ? node : null` boilerplate at call sites.
 *
 * @param {import("typescript").Node} node - Node to test.
 * @returns {import("typescript").ClassDeclaration|null}
 */
function asClass(node) {
    return ts.isClassDeclaration(node) ? node : null;
}

/**
 * Narrow `node` to a function-like expression, or return `null`.
 * Matches exactly the set lib/extractor.js's own `isFunctionLike()` already
 * treats as function-like: arrow functions and function expressions (NOT
 * function declarations, which extractor.js handles as a separate case).
 *
 * @param {import("typescript").Node} node - Node to test.
 * @returns {import("typescript").ArrowFunction|import("typescript").FunctionExpression|null}
 */
function asFunctionLike(node) {
    return (!!node && (node.kind === ts.SyntaxKind.ArrowFunction || node.kind === ts.SyntaxKind.FunctionExpression))
        ? node
        : null;
}

module.exports = { getDescendantsOfKind, findFirstDescendant, asClass, asFunctionLike };
