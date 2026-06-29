"use strict";

/**
 * Minimal self-test, no framework needed — runs on every `npm test`
 * and ideally before every `npm publish` (see prepublishOnly).
 * Pure assertions against deterministic output, so it never flakes.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");
const { processFile, collectFiles } = require("../lib/index.js");

function tmpFile(name, content) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cbg-test-"));
    const file = path.join(dir, name);
    fs.writeFileSync(file, content, "utf8");
    return file;
}

let passed = 0;
function check(label, fn) {
    fn();
    passed += 1;
    console.log(`  ok - ${label}`);
}

check("adds a function doc with correct param/return types (TS)", () => {
    const file = tmpFile("a.ts", "export function add(a: number, b: number): number {\n  return a + b;\n}\n");
    processFile(file, { write: false, silent: true });
    const out = fs.readFileSync(file.replace(".ts", ".ts"), "utf8");
    assert.match(out, /@function add/);
    assert.match(out, /@param \{number\} a/);
    assert.match(out, /@returns \{number\}/);
});

check("infers non-void return type from a bare return statement (no AI, just syntax)", () => {
    const file = tmpFile("b.js", 'function greet(name) {\n  return "hi " + name;\n}\n');
    processFile(file, { write: false, silent: true });
    const out = fs.readFileSync(file.replace(".js", ".js"), "utf8");
    assert.match(out, /@returns \{any\}/); // no annotation available in plain JS, but NOT void
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
    const ts = require("typescript");
    const file = tmpFile("e.ts", "export class Foo {\n  bar(x: string): string {\n    return x;\n  }\n}\n");
    processFile(file, { write: false, silent: true });
    const outPath = file.replace(".ts", ".ts");
    const text = fs.readFileSync(outPath, "utf8");
    const sf = ts.createSourceFile(outPath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
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

console.log(`\n${passed} test(s) passed.`);
