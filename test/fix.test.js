"use strict";

/**
 * Autofix engine unit tests — tests lib/fix.js against real files (fixModule()
 * reads/writes disk, unlike lintModule()'s pure moduleData function), mirroring
 * Suite 1's tmpFile() style rather than lint.test.js's hand-built fixtures.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");
const { fixModule } = require("../lib/fix.js");
const { extractModule } = require("../lib/extractor.js");
const { lintModule } = require("../lib/lint.js");

function tmpFile(name, content) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cbg-fix-test-"));
    const file = path.join(dir, name);
    fs.writeFileSync(file, content, "utf8");
    return file;
}

module.exports = function runFixTests(check) {

    check("fix: a file with zero lint issues is left byte-identical", () => {
        const original = [
            "/**",
            " * Adds two numbers.",
            " * @param {number} a - first",
            " * @param {number} b - second",
            " * @returns {number} the sum",
            " */",
            "function add(a, b) { return a + b; }",
        ].join("\n") + "\n";
        const file = tmpFile("clean.js", original);
        const result = fixModule(file);
        assert.strictEqual(result.fixedCount, 0);
        assert.strictEqual(result.totalBefore, 0);
        assert.strictEqual(fs.readFileSync(file, "utf8"), original, "must not touch a file with no lint issues");
    });

    check("fix: require-param fills a missing @param with a TODO placeholder, not invented prose", () => {
        const file = tmpFile("missing-param.js", [
            "/**",
            " * Adds.",
            " * @param {number} a",
            " */",
            "function add(a, b) { return a + b; }",
        ].join("\n") + "\n");
        fixModule(file);
        const out = fs.readFileSync(file, "utf8");
        assert.match(out, /@param \{any\} b - TODO: describe parameter "b"\./);
    });

    check("fix: check-param-names reorders @param tags to match real parameter order", () => {
        const file = tmpFile("bad-order.js", [
            "/**",
            " * Subtracts.",
            " * @param {number} b - second",
            " * @param {number} a - first",
            " */",
            "function subtract(a, b) { return a - b; }",
        ].join("\n") + "\n");
        fixModule(file);
        const out = fs.readFileSync(file, "utf8");
        const aIdx = out.indexOf("@param {number} a");
        const bIdx = out.indexOf("@param {number} b");
        assert.ok(aIdx < bIdx && aIdx !== -1 && bIdx !== -1, "a must now come before b");
    });

    check("fix: require-returns adds a missing @returns with a TODO placeholder", () => {
        const file = tmpFile("missing-returns.js", [
            "/**",
            " * Doubles a number.",
            " * @param {number} x - the input",
            " */",
            "function double(x) { return x * 2; }",
        ].join("\n") + "\n");
        fixModule(file);
        const out = fs.readFileSync(file, "utf8");
        assert.match(out, /@returns \{any\} TODO: describe the return value\./);
    });

    check("fix: require-returns-check drops an unnecessary @returns on a void function", () => {
        const file = tmpFile("unnecessary-returns.js", [
            "/**",
            " * Logs a message.",
            " * @returns {void}",
            " */",
            "function log(msg) { console.log(msg); }",
        ].join("\n") + "\n");
        fixModule(file);
        const out = fs.readFileSync(file, "utf8");
        assert.ok(!/@returns/.test(out), "the unnecessary @returns should be gone");
        assert.match(out, /@param \{any\} msg/, "the missing @param for msg should still be added");
    });

    check("fix: require-description inserts a TODO description above existing tags", () => {
        const file = tmpFile("no-desc.js", [
            "/**",
            " * @param {number} a - the value",
            " */",
            "function identity(a) { return a; }",
        ].join("\n") + "\n");
        fixModule(file);
        const out = fs.readFileSync(file, "utf8");
        assert.match(out, /TODO: describe what this does\./);
    });

    check("fix: no-blank-block-descriptions fills a fully empty block", () => {
        const file = tmpFile("blank.js", [
            "/**",
            " *",
            " */",
            "function noop() {}",
        ].join("\n") + "\n");
        fixModule(file);
        const out = fs.readFileSync(file, "utf8");
        assert.match(out, /TODO: describe what this does\./);
    });

    check("fix: empty-tags strips trailing text after a no-description tag but keeps the tag", () => {
        const file = tmpFile("empty-tag.js", [
            "/**",
            " * A thing.",
            " * @readonly should not have text",
            " */",
            "class Thing {}",
        ].join("\n") + "\n");
        fixModule(file);
        const out = fs.readFileSync(file, "utf8");
        assert.match(out, /@readonly\s*$/m, "trailing text must be gone");
        assert.ok(!/should not have text/.test(out));
    });

    check("fix: no-multi-asterisks collapses a stray double-asterisk interior line", () => {
        const file = tmpFile("multi-star.js", [
            "/**",
            " * A thing.",
            " ** stray asterisks",
            " */",
            "class Thing {}",
        ].join("\n") + "\n");
        fixModule(file);
        const out = fs.readFileSync(file, "utf8");
        assert.match(out, /^ \* stray asterisks$/m);
    });

    check("fix: an unknown/typo'd tag is preserved verbatim, never renamed or dropped", () => {
        const file = tmpFile("unknown-tag.js", [
            "/**",
            " * @parm {number} a",
            " */",
            "function add(a, b) { return a + b; }",
        ].join("\n") + "\n");
        fixModule(file);
        const out = fs.readFileSync(file, "utf8");
        assert.match(out, /@parm \{number\} a/, "the typo'd tag text itself must survive unchanged");
    });

    check("fix: check-tag-names always survives --fix and is reported as a remaining issue", () => {
        const file = tmpFile("remaining.js", [
            "/**",
            " * Adds.",
            " * @parm {number} a",
            " * @param {number} b",
            " */",
            "function add(a, b) { return a + b; }",
        ].join("\n") + "\n");
        const result = fixModule(file);
        assert.ok(result.remainingIssues.some((i) => i.rule === "check-tag-names"));
        assert.ok(result.fixedCount > 0, "the require-param issue for a should still get fixed");
    });

    check("fix: a known marker tag not otherwise reconstructed (e.g. @readonly with no issue) survives a rebuild untouched", () => {
        const file = tmpFile("marker.js", [
            "/**",
            " * A thing.",
            " * @readonly",
            " * @param {number} a",
            " */",
            "function get(a, b) { return a; }",
        ].join("\n") + "\n");
        fixModule(file);
        const out = fs.readFileSync(file, "utf8");
        assert.match(out, /@readonly/, "marker tag must not be silently dropped during a function-like rebuild");
        assert.match(out, /@param \{any\} b/, "the actually-missing param should still be added");
    });

    check("fix: is idempotent — running twice produces zero additional edits", () => {
        const file = tmpFile("idempotent.js", [
            "/**",
            " * @param {number} b",
            " * @param {number} a",
            " */",
            "function subtract(a, b) { return a - b; }",
        ].join("\n") + "\n");
        const first = fixModule(file);
        assert.ok(first.fixedCount > 0);
        const second = fixModule(file);
        assert.strictEqual(second.fixedCount, 0, "second run should find nothing left to fix");
    });

    check("fix: require-jsdoc (no block at all) is left alone — that's --write's job, not --fix's", () => {
        const original = "function undocumented(a, b) { return a + b; }\n";
        const file = tmpFile("undocumented.js", original);
        const result = fixModule(file);
        assert.strictEqual(result.fixedCount, 0);
        assert.strictEqual(fs.readFileSync(file, "utf8"), original, "--fix must never add a brand-new JSDoc block");
        const remaining = result.remainingIssues.filter((i) => i.rule === "require-jsdoc");
        assert.strictEqual(remaining.length, 1, "the require-jsdoc finding should still be reported as remaining");
    });

    check("fix: output stays syntactically valid after a rebuild", () => {
        const ts = require("typescript");
        const file = tmpFile("valid.ts", [
            "/**",
            " * @param {number} b",
            " * @param {number} a",
            " */",
            "export function subtract(a: number, b: number): number { return a - b; }",
        ].join("\n") + "\n");
        fixModule(file);
        const text = fs.readFileSync(file, "utf8");
        const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        assert.strictEqual((sf.parseDiagnostics || []).length, 0);
    });

    check("fix: fixedCount reflects the before/after lint issue count delta accurately", () => {
        const file = tmpFile("count.js", [
            "/**",
            " * @param {number} b",
            " * @param {number} a",
            " */",
            "function subtract(a, b) { return a - b; }",
        ].join("\n") + "\n");
        const moduleDataBefore = extractModule(file);
        const before = lintModule(moduleDataBefore).length;
        const result = fixModule(file);
        assert.strictEqual(result.totalBefore, before);
        assert.strictEqual(result.fixedCount, before - result.remainingIssues.length);
    });

};
