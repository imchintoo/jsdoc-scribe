"use strict";

/**
 * Unit tests for lib/site-data.js (story-file-detail-redesign /
 * adr-phase-l-file-detail-and-site-data.md): the versioned site-data JSON
 * layer that captures everything buildSite() needs, separate from and
 * unrelated to the existing --json/docs.json contract.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");
const siteData = require("../lib/site-data.js");

function tmpDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

module.exports = function runSiteDataTests(check) {

    check("buildSiteData: shapes modules + quality + meta into one payload with a schemaVersion", () => {
        const modules = [{ filePath: "a.js", moduleName: "a", description: "desc", since: "1.0", functions: [{ name: "f" }], classes: [], interfaces: [], typeAliases: [], enums: [], variables: [] }];
        const quality = { result: { averageHealthScore: 80 }, graph: { inDegree: {} }, orphans: ["x.js"], snapshots: [] };
        const payload = siteData.buildSiteData(modules, quality, { projectName: "Test", version: "1.2.3", sourceUrl: "https://example.com" });
        assert.strictEqual(payload.schemaVersion, siteData.SCHEMA_VERSION);
        assert.strictEqual(payload.projectName, "Test");
        assert.strictEqual(payload.version, "1.2.3");
        assert.strictEqual(payload.sourceUrl, "https://example.com");
        assert.ok(payload.generatedAt, "generatedAt missing");
        assert.strictEqual(payload.modules.length, 1);
        assert.strictEqual(payload.modules[0].moduleName, "a");
        assert.strictEqual(payload.modules[0].functions.length, 1);
        assert.strictEqual(payload.quality.result.averageHealthScore, 80);
        assert.deepStrictEqual(payload.quality.orphans, ["x.js"]);
    });

    check("buildSiteData: quality is null when no --quality data was computed (not a placeholder object)", () => {
        const payload = siteData.buildSiteData([], null, { projectName: "T", version: "1.0.0" });
        assert.strictEqual(payload.quality, null);
    });

    check("writeSiteData: first write has no preserved prior file", () => {
        const dir = tmpDir("scribe-sitedata-first-");
        const dataPath = path.join(dir, "site-data.json");
        const result = siteData.writeSiteData(dataPath, siteData.buildSiteData([], null, { projectName: "T", version: "1.0.0" }));
        assert.strictEqual(result.path, dataPath);
        assert.strictEqual(result.preserved, null);
        assert.ok(fs.existsSync(dataPath));
    });

    check("writeSiteData: second write NEVER overwrites silently -- prior file is preserved in <name>-history/", () => {
        const dir = tmpDir("scribe-sitedata-history-");
        const dataPath = path.join(dir, "site-data.json");
        const first = siteData.buildSiteData([{ filePath: "a.js", functions: [], classes: [], interfaces: [], typeAliases: [], enums: [], variables: [] }], null, { projectName: "T", version: "1.0.0" });
        siteData.writeSiteData(dataPath, first);
        const firstContent = fs.readFileSync(dataPath, "utf8");

        const second = siteData.buildSiteData([{ filePath: "b.js", functions: [], classes: [], interfaces: [], typeAliases: [], enums: [], variables: [] }], null, { projectName: "T", version: "1.0.1" });
        const result = siteData.writeSiteData(dataPath, second);

        assert.ok(result.preserved, "expected a preserved path on the second write");
        assert.ok(fs.existsSync(result.preserved), "preserved file should exist on disk");
        assert.strictEqual(fs.readFileSync(result.preserved, "utf8"), firstContent, "preserved file should be the exact prior content, byte for byte");
        assert.strictEqual(path.dirname(result.preserved), path.join(dir, "site-data-history"), "preserved file should live in a sibling -history/ dir");

        const reloaded = JSON.parse(fs.readFileSync(dataPath, "utf8"));
        assert.strictEqual(reloaded.version, "1.0.1", "canonical path should reflect the LATEST generation");
    });

    check("writeSiteData: three successive writes preserve two distinct history files, never overwriting each other", () => {
        const dir = tmpDir("scribe-sitedata-triple-");
        const dataPath = path.join(dir, "site-data.json");
        for (const v of ["1.0.0", "1.0.1", "1.0.2"]) {
            siteData.writeSiteData(dataPath, siteData.buildSiteData([], null, { projectName: "T", version: v }));
        }
        const histDir = siteData.historyDirFor(dataPath);
        const histFiles = fs.readdirSync(histDir);
        assert.strictEqual(histFiles.length, 2, "expected exactly 2 preserved prior generations after 3 writes");
        const versions = histFiles.map((f) => JSON.parse(fs.readFileSync(path.join(histDir, f), "utf8")).version).sort();
        assert.deepStrictEqual(versions, ["1.0.0", "1.0.1"]);
    });

    check("loadSiteData: round-trips a written payload exactly", () => {
        const dir = tmpDir("scribe-sitedata-roundtrip-");
        const dataPath = path.join(dir, "site-data.json");
        const payload = siteData.buildSiteData(
            [{ filePath: "a.js", functions: [{ name: "f" }], classes: [], interfaces: [], typeAliases: [], enums: [], variables: [] }],
            { result: { averageHealthScore: 77 }, graph: null, orphans: [], snapshots: [] },
            { projectName: "T", version: "1.0.0" },
        );
        siteData.writeSiteData(dataPath, payload);
        const loaded = siteData.loadSiteData(dataPath);
        assert.strictEqual(loaded.modules[0].functions[0].name, "f");
        assert.strictEqual(loaded.quality.result.averageHealthScore, 77);
    });

    check("loadSiteData: missing file throws a clear, actionable error (never a raw ENOENT stack)", () => {
        const dir = tmpDir("scribe-sitedata-missing-");
        assert.throws(
            () => siteData.loadSiteData(path.join(dir, "nope.json")),
            (err) => err.code === "SITE_DATA_NOT_FOUND" && /Could not read site-data file/.test(err.message),
        );
    });

    check("loadSiteData: malformed JSON throws SITE_DATA_INVALID, not a raw SyntaxError", () => {
        const dir = tmpDir("scribe-sitedata-badjson-");
        const p = path.join(dir, "bad.json");
        fs.writeFileSync(p, "{ not valid json", "utf8");
        assert.throws(
            () => siteData.loadSiteData(p),
            (err) => err.code === "SITE_DATA_INVALID",
        );
    });

    check("loadSiteData: valid JSON but missing `modules` array is rejected as invalid", () => {
        const dir = tmpDir("scribe-sitedata-noshape-");
        const p = path.join(dir, "notsitedata.json");
        fs.writeFileSync(p, JSON.stringify({ hello: "world" }), "utf8");
        assert.throws(
            () => siteData.loadSiteData(p),
            (err) => err.code === "SITE_DATA_INVALID",
        );
    });

};
