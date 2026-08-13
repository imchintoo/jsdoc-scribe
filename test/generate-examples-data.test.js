"use strict";

/**
 * Tests for scripts/generate-examples-data.js (TASK-F14-03A).
 *
 * Written in this repo's existing `module.exports = function(check) {...}`
 * convention (see test/site-data.test.js, test/project-facts.test.js) so it
 * can be wired into test/run.js's Suite list with one `require()` line.
 *
 * NOT wired into test/run.js by this ticket: TASK-F14-03A's scope is
 * explicitly "scripts/generate-examples-data.js (new file). No touch to
 * build-pages-docs.js in this ticket" and the parent task instructions for
 * this ticket say "zero edits to ... any other existing file" — test/run.js
 * is an existing file. Flagging for tech-lead: someone (tech-lead review /
 * TASK-F14-03B) needs to add
 *   require("./generate-examples-data.test.js")(check);
 * to test/run.js so this suite runs under `npm test`. Until then, this file
 * is independently runnable directly: `node test/generate-examples-data.test.js`.
 *
 * These tests exercise the real generateExamplesData() — which shells out
 * to the real bin/cli.js against real sample/* fixtures — so they're
 * integration tests, not pure-unit, and take a few seconds (dominated by
 * ~13 child `node bin/cli.js` process spawns). That's expected and
 * consistent with the timing this ticket's PR reports.
 */

const assert = require("assert");
const { generateExamplesData, stripJsDocBlocks, FRAMEWORKS } = require("../scripts/generate-examples-data.js");

const FIGMA_ORDER = ["React", "Next.js", "Angular", "Vue", "Express", "NestJS", "Plain JS", "Plain TS"];

module.exports = function runGenerateExamplesDataTests(check) {
    // Run the (real, CLI-shelling) generator once and share the result
    // across checks below, rather than re-running it ~10 times.
    let result;
    let setupError = null;
    try {
        result = generateExamplesData();
    } catch (err) {
        setupError = err;
    }

    check("generateExamplesData: runs without throwing", () => {
        if (setupError) throw setupError;
        assert.ok(result, "generateExamplesData() returned nothing");
    });

    if (setupError) {
        // Every subsequent check would just fail with the same root cause;
        // report it once, clearly, instead of a flood of duplicate failures.
        check("generateExamplesData: aborted -- see prior failure for root cause", () => {
            throw setupError;
        });
        return;
    }

    check("generateExamplesData: returns exactly 8 entries", () => {
        assert.strictEqual(result.entries.length, 8);
    });

    check("generateExamplesData: entry order matches the fixed Figma order", () => {
        assert.deepStrictEqual(result.entries.map((e) => e.name), FIGMA_ORDER);
    });

    check("generateExamplesData: FRAMEWORKS config itself matches the fixed Figma order", () => {
        assert.deepStrictEqual(FRAMEWORKS.map((f) => f.name), FIGMA_ORDER);
    });

    check("generateExamplesData: all 7 real entries have generated:true and non-empty, genuinely-different after/before", () => {
        const real = result.entries.filter((e) => e.name !== "Vue");
        assert.strictEqual(real.length, 7);
        real.forEach((e) => {
            assert.strictEqual(e.generated, true, `${e.name}: expected generated:true`);
            assert.ok(typeof e.before === "string" && e.before.length > 0, `${e.name}: before missing/empty`);
            assert.ok(typeof e.after === "string" && e.after.length > 0, `${e.name}: after missing/empty`);
            assert.notStrictEqual(e.after, e.before, `${e.name}: after must not equal before (would mean nothing was really generated)`);
            assert.match(e.after, /\/\*\*/, `${e.name}: after should contain at least one real JSDoc block`);
        });
    });

    check("generateExamplesData: all 7 real entries have a non-empty detectionMethod string", () => {
        result.entries
            .filter((e) => e.name !== "Vue")
            .forEach((e) => {
                assert.ok(typeof e.detectionMethod === "string" && e.detectionMethod.length > 0, `${e.name}: detectionMethod missing/empty`);
            });
    });

    check("generateExamplesData: Vue entry has the stub shape -- no before/after/sample fields populated", () => {
        const vue = result.entries.find((e) => e.name === "Vue");
        assert.ok(vue, "Vue entry missing");
        assert.strictEqual(vue.generated, false);
        assert.strictEqual(vue.before, null);
        assert.strictEqual(vue.after, null);
        assert.strictEqual(vue.sampleTargets, null);
        assert.strictEqual(vue.demoFile, null);
        assert.ok(typeof vue.detectionMethod === "string" && vue.detectionMethod.length > 0, "Vue: detectionMethod should still be populated (sourced from FRAMEWORK_MARKERS)");
    });

    check("generateExamplesData: Plain TS entry's sampleTargets is the explicit 6-file root list, not a directory", () => {
        const plainTs = result.entries.find((e) => e.name === "Plain TS");
        assert.deepStrictEqual(plainTs.sampleTargets, [
            "sample/api.ts",
            "sample/models.ts",
            "sample/errors.ts",
            "sample/events.ts",
            "sample/middleware.ts",
            "sample/container.ts",
        ]);
    });

    check("generateExamplesData: --dry-run checks against real sample/* mutated zero files", () => {
        assert.ok(result.dryRunChecks.length === 7, "expected one dry-run check per real framework");
        result.dryRunChecks.forEach((c) => {
            assert.strictEqual(c.mutated.length, 0, `${c.name}: --dry-run mutated ${c.mutated.length} real sample file(s): ${c.mutated.join(", ")}`);
            assert.strictEqual(c.exitCode, 0, `${c.name}: --dry-run exited ${c.exitCode}`);
        });
    });

    // --- stripJsDocBlocks unit checks (pure function, no CLI spawn) ---

    check("stripJsDocBlocks: removes a leading block comment, leaves code untouched", () => {
        const src = "/**\n * A doc.\n */\nfunction f() {\n  return 1;\n}\n";
        const stripped = stripJsDocBlocks(src);
        assert.ok(!stripped.includes("/**"), "block comment should be gone");
        assert.match(stripped, /function f\(\) \{\s*\n\s*return 1;/);
    });

    check("stripJsDocBlocks: leaves files with no JSDoc unchanged", () => {
        const src = "function f() {\n  return 1;\n}\n";
        assert.strictEqual(stripJsDocBlocks(src), src);
    });
};

// Standalone runner: `node test/generate-examples-data.test.js`
if (require.main === module) {
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
    console.log("-- generate-examples-data --");
    module.exports(check);
    console.log("\n" + passed + " test(s) passed." + (failed ? "  " + failed + " FAILED." : ""));
    if (failed > 0) process.exit(1);
}
