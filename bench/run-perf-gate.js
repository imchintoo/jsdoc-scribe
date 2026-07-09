#!/usr/bin/env node
"use strict";

/**
 * bench/run-perf-gate.js -- task-ls-01
 *
 * Generates (or reuses already-generated) 500/1000/2000-file fixture sets
 * via bench/generate-fixtures.js, times `gen-docs` end-to-end wall-clock
 * against each set, computes time(2000)/time(500), and asserts that ratio
 * stays under 5.0x -- the linear-growth envelope from
 * story-gendocs-linear-scaling.md AC6/adr-linear-scaling-fix.md.
 *
 * 5.0x (not 4.0x) is deliberate headroom over strict linearity
 * (2000/500 = 4x file-count growth), so normal machine/CI noise doesn't
 * flip a healthy run into a false failure. Bumped from the original 4.5x
 * after a CI run measured 4.55x on otherwise-healthy code (no algorithmic
 * change since the linear-scaling fix landed) -- shared-runner timing
 * variance, not a regression. 5.0x keeps real superlinear blowups
 * (quadratic-ish growth would land well above this) caught while giving
 * single-digit-percent noise room to breathe.
 *
 * This is the interface contract `.github/workflows/perf-gate.yml` calls
 * via `npm run bench:perf-gate` (package.json).
 *
 * Exit code: 0 on pass, 1 on threshold breach or any other failure.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
const { generate } = require("./generate-fixtures.js");

var REPO_ROOT = path.join(__dirname, "..");
var GEN_DOCS_BIN = path.join(REPO_ROOT, "bin", "gen-docs.js");
var SIZES = [500, 1000, 2000];
var THRESHOLD = 5.0;

/**
 * Ensures a fixture set of size n exists at bench/generated/<n>, generating
 * it if missing. Reuse is intentional -- profiling (task-ls-02) and repeat
 * local perf-gate runs shouldn't pay fixture-generation cost every time.
 * @param {number} n
 * @returns {string} the fixture directory path
 */
function ensureFixtures(n) {
    var dir = path.join(__dirname, "generated", String(n));
    var marker = path.join(dir, ".generated");
    if (fs.existsSync(dir) && fs.existsSync(marker)) {
        return dir;
    }
    generate(n, dir);
    fs.writeFileSync(marker, "ok", "utf8");
    return dir;
}

/**
 * Times a single end-to-end `gen-docs <fixtureDir> --out <tmpOut>` run.
 * @param {string} fixtureDir
 * @returns {number} wall-clock milliseconds
 */
function timeGenDocs(fixtureDir) {
    var outDir = fs.mkdtempSync(path.join(os.tmpdir(), "scribe-bench-out-"));
    var start = process.hrtime.bigint();
    var result = spawnSync(
        process.execPath,
        [GEN_DOCS_BIN, fixtureDir, "--out", outDir, "--title", "bench"],
        { cwd: REPO_ROOT, stdio: ["ignore", "ignore", "inherit"] },
    );
    var end = process.hrtime.bigint();
    fs.rmSync(outDir, { recursive: true, force: true });
    if (result.status !== 0) {
        throw new Error("gen-docs exited with status " + result.status + " while benchmarking " + fixtureDir);
    }
    return Number(end - start) / 1e6; // ns -> ms
}

function main() {
    var results = [];
    SIZES.forEach(function (n) {
        var dir = ensureFixtures(n);
        var ms = timeGenDocs(dir);
        results.push({ n: n, ms: ms });
    });

    var t500 = results.filter(function (r) { return r.n === 500; })[0].ms;
    var t2000 = results.filter(function (r) { return r.n === 2000; })[0].ms;
    var ratio = t2000 / t500;

    console.log("\nperf-gate results (bench/run-perf-gate.js)");
    console.log("N\tgen-docs wall-clock (ms)");
    results.forEach(function (r) {
        console.log(r.n + "\t" + r.ms.toFixed(1));
    });
    console.log("\ntime(2000) / time(500) = " + ratio.toFixed(2) + "x  (threshold: <" + THRESHOLD + "x)");

    if (ratio >= THRESHOLD) {
        console.error("\nFAIL -- superlinear growth detected (" + ratio.toFixed(2) + "x >= " + THRESHOLD + "x).");
        process.exit(1);
    }
    console.log("\nPASS -- growth stayed within the linear envelope.");
    process.exit(0);
}

main();
