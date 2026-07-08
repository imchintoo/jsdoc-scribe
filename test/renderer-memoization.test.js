"use strict";

/**
 * task-ls-05 -- cross-call isolation regression test for the linear-scaling
 * fix (story-gendocs-linear-scaling.md / adr-linear-scaling-fix.md).
 *
 * task-ls-03 memoizes lib/renderer.js's commonRoot(modules) in a WeakMap
 * keyed on the `modules` ARRAY REFERENCE (not on any string derived from
 * it), specifically to avoid two independent buildSite() calls leaking a
 * cached label/breadcrumb between each other when they happen to share a
 * filePath string but have a different actual common root. task-ls-04's
 * per-tree-node default-HTML cache is call-scoped (a fresh Map built inside
 * every buildSite() call) for the same reason.
 *
 * This is a renderer-internal concern (buildSite()'s own memoization
 * correctness), not a CLI-level concern -- kept in its own file rather than
 * folded into test/gen-docs.test.js, per task-ls-05's Definition of Done.
 */

const assert = require("assert");
const { buildSite } = require("../lib/renderer.js");

function makeMod(filePath, overrides) {
    return Object.assign({
        filePath,
        description: null,
        since: null,
        functions:   [],
        classes:     [],
        interfaces:  [],
        typeAliases: [],
        enums:       [],
        variables:   [],
    }, overrides);
}

module.exports = function runRendererMemoizationTests(check) {

    check("renderer: commonRoot cache does not bleed a label across two buildSite() calls that share a filePath string but have a different common root", () => {
        // Call A: two modules under /proj/src/utils/ -- commonRoot is
        // "/proj/src/utils", so helper.ts's label is the bare "helper".
        const modulesA = [makeMod("/proj/src/utils/helper.ts"), makeMod("/proj/src/utils/other.ts")];
        const pagesA = buildSite(modulesA, { projectName: "A" });
        const pathsA = pagesA.map((p) => p.path);
        assert.ok(pathsA.includes("modules/helper.html"), "call A: expected modules/helper.html, got " + pathsA.join(","));

        // Call B: helper.ts is STILL at the same absolute path, but its
        // sibling this time is one level up -- commonRoot is now
        // "/proj/src", so helper.ts's label should be "utils/helper", not
        // the "helper" cached by call A.
        const modulesB = [makeMod("/proj/src/utils/helper.ts"), makeMod("/proj/src/api.ts")];
        const pagesB = buildSite(modulesB, { projectName: "B" });
        const pathsB = pagesB.map((p) => p.path);
        assert.ok(
            pathsB.includes("modules/utils__helper.html"),
            "call B: expected modules/utils__helper.html (commonRoot should NOT be bled from call A's cache), got " + pathsB.join(","),
        );
        assert.ok(!pathsB.includes("modules/helper.html"), "call B incorrectly reused call A's cached 'helper' label");

        // Call A again, AFTER call B -- confirms the reverse direction too
        // (B's wider commonRoot must not leak forward into a fresh call
        // shaped like A).
        const pagesA2 = buildSite(modulesA, { projectName: "A2" });
        const pathsA2 = pagesA2.map((p) => p.path);
        assert.ok(pathsA2.includes("modules/helper.html"), "re-run of call A after call B: expected modules/helper.html again, got " + pathsA2.join(","));
    });

    check("renderer: sidebar link hrefs for the shared module differ correctly between the two isolated calls (not just the page filename)", () => {
        const modulesA = [makeMod("/proj/src/utils/helper.ts"), makeMod("/proj/src/utils/other.ts")];
        const pagesA = buildSite(modulesA, { projectName: "A" });
        const indexA = pagesA.find((p) => p.path === "index.html").html;
        assert.ok(indexA.includes('href="modules/helper.html"'), "call A sidebar should link to modules/helper.html");

        const modulesB = [makeMod("/proj/src/utils/helper.ts"), makeMod("/proj/src/api.ts")];
        const pagesB = buildSite(modulesB, { projectName: "B" });
        const indexB = pagesB.find((p) => p.path === "index.html").html;
        assert.ok(indexB.includes('href="modules/utils__helper.html"'), "call B sidebar should link to modules/utils__helper.html, not call A's cached path");
        assert.ok(!indexB.includes('href="modules/helper.html"'), "call B sidebar leaked call A's cached href");
    });

    check("renderer: two buildSite() calls against genuinely identical input produce byte-identical output (baseline determinism, no cache involved)", () => {
        const mk = () => [makeMod("/proj/src/a.ts"), makeMod("/proj/src/sub/b.ts")];
        const pages1 = buildSite(mk(), { projectName: "Same" });
        const pages2 = buildSite(mk(), { projectName: "Same" });
        assert.deepStrictEqual(pages1.map((p) => p.path).sort(), pages2.map((p) => p.path).sort());
        const byPath1 = Object.fromEntries(pages1.map((p) => [p.path, p.html]));
        const byPath2 = Object.fromEntries(pages2.map((p) => [p.path, p.html]));
        for (const p of Object.keys(byPath1)) {
            assert.strictEqual(byPath1[p], byPath2[p], `page "${p}" differs between two calls with equivalent-but-distinct modules arrays`);
        }
    });

};
