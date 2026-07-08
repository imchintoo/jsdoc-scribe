#!/usr/bin/env node
"use strict";

/**
 * bench/generate-fixtures.js -- task-ls-01
 *
 * Deterministic synthetic-fixture generator for the linear-scaling
 * benchmark (story-gendocs-linear-scaling.md / adr-linear-scaling-fix.md).
 *
 * Produces N JSDoc'd .ts files at a mixed subdirectory-depth distribution
 * (not a flat folder of N files) -- meant to roughly mirror a real
 * monorepo shape, since the bug this benchmarks (unmemoized commonRoot() +
 * full-tree sidebar walk per page) is depth/breadth sensitive, not just
 * file-count sensitive.
 *
 * Determinism: a fixed-seed PRNG (mulberry32) is (re)seeded with the same
 * constant on every invocation and consumed in file-index order (i = 0..N-1),
 * so the same N always produces the same file set and the same content --
 * required so local profiling runs (task-ls-02) and CI perf-gate runs
 * (bench/run-perf-gate.js) are reproducible and comparable run-to-run.
 * Never uses Date.now()/Math.random().
 *
 * CLI:
 *   node bench/generate-fixtures.js <N> [--out <dir>]
 *
 * Programmatic:
 *   const { generate } = require("./bench/generate-fixtures.js");
 *   generate(1000, "bench/generated/1000");
 */

const fs = require("fs");
const path = require("path");

const SEED = 0x5eed1dea;

// mulberry32 -- small, fast, deterministic PRNG. Good enough for fixture
// shape/content selection; not used for anything security-sensitive.
function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

var DIR_POOL = [
    "core", "services", "utils", "components", "models", "controllers",
    "handlers", "helpers", "lib", "api", "routes", "middleware", "types",
    "validators", "adapters", "repositories", "workers", "jobs", "config",
    "clients",
];

var VERB_POOL = ["compute", "resolve", "build", "normalize", "validate", "transform", "fetch", "serialize"];
var NOUN_POOL = ["value", "record", "payload", "entity", "result", "batch", "context", "state"];

function pick(rng, pool) {
    return pool[Math.floor(rng() * pool.length) % pool.length];
}

/**
 * Picks a nesting depth 0-4, weighted toward 1-2 (few root files, most
 * files a level or two deep, fewer very-deep files) -- "mixed", not flat,
 * and not uniformly random either.
 * @param {function} rng
 * @returns {number}
 */
function pickDepth(rng) {
    var r = rng();
    if (r < 0.08) return 0;
    if (r < 0.40) return 1;
    if (r < 0.75) return 2;
    if (r < 0.93) return 3;
    return 4;
}

/**
 * Builds one synthetic module's relative path + source content.
 * @param {number} i - file index, 0-based
 * @param {function} rng - seeded PRNG, shared/advanced across all files
 * @returns {{relPath: string, content: string}}
 */
function buildFixture(i, rng) {
    var depth = pickDepth(rng);
    var segs = [];
    for (var d = 0; d < depth; d++) {
        segs.push(pick(rng, DIR_POOL));
    }
    var verb = pick(rng, VERB_POOL);
    var noun = pick(rng, NOUN_POOL);
    var baseName = verb + noun.charAt(0).toUpperCase() + noun.slice(1);
    var fileName = baseName + "_" + i + ".ts";
    var relPath = segs.concat([fileName]).join("/");

    var exportCount = 1 + Math.floor(rng() * 3); // 1-3 exports per file
    var parts = [];
    for (var e = 0; e < exportCount; e++) {
        var fnName = baseName + (e === 0 ? "" : e);
        parts.push(
            "/**\n" +
                " * " + verb.charAt(0).toUpperCase() + verb.slice(1) + "s the " + noun + " for fixture " + i + "-" + e + ".\n" +
                " * @param {number} a\n" +
                " * @param {number} b\n" +
                " * @returns {number}\n" +
                " */\n" +
                "export function " + fnName + "(a: number, b: number): number {\n" +
                "    return a + b + " + i + ";\n" +
                "}\n",
        );
    }
    // Every ~10th file also gets a small class, for shape variety (classes
    // exercise a different renderer code path than plain functions).
    if (i % 10 === 0) {
        parts.push(
            "/**\n" +
                " * Synthetic fixture class for module " + i + ".\n" +
                " */\n" +
                "export class " + baseName.charAt(0).toUpperCase() + baseName.slice(1) + "Service" + i + " {\n" +
                "    /**\n" +
                "     * @param {number} x\n" +
                "     * @returns {number}\n" +
                "     */\n" +
                "    run(x: number): number {\n" +
                "        return x * " + ((i % 7) + 1) + ";\n" +
                "    }\n" +
                "}\n",
        );
    }

    return { relPath: relPath, content: parts.join("\n") };
}

/**
 * Generates N deterministic fixture files into outDir. Idempotent: if
 * outDir already contains exactly N generated files from a prior run with
 * the same generator version, this still rewrites them (cheap, and avoids
 * subtle staleness bugs from a partial/aborted prior run) -- callers that
 * want to skip regeneration should check for the directory's existence
 * themselves (bench/run-perf-gate.js does this).
 * @param {number} n
 * @param {string} outDir
 * @returns {number} number of files written
 */
function generate(n, outDir) {
    if (!Number.isInteger(n) || n <= 0) {
        throw new Error("generate(n, outDir): n must be a positive integer, got " + n);
    }
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });

    var rng = mulberry32(SEED);
    for (var i = 0; i < n; i++) {
        var fixture = buildFixture(i, rng);
        var fullPath = path.join(outDir, fixture.relPath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, fixture.content, "utf8");
    }
    return n;
}

function main() {
    var args = process.argv.slice(2);
    var n = parseInt(args[0], 10);
    if (!n || n <= 0) {
        console.error("Usage: node bench/generate-fixtures.js <N> [--out <dir>]");
        process.exit(1);
    }
    var outIdx = args.indexOf("--out");
    var outDir = outIdx !== -1 && args[outIdx + 1] ? args[outIdx + 1] : path.join(__dirname, "generated", String(n));
    var written = generate(n, outDir);
    console.log("Generated " + written + " fixture file(s) at " + outDir);
}

if (require.main === module) {
    main();
}

module.exports = { generate: generate, mulberry32: mulberry32 };
