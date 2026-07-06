"use strict";

/**
 * lib/lint.js
 * ----------------------------------------
 * Pure, synchronous JSDoc validation over the shape extractModule() already
 * returns (lib/extractor.js), now including each symbol's rawComment /
 * badComment text. No ESLint, no new npm dependency, no type-checker —
 * reuses exactly the AST + parsed-JSDoc data the rest of the tool already
 * builds. See docs/backlog/adr-011-native-lint-engine.md for the LintIssue
 * schema and the rule-scope decisions (structural vs. text-level, what's
 * deferred to a later sprint).
 */

// ---------------------------------------------------------------------------
// Known-tag reference data
// ---------------------------------------------------------------------------

// Floor: every tag lib/extractor.js's parseJSDocBlock() already recognizes
// (param/arg/argument, returns/return, throws/exception, example,
// deprecated, since, module, description) plus common JSDoc/TypeScript-
// flavor tags jsdoc-scribe doesn't parse structurally today but that are
// legitimate and must never be flagged as "unknown".
var KNOWN_TAGS = new Set([
    "param", "arg", "argument",
    "returns", "return",
    "throws", "exception",
    "example",
    "deprecated",
    "since",
    "module",
    "description",
    "template",
    "property", "prop",
    "yields", "yield",
    "abstract",
    "readonly",
    "override",
    "access",
    "private", "protected", "public",
    "static",
    "async",
    "generator",
    "fileoverview",
    "type",
    "typedef",
    "callback",
    "constructor",
    "augments", "extends",
    "implements",
    "interface",
    "memberof",
    "namespace",
    "see",
    "todo",
    "ignore",
    "internal",
    "packagedocumentation",
    "remarks",
    "default", "defaultvalue",
    "enum",
    "event", "fires", "emits",
    "constant", "const",
    "function", "func", "method",
    "class", "classdesc",
    "kind",
    "lends",
    "mixes", "mixin",
    "name",
    "summary",
    "this",
    "variation",
    "version",
    "license",
    "author",
    "copyright",
    "file",
    "borrows",
    "exports",
    "requires",
    "inheritdoc",
    "hideconstructor",
    "export",
    "global",
    "inner",
    "instance",
    "listens",
    "package",
    "tutorial",
    "virtual",
]);

// Tags that should never carry trailing description text.
var NO_DESC_TAGS = new Set([
    "abstract", "readonly", "override", "static", "async", "generator",
    "ignore", "internal", "constructor", "interface", "inheritdoc",
    "hideconstructor", "package", "virtual", "global", "inner", "instance",
]);

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function hasAnyBlock(sym) {
    return !!(sym.rawComment || (sym.jsdocParams && sym.jsdocParams.length) || sym.returns || sym.description);
}

function push(issues, symbol, rule, message, line) {
    issues.push({ symbol: symbol, rule: rule, message: message, line: line == null ? null : line });
}

// ---------------------------------------------------------------------------
// Structural rules — params / returns / description
// (require jsdocParams/returns/returnType/description; no rawComment needed)
// ---------------------------------------------------------------------------

function lintParams(issues, symbol, params, jsdocParams, line) {
    var astNames = (params || []).map(function (p) { return p.name; });
    var docNames = (jsdocParams || []).map(function (p) { return p.name; });

    astNames.forEach(function (n) {
        if (docNames.indexOf(n) === -1) {
            push(issues, symbol, "require-param", 'Missing @param for "' + n + '".', line);
        }
    });

    (jsdocParams || []).forEach(function (p) {
        if (astNames.indexOf(p.name) !== -1 && !p.description) {
            push(issues, symbol, "require-param-description", '@param "' + p.name + '" has no description.', line);
        }
    });

    // Ordering: only meaningful when both sides cover the identical name
    // set — a differing name set is --check-drift's territory, not lint's.
    var sameSet = astNames.length === docNames.length && astNames.every(function (n) { return docNames.indexOf(n) !== -1; });
    if (sameSet && astNames.length > 1) {
        var ordered = astNames.every(function (n, i) { return docNames[i] === n; });
        if (!ordered) {
            push(issues, symbol, "check-param-names", "@param order does not match function parameter order.", line);
        }
    }
}

function lintReturns(issues, symbol, returnType, returns, line) {
    var hasRealReturn = !!returnType && returnType !== "void";
    if (hasRealReturn && !returns) {
        push(issues, symbol, "require-returns", "Missing @returns.", line);
    }
    if (returns && !returns.description) {
        push(issues, symbol, "require-returns-description", "@returns has no description.", line);
    }
    if (returns && !hasRealReturn) {
        push(issues, symbol, "require-returns-check", "@returns present but function has no return value.", line);
    }
}

function lintDescription(issues, symbol, description, line) {
    if (!description) {
        push(issues, symbol, "require-description", "Missing description.", line);
    }
}

/** Full structural family for a function/method: require-jsdoc gates everything else. */
function lintFunctionLike(issues, symbol, sym, skipReturns) {
    var line = sym.line == null ? null : sym.line;
    if (!hasAnyBlock(sym)) {
        push(issues, symbol, "require-jsdoc", "Missing JSDoc comment.", line);
        return; // no block at all is out of scope for everything else here
    }
    lintParams(issues, symbol, sym.params, sym.jsdocParams, line);
    if (!skipReturns) lintReturns(issues, symbol, sym.returnType, sym.returns, line);
    lintDescription(issues, symbol, sym.description, line);
}

// ---------------------------------------------------------------------------
// Text-level rules — rawComment-dependent
// ---------------------------------------------------------------------------

function lintTagNames(issues, symbol, rawComment, line) {
    if (!rawComment) return;
    var re = /@([a-zA-Z][\w-]*)/g;
    var m;
    while ((m = re.exec(rawComment))) {
        var tag = m[1].toLowerCase();
        if (!KNOWN_TAGS.has(tag)) {
            push(issues, symbol, "check-tag-names", 'Unknown tag "@' + m[1] + '".', line);
        }
    }
}

function lintEmptyTags(issues, symbol, rawComment, line) {
    if (!rawComment) return;
    rawComment.split("\n").forEach(function (l) {
        var stripped = l.replace(/^\s*\/?\*+\s?/, "");
        var m = stripped.match(/^@([a-zA-Z][\w-]*)\s*(.*)$/);
        if (m && NO_DESC_TAGS.has(m[1].toLowerCase()) && m[2].replace(/\*\/\s*$/, "").trim()) {
            push(issues, symbol, "empty-tags", '"@' + m[1] + '" should not have a description.', line);
        }
    });
}

function lintMultiAsterisks(issues, symbol, rawComment, line) {
    if (!rawComment) return;
    var lines = rawComment.split("\n");
    lines.forEach(function (l, idx) {
        if (idx === 0) return; // opening "/**" line
        if (idx === lines.length - 1 && /^\s*\*+\/\s*$/.test(l)) return; // closing "*/" line
        if (/^\s*\*{2,}(?!\/)/.test(l)) {
            push(issues, symbol, "no-multi-asterisks", "Unexpected multiple asterisks.", line);
        }
    });
}

function lintBlankBlock(issues, symbol, rawComment, line) {
    if (!rawComment) return;
    var inner = rawComment.replace(/^\/\*\*/, "").replace(/\*\/$/, "");
    var stripped = inner.split("\n").map(function (l) { return l.replace(/^\s*\*\s?/, "").trim(); }).join("").trim();
    if (stripped === "") {
        push(issues, symbol, "no-blank-block-descriptions", "JSDoc block is empty.", line);
    }
}

function lintBadBlock(issues, symbol, badComment, line) {
    if (!badComment) return;
    push(issues, symbol, "no-bad-blocks", "Comment looks like an intended JSDoc block but is malformed (wrong asterisk count).", line);
}

function lintTextLevel(issues, symbol, sym) {
    var line = sym.line == null ? null : sym.line;
    lintTagNames(issues, symbol, sym.rawComment, line);
    lintEmptyTags(issues, symbol, sym.rawComment, line);
    lintMultiAsterisks(issues, symbol, sym.rawComment, line);
    lintBlankBlock(issues, symbol, sym.rawComment, line);
    lintBadBlock(issues, symbol, sym.badComment, line);
}

// ---------------------------------------------------------------------------
// Generic family — any symbol with a comment slot but no params/returns
// semantics (classes, interfaces, typeAliases, enums, variables, getters,
// setters, properties).
// ---------------------------------------------------------------------------

function lintGeneric(issues, symbol, sym) {
    var line = sym.line == null ? null : sym.line;
    if (!hasAnyBlock(sym)) {
        push(issues, symbol, "require-jsdoc", "Missing JSDoc comment.", line);
    } else {
        lintDescription(issues, symbol, sym.description, line);
    }
    lintTextLevel(issues, symbol, sym);
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

/**
 * @param {object} moduleData - extractModule() output for one file.
 * @returns {Array<{symbol: string, rule: string, message: string, line: (number|null)}>}
 */
function lintModule(moduleData) {
    var issues = [];

    (moduleData.functions || []).forEach(function (fn) {
        lintFunctionLike(issues, fn.name, fn, false);
        lintTextLevel(issues, fn.name, fn);
    });

    (moduleData.classes || []).forEach(function (cls) {
        lintGeneric(issues, cls.name, cls);

        if (cls.constructor) {
            var ctorSymbol = cls.name + ".constructor";
            lintFunctionLike(issues, ctorSymbol, cls.constructor, true);
            lintTextLevel(issues, ctorSymbol, cls.constructor);
        }

        (cls.methods || []).forEach(function (m) {
            var symbol = cls.name + "." + m.name;
            lintFunctionLike(issues, symbol, m, false);
            lintTextLevel(issues, symbol, m);
        });

        (cls.getters || []).forEach(function (g) {
            lintGeneric(issues, cls.name + "." + g.name + " (getter)", g);
        });
        (cls.setters || []).forEach(function (s) {
            lintGeneric(issues, cls.name + "." + s.name + " (setter)", s);
        });
        (cls.properties || []).forEach(function (p) {
            lintGeneric(issues, cls.name + "." + p.name + " (property)", p);
        });
    });

    (moduleData.interfaces || []).forEach(function (iface) {
        lintGeneric(issues, iface.name, iface);
    });
    (moduleData.typeAliases || []).forEach(function (t) {
        lintGeneric(issues, t.name, t);
    });
    (moduleData.enums || []).forEach(function (e) {
        lintGeneric(issues, e.name, e);
    });
    (moduleData.variables || []).forEach(function (v) {
        lintGeneric(issues, v.name, v);
    });

    return issues;
}

module.exports = { lintModule, KNOWN_TAGS, NO_DESC_TAGS };
