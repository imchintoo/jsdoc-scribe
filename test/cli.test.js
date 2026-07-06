"use strict";

/**
 * CLI-level tests for the new --check-drift and --coverage-badge flags, plus
 * the --check byte-identical-output regression required by
 * docs/backlog/task-pi-04-coverage-badge-cli.md (the --check/aggregateCoverage
 * refactor must not change --check's printed output).
 *
 * These spawn bin/cli.js directly (the only place that exercises the full
 * parseArgs -> branch-dispatch wiring), separate from the pure lib/*.js unit
 * suites above.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");
const { execFileSync } = require("child_process");

const CLI = path.join(__dirname, "..", "bin", "cli.js");

function tmpDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function runCli(args) {
    try {
        const out = execFileSync(process.execPath, [CLI, ...args], { encoding: "utf8" });
        return { status: 0, stdout: out };
    } catch (err) {
        return { status: err.status, stdout: err.stdout || "" };
    }
}

module.exports = function runCliTests(check) {

    check("cli: --check-drift exits 0 and reports no drift on a fully-consistent file", () => {
        const dir = tmpDir("scribe-cli-drift-clean-");
        const file = path.join(dir, "ok.ts");
        fs.writeFileSync(file, [
            "/**",
            " * Add two numbers.",
            " * @param {number} a - first",
            " * @param {number} b - second",
            " * @returns {number}",
            " */",
            "export function add(a: number, b: number): number { return a + b; }",
        ].join("\n") + "\n", "utf8");

        const res = runCli([dir, "--check-drift"]);
        assert.strictEqual(res.status, 0, "expected exit 0 for zero drift");
        assert.match(res.stdout, /No drift detected/);
    });

    check("cli: --check-drift exits 1 and reports issues when JSDoc has drifted from AST", () => {
        const dir = tmpDir("scribe-cli-drift-dirty-");
        const file = path.join(dir, "bad.ts");
        fs.writeFileSync(file, [
            "/**",
            " * Add two numbers.",
            " * @param {number} a - first",
            " * @returns {string}",
            " */",
            "export function add(a: number, b: number): number { return a + b; }",
        ].join("\n") + "\n", "utf8");

        const before = fs.readFileSync(file, "utf8");
        const res = runCli([dir, "--check-drift"]);
        const after = fs.readFileSync(file, "utf8");

        assert.strictEqual(res.status, 1, "expected exit 1 when drift found");
        assert.match(res.stdout, /missing-param/);
        assert.match(res.stdout, /return-type-mismatch/);
        assert.strictEqual(before, after, "--check-drift must never modify source files");
    });

    check("cli: --check-drift --write does not write to source (read-only branch wins)", () => {
        const dir = tmpDir("scribe-cli-drift-write-");
        const file = path.join(dir, "bad.ts");
        const original = [
            "/**",
            " * @param {number} a",
            " */",
            "export function f(a: number, b: number): void {}",
        ].join("\n") + "\n";
        fs.writeFileSync(file, original, "utf8");

        runCli([dir, "--check-drift", "--write"]);
        const after = fs.readFileSync(file, "utf8");
        assert.strictEqual(after, original, "--check-drift must short-circuit before any write path");
    });

    check("cli: --coverage-badge <dir> writes valid SVG + JSON without touching source", () => {
        const srcDir = tmpDir("scribe-cli-cov-src-");
        const outDir = tmpDir("scribe-cli-cov-out-");
        const file = path.join(srcDir, "a.ts");
        const original = "export function undocumented(): void {}\n";
        fs.writeFileSync(file, original, "utf8");

        const res = runCli([srcDir, "--coverage-badge", outDir]);
        assert.strictEqual(res.status, 0);

        const svg = fs.readFileSync(path.join(outDir, "coverage-badge.svg"), "utf8");
        assert.ok(svg.startsWith("<svg") && svg.endsWith("</svg>\n") === false && svg.trim().endsWith("</svg>"));

        const json = JSON.parse(fs.readFileSync(path.join(outDir, "coverage-summary.json"), "utf8"));
        assert.strictEqual(json.total, 1);
        assert.strictEqual(json.documented, 0);
        assert.strictEqual(json.pct, 0);
        assert.strictEqual(json.generatedAt, null);

        assert.strictEqual(fs.readFileSync(file, "utf8"), original, "--coverage-badge must not touch source files");
    });

    check("cli: --coverage-badge creates the output directory if missing", () => {
        const srcDir = tmpDir("scribe-cli-cov-src2-");
        fs.writeFileSync(path.join(srcDir, "a.ts"), "export function f(): void {}\n", "utf8");
        const outDir = path.join(tmpDir("scribe-cli-cov-parent-"), "nested", "badge-dir");

        runCli([srcDir, "--coverage-badge", outDir]);
        assert.ok(fs.existsSync(path.join(outDir, "coverage-badge.svg")));
    });

    check("cli: --check pct matches --coverage-badge pct for the same path (same run's aggregateCoverage)", () => {
        const dir = tmpDir("scribe-cli-parity-");
        fs.writeFileSync(path.join(dir, "a.ts"), "export function documented(): void {}\nexport function bare(): void {}\n", "utf8");
        const outDir = tmpDir("scribe-cli-parity-out-");

        const checkRes = runCli([dir, "--check"]);
        const badgeRes = runCli([dir, "--coverage-badge", outDir]);

        const checkMatch = checkRes.stdout.match(/Coverage: (\d+)\/(\d+) symbols documented \((\d+)%\)/);
        const json = JSON.parse(fs.readFileSync(path.join(outDir, "coverage-summary.json"), "utf8"));

        assert.ok(checkMatch, "could not parse --check coverage line");
        assert.strictEqual(Number(checkMatch[3]), json.pct, "pct differs between --check and --coverage-badge");
    });

    check("cli: --coverage-badge on a file with zero doc-able symbols produces pct:100, not NaN/crash", () => {
        const srcDir = tmpDir("scribe-cli-cov-empty-");
        const outDir = tmpDir("scribe-cli-cov-empty-out-");
        // Note: a top-level `export const X = ...` IS counted as one doc-able symbol by
        // collectEdits() (ts.isVariableStatement branch, lib/index.js:373) — that is NOT
        // the zero-symbol case. A file with only bare expression statements (no function,
        // class, interface, or variable-statement declarations) is the true zero-total case.
        fs.writeFileSync(path.join(srcDir, "script.ts"), 'console.log("side effect only, no declarations");\n', "utf8");

        const res = runCli([srcDir, "--coverage-badge", outDir]);
        assert.strictEqual(res.status, 0);

        const json = JSON.parse(fs.readFileSync(path.join(outDir, "coverage-summary.json"), "utf8"));
        assert.strictEqual(json.total, 0, "a file with only expression statements has no doc-able symbols");
        assert.strictEqual(json.pct, 100, "zero-file/zero-symbol fallback must be 100, not NaN");
        assert.ok(!Number.isNaN(json.pct));

        const svg = fs.readFileSync(path.join(outDir, "coverage-badge.svg"), "utf8");
        assert.ok(svg.includes("100%"));
        assert.ok(svg.includes("#4c1"), "100% should render green");
    });

    check("cli: --check-drift and --coverage-badge both parse together without clobbering each other", () => {
        const dir = tmpDir("scribe-cli-coexist-");
        fs.writeFileSync(path.join(dir, "a.ts"), "export function f(): void {}\n", "utf8");
        const outDir = tmpDir("scribe-cli-coexist-out-");

        // --check-drift is checked first in bin/cli.js, so it wins and returns
        // before the coverageBadge branch runs — this test asserts both flags
        // parse cleanly together (no crash, no argv-consuming collision) and
        // that the earlier branch's precedence holds.
        const res = runCli([dir, "--check-drift", "--coverage-badge", outDir]);
        assert.strictEqual(res.status, 0);
        assert.match(res.stdout, /No drift detected/);
        assert.ok(!fs.existsSync(path.join(outDir, "coverage-badge.svg")), "checkDrift branch should return before coverageBadge branch runs");
    });

    check("cli: --lint exits 0 and reports no issues on a fully-documented, well-formed file", () => {
        const dir = tmpDir("scribe-cli-lint-clean-");
        const file = path.join(dir, "ok.ts");
        fs.writeFileSync(file, [
            "/**",
            " * Add two numbers.",
            " * @param {number} a - first",
            " * @param {number} b - second",
            " * @returns {number} the sum",
            " */",
            "export function add(a: number, b: number): number { return a + b; }",
        ].join("\n") + "\n", "utf8");

        const res = runCli([dir, "--lint"]);
        assert.strictEqual(res.status, 0, "expected exit 0 for zero lint issues");
        assert.match(res.stdout, /No lint issues found/);
    });

    check("cli: --lint exits 1 and reports issues for missing tags and unknown tag names", () => {
        const dir = tmpDir("scribe-cli-lint-dirty-");
        const file = path.join(dir, "bad.ts");
        fs.writeFileSync(file, [
            "/**",
            " * @parm {number} a",
            " */",
            "export function add(a: number, b: number): number { return a + b; }",
        ].join("\n") + "\n", "utf8");

        const before = fs.readFileSync(file, "utf8");
        const res = runCli([dir, "--lint"]);
        const after = fs.readFileSync(file, "utf8");

        assert.strictEqual(res.status, 1, "expected exit 1 when lint issues found");
        assert.match(res.stdout, /check-tag-names/);
        assert.match(res.stdout, /require-param/);
        assert.strictEqual(before, after, "--lint must never modify source files");
    });

    check("cli: --lint and --check-drift both run together, sharing one extractModule() pass", () => {
        const dir = tmpDir("scribe-cli-lint-drift-");
        fs.writeFileSync(path.join(dir, "a.ts"), [
            "/**",
            " * @param {number} a",
            " * @returns {string}",
            " */",
            "export function f(a: number, b: number): number { return a; }",
        ].join("\n") + "\n", "utf8");

        const res = runCli([dir, "--lint", "--check-drift"]);
        assert.strictEqual(res.status, 1);
        assert.match(res.stdout, /Checking drift across/);
        assert.match(res.stdout, /Linting JSDoc across/);
        assert.match(res.stdout, /return-type-mismatch/);
        assert.match(res.stdout, /require-param/);
    });

    check("cli: --fix rewrites a file to resolve lint issues and reports fixed/remaining counts", () => {
        const dir = tmpDir("scribe-cli-fix-");
        const file = path.join(dir, "bad.ts");
        fs.writeFileSync(file, [
            "/**",
            " * @param {number} b",
            " * @param {number} a",
            " */",
            "export function subtract(a: number, b: number): number { return a - b; }",
        ].join("\n") + "\n", "utf8");

        const res = runCli([dir, "--fix"]);
        const after = fs.readFileSync(file, "utf8");

        assert.match(res.stdout, /Fixing JSDoc lint issues across/, "--fix should imply --lint's framing, not silently do nothing");
        assert.match(res.stdout, /issue\(s\) fixed/);
        assert.match(after, /@param \{number\} a/);
        assert.match(after, /@returns/);
        const aIdx = after.indexOf("@param {number} a");
        const bIdx = after.indexOf("@param {number} b");
        assert.ok(aIdx < bIdx, "param order should now match the real signature");
    });

    check("cli: --fix exits 0 once every issue is resolved", () => {
        const dir = tmpDir("scribe-cli-fix-clean-");
        const file = path.join(dir, "bad.ts");
        fs.writeFileSync(file, [
            "/**",
            " * Adds.",
            " * @param {number} a",
            " */",
            "export function add(a: number, b: number): number { return a + b; }",
        ].join("\n") + "\n", "utf8");

        const res = runCli([dir, "--fix"]);
        assert.strictEqual(res.status, 0, "no unfixable rule (check-tag-names) present, so exit should be 0 after fixing");
        assert.match(res.stdout, /No remaining lint issues/);
    });

    check("cli: --fix leaves an unknown-tag finding as a remaining issue and exits 1", () => {
        const dir = tmpDir("scribe-cli-fix-remaining-");
        const file = path.join(dir, "bad.ts");
        fs.writeFileSync(file, [
            "/**",
            " * @parm {number} a",
            " */",
            "export function identity(a: number): number { return a; }",
        ].join("\n") + "\n", "utf8");

        const res = runCli([dir, "--fix"]);
        assert.strictEqual(res.status, 1);
        assert.match(res.stdout, /check-tag-names/);
        assert.match(res.stdout, /remain/);
    });

    check("cli: --fix on an already-clean file changes nothing and exits 0", () => {
        const dir = tmpDir("scribe-cli-fix-noop-");
        const file = path.join(dir, "ok.ts");
        const original = [
            "/**",
            " * Add two numbers.",
            " * @param {number} a - first",
            " * @param {number} b - second",
            " * @returns {number} the sum",
            " */",
            "export function add(a: number, b: number): number { return a + b; }",
        ].join("\n") + "\n";
        fs.writeFileSync(file, original, "utf8");

        const res = runCli([dir, "--fix"]);
        assert.strictEqual(res.status, 0);
        assert.strictEqual(fs.readFileSync(file, "utf8"), original, "a clean file must be byte-identical after --fix");
    });

    check("cli: --check stdout is unchanged by the aggregateCoverage refactor (regression)", () => {
        const dir = tmpDir("scribe-cli-check-regress-");
        fs.writeFileSync(path.join(dir, "a.ts"), [
            "export function documented(): void {}",
            "export function bare(a: number): number { return a; }",
        ].join("\n") + "\n", "utf8");

        const res = runCli([dir, "--check"]);
        assert.strictEqual(res.status, 1);
        assert.match(res.stdout, /^Analysing \d+ file\(s\)\.\.\./);
        assert.match(res.stdout, /Coverage: \d+\/\d+ symbols documented \(\d+%\)/);
        assert.match(res.stdout, /symbol\(s\) missing documentation\./);
        assert.match(res.stdout, /Failing: run gen-comments --write to add missing blocks\./);
    });

};
