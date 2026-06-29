"use strict";

/**
 * comment-block-generator — lib/index.js
 * ----------------------------------------
 * A PURE, deterministic, AST-based JSDoc comment generator.
 * No AI / LLM / external API is used anywhere — every comment line is
 * derived mechanically from syntax: names, modifiers, type annotations,
 * parameter lists, heritage clauses, enum members, etc.
 *
 * Works on plain JavaScript (.js/.jsx) AND TypeScript (.ts/.tsx) because
 * both are parsed with the TypeScript compiler's parser, which is a
 * superset parser for JS (it never type-checks, only parses syntax).
 *
 * This file exports plain functions so it can be:
 *   1. Driven by bin/cli.js as a command-line tool, or
 *   2. require()'d directly in another Node script / build pipeline:
 *        const { processFile } = require('jsdoc-scribe');
 */

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const DEFAULT_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
const DEFAULT_IGNORE_DIRS = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    "out",
    "coverage",
    ".next",
    ".turbo",
    ".cache",
]);

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

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

/** True if `node` already has a leading /** ... *\/ block right above it. */
function hasLeadingJSDoc(sourceFile, node) {
    const ranges = ts.getLeadingCommentRanges(sourceFile.text, node.getFullStart()) || [];
    return ranges.some((r) => sourceFile.text.slice(r.pos, r.pos + 3) === "/**");
}

/**
 * Walk backwards from the node's first real token to find where its own
 * line-indentation begins. Returns the exact insertion offset + the
 * whitespace string to reuse for every comment line, so the comment lines
 * up visually with the code it documents — without re-printing/reformatting
 * the rest of the file.
 */
function getIndentAndInsertionPos(sourceFile, node) {
    const start = node.getStart(sourceFile);
    const text = sourceFile.text;
    let i = start;
    while (i > 0 && (text[i - 1] === " " || text[i - 1] === "\t")) i--;
    return { pos: i, indent: text.slice(i, start) };
}

function modifiersOf(node) {
    const kinds = new Set((node.modifiers || []).map((m) => m.kind));
    return {
        isExported: kinds.has(ts.SyntaxKind.ExportKeyword),
        isAsync: kinds.has(ts.SyntaxKind.AsyncKeyword),
        isStatic: kinds.has(ts.SyntaxKind.StaticKeyword),
        isReadonly: kinds.has(ts.SyntaxKind.ReadonlyKeyword),
        isPrivate: kinds.has(ts.SyntaxKind.PrivateKeyword),
        isProtected: kinds.has(ts.SyntaxKind.ProtectedKeyword),
        isAbstract: kinds.has(ts.SyntaxKind.AbstractKeyword),
    };
}

function typeText(node) {
    return node && node.type ? node.type.getText() : null;
}

function isFunctionLikeInitializer(init) {
    return !!init && (init.kind === ts.SyntaxKind.ArrowFunction || init.kind === ts.SyntaxKind.FunctionExpression);
}

/** Purely syntactic: does this block contain a `return <value>;` at its own level (not inside a nested function)? */
function hasReturnWithValue(block) {
    let found = false;
    function walk(n) {
        if (found) return;
        if (ts.isReturnStatement(n)) {
            if (n.expression) found = true;
            return;
        }
        if (ts.isFunctionLike(n)) return; // don't attribute a nested closure's return to the outer function
        ts.forEachChild(n, walk);
    }
    walk(block);
    return found;
}

/**
 * Decide the @returns type with no semantics, no AI — just syntax:
 * 1. An explicit type annotation always wins.
 * 2. A concise arrow body (`x => x + 1`, no braces) always produces a value.
 * 3. A block body is scanned for a top-level `return <value>;`.
 * 4. Otherwise it's void.
 */
function inferReturnType(fnNode) {
    const explicit = typeText(fnNode);
    if (explicit) return explicit;
    const body = fnNode.body;
    if (!body) return "void";
    if (body.kind !== ts.SyntaxKind.Block) return "any"; // concise arrow body
    return hasReturnWithValue(body) ? "any" : "void";
}

/** Best-effort, purely syntactic type guess from an initializer expression. No semantics, no AI. */
function inferTypeFromInitializer(init) {
    if (!init) return "any";
    switch (init.kind) {
        case ts.SyntaxKind.StringLiteral:
        case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
            return "string";
        case ts.SyntaxKind.NumericLiteral:
            return "number";
        case ts.SyntaxKind.TrueKeyword:
        case ts.SyntaxKind.FalseKeyword:
            return "boolean";
        case ts.SyntaxKind.ArrayLiteralExpression:
            return "Array";
        case ts.SyntaxKind.ObjectLiteralExpression:
            return "Object";
        case ts.SyntaxKind.ArrowFunction:
        case ts.SyntaxKind.FunctionExpression:
            return "Function";
        case ts.SyntaxKind.NewExpression:
            return init.expression ? init.expression.getText() : "Object";
        default:
            return "any";
    }
}

// ---------------------------------------------------------------------------
// Comment builders — every line below comes ONLY from AST shape, never from
// guessing "what the code means".
// ---------------------------------------------------------------------------

function buildParamLines(params) {
    return (params || []).map((p) => {
        const name = p.name.getText();
        const optional = !!p.questionToken || !!p.initializer;
        const type = typeText(p) || (p.initializer ? inferTypeFromInitializer(p.initializer) : "any");
        const label = optional ? `[${name}]` : name;
        return ` * @param {${type}} ${label}`;
    });
}

function buildFunctionDoc({ name, params, returnType, mods, isGenerator }) {
    const lines = ["/**", ` * @function ${name || "anonymous"}`];
    if (mods.isExported) lines.push(" * @exported");
    if (mods.isAsync) lines.push(" * @async");
    if (isGenerator) lines.push(" * @generator");
    lines.push(...buildParamLines(params));
    lines.push(` * @returns {${returnType || "void"}}`);
    lines.push(" */");
    return lines;
}

function buildClassDoc(node) {
    const name = node.name ? node.name.getText() : "AnonymousClass";
    const mods = modifiersOf(node);
    const heritage = node.heritageClauses || [];
    const lines = ["/**", ` * @class ${name}`];
    if (mods.isExported) lines.push(" * @exported");
    if (mods.isAbstract) lines.push(" * @abstract");
    for (const h of heritage) {
        const kw = h.token === ts.SyntaxKind.ExtendsKeyword ? "@extends" : "@implements";
        for (const t of h.types) lines.push(` * ${kw} ${t.getText()}`);
    }
    lines.push(" */");
    return lines;
}

function buildMethodDoc(node) {
    const mods = modifiersOf(node);
    const visibility = mods.isPrivate ? "private" : mods.isProtected ? "protected" : "public";
    const name = node.name.getText();
    const kind = ts.isGetAccessorDeclaration(node) ? "getter" : ts.isSetAccessorDeclaration(node) ? "setter" : "method";
    const lines = ["/**", ` * @${kind} ${name}`, ` * @${visibility}`];
    if (mods.isStatic) lines.push(" * @static");
    if (mods.isAbstract) lines.push(" * @abstract");
    if (mods.isAsync) lines.push(" * @async");
    if (node.asteriskToken) lines.push(" * @generator");
    lines.push(...buildParamLines(node.parameters));
    lines.push(` * @returns {${inferReturnType(node)}}`);
    lines.push(" */");
    return lines;
}

function buildMemberDoc(node) {
    if (ts.isConstructorDeclaration(node)) {
        const lines = ["/**", " * @constructor"];
        lines.push(...buildParamLines(node.parameters));
        lines.push(" */");
        return lines;
    }
    if (ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) {
        return buildMethodDoc(node);
    }
    if (ts.isPropertyDeclaration(node)) {
        const mods = modifiersOf(node);
        const visibility = mods.isPrivate ? "private" : mods.isProtected ? "protected" : "public";
        const name = node.name.getText();
        const type = typeText(node) || inferTypeFromInitializer(node.initializer);
        const lines = ["/**", ` * @member ${name}`, ` * @type {${type}}`, ` * @${visibility}`];
        if (mods.isStatic) lines.push(" * @static");
        if (mods.isReadonly) lines.push(" * @readonly");
        lines.push(" */");
        return lines;
    }
    return null;
}

function buildSingleVariableDoc(decl, isConst) {
    const name = decl.name.getText();
    const init = decl.initializer;
    if (isFunctionLikeInitializer(init)) {
        return buildFunctionDoc({
            name,
            params: init.parameters,
            returnType: inferReturnType(init),
            mods: { isAsync: (init.modifiers || []).some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) },
            isGenerator: !!init.asteriskToken,
        });
    }
    const type = typeText(decl) || inferTypeFromInitializer(init);
    return ["/**", ` * @${isConst ? "constant" : "variable"} ${name}`, ` * @type {${type}}`, " */"];
}

function buildVariableStatementDoc(node, isConst) {
    const decls = node.declarationList.declarations;
    if (decls.length === 1) return buildSingleVariableDoc(decls[0], isConst);
    const lines = ["/**"];
    for (const decl of decls) {
        const type = typeText(decl) || inferTypeFromInitializer(decl.initializer);
        lines.push(` * @${isConst ? "constant" : "variable"} ${decl.name.getText()} {${type}}`);
    }
    lines.push(" */");
    return lines;
}

function buildInterfaceDoc(node) {
    const name = node.name.getText();
    const lines = ["/**", ` * @interface ${name}`];
    for (const m of node.members) {
        if (ts.isPropertySignature(m) && m.name) {
            lines.push(` * @property {${typeText(m) || "any"}} ${m.name.getText()}`);
        }
    }
    lines.push(" */");
    return lines;
}

function buildTypeAliasDoc(node) {
    return ["/**", ` * @typedef {${node.type.getText()}} ${node.name.getText()}`, " */"];
}

function buildEnumDoc(node) {
    const members = node.members.map((m) => m.name.getText()).join(" | ");
    return ["/**", ` * @enum ${node.name.getText()}`, ` * @values ${members}`, " */"];
}

// ---------------------------------------------------------------------------
// AST walk: collect {pos, text} edits, never mutating the source directly.
// ---------------------------------------------------------------------------

function collectEdits(sourceFile, force) {
    const edits = [];

    function addEdit(node, linesFn) {
        if (!force && hasLeadingJSDoc(sourceFile, node)) return;
        const lines = linesFn();
        if (!lines) return;
        const { pos, indent } = getIndentAndInsertionPos(sourceFile, node);
        const text = lines.map((l) => indent + l).join("\n") + "\n";
        edits.push({ pos, text });
    }

    function visit(node) {
        if (ts.isFunctionDeclaration(node) && node.body) {
            addEdit(node, () =>
                buildFunctionDoc({
                    name: node.name ? node.name.getText() : null,
                    params: node.parameters,
                    returnType: inferReturnType(node),
                    mods: modifiersOf(node),
                    isGenerator: !!node.asteriskToken,
                }),
            );
        } else if (ts.isClassDeclaration(node)) {
            addEdit(node, () => buildClassDoc(node));
        } else if (
            ts.isMethodDeclaration(node) ||
            ts.isConstructorDeclaration(node) ||
            ts.isPropertyDeclaration(node) ||
            ts.isGetAccessorDeclaration(node) ||
            ts.isSetAccessorDeclaration(node)
        ) {
            addEdit(node, () => buildMemberDoc(node));
        } else if (ts.isPropertyAssignment(node) && isFunctionLikeInitializer(node.initializer)) {
            const init = node.initializer;
            addEdit(node, () =>
                buildFunctionDoc({
                    name: node.name.getText(),
                    params: init.parameters,
                    returnType: inferReturnType(init),
                    mods: { isAsync: (init.modifiers || []).some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) },
                    isGenerator: !!init.asteriskToken,
                }),
            );
        } else if (ts.isVariableStatement(node)) {
            const isConst = (node.declarationList.flags & ts.NodeFlags.Const) !== 0;
            addEdit(node, () => buildVariableStatementDoc(node, isConst));
        } else if (ts.isInterfaceDeclaration(node)) {
            addEdit(node, () => buildInterfaceDoc(node));
        } else if (ts.isTypeAliasDeclaration(node)) {
            addEdit(node, () => buildTypeAliasDoc(node));
        } else if (ts.isEnumDeclaration(node)) {
            addEdit(node, () => buildEnumDoc(node));
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return edits;
}

// ---------------------------------------------------------------------------
// File processing
// ---------------------------------------------------------------------------

/**
 * Process a single file. Returns the number of comment blocks added.
 * @param {string} filePath
 * @param {{ write?: boolean, force?: boolean, silent?: boolean }} [options]
 * @returns {number}
 */
function processFile(filePath, options = {}) {
    const { write = false, force = false, silent = false } = options;
    const sourceText = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, getScriptKind(filePath));

    const edits = collectEdits(sourceFile, force);
    edits.sort((a, b) => b.pos - a.pos); // bottom-to-top so earlier offsets stay valid

    let output = sourceText;
    for (const edit of edits) {
        output = output.slice(0, edit.pos) + edit.text + output.slice(edit.pos);
    }

    const outPath = write ? filePath : filePath.replace(/(\.[jt]sx?)$/, "$1");
    if (edits.length > 0 || write) {
        fs.writeFileSync(outPath, output, "utf8");
    }
    if (!silent) {
        console.log(`  ${filePath} -> ${outPath} (${edits.length} block${edits.length === 1 ? "" : "s"})`);
    }
    return edits.length;
}

// ---------------------------------------------------------------------------
// Directory / project-wide scanning
// ---------------------------------------------------------------------------

/**
 * Recursively collect all matching source files under a path.
 * If `inputPath` is itself a file, returns it (if its extension matches).
 * @param {string} inputPath
 * @param {string[]} [extensions]
 * @param {Set<string>} [ignoreDirs]
 * @returns {string[]}
 */
function collectFiles(inputPath, extensions = DEFAULT_EXTENSIONS, ignoreDirs = DEFAULT_IGNORE_DIRS, ignorePatterns = []) {
    function matchesIgnore(fullPath) {
        const normalised = fullPath.replace(/\\/g, "/");
        return ignorePatterns.some(pat => {
            const norm = pat.replace(/\\/g, "/").replace(/^\.?\/?/, "");
            if (norm.startsWith("**/")) {
                const suffix = norm.slice(3);
                const re = new RegExp(suffix.replace(/\./g, "\\.").replace(/\*/g, "[^/]*") + "$");
                return re.test(normalised);
            }
            const re = new RegExp(norm.replace(/\./g, "\\.").replace(/\*/g, "[^/]*") + "$");
            return re.test(normalised);
        });
    }

    const stat = fs.statSync(inputPath);
    if (stat.isFile()) {
        if (matchesIgnore(inputPath)) return [];
        return extensions.includes(path.extname(inputPath).toLowerCase()) ? [inputPath] : [];
    }
    if (!stat.isDirectory()) return [];

    const results = [];
    function walk(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (ignoreDirs.has(entry.name) || entry.name.startsWith(".")) continue;
                if (matchesIgnore(full)) continue;
                walk(full);
            } else if (entry.isFile()) {
                const lower = entry.name.toLowerCase();
                if (lower.endsWith(".d.ts")) continue;
                if (matchesIgnore(full)) continue;
                if (extensions.includes(path.extname(lower))) results.push(full);
            }
        }
    }
    walk(inputPath);
    return results;
}

module.exports = {
    processFile,
    collectFiles,
    collectEdits,
    DEFAULT_EXTENSIONS,
    DEFAULT_IGNORE_DIRS,
};
