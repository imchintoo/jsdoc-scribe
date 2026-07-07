"use strict";

/**
 * lib/site-data.js
 * ----------------------------------------
 * story-file-detail-redesign / adr-phase-l-file-detail-and-site-data.md
 *
 * A single JSON artifact that captures everything `buildSite()` needs to
 * regenerate the doc site: module data (same shape `--json`/`docs.json`
 * already publishes -- reused, not redefined) plus quality/import-graph/
 * snapshot data (the exact shape `computeQualityEmbedData()` in
 * bin/gen-docs.js already produces).
 *
 * Two things this module is deliberately NOT:
 *   - It does not touch `docs.json` (the existing `--json` flag's output).
 *     That's a separate, already-published contract -- see the ADR's
 *     Decision 4.
 *   - It is not itself a renderer. `loadSiteData()` only reads and
 *     validates; turning the result back into HTML is `bin/gen-docs.js`'s
 *     job (calling the same `buildSite()` the normal path already uses).
 */

const fs = require("fs");
const path = require("path");

const SCHEMA_VERSION = 1;

/**
 * Assembles the full site-data payload from already-computed pieces --
 * this function does no extraction/analysis of its own, it only shapes
 * data callers already have.
 * @param {object[]} modules - extractModule() output, one per file.
 * @param {{result: object, graph?: object, orphans?: string[], snapshots?: object[]}|null} quality - computeQualityEmbedData() output, or null if `--quality` wasn't used.
 * @param {{projectName: string, version: string, sourceUrl?: string}} meta
 * @returns {object} the full payload, ready for JSON.stringify().
 */
function buildSiteData(modules, quality, meta) {
    return {
        schemaVersion: SCHEMA_VERSION,
        generatedAt: new Date().toISOString(),
        projectName: meta.projectName,
        version: meta.version,
        sourceUrl: meta.sourceUrl || null,
        modules: (modules || []).map(function (m) {
            return {
                filePath: m.filePath,
                moduleName: m.moduleName || null,
                description: m.description || null,
                since: m.since || null,
                functions: m.functions || [],
                classes: m.classes || [],
                interfaces: m.interfaces || [],
                typeAliases: m.typeAliases || [],
                enums: m.enums || [],
                variables: m.variables || [],
            };
        }),
        quality: quality
            ? {
                  result: quality.result,
                  graph: quality.graph || null,
                  orphans: quality.orphans || [],
                  snapshots: quality.snapshots || [],
              }
            : null,
    };
}

/**
 * @param {string} dataPath - path to the canonical site-data.json.
 * @returns {string} the sibling history directory for that path.
 */
function historyDirFor(dataPath) {
    return path.join(path.dirname(dataPath), path.basename(dataPath, ".json") + "-history");
}

/**
 * Writes `payload` to `dataPath`, NEVER silently overwriting a prior
 * generation (story-file-detail-redesign AC5): if `dataPath` already
 * exists, it is moved (not deleted) into a sibling `<name>-history/`
 * directory under an ISO-timestamped filename -- same timestamp
 * convention `code-multivitals`'s own `saveSnapshot()` already uses in
 * this codebase -- before the new payload is written to the canonical
 * path. Collision-safe: if two writes land in the same millisecond (e.g.
 * rapid successive test runs), a numeric suffix is appended rather than
 * clobbering the preserved copy.
 * @param {string} dataPath
 * @param {object} payload
 * @returns {{path: string, preserved: string|null}} the canonical path written, and the history path of the preserved prior file (or null if none existed).
 */
function writeSiteData(dataPath, payload) {
    let preserved = null;
    if (fs.existsSync(dataPath)) {
        const histDir = historyDirFor(dataPath);
        fs.mkdirSync(histDir, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        const base = path.basename(dataPath, ".json");
        let histPath = path.join(histDir, base + "-" + ts + ".json");
        let n = 1;
        while (fs.existsSync(histPath)) {
            histPath = path.join(histDir, base + "-" + ts + "-" + n + ".json");
            n++;
        }
        fs.renameSync(dataPath, histPath);
        preserved = histPath;
    }
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(payload, null, 2), "utf8");
    return { path: dataPath, preserved: preserved };
}

/**
 * Reads + validates a site-data JSON file. Throws a clear, actionable
 * Error (never a raw parse/ENOENT stack trace) on failure -- same contract
 * as `lib/quality.js`'s `CODE_MULTIVITALS_NOT_INSTALLED`.
 * @param {string} dataPath
 * @returns {object} the parsed, validated payload.
 */
function loadSiteData(dataPath) {
    let raw;
    try {
        raw = fs.readFileSync(dataPath, "utf8");
    } catch (err) {
        const wrapped = new Error("Could not read site-data file at " + dataPath + ": " + err.message);
        wrapped.code = "SITE_DATA_NOT_FOUND";
        throw wrapped;
    }
    let data;
    try {
        data = JSON.parse(raw);
    } catch (err) {
        const wrapped = new Error("site-data file at " + dataPath + " is not valid JSON: " + err.message);
        wrapped.code = "SITE_DATA_INVALID";
        throw wrapped;
    }
    if (!data || !Array.isArray(data.modules)) {
        const wrapped = new Error(
            "site-data file at " + dataPath + " has no `modules` array -- not a valid site-data file (expected the shape written by --data).",
        );
        wrapped.code = "SITE_DATA_INVALID";
        throw wrapped;
    }
    return data;
}

module.exports = { SCHEMA_VERSION, buildSiteData, writeSiteData, loadSiteData, historyDirFor };
