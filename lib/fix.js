"use strict";

/**
 * lib/fix.js
 * ----------------------------------------
 * `gen-comments --lint --fix`'s engine. Rewrites EXISTING, malformed JSDoc
 * blocks to resolve lintModule()'s findings — it does not add JSDoc to
 * undocumented symbols (that's `--write`'s job; a require-jsdoc finding with
 * no existing block at all is left alone here).
 *
 * Two fix strategies, matched to two kinds of symbol (see
 * docs/backlog/adr-013-lint-autofix.md for the full reasoning):
 *
 *   1. Function-like symbols (functions, methods, constructors) — the whole
 *      block is REBUILT from real AST truth (actual param names/order/types,
 *      actual return type) merged with whatever valid prose already existed.
 *      This one rebuild naturally fixes require-param, require-param-description,
 *      check-param-names (ordering), require-returns, require-returns-description,
 *      require-returns-check, require-description, empty-tags, and
 *      no-multi-asterisks/no-blank-block-descriptions in a single pass — a
 *      symbol with zero lint issues is left completely untouched (byte-identical).
 *
 *   2. Generic symbols (classes, interfaces, typeAliases, enums, variables,
 *      getters, setters, properties) — a lighter, line-level fix: strip
 *      trailing text after a no-description tag, collapse stray asterisks,
 *      insert one placeholder description line if the block is blank or has
 *      none. No attempt to rebuild @property/@enum-style tag lists — those
 *      aren't lint-checked today and rebuilding them risks losing real content.
 *
 * One deliberate carve-out, in both strategies: `check-tag-names` (an unknown
 * / typo'd tag) is NEVER auto-fixed. Every other fix here either applies a
 * fixed, deterministic placeholder template (never invented prose) or performs
 * a lossless mechanical transform (reorder, strip, collapse). Renaming a
 * typo'd tag would mean guessing what the author meant to type — there is no
 * safe default for that, so `check-tag-names` findings always survive a
 * `--fix` run and are reported as such.
 */

const fs = require("fs");
const { extractModule } = require("./extractor.js");
const { lintModule, KNOWN_TAGS, NO_DESC_TAGS } = require("./lint.js");

// ---------------------------------------------------------------------------
// Placeholder templates — fixed strings, never generated/inferred content.
// Every one is prefixed "TODO:" on purpose, so a human glancing at the diff
// immediately sees which text is a real description and which is a marker
// left by --fix, unlike an LLM-written description that looks authoritative
// whether or not it's accurate. This is the one place --fix writes prose
// instead of performing a mechanical transform — see the ADR for why that's
// still consistent with "no AI, no guessing": the tool is not inventing an
// explanation of what the code does, it is flagging "a human needs to write
// one here."
// ---------------------------------------------------------------------------

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

/** Exact indentation string of the line `pos` sits on — reused for every continuation line. */
function indentOf(sourceText, pos) {
    let i = pos;
    while (i > 0 && (sourceText[i - 1] === " " || sourceText[i - 1] === "\t")) i--;
    return sourceText.slice(i, pos);
}

// Tags rebuildFunctionBlock() reconstructs structurally from sym.* fields —
// everything else (whether a recognized marker tag like @readonly/@static, or
// a genuine unknown/typo'd tag) is preserved verbatim by scanOtherTagLines
// below rather than silently dropped. parseJSDocBlock() only extracts these
// seven concepts; every other tag it sees just gets skipped over, so the
// rebuild has to re-scan the raw text itself to avoid losing them.
const STRUCTURAL_TAGS = new Set([
    "param", "arg", "argument",
    "returns", "return",
    "throws", "exception",
    "since", "deprecated", "example", "description",
]);

/**
 * Every `@tag` line that isn't one of the seven concepts rebuilt structurally
 * above — kept verbatim (not reformatted), so a full rebuild never silently
 * drops real content it doesn't have a structured slot for (e.g. `@readonly`,
 * `@static`, `@abstract`), and never renames a tag it can't safely interpret
 * (e.g. an unknown/typo'd tag — check-tag-names' territory, left for a human).
 * A tag known to carry no description (NO_DESC_TAGS) still gets its trailing
 * text stripped here — same transform empty-tags asks for, just applied
 * inline since these lines bypass the rest of the rebuild.
 */
function scanOtherTagLines(rawComment) {
    if (!rawComment) return [];
    const inner = rawComment.replace(/^\/\*\*/, "").replace(/\*\/$/, "");
    const lines = inner.split("\n").map((l) => l.replace(/^\s*\*\s?/, ""));
    const out = [];
    for (const line of lines) {
        const m = line.match(/^@([a-zA-Z][\w-]*)\s*(.*)$/);
        if (!m || STRUCTURAL_TAGS.has(m[1].toLowerCase())) continue;
        if (NO_DESC_TAGS.has(m[1].toLowerCase())) {
            out.push("@" + m[1]);
        } else {
            out.push(m[2] ? ("@" + m[1] + " " + m[2]).trimEnd() : "@" + m[1]);
        }
    }
    return out;
}

// ---------------------------------------------------------------------------
// Strategy 1 — function-like symbols: full canonical rebuild
// ---------------------------------------------------------------------------

function rebuildFunctionBlock(sym, indent) {
    const lines = ["/**"];
    lines.push(" * " + ensureSentence(sym.description || TODO_DESCRIPTION));

    if (sym.deprecated !== null && sym.deprecated !== undefined) {
        lines.push(sym.deprecated ? " * @deprecated " + sym.deprecated : " * @deprecated");
    }
    if (sym.since) lines.push(" * @since " + sym.since);

    const docByName = new Map((sym.jsdocParams || []).map((p) => [p.name, p]));
    for (const p of sym.params || []) {
        const existing = docByName.get(p.name);
        docByName.delete(p.name);
        const type = existing ? existing.type : p.type;
        const desc = ensureSentence(existing && existing.description ? existing.description : todoParamDescription(p.name));
        const label = p.optional ? "[" + p.name + "]" : p.name;
        lines.push(" * @param {" + type + "} " + label + " - " + desc);
    }
    // Any @param left in docByName documents a parameter that no longer exists on the
    // real function — that's --check-drift's territory (stale docs), not --lint's, so
    // --fix doesn't delete it; it's carried through unchanged.
    for (const stale of docByName.values()) {
        const label = stale.optional ? "[" + stale.name + "]" : stale.name;
        const desc = stale.description ? " - " + stale.description : "";
        lines.push(" * @param {" + stale.type + "} " + label + desc);
    }

    for (const t of sym.throws || []) {
        const desc = t.description ? " " + t.description : "";
        lines.push(" * @throws {" + t.type + "}" + desc);
    }

    const reallyReturnsAValue = !!sym.returnType && sym.returnType !== "void";
    if (reallyReturnsAValue) {
        const type = sym.returns ? sym.returns.type : sym.returnType;
        const desc = ensureSentence(sym.returns && sym.returns.description ? sym.returns.description : TODO_RETURNS_DESCRIPTION);
        lines.push(" * @returns {" + type + "} " + desc);
    }
    // else: an existing @returns here would be require-returns-check's finding — dropping
    // it is a safe, mechanical deletion (documenting a return value that doesn't exist),
    // not a guess.

    for (const line of scanOtherTagLines(sym.rawComment)) {
        lines.push(" * " + line);
    }

    if (sym.example) {
        lines.push(" * @example");
        for (const l of sym.example.split("\n")) lines.push(l ? " * " + l : " *");
    }

    lines.push(" */");
    return lines.map((l, i) => (i === 0 ? l : indent + l)).join("\n");
}

// ---------------------------------------------------------------------------
// Strategy 2 — generic symbols: line-level, non-destructive fixes
// ---------------------------------------------------------------------------

function lightFixGenericBlock(sym, rules) {
    if (!sym.rawComment) return null;
    let lines = sym.rawComment.split("\n");
    let changed = false;

    if (rules.has("empty-tags")) {
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

    if (rules.has("no-multi-asterisks")) {
        lines = lines.map((l, idx) => {
            if (idx === 0) return l; // opening "/**" line
            if (idx === lines.length - 1 && /^\s*\*+\/\s*$/.test(l)) return l; // closing "*/" line
            if (/^\s*\*{2,}(?!\/)/.test(l)) {
                changed = true;
                return l.replace(/^(\s*)\*{2,}(?!\/)/, "$1*");
            }
            return l;
        });
    }

    if ((rules.has("no-blank-block-descriptions") || rules.has("require-description")) && !sym.description) {
        lines.splice(1, 0, " * " + TODO_DESCRIPTION);
        changed = true;
    }

    if (!changed) return null;
    return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

/**
 * Fix every symbol in `filePath` that lintModule() flagged, where a safe or
 * placeholder-based fix exists. Writes the file in place (same "no dry-run"
 * contract `--fix` follows everywhere else it's implemented) if — and only
 * if — at least one edit applies; a file with zero fixable issues is never
 * touched, byte-identical before and after.
 *
 * @param {string} filePath
 * @returns {{ fixedCount: number, totalBefore: number, remainingIssues: Array }}
 */
function fixModule(filePath) {
    const sourceText = fs.readFileSync(filePath, "utf8");
    const moduleData = extractModule(filePath);
    const issuesBefore = lintModule(moduleData);

    const issuesBySymbol = new Map();
    for (const issue of issuesBefore) {
        if (!issuesBySymbol.has(issue.symbol)) issuesBySymbol.set(issue.symbol, []);
        issuesBySymbol.get(issue.symbol).push(issue);
    }

    const edits = [];

    function tryFunctionLike(sym, symbolKey) {
        const symIssues = issuesBySymbol.get(symbolKey);
        if (!symIssues || !symIssues.length) return;
        if (!sym.rawComment || !sym.commentRange) return; // require-jsdoc: use --write, not --fix
        const fixable = symIssues.some((i) => i.rule !== "check-tag-names");
        if (!fixable) return;
        const indent = indentOf(sourceText, sym.commentRange.pos);
        const newText = rebuildFunctionBlock(sym, indent);
        if (newText === sym.rawComment) return;
        edits.push({ pos: sym.commentRange.pos, end: sym.commentRange.end, text: newText });
    }

    function tryGeneric(sym, symbolKey) {
        const symIssues = issuesBySymbol.get(symbolKey);
        if (!symIssues || !symIssues.length) return;
        if (!sym.rawComment || !sym.commentRange) return;
        const rules = new Set(symIssues.map((i) => i.rule));
        const newText = lightFixGenericBlock(sym, rules);
        if (!newText || newText === sym.rawComment) return;
        edits.push({ pos: sym.commentRange.pos, end: sym.commentRange.end, text: newText });
    }

    (moduleData.functions || []).forEach((fn) => tryFunctionLike(fn, fn.name));
    (moduleData.classes || []).forEach((cls) => {
        tryGeneric(cls, cls.name);
        if (cls.constructor) tryFunctionLike(cls.constructor, cls.name + ".constructor");
        (cls.methods || []).forEach((m) => tryFunctionLike(m, cls.name + "." + m.name));
        (cls.getters || []).forEach((g) => tryGeneric(g, cls.name + "." + g.name + " (getter)"));
        (cls.setters || []).forEach((s) => tryGeneric(s, cls.name + "." + s.name + " (setter)"));
        (cls.properties || []).forEach((p) => tryGeneric(p, cls.name + "." + p.name + " (property)"));
    });
    (moduleData.interfaces || []).forEach((i) => tryGeneric(i, i.name));
    (moduleData.typeAliases || []).forEach((t) => tryGeneric(t, t.name));
    (moduleData.enums || []).forEach((e) => tryGeneric(e, e.name));
    (moduleData.variables || []).forEach((v) => tryGeneric(v, v.name));

    if (edits.length === 0) {
        return { fixedCount: 0, totalBefore: issuesBefore.length, remainingIssues: issuesBefore };
    }

    edits.sort((a, b) => b.pos - a.pos); // bottom-to-top so earlier offsets stay valid
    let output = sourceText;
    for (const edit of edits) {
        output = output.slice(0, edit.pos) + edit.text + output.slice(edit.end);
    }
    fs.writeFileSync(filePath, output, "utf8");

    const remainingIssues = lintModule(extractModule(filePath));
    return {
        fixedCount: issuesBefore.length - remainingIssues.length,
        totalBefore: issuesBefore.length,
        remainingIssues,
    };
}

module.exports = { fixModule };
