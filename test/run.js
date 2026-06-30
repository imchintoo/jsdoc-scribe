"use strict";

/**
 * Minimal self-test runner — no framework needed.
 * Runs on every `npm test` and ideally before every `npm publish`.
 * Pure assertions against deterministic output; never flakes.
 *
 * Suites:
 *   1. gen-comments (lib/index.js) — 7 tests
 *   2. extractor     (lib/extractor.js) — 10 tests
 *   3. renderer      (lib/renderer.js)  — 8 tests
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
    assert.match(out, /@function add/);
    assert.match(out, /@param \{number\} a/);
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
// Summary
// ---------------------------------------------------------------------------
console.log("\n" + passed + " test(s) passed." + (failed ? "  " + failed + " FAILED." : ""));
if (failed > 0) process.exit(1);
