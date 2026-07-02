"use strict";

/**
 * lib/coverage.js
 * ----------------------------------------
 * Pure aggregation/reporting module, sibling to lib/drift.js. Extracts the
 * sum-then-divide coverage math bin/cli.js already does inline into a
 * testable, reusable function, and hand-rolls a shields.io-style SVG badge
 * (no network dependency — see docs/backlog/adr-phase-i-coverage-badge.md).
 */

/**
 * Sum per-file coverage stats into a project-wide aggregate.
 * @param {{documented:number,total:number,undocumented:number}[]} fileResults
 * @returns {{documented:number,total:number,undocumented:number,pct:number}}
 */
function aggregateCoverage(fileResults) {
    var documented = 0, total = 0, undocumented = 0;
    (fileResults || []).forEach(function (r) {
        documented += r.documented;
        total += r.total;
        undocumented += r.undocumented;
    });
    var pct = total ? Math.round((documented / total) * 100) : 100;
    return { documented: documented, total: total, undocumented: undocumented, pct: pct };
}

/**
 * Render a static, deterministic, shields.io-visual-style SVG coverage badge.
 * @param {number} pct
 * @returns {string} shields.io-style SVG markup
 */
function renderBadgeSvg(pct) {
    var color = pct < 50 ? "#e05d44" : pct < 80 ? "#dfb317" : "#4c1";
    var label = "coverage";
    var value = pct + "%";
    var labelW = 70, valueW = 46, h = 20;
    var totalW = labelW + valueW;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + totalW + '" height="' + h + '" role="img" aria-label="' + label + ': ' + value + '">'
        + '<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>'
        + '<clipPath id="r"><rect width="' + totalW + '" height="' + h + '" rx="3" fill="#fff"/></clipPath>'
        + '<g clip-path="url(#r)">'
        + '<rect width="' + labelW + '" height="' + h + '" fill="#555"/>'
        + '<rect x="' + labelW + '" width="' + valueW + '" height="' + h + '" fill="' + color + '"/>'
        + '<rect width="' + totalW + '" height="' + h + '" fill="url(#s)"/>'
        + '</g>'
        + '<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">'
        + '<text x="' + (labelW / 2) + '" y="14">' + label + '</text>'
        + '<text x="' + (labelW + valueW / 2) + '" y="14">' + value + '</text>'
        + '</g>'
        + '</svg>';
}

module.exports = { aggregateCoverage, renderBadgeSvg };
