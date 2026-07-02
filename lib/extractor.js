"use strict";

const path = require("path");
const ts = require("typescript");

function getScriptKind(file) {
    switch (path.extname(file).toLowerCase()) {
        case ".tsx": return ts.ScriptKind.TSX;
        case ".ts":  return ts.ScriptKind.TS;
        case ".jsx": return ts.ScriptKind.JSX;
        default:     return ts.ScriptKind.JS;
    }
}

function modifiersOf(node) {
    const kinds = new Set((node.modifiers || []).map(m => m.kind));
    return {
        isExported:  kinds.has(ts.SyntaxKind.ExportKeyword),
        isAsync:     kinds.has(ts.SyntaxKind.AsyncKeyword),
        isStatic:    kinds.has(ts.SyntaxKind.StaticKeyword),
        isReadonly:  kinds.has(ts.SyntaxKind.ReadonlyKeyword),
        isPrivate:   kinds.has(ts.SyntaxKind.PrivateKeyword),
        isProtected: kinds.has(ts.SyntaxKind.ProtectedKeyword),
        isAbstract:  kinds.has(ts.SyntaxKind.AbstractKeyword),
    };
}

function typeText(node) { return node && node.type ? node.type.getText() : null; }

function isFunctionLike(init) {
    return !!init && (init.kind === ts.SyntaxKind.ArrowFunction || init.kind === ts.SyntaxKind.FunctionExpression);
}

function hasReturnWithValue(block) {
    let found = false;
    function walk(n) {
        if (found) return;
        if (ts.isReturnStatement(n)) { if (n.expression) found = true; return; }
        if (ts.isFunctionLike(n)) return;
        ts.forEachChild(n, walk);
    }
    walk(block);
    return found;
}

function inferReturnType(fnNode) {
    const explicit = typeText(fnNode);
    if (explicit) return explicit;
    const body = fnNode.body;
    if (!body) return "void";
    if (body.kind !== ts.SyntaxKind.Block) return "any";
    return hasReturnWithValue(body) ? "any" : "void";
}

function inferTypeFromInitializer(init) {
    if (!init) return "any";
    switch (init.kind) {
        case ts.SyntaxKind.StringLiteral:
        case ts.SyntaxKind.NoSubstitutionTemplateLiteral: return "string";
        case ts.SyntaxKind.NumericLiteral:  return "number";
        case ts.SyntaxKind.TrueKeyword:
        case ts.SyntaxKind.FalseKeyword:    return "boolean";
        case ts.SyntaxKind.ArrayLiteralExpression:  return "Array";
        case ts.SyntaxKind.ObjectLiteralExpression: return "Object";
        case ts.SyntaxKind.ArrowFunction:
        case ts.SyntaxKind.FunctionExpression:      return "Function";
        case ts.SyntaxKind.NewExpression:
            return init.expression ? init.expression.getText() : "Object";
        default: return "any";
    }
}

function extractParams(params) {
    return (params || []).map(p => ({
        name: p.name.getText(),
        type: typeText(p) || (p.initializer ? inferTypeFromInitializer(p.initializer) : "any"),
        optional: !!p.questionToken || !!p.initializer,
    }));
}

function getLineNumber(sourceFile, node) {
    try { return sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1; }
    catch (_) { return null; }
}

// ---------------------------------------------------------------------------
// JSDoc comment extraction
// ---------------------------------------------------------------------------

/** Empty jsdoc result used as default */
function emptyJSDoc() {
    return { description: null, example: null, since: null, deprecated: null, params: [], returns: null, throws: [] };
}

/**
 * Parse a raw /** ... *\/ comment block.
 * Returns: { description, example, since, deprecated, params, returns, throws }
 *   - description: text before the first @tag line
 *   - example:     text after @example
 *   - since:       string after @since
 *   - deprecated:  message after @deprecated (or empty string if bare tag)
 *   - params:      [{ name, type, description }] from @param {type} name desc
 *   - returns:     { type, description } from @returns {type} desc
 *   - throws:      [{ type, description }] from @throws {type} desc
 */
function parseJSDocBlock(raw) {
    const lines = raw
        .replace(/^\/\*\*/, "")
        .replace(/\*\/$/, "")
        .split("\n")
        .map(l => l.replace(/^\s*\*\s?/, "").trimEnd());

    const descLines = [];
    let exampleLines = null;
    let inExample = false;
    let since = null;
    let deprecated = null;
    const params = [];
    let returns = null;
    const throws = [];

    // Helper: extract {type} from start of rest string; returns { type, rest }
    // Type syntax can nest braces (e.g. "{{ documented: number, total: number }[]}"),
    // so this can't be a "stop at the first }" regex — it has to walk the string
    // tracking brace depth and match the CLOSING brace of the OPENING one.
    function extractBraced(str) {
        if (str[0] !== "{") return { type: "any", rest: str };
        let depth = 0;
        for (let i = 0; i < str.length; i++) {
            if (str[i] === "{") depth++;
            else if (str[i] === "}") {
                depth--;
                if (depth === 0) {
                    return { type: str.slice(1, i).trim(), rest: str.slice(i + 1).replace(/^\s+/, "") };
                }
            }
        }
        // Unbalanced — no matching close brace found; fall back to "any".
        return { type: "any", rest: str };
    }

    for (const line of lines) {
        if (/^@example\b/.test(line)) {
            inExample = true;
            exampleLines = exampleLines || [];
            const rest = line.slice("@example".length).trim();
            if (rest) exampleLines.push(rest);
        } else if (/^@param\b/.test(line)) {
            inExample = false;
            const rest = line.slice("@param".length).trim();
            const { type, rest: nameAndDesc } = extractBraced(rest);
            const m2 = nameAndDesc.match(/^(\[?[\w.]+\]?)\s*(.*)/);
            if (m2) {
                const rawName = m2[1];
                const optional = rawName.startsWith("[") && rawName.endsWith("]");
                const name = rawName.replace(/^\[|\]$/g, "");
                params.push({ name, type, description: m2[2].trim() || null, optional });
            }
        } else if (/^@returns?\b/.test(line)) {
            inExample = false;
            const rest = line.replace(/^@returns?\s*/, "");
            const { type, rest: desc } = extractBraced(rest);
            returns = { type, description: desc.trim() || null };
        } else if (/^@throws?\b/.test(line)) {
            inExample = false;
            const rest = line.replace(/^@throws?\s*/, "");
            const { type, rest: desc } = extractBraced(rest);
            throws.push({ type, description: desc.trim() || null });
        } else if (/^@since\b/.test(line)) {
            inExample = false;
            since = line.slice("@since".length).trim() || null;
        } else if (/^@deprecated\b/.test(line)) {
            inExample = false;
            deprecated = line.slice("@deprecated".length).trim() || "";
        } else if (/^@description\b/.test(line)) {
            inExample = false;
            const descText = line.slice("@description".length).trim();
            if (descText) descLines.push(descText);
        } else if (/^@\w/.test(line)) {
            inExample = false;
        } else if (inExample) {
            exampleLines.push(line);
        } else if (descLines.length === 0 && line.trim() === "") {
            // skip leading blanks
        } else {
            descLines.push(line);
        }
    }

    while (descLines.length && descLines[descLines.length - 1].trim() === "") descLines.pop();
    const description = descLines.join("\n").trim() || null;

    let example = null;
    if (exampleLines) {
        while (exampleLines.length && exampleLines[0].trim() === "") exampleLines.shift();
        while (exampleLines.length && exampleLines[exampleLines.length - 1].trim() === "") exampleLines.pop();
        example = exampleLines.join("\n").trim() || null;
    }

    return { description, example, since, deprecated, params, returns, throws };
}

/**
 * Read the nearest leading /** ... *\/ block for a node.
 */
function readJSDoc(sourceFile, node) {
    const ranges = ts.getLeadingCommentRanges(sourceFile.text, node.getFullStart()) || [];
    for (let i = ranges.length - 1; i >= 0; i--) {
        const r = ranges[i];
        const text = sourceFile.text.slice(r.pos, r.end);
        if (text.startsWith("/**")) return parseJSDocBlock(text);
    }
    return emptyJSDoc();
}

// ---------------------------------------------------------------------------
// Module-level JSDoc
// ---------------------------------------------------------------------------

/**
 * Extract top-of-file /** @module ... *\/ block.
 * Returns { moduleName, description, since } or all-null.
 */
function extractModuleDoc(sourceFile) {
    // Walk the first few statements looking for a /** block
    const text = sourceFile.text;
    const ranges = ts.getLeadingCommentRanges(text, 0) || [];
    for (const r of ranges) {
        const block = text.slice(r.pos, r.end);
        if (!block.startsWith("/**")) continue;
        const parsed = parseJSDocBlock(block);
        // Extract @module tag from raw block
        const modMatch = block.match(/@module\s+([^\s*]+)/);
        return {
            moduleName:  modMatch ? modMatch[1].trim() : null,
            description: parsed.description,
            since:       parsed.since,
        };
    }
    return { moduleName: null, description: null, since: null };
}

// ---------------------------------------------------------------------------
// Item extractors
// ---------------------------------------------------------------------------

function extractFunction(node, sourceFile, nameOverride) {
    const mods = modifiersOf(node);
    const jsdoc = sourceFile ? readJSDoc(sourceFile, node) : emptyJSDoc();
    return {
        name: nameOverride || (node.name ? node.name.getText() : "anonymous"),
        line: sourceFile ? getLineNumber(sourceFile, node) : null,
        description: jsdoc.description,
        example: jsdoc.example,
        since: jsdoc.since,
        deprecated: jsdoc.deprecated,
        jsdocParams: jsdoc.params,
        returns: jsdoc.returns,
        throws: jsdoc.throws,
        params: extractParams(node.parameters),
        returnType: inferReturnType(node),
        isExported: mods.isExported,
        isAsync: mods.isAsync,
        isGenerator: !!node.asteriskToken,
    };
}

function extractClass(node, sourceFile) {
    const mods = modifiersOf(node);
    const name = node.name ? node.name.getText() : "AnonymousClass";
    const jsdoc = sourceFile ? readJSDoc(sourceFile, node) : emptyJSDoc();
    const result = {
        name,
        line: sourceFile ? getLineNumber(sourceFile, node) : null,
        description: jsdoc.description,
        example: jsdoc.example,
        since: jsdoc.since,
        deprecated: jsdoc.deprecated,
        isExported: mods.isExported,
        isAbstract: mods.isAbstract,
        extends: [],
        implements: [],
        constructor: null,
        methods: [],
        getters: [],
        setters: [],
        properties: [],
    };

    for (const h of (node.heritageClauses || [])) {
        const target = h.token === ts.SyntaxKind.ExtendsKeyword ? result.extends : result.implements;
        for (const t of h.types) target.push(t.getText());
    }

    for (const m of node.members) {
        const mjsdoc = sourceFile ? readJSDoc(sourceFile, m) : emptyJSDoc();
        if (ts.isConstructorDeclaration(m)) {
            result.constructor = {
                params: extractParams(m.parameters),
                description: mjsdoc.description,
                jsdocParams: mjsdoc.params,
                throws: mjsdoc.throws,
            };
        } else if (ts.isMethodDeclaration(m)) {
            const mm = modifiersOf(m);
            const visibility = mm.isPrivate ? "private" : mm.isProtected ? "protected" : "public";
            result.methods.push({
                name: m.name.getText(),
                description: mjsdoc.description,
                since: mjsdoc.since,
                deprecated: mjsdoc.deprecated,
                returns: mjsdoc.returns,
                throws: mjsdoc.throws,
                jsdocParams: mjsdoc.params,
                visibility,
                isStatic: mm.isStatic,
                isAbstract: mm.isAbstract,
                isAsync: mm.isAsync,
                isGenerator: !!m.asteriskToken,
                params: extractParams(m.parameters),
                returnType: inferReturnType(m),
            });
        } else if (ts.isGetAccessorDeclaration(m)) {
            const mm = modifiersOf(m);
            result.getters.push({ name: m.name.getText(), returnType: inferReturnType(m), isStatic: mm.isStatic, description: mjsdoc.description, deprecated: mjsdoc.deprecated, since: mjsdoc.since });
        } else if (ts.isSetAccessorDeclaration(m)) {
            const mm = modifiersOf(m);
            result.setters.push({ name: m.name.getText(), params: extractParams(m.parameters), isStatic: mm.isStatic, description: mjsdoc.description, deprecated: mjsdoc.deprecated });
        } else if (ts.isPropertyDeclaration(m)) {
            const mm = modifiersOf(m);
            const visibility = mm.isPrivate ? "private" : mm.isProtected ? "protected" : "public";
            result.properties.push({
                name: m.name.getText(),
                type: typeText(m) || inferTypeFromInitializer(m.initializer),
                visibility,
                isStatic: mm.isStatic,
                isReadonly: mm.isReadonly,
                isAbstract: mm.isAbstract,
                description: mjsdoc.description,
                deprecated: mjsdoc.deprecated,
                since: mjsdoc.since,
            });
        }
    }

    return result;
}

function extractInterface(node, sourceFile) {
    const jsdoc = sourceFile ? readJSDoc(sourceFile, node) : emptyJSDoc();
    return {
        name: node.name.getText(),
        line: sourceFile ? getLineNumber(sourceFile, node) : null,
        description: jsdoc.description,
        example: jsdoc.example,
        since: jsdoc.since,
        deprecated: jsdoc.deprecated,
        isExported: modifiersOf(node).isExported,
        properties: node.members
            .filter(m => ts.isPropertySignature(m) && m.name)
            .map(m => ({
                name: m.name.getText(),
                type: typeText(m) || "any",
                optional: !!m.questionToken,
            })),
        methods: node.members
            .filter(m => ts.isMethodSignature(m) && m.name)
            .map(m => ({
                name: m.name.getText(),
                params: extractParams(m.parameters),
                returnType: typeText(m) || "void",
                optional: !!m.questionToken,
            })),
    };
}

function extractTypeAlias(node, sourceFile) {
    const jsdoc = sourceFile ? readJSDoc(sourceFile, node) : emptyJSDoc();
    return {
        name: node.name.getText(),
        line: sourceFile ? getLineNumber(sourceFile, node) : null,
        description: jsdoc.description,
        since: jsdoc.since,
        deprecated: jsdoc.deprecated,
        type: node.type.getText(),
        isExported: modifiersOf(node).isExported,
    };
}

function extractEnum(node, sourceFile) {
    const jsdoc = sourceFile ? readJSDoc(sourceFile, node) : emptyJSDoc();
    return {
        name: node.name.getText(),
        line: sourceFile ? getLineNumber(sourceFile, node) : null,
        description: jsdoc.description,
        since: jsdoc.since,
        deprecated: jsdoc.deprecated,
        isExported: modifiersOf(node).isExported,
        members: node.members.map(m => ({
            name: m.name.getText(),
            value: m.initializer ? m.initializer.getText() : null,
        })),
    };
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

function extractModule(filePath) {
    const fs = require("fs");
    const sourceText = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, getScriptKind(filePath));

    if (!sourceFile) {
        process.stderr.write("jsdoc-scribe: could not parse " + filePath + "\n");
        return { filePath, moduleName: null, description: null, since: null, functions: [], classes: [], interfaces: [], typeAliases: [], enums: [], variables: [] };
    }
    const moduleDoc = extractModuleDoc(sourceFile);
    const result = { filePath, moduleName: moduleDoc.moduleName, description: moduleDoc.description, since: moduleDoc.since, functions: [], classes: [], interfaces: [], typeAliases: [], enums: [], variables: [] };

    function visit(node) {
        try {
        if (ts.isFunctionDeclaration(node) && node.body && node.name) {
            result.functions.push(extractFunction(node, sourceFile));
        } else if (ts.isClassDeclaration(node)) {
            result.classes.push(extractClass(node, sourceFile));
        } else if (ts.isInterfaceDeclaration(node)) {
            result.interfaces.push(extractInterface(node, sourceFile));
        } else if (ts.isTypeAliasDeclaration(node)) {
            result.typeAliases.push(extractTypeAlias(node, sourceFile));
        } else if (ts.isEnumDeclaration(node)) {
            result.enums.push(extractEnum(node, sourceFile));
        } else if (ts.isVariableStatement(node)) {
            const mods = modifiersOf(node);
            const isConst = (node.declarationList.flags & ts.NodeFlags.Const) !== 0;
            const stmtJsdoc = sourceFile ? readJSDoc(sourceFile, node) : emptyJSDoc();
            for (const decl of node.declarationList.declarations) {
                const init = decl.initializer;
                if (isFunctionLike(init)) {
                    result.functions.push({
                        name: decl.name.getText(),
                        line: sourceFile ? getLineNumber(sourceFile, decl) : null,
                        description: stmtJsdoc.description,
                        example: stmtJsdoc.example,
                        since: stmtJsdoc.since,
                        deprecated: stmtJsdoc.deprecated,
                        jsdocParams: stmtJsdoc.params,
                        returns: stmtJsdoc.returns,
                        throws: stmtJsdoc.throws,
                        params: extractParams(init.parameters),
                        returnType: inferReturnType(init),
                        isExported: mods.isExported,
                        isAsync: (init.modifiers || []).some(m => m.kind === ts.SyntaxKind.AsyncKeyword),
                        isGenerator: !!init.asteriskToken,
                    });
                } else {
                    result.variables.push({
                        name: decl.name.getText(),
                        line: sourceFile ? getLineNumber(sourceFile, decl) : null,
                        description: stmtJsdoc.description,
                        since: stmtJsdoc.since,
                        deprecated: stmtJsdoc.deprecated,
                        type: typeText(decl) || inferTypeFromInitializer(init),
                        isConst,
                        isExported: mods.isExported,
                    });
                }
            }
        }
        } catch (err) {
            process.stderr.write("jsdoc-scribe: skipped node in " + filePath + " — " + err.message + "\n");
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return result;
}

module.exports = { extractModule };
