"use strict";

/**
 * lib/quality.js
 * ----------------------------------------
 * Shared code-multivitals wrapper, used by BOTH:
 *   - bin/gen-dashboard.js (Track B, internal dashboard -- code-multivitals
 *     is a devDependency here, so require() always resolves in this repo)
 *   - bin/gen-docs.js's --quality* flags (Track C, end-user-facing --
 *     code-multivitals is an OPTIONAL peerDependency there, so require()
 *     may legitimately fail in a user's project)
 *
 * Because of Track C, code-multivitals is NEVER require()'d at module
 * top-level anywhere in this file (or anywhere else in lib/ or bin/) --
 * only inside loadCodeMultivitals(), called lazily at the point of use.
 * See docs/backlog/adr-phase-j-project-dashboard.md Decision 10.
 */

const fs = require("fs");

const INSTALL_MESSAGE = "Quality reporting requires code-multivitals. Install it with: npm install --save-dev code-multivitals";

/**
 * Lazily require code-multivitals. Throws a clear, actionable Error (never
 * a raw MODULE_NOT_FOUND stack trace) if it isn't installed.
 * @returns {object} the code-multivitals module exports.
 */
function loadCodeMultivitals() {
    try {
        return require("code-multivitals");
    } catch (err) {
        // MODULE_NOT_FOUND is the clean "never installed" case. ENOENT covers a
        // partially-removed/corrupted install (e.g. package.json present but
        // dist/ missing) -- both mean "not usable," both get the same
        // actionable install message rather than a raw resolution stack trace.
        if (err && (err.code === "MODULE_NOT_FOUND" || err.code === "ENOENT")) {
            const wrapped = new Error(INSTALL_MESSAGE);
            wrapped.code = "CODE_MULTIVITALS_NOT_INSTALLED";
            throw wrapped;
        }
        throw err;
    }
}

/**
 * Resolve the effective threshold set for a run: CLI/explicit thresholds >
 * config file > named profile > code-multivitals's own built-in defaults.
 * Mirrors code-multivitals's own documented priority order.
 * @param {object} cm - loadCodeMultivitals() result.
 * @param {{profile?: string, configPath?: string, thresholds?: object}} options
 * @returns {object|undefined} a thresholds object, or undefined to let code-multivitals use its own default.
 */
function resolveThresholds(cm, options) {
    const opts = options || {};
    let thresholds;

    if (opts.profile) {
        const profile = cm.getProfile(opts.profile);
        if (!profile) throw new Error("Unknown code-multivitals profile: " + opts.profile + " (expected one of: " + cm.PROFILE_NAMES.join(", ") + ")");
        thresholds = cm.copyThresholds(profile);
    }

    if (opts.configPath) {
        let fileThresholds;
        try {
            fileThresholds = JSON.parse(fs.readFileSync(opts.configPath, "utf8")).thresholds;
        } catch (err) {
            throw new Error("Failed to read/parse quality config at " + opts.configPath + ": " + err.message);
        }
        thresholds = Object.assign({}, thresholds || cm.copyThresholds(cm.getProfile("default")), fileThresholds);
    }

    if (opts.thresholds) {
        thresholds = Object.assign({}, thresholds || {}, opts.thresholds);
    }

    return thresholds;
}

/**
 * Run code-multivitals's analysis across `files`.
 * @param {string[]} files
 * @param {{profile?: string, configPath?: string, thresholds?: object, minDuplicateLines?: number}} [options]
 * @returns {object} code-multivitals's AnalysisResult.
 */
function runQuality(files, options) {
    const cm = loadCodeMultivitals();
    const opts = options || {};
    const thresholds = resolveThresholds(cm, opts);
    const analyseOptions = {};
    if (thresholds) analyseOptions.thresholds = thresholds;
    if (opts.minDuplicateLines != null) analyseOptions.minDuplicateLines = opts.minDuplicateLines;
    return cm.analyse(files, analyseOptions);
}

const REPORTER_NAMES = ["console", "json", "html", "sarif", "badge", "dashboard"];

/**
 * Render an AnalysisResult using one of code-multivitals's own reporters.
 * @param {object} result - runQuality() output.
 * @param {string} reporterName - one of REPORTER_NAMES.
 * @param {{outputDir?: string}} [extra] - reporter-specific extras (badge needs an output dir).
 * @returns {string|void} report output (reporters that print directly, e.g. console, return undefined).
 */
function renderQualityReport(result, reporterName, extra) {
    const cm = loadCodeMultivitals();
    switch (reporterName) {
        case "console":
            return cm.reportConsole(result);
        case "json":
            return cm.reportJson(result);
        case "html":
            return cm.reportHtml(result);
        case "sarif":
            return cm.reportSarif(result);
        case "badge":
            return cm.reportBadge(result, (extra && extra.outputDir) || ".");
        case "dashboard":
            return cm.reportDashboard(result);
        default:
            throw new Error("Unknown quality reporter: " + reporterName + " (expected one of: " + REPORTER_NAMES.join(", ") + ")");
    }
}

/**
 * Snapshot/trend/hotspot passthroughs -- thin re-exports behind the same
 * dynamic-require guard as everything else in this module.
 */
function saveQualitySnapshot(dir, result) {
    return loadCodeMultivitals().saveSnapshot(dir, result);
}

function loadQualitySnapshots(dir, limit) {
    return loadCodeMultivitals().loadSnapshots(dir, limit);
}

function computeQualityTrends(snapshots) {
    return loadCodeMultivitals().computeTrends(snapshots);
}

function rankQualityHotspots(trends, churnMap, limit) {
    return loadCodeMultivitals().rankHotspots(trends, churnMap, limit);
}

function getQualityChurnMap(files) {
    return loadCodeMultivitals().getChurnMap(files);
}

/**
 * Baseline/diff passthrough. code-multivitals has no dedicated "save
 * baseline" function of its own (per its README, a baseline is just the
 * raw analyse() result, JSON-serialized) -- applyBaseline is the one real
 * API entry point, used to diff a fresh result against a previously-saved one.
 * @param {object} result - fresh runQuality() output.
 * @param {object} baseline - a previously-saved runQuality() output.
 * @returns {object} the diffed result (new/worsened findings only).
 */
function applyQualityBaseline(result, baseline) {
    return loadCodeMultivitals().applyBaseline(result, baseline);
}

module.exports = {
    INSTALL_MESSAGE,
    REPORTER_NAMES,
    loadCodeMultivitals,
    resolveThresholds,
    runQuality,
    renderQualityReport,
    saveQualitySnapshot,
    loadQualitySnapshots,
    computeQualityTrends,
    rankQualityHotspots,
    getQualityChurnMap,
    applyQualityBaseline,
};
