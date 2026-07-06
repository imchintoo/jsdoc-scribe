"use strict";

const { KNOWN_TAGS, NO_DESC_TAGS } = require("jsdoc-scribe/lint");

/** ESLint 9's `context.sourceCode` vs the older `context.getSourceCode()` — support both. */
function getSourceCode(context) {
    return context.sourceCode || context.getSourceCode();
}

/**
 * Finds the JSDoc block comment immediately preceding `node`, if any.
 * Mirrors lib/extractor.js's readJSDoc(): last leading comment, must start
 * with a second asterisk (`/**`, not just `/*`).
 */
function getJSDocComment(sourceCode, node) {
    const comments = sourceCode.getCommentsBefore(node);
    if (!comments.length) return null;
    const last = comments[comments.length - 1];
    if (last.type !== "Block") return null;
    if (!last.value.startsWith("*")) return null; // comment.value excludes the opening "/*"
    return last;
}

/**
 * Splits a JSDoc comment's inner text (comment.value, i.e. without the
 * surrounding /* * /) into { description, tags }, where each tag is
 * { tag, rest, raw }.
 */
function parseComment(commentValue) {
    const rawLines = commentValue.split("\n").map((l) => l.replace(/^\s*\*\s?/, ""));
    const descLines = [];
    const tags = [];
    let current = null;

    for (const line of rawLines) {
        const m = line.match(/^@([a-zA-Z][\w-]*)\s*(.*)$/);
        if (m) {
            current = { tag: m[1], rest: m[2], raw: line };
            tags.push(current);
        } else if (!tags.length) {
            descLines.push(line);
        } else if (current) {
            current.rest = (current.rest + " " + line).trim();
        }
    }

    while (descLines.length && descLines[descLines.length - 1].trim() === "") descLines.pop();
    while (descLines.length && descLines[0].trim() === "") descLines.shift();

    return { description: descLines.join("\n").trim(), tags };
}

/** Extract a {type} prefix from a tag's `rest` string (same brace-depth walk as lib/extractor.js). */
function extractBraced(str) {
    if (str[0] !== "{") return { type: null, rest: str };
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === "{") depth++;
        else if (str[i] === "}") {
            depth--;
            if (depth === 0) return { type: str.slice(1, i).trim(), rest: str.slice(i + 1).replace(/^\s+/, "") };
        }
    }
    return { type: null, rest: str };
}

/** All @param tags as [{ name, type, description, optional }], preserving documented order. */
function extractParamTags(tags) {
    return tags
        .filter((t) => t.tag === "param" || t.tag === "arg" || t.tag === "argument")
        .map((t) => {
            const { type, rest } = extractBraced(t.rest);
            const m = rest.match(/^(\[?[\w.]+\]?)\s*-?\s*(.*)/);
            if (!m) return null;
            const rawName = m[1];
            const optional = rawName.startsWith("[") && rawName.endsWith("]");
            const name = rawName.replace(/^\[|\]$/g, "");
            return { name, type, description: m[2].trim() || null, optional };
        })
        .filter(Boolean);
}

/** The @returns/@return tag, if any, as { type, description }. */
function extractReturnsTag(tags) {
    const t = tags.find((x) => x.tag === "returns" || x.tag === "return");
    if (!t) return null;
    const { type, rest } = extractBraced(t.rest);
    return { type, description: rest.trim() || null };
}

/** Every function parameter name, in declared order — best-effort for destructuring/rest. */
function paramNames(params) {
    return params
        .map((p) => {
            if (p.type === "Identifier") return p.name;
            if (p.type === "AssignmentPattern" && p.left.type === "Identifier") return p.left.name;
            if (p.type === "RestElement" && p.argument && p.argument.type === "Identifier") return p.argument.name;
            return null;
        })
        .filter(Boolean);
}

/** Best-effort, purely syntactic type guess from a default value — no semantics, no AI. */
function inferTypeFromDefault(node) {
    if (!node) return "*";
    switch (node.type) {
        case "Literal":
            if (typeof node.value === "string") return "string";
            if (typeof node.value === "number") return "number";
            if (typeof node.value === "boolean") return "boolean";
            return "*";
        case "ArrayExpression":
            return "Array";
        case "ObjectExpression":
            return "Object";
        case "ArrowFunctionExpression":
        case "FunctionExpression":
            return "Function";
        default:
            return "*";
    }
}

/**
 * [{ name, type, optional }] for every real function parameter — used by the
 * autofixers to know what to document for a parameter that has no existing
 * @param at all. `type` is a best-effort placeholder ("*" — JSDoc/Closure's
 * own "any type" marker — unless a default value gives a syntactic hint),
 * since plain ESTree carries no type annotations to read.
 */
function paramInfos(params) {
    return params
        .map((p) => {
            if (p.type === "Identifier") return { name: p.name, type: "*", optional: false };
            if (p.type === "AssignmentPattern" && p.left.type === "Identifier") {
                return { name: p.left.name, type: inferTypeFromDefault(p.right), optional: true };
            }
            if (p.type === "RestElement" && p.argument && p.argument.type === "Identifier") {
                return { name: p.argument.name, type: "*", optional: false };
            }
            return null;
        })
        .filter(Boolean);
}

/** True if the function body contains a `return <expr>;` at its own boundary (not inside a nested function). */
function hasReturnWithValue(node) {
    if (node.type === "ArrowFunctionExpression" && node.body.type !== "BlockStatement") return true; // expression-body arrow always "returns"
    if (!node.body || node.body.type !== "BlockStatement") return false;
    let found = false;
    (function walk(n) {
        if (found || !n || typeof n.type !== "string") return;
        if (n.type === "ReturnStatement" && n.argument) {
            found = true;
            return;
        }
        if (n.type === "FunctionDeclaration" || n.type === "FunctionExpression" || n.type === "ArrowFunctionExpression") {
            return; // don't cross into a nested function's own boundary
        }
        for (const key in n) {
            if (key === "parent") continue;
            const value = n[key];
            if (Array.isArray(value)) value.forEach(walk);
            else if (value && typeof value.type === "string") walk(value);
        }
    })(node.body);
    return found;
}

/** MethodDefinition's actual function params/body live on node.value, not the node itself. */
function functionParams(node) {
    return node.type === "MethodDefinition" ? node.value.params : node.params;
}

function functionBodyNode(node) {
    return node.type === "MethodDefinition" ? node.value : node;
}

/**
 * Shared visitor wiring for every rule that inspects function-like
 * documentable nodes (function declarations, `const x = function/arrow`,
 * and class methods — constructors included, getters/setters excluded,
 * matching lib/lint.js's own scope). Calls `handler(node, jsdocComment)`
 * once per candidate, where `node` is the reportable node (function decl,
 * variable declarator, or method definition) and `jsdocComment` is the
 * associated comment token or null.
 */
function visitFunctionLike(context, handler) {
    const sourceCode = getSourceCode(context);

    function direct(node) {
        handler(node, getJSDocComment(sourceCode, node));
    }

    function viaVariableDeclarator(fnNode) {
        const declarator = fnNode.parent;
        const declaration = declarator.parent;
        if (declaration.type !== "VariableDeclaration" || declaration.declarations.length !== 1) return;
        // Re-associate: report at the declarator, but the function body/params
        // (and constructor-ness) come from fnNode itself.
        handler(Object.assign(Object.create(fnNode), { __reportNode: declarator }), getJSDocComment(sourceCode, declaration));
    }

    return {
        FunctionDeclaration: direct,
        "VariableDeclarator > FunctionExpression": viaVariableDeclarator,
        "VariableDeclarator > ArrowFunctionExpression": viaVariableDeclarator,
        "MethodDefinition[kind!='get'][kind!='set']": direct,
    };
}

/** The node ESLint should attach the report to — usually the node itself, unless it's a var-declared function. */
function reportNodeOf(node) {
    return node.__reportNode || node;
}

// ---------------------------------------------------------------------------
// Autofix helpers
// ---------------------------------------------------------------------------
// Same "TODO:" placeholder convention lib/fix.js uses for the core CLI's
// `--lint --fix` — a fixed, deterministic template, never invented/generated
// prose. See packages/eslint-plugin-jsdoc-scribe/README.md's Autofix section
// and docs/backlog/adr-013-lint-autofix.md for the full reasoning. Kept in
// sync with lib/fix.js's own constants on purpose.

const TODO_DESCRIPTION = "TODO: describe what this does.";
const TODO_RETURNS_DESCRIPTION = "TODO: describe the return value.";
function todoParamDescription(name) {
    return "TODO: describe parameter \"" + name + "\".";
}

function ensureSentence(text) {
    const t = (text || "").trim();
    if (!t) return t;
    return /[.!?]$/.test(t) ? t : t + ".";
}

/** Exact indentation string of the line `pos` sits on in the source text. */
function indentOf(sourceCode, pos) {
    const text = sourceCode.getText();
    let i = pos;
    while (i > 0 && (text[i - 1] === " " || text[i - 1] === "\t")) i--;
    return text.slice(i, pos);
}

// Tags rebuildFunctionComment() reconstructs structurally — everything else
// (a marker tag like @readonly/@static, or a genuine unknown/typo'd tag) is
// preserved verbatim rather than silently dropped, and never renamed (an
// unknown tag is check-tag-names' territory — there's no safe default for
// what it should have been, so it's never auto-fixed, matching lib/fix.js).
const STRUCTURAL_TAGS = new Set(["param", "arg", "argument", "returns", "return"]);

/**
 * Rebuilds an entire function-like JSDoc block from real AST truth (actual
 * parameter names/order, whether the function really returns a value) merged
 * with whatever valid prose already existed, returning the full replacement
 * text (including the `/**`/`* /` delimiters) ready for `fixer.replaceText`.
 * Mirrors lib/fix.js's rebuildFunctionBlock() — same placeholder templates,
 * same "preserve what we can't safely interpret" rule for other tags, same
 * mechanical drop of an unnecessary @returns.
 */
function rebuildFunctionComment(sourceCode, node, jsdocComment) {
    const { description, tags } = parseComment(jsdocComment.value);
    const indent = indentOf(sourceCode, jsdocComment.range[0]);

    const lines = ["/**"];
    lines.push(" * " + ensureSentence(description || TODO_DESCRIPTION));

    const paramTags = extractParamTags(tags);
    const docByName = new Map(paramTags.map((p) => [p.name, p]));
    const infos = paramInfos(functionParams(node));

    for (const info of infos) {
        const existing = docByName.get(info.name);
        docByName.delete(info.name);
        const type = existing && existing.type ? existing.type : info.type;
        const desc = ensureSentence(existing && existing.description ? existing.description : todoParamDescription(info.name));
        const label = info.optional ? "[" + info.name + "]" : info.name;
        lines.push(" * @param {" + type + "} " + label + " - " + desc);
    }
    // A leftover @param that no longer matches a real parameter documents something
    // that's since been removed — not this rule set's concern, carried through as-is.
    for (const stale of docByName.values()) {
        const label = stale.optional ? "[" + stale.name + "]" : stale.name;
        const desc = stale.description ? " - " + stale.description : "";
        lines.push(" * @param {" + (stale.type || "*") + "} " + label + desc);
    }

    const returnsTag = extractReturnsTag(tags);
    const reallyReturnsAValue = hasReturnWithValue(functionBodyNode(node));
    if (reallyReturnsAValue) {
        const type = returnsTag && returnsTag.type ? returnsTag.type : "*";
        const desc = ensureSentence(returnsTag && returnsTag.description ? returnsTag.description : TODO_RETURNS_DESCRIPTION);
        lines.push(" * @returns {" + type + "} " + desc);
    }
    // else: an existing @returns here is require-returns-check's finding — dropping it
    // is a safe, mechanical deletion (documents a return value that doesn't exist).

    for (const t of tags) {
        if (STRUCTURAL_TAGS.has(t.tag.toLowerCase())) continue;
        lines.push(t.rest ? " * @" + t.tag + " " + t.rest : " * @" + t.tag);
    }

    lines.push(" */");
    return lines.map((l, i) => (i === 0 ? l : indent + l)).join("\n");
}

/**
 * Line-level, non-destructive fix for a comment that isn't tied to a specific
 * function context (empty-tags / no-multi-asterisks / no-blank-block-descriptions
 * all scan every comment in the file, not just ones attached to a function).
 * Returns the new full comment text, or null if this rule finds nothing to
 * change. Mirrors lib/fix.js's lightFixGenericBlock().
 */
function lightFixComment(jsdocComment, ruleName, description) {
    let lines = ("/*" + jsdocComment.value + "*/").split("\n");
    let changed = false;

    if (ruleName === "empty-tags") {
        lines = lines.map((l) => {
            const stripped = l.replace(/^\s*\/?\*+\s?/, "");
            const m = stripped.match(/^@([a-zA-Z][\w-]*)\s*(.*)$/);
            if (m && NO_DESC_TAGS.has(m[1].toLowerCase())) {
                const closer = /\*\/\s*$/.test(stripped) ? "*/" : "";
                const trailing = stripped.replace(/\*\/\s*$/, "").slice(m[0].length - m[2].length).trim();
                if (trailing) {
                    changed = true;
                    const prefixMatch = l.match(/^(\s*\/?\*+\s?)/);
                    const prefix = prefixMatch ? prefixMatch[1] : " * ";
                    return prefix + "@" + m[1] + (closer ? " " + closer : "");
                }
            }
            return l;
        });
    }

    if (ruleName === "no-multi-asterisks") {
        lines = lines.map((l, idx) => {
            if (idx === 0) return l;
            if (idx === lines.length - 1 && /^\s*\*+\/\s*$/.test(l)) return l;
            if (/^\s*\*{2,}(?!\/)/.test(l)) {
                changed = true;
                return l.replace(/^(\s*)\*{2,}(?!\/)/, "$1*");
            }
            return l;
        });
    }

    if (ruleName === "no-blank-block-descriptions" && !description) {
        lines.splice(1, 0, " * " + TODO_DESCRIPTION);
        changed = true;
    }

    if (!changed) return null;
    return lines.join("\n");
}

module.exports = {
    KNOWN_TAGS,
    NO_DESC_TAGS,
    getSourceCode,
    getJSDocComment,
    parseComment,
    extractParamTags,
    extractReturnsTag,
    paramNames,
    paramInfos,
    hasReturnWithValue,
    functionParams,
    functionBodyNode,
    visitFunctionLike,
    reportNodeOf,
    rebuildFunctionComment,
    lightFixComment,
    ensureSentence,
    TODO_DESCRIPTION,
};
