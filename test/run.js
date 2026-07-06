"use strict";

/**
 * Minimal self-test runner — no framework needed.
 * Runs on every `npm test` and ideally before every `npm publish`.
 * Pure assertions against deterministic output; never flakes.
 *
 * Suites:
 *   1. gen-comments (lib/index.js) — 12 tests
 *   2. extractor     (lib/extractor.js) — 10 tests
 *   3. renderer      (lib/renderer.js)  — 8 tests
 *   4. drift         (lib/drift.js)     — 9 tests
 *   5. coverage      (lib/coverage.js)  — 5 tests
 *   6. cli           (bin/cli.js)       — 8 tests
 *   7. ast-utils     (lib/ast-utils.js) — 12 tests
 *   8. lint          (lib/lint.js)      — new in v1.18.0
 *   9. fix           (lib/fix.js)       — new in v1.19.0 (--lint --fix)
 *  10. import-graph  (lib/import-graph.js) — new in v1.20.0 (project dashboard)
 *  11. project-facts (lib/project-facts.js) — new in v1.20.0 (project dashboard)
 *  12. quality       (lib/quality.js) — new in v1.20.0 (code-multivitals integration)
 */

const fs   = require("fs");
const path = require("path");
const os   = require("os");
const assert = require("assert");
const { processFile, collectFiles } = require("../lib/index.js");

function tmpFile(name, content) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cbg-test-"));
    const file = path.join(dir, name);
    fs.writeFileSync(file, content, "utf8");
    return file;
}

let passed = 0;
let failed = 0;
function check(label, fn) {
    try {
        fn();
        passed += 1;
        console.log("  ok - " + label);
    } catch (err) {
        failed += 1;
        console.error("  FAIL - " + label);
        console.error("       " + err.message);
    }
}

// ---------------------------------------------------------------------------
// Suite 1 — gen-comments (lib/index.js)
// ---------------------------------------------------------------------------
console.log("\n-- gen-comments --");

check("adds a function doc with correct param/return types (TS)", () => {
    const file = tmpFile("a.ts", "export function add(a: number, b: number): number {\n  return a + b;\n}\n");
    processFile(file, { write: false, silent: true });
    const out = fs.readFileSync(file, "utf8");
    // Phase E: description line replaces @function tag
    assert.match(out, /Adds the/);          // inferred description from verb "add"
    assert.match(out, /@param \{number\} a/);   // type preserved
    assert.match(out, /@returns \{number\}/);
});

check("infers non-void return type from a bare return statement (no AI, just syntax)", () => {
    const file = tmpFile("b.js", "function greet(name) {\n  return \"hi \" + name;\n}\n");
    processFile(file, { write: false, silent: true });
    const out = fs.readFileSync(file, "utf8");
    assert.match(out, /@returns \{any\}/);
});

check("skips nodes that already have a leading JSDoc block", () => {
    const file = tmpFile("c.js", "/**\n * already documented\n */\nfunction f(x) {\n  return x;\n}\n");
    const count = processFile(file, { write: false, silent: true });
    assert.strictEqual(count, 0);
});

check("--force re-adds comments even when one already exists", () => {
    const file = tmpFile("d.js", "/**\n * already documented\n */\nfunction f(x) {\n  return x;\n}\n");
    const count = processFile(file, { write: false, force: true, silent: true });
    assert.strictEqual(count, 1);
});

check("output remains syntactically valid TypeScript", () => {
    const ts   = require("typescript");
    const file = tmpFile("e.ts", "export class Foo {\n  bar(x: string): string {\n    return x;\n  }\n}\n");
    processFile(file, { write: false, silent: true });
    const text = fs.readFileSync(file, "utf8");
    const sf   = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    assert.strictEqual((sf.parseDiagnostics || []).length, 0);
});

check("recursively collects files from a directory and skips node_modules", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cbg-test-dir-"));
    fs.mkdirSync(path.join(dir, "node_modules"));
    fs.writeFileSync(path.join(dir, "node_modules", "skip.js"), "function s(){}");
    fs.writeFileSync(path.join(dir, "keep.ts"), "function k(){}");
    const files = collectFiles(dir);
    assert.strictEqual(files.length, 1);
    assert.ok(files[0].endsWith("keep.ts"));
});

check("is idempotent: running twice adds 0 blocks the second time", () => {
    const file = tmpFile("f.js", "const x = 1;\n");
    processFile(file, { write: true, silent: true });
    const second = processFile(file, { write: true, silent: true });
    assert.strictEqual(second, 0);
});

check("gen-comments: infers description from verb prefix", () => {
    const file = tmpFile("verb.ts", "function getUserById(userId: string) { return null; }\n");
    processFile(file, { write: false, silent: true });
    const out = fs.readFileSync(file, "utf8");
    assert.match(out, /Returns the user by id/);
    assert.match(out, /user unique identifier/);   // param description
});

check("gen-comments: auto-detects @throws from AST throw statements", () => {
    const file = tmpFile("throws.ts", [
        "function validate(x: string): void {",
        "  if (!x) throw new ValidationError('required');",
        "}",
    ].join("\n") + "\n");
    processFile(file, { write: false, silent: true });
    const out = fs.readFileSync(file, "utf8");
    assert.match(out, /@throws \{ValidationError\}/);
});

check("gen-comments: infers class description from class name suffix", () => {
    const file = tmpFile("cls.ts", "export class UserService {}\n");
    processFile(file, { write: false, silent: true });
    const out = fs.readFileSync(file, "utf8");
    assert.match(out, /Service responsible for user operations/);
});

check("gen-comments: --check exits 1 when symbols undocumented", () => {
    const { analyseFile } = require("../lib/index.js");
    const file = tmpFile("chk.ts", "export function undocumented() {}\n");
    const stats = analyseFile(file);
    assert.strictEqual(stats.total, 1);
    assert.strictEqual(stats.undocumented, 1);
    assert.strictEqual(stats.documented, 0);
});

check("gen-comments: analyseFile returns 100% after processFile", () => {
    const { analyseFile } = require("../lib/index.js");
    const file = tmpFile("chk2.ts", "export function documented() {}\n");
    processFile(file, { write: false, silent: true });
    const stats = analyseFile(file);
    assert.strictEqual(stats.undocumented, 0);
    assert.strictEqual(stats.documented, stats.total);
});

// ---------------------------------------------------------------------------
// Suite 2 — extractor (lib/extractor.js)
// ---------------------------------------------------------------------------
console.log("\n-- extractor --");
require("./extractor.test.js")(check);

// ---------------------------------------------------------------------------
// Suite 3 — renderer (lib/renderer.js)
// ---------------------------------------------------------------------------
console.log("\n-- renderer --");
require("./renderer.test.js")(check);

// ---------------------------------------------------------------------------
// Suite 4 — drift (lib/drift.js)
// ---------------------------------------------------------------------------
console.log("\n-- drift --");
require("./drift.test.js")(check);

// ---------------------------------------------------------------------------
// Suite 5 — coverage (lib/coverage.js)
// ---------------------------------------------------------------------------
console.log("\n-- coverage --");
require("./coverage.test.js")(check);

// ---------------------------------------------------------------------------
// Suite 6 — cli (bin/cli.js)
// ---------------------------------------------------------------------------
console.log("\n-- cli --");
require("./cli.test.js")(check);

// ---------------------------------------------------------------------------
// Suite 7 — ast-utils (lib/ast-utils.js)
// ---------------------------------------------------------------------------
console.log("\n-- ast-utils --");
require("./ast-utils.test.js")(check);

// ---------------------------------------------------------------------------
// Suite 8 — lint (lib/lint.js)
// ---------------------------------------------------------------------------
console.log("\n-- lint --");
require("./lint.test.js")(check);

// ---------------------------------------------------------------------------
// Suite 9 — fix (lib/fix.js)
// ---------------------------------------------------------------------------
console.log("\n-- fix --");
require("./fix.test.js")(check);

// ---------------------------------------------------------------------------
// Suite 10 — import-graph (lib/import-graph.js) — new in v1.20.0
// ---------------------------------------------------------------------------
console.log("\n-- import-graph --");
require("./import-graph.test.js")(check);

// ---------------------------------------------------------------------------
// Suite 11 — project-facts (lib/project-facts.js) — new in v1.20.0
// ---------------------------------------------------------------------------
console.log("\n-- project-facts --");
require("./project-facts.test.js")(check);

// ---------------------------------------------------------------------------
// Suite 12 — quality (lib/quality.js) — new in v1.20.0
// ---------------------------------------------------------------------------
console.log("\n-- quality --");
require("./quality.test.js")(check);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("\n" + passed + " test(s) passed." + (failed ? "  " + failed + " FAILED." : ""));
if (failed > 0) process.exit(1);
