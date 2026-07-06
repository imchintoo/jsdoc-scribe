"use strict";

/**
 * lib/import-graph.js
 * ----------------------------------------
 * Project-wide import graph + orphan-file detection, for the internal
 * project dashboard (Track B, see docs/backlog/adr-phase-j-project-dashboard.md).
 *
 * CORRECTION (caught during implementation, see task-pj-01-import-graph.md):
 * the ADR and story-code-health-dashboard both assumed this module would
 * "reuse lib/extractor.js's existing per-file import/export data." That
 * data does not exist -- extractModule() (lib/extractor.js) returns
 * { filePath, moduleName, description, since, functions, classes,
 * interfaces, typeAliases, enums, variables } with no imports/exports
 * field. This module does its own lightweight extraction instead, using
 * the `typescript` compiler API -- the same parser lib/extractor.js
 * already uses, so it is zero NEW dependency, just not zero new parsing
 * as originally (incorrectly) assumed.
 */

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

/** @param {string} file @returns {ts.ScriptKind} */
function getScriptKind(file) {
    switch (path.extname(file).toLowerCase()) {
        case ".tsx":
            return ts.ScriptKind.TSX;
        case ".ts":
            return ts.ScriptKind.TS;
        case ".jsx":
            return ts.ScriptKind.JSX;
        default:
            return ts.ScriptKind.JS;
    }
}

/**
 * Extract raw import/require specifiers (module paths exactly as written in
 * source) for one file. Handles ESM `import ... from "x"` / `export ...
 * from "x"`, CommonJS `require("x")`, and best-effort dynamic `import("x")`.
 * @param {string} filePath
 * @returns {string[]} raw specifiers, e.g. ["./coverage.js", "typescript"]
 */
function extractSpecifiers(filePath) {
    const text = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, getScriptKind(filePath));
    const specifiers = [];

    function visit(node) {
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
            specifiers.push(node.moduleSpecifier.text);
        } else if (ts.isCallExpression(node)) {
            const callee = node.expression;
            const isRequireCall = ts.isIdentifier(callee) && callee.text === "require";
            const isDynamicImport = callee.kind === ts.SyntaxKind.ImportKeyword;
            if ((isRequireCall || isDynamicImport) && node.arguments.length > 0 && ts.isStringLiteral(node.arguments[0])) {
                specifiers.push(node.arguments[0].text);
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return specifiers;
}

/**
 * Resolve a raw specifier (as written in `fromFile`) to an absolute path,
 * but only if it lands on one of `knownFilesSet` -- external packages
 * (non-relative specifiers, or relative specifiers that resolve outside the
 * analyzed set) are not graph nodes.
 * @param {string} spec
 * @param {string} fromFile
 * @param {Set<string>} knownFilesSet
 * @returns {string|null}
 */
function resolveSpecifier(spec, fromFile, knownFilesSet) {
    if (!spec || spec[0] !== ".") return null; // bare specifier -> external package, not part of this graph
    const baseDir = path.dirname(fromFile);
    const raw = path.resolve(baseDir, spec);
    const candidates = [raw, raw + ".js", raw + ".jsx", raw + ".ts", raw + ".tsx", path.join(raw, "index.js"), path.join(raw, "index.ts")];
    for (let i = 0; i < candidates.length; i++) {
        if (knownFilesSet.has(candidates[i])) return candidates[i];
    }
    return null;
}

/**
 * Build a project-wide import graph across `files`.
 * @param {string[]} files - file paths (same set the caller already collected via collectFiles).
 * @returns {{edges: {from:string,to:string}[], inDegree: Object<string,number>}}
 */
function buildImportGraph(files) {
    const absFiles = (files || []).map(function (f) { return path.resolve(f); });
    const knownFilesSet = new Set(absFiles);
    const edges = [];
    const inDegree = {};
    absFiles.forEach(function (f) { inDegree[f] = 0; });

    absFiles.forEach(function (file) {
        let specifiers;
        try {
            specifiers = extractSpecifiers(file);
        } catch (err) {
            return; // unreadable/unparsable file -- same per-file error tolerance as the rest of the tool
        }
        specifiers.forEach(function (spec) {
            const resolved = resolveSpecifier(spec, file, knownFilesSet);
            if (resolved && resolved !== file) {
                edges.push({ from: file, to: resolved });
                inDegree[resolved] = (inDegree[resolved] || 0) + 1;
            }
        });
    });

    return { edges: edges, inDegree: inDegree };
}

/**
 * Files with zero incoming imports that are not among the known entry points.
 * @param {{edges: Array, inDegree: Object<string,number>}} graph
 * @param {string[]} entryPoints - known entry-point file paths (bin scripts, package.json main/exports targets).
 * @returns {string[]} orphan file paths, sorted.
 */
function findOrphanFiles(graph, entryPoints) {
    const entrySet = new Set((entryPoints || []).map(function (f) { return path.resolve(f); }));
    return Object.keys(graph.inDegree)
        .filter(function (f) { return graph.inDegree[f] === 0 && !entrySet.has(f); })
        .sort();
}

module.exports = { buildImportGraph, findOrphanFiles, extractSpecifiers };
