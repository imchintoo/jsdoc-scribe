"use strict";

/**
 * Coverage module unit tests — tests lib/coverage.js in isolation.
 */

const assert = require("assert");
const { aggregateCoverage, renderBadgeSvg } = require("../lib/coverage.js");

module.exports = function runCoverageTests(check) {

    check("coverage: aggregateCoverage([]) returns 0/0/0 with pct 100 (zero-file fallback)", () => {
        const agg = aggregateCoverage([]);
        assert.deepStrictEqual(agg, { documented: 0, total: 0, undocumented: 0, pct: 100 });
    });

    check("coverage: aggregateCoverage sums across a 3-file fixture and rounds like bin/cli.js", () => {
        const fileResults = [
            { documented: 2, total: 4, undocumented: 2 },
            { documented: 5, total: 5, undocumented: 0 },
            { documented: 1, total: 3, undocumented: 2 },
        ];
        const agg = aggregateCoverage(fileResults);
        assert.strictEqual(agg.documented, 8);
        assert.strictEqual(agg.total, 12);
        assert.strictEqual(agg.undocumented, 4);
        assert.strictEqual(agg.pct, Math.round((8 / 12) * 100));
    });

    check("coverage: renderBadgeSvg returns valid SVG at each color threshold boundary", () => {
        [0, 49, 50, 79, 80, 100].forEach((pct) => {
            const svg = renderBadgeSvg(pct);
            assert.ok(svg.startsWith("<svg"), `pct=${pct} did not start with <svg`);
            assert.ok(svg.endsWith("</svg>"), `pct=${pct} did not end with </svg>`);
            assert.ok(svg.includes(`${pct}%`), `pct=${pct} value text missing`);
        });
    });

    check("coverage: renderBadgeSvg uses red/yellow/green at the correct thresholds", () => {
        assert.ok(renderBadgeSvg(0).includes("#e05d44"));
        assert.ok(renderBadgeSvg(49).includes("#e05d44"));
        assert.ok(renderBadgeSvg(50).includes("#dfb317"));
        assert.ok(renderBadgeSvg(79).includes("#dfb317"));
        assert.ok(renderBadgeSvg(80).includes("#4c1"));
        assert.ok(renderBadgeSvg(100).includes("#4c1"));
    });

    check("coverage: renderBadgeSvg is deterministic — same pct produces byte-identical output", () => {
        const a = renderBadgeSvg(73);
        const b = renderBadgeSvg(73);
        assert.strictEqual(a, b);
    });

};
