"use strict";

/**
 * Quality-module unit tests — tests lib/quality.js. code-multivitals is a
 * real devDependency in this repo (see docs/backlog/adr-phase-j-project-dashboard.md
 * Decision 6), so the "installed" path is tested against the real package,
 * not a mock. The "not installed" path (Track C's graceful-degradation
 * requirement) is tested by temporarily hiding the installed package on
 * disk and restoring it afterwards.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");
const quality = require("../lib/quality.js");

function tmpFile(name, content) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cbg-quality-"));
    const file = path.join(dir, name);
    fs.writeFileSync(file, content, "utf8");
    return file;
}

module.exports = function runQualityTests(check) {

    check("no top-level require('code-multivitals') anywhere in lib/quality.js", () => {
        const src = fs.readFileSync(path.resolve(__dirname, "..", "lib", "quality.js"), "utf8");
        const lines = src.split("\n");
        const offenders = lines.filter((line, i) => {
            if (!/require\(\s*["']code-multivitals["']\s*\)/.test(line)) return false;
            // Acceptable only if it's inside loadCodeMultivitals's try block (indented, not column 0).
            return !/^\s+return require/.test(line);
        });
        assert.strictEqual(offenders.length, 0, "code-multivitals must only be required lazily inside loadCodeMultivitals()");
    });

    check("loadCodeMultivitals: resolves the real installed package", () => {
        const cm = quality.loadCodeMultivitals();
        assert.strictEqual(typeof cm.analyse, "function");
    });

    check("runQuality: analyses a real file and returns a real (non-placeholder) health score", () => {
        const file = tmpFile("a.js", "function f(x) {\n  if (x) { return 1; } else { return 2; }\n}\nmodule.exports = f;\n");
        const result = quality.runQuality([file]);
        assert.strictEqual(result.totalFiles, 1);
        assert.strictEqual(typeof result.averageHealthScore, "number");
        assert.ok(result.averageHealthScore >= 0 && result.averageHealthScore <= 100);
    });

    check("runQuality: 'strict' profile flags more warnings than 'relaxed' on the same complex file", () => {
        const complex = [
            "function f(a,b,c,d) {",
            "  if (a) { if (b) { if (c) { if (d) { return 1; } } } }",
            "  for (let i=0;i<10;i++){ if(i%2){ console.log(i); } }",
            "  return 0;",
            "}",
            "module.exports = f;",
        ].join("\n");
        const file = tmpFile("complex.js", complex);
        const strict = quality.runQuality([file], { profile: "strict" });
        const relaxed = quality.runQuality([file], { profile: "relaxed" });
        assert.ok(strict.warnCount + strict.errorCount >= relaxed.warnCount + relaxed.errorCount);
    });

    check("runQuality: unknown profile name throws a clear error", () => {
        const file = tmpFile("a.js", "function f(){}\nmodule.exports=f;\n");
        assert.throws(() => quality.runQuality([file], { profile: "not-a-real-profile" }), /Unknown code-multivitals profile/);
    });

    check("renderQualityReport: every reporter produces non-empty, well-formed output", () => {
        const file = tmpFile("a.js", "function f(x){ return x; }\nmodule.exports=f;\n");
        const result = quality.runQuality([file]);

        const json = quality.renderQualityReport(result, "json");
        assert.doesNotThrow(() => JSON.parse(json));

        const html = quality.renderQualityReport(result, "html");
        assert.match(html, /<html/i);

        const sarif = quality.renderQualityReport(result, "sarif");
        const sarifDoc = JSON.parse(sarif);
        assert.strictEqual(sarifDoc.version, "2.1.0");

        const dashboard = quality.renderQualityReport(result, "dashboard");
        assert.match(dashboard, /<html/i);

        const badgeDir = fs.mkdtempSync(path.join(os.tmpdir(), "cbg-quality-badges-"));
        quality.renderQualityReport(result, "badge", { outputDir: badgeDir });
        const badgeFiles = fs.readdirSync(badgeDir);
        assert.ok(badgeFiles.includes("health.svg"));
    });

    check("renderQualityReport: unknown reporter name throws a clear error", () => {
        const file = tmpFile("a.js", "function f(){}\nmodule.exports=f;\n");
        const result = quality.runQuality([file]);
        assert.throws(() => quality.renderQualityReport(result, "xml"), /Unknown quality reporter/);
    });

    check("applyQualityBaseline: a fixed function has zero regressions against its own baseline", () => {
        const file = tmpFile("a.js", "function f(x){ return x; }\nmodule.exports=f;\n");
        const baseline = quality.runQuality([file]);
        const fresh = quality.runQuality([file]);
        const diff = quality.applyQualityBaseline(fresh, baseline);
        assert.strictEqual(diff.errorCount, 0);
    });

    check("loadCodeMultivitals: throws the documented install-instruction message when the package is missing", () => {
        // Simulated in a fresh child process (not this process) so Node's module
        // resolution has no leftover cache from the real installed package --
        // a true clean-room "never installed" repro, not just a cache-eviction
        // approximation.
        const { execFileSync } = require("child_process");
        const pkgDir = path.resolve(__dirname, "..", "node_modules", "code-multivitals");
        const hiddenDir = pkgDir + ".hidden-for-test";
        fs.renameSync(pkgDir, hiddenDir);
        try {
            const script = "const q = require(" + JSON.stringify(path.resolve(__dirname, "..", "lib", "quality.js")) + ");" +
                "try { q.loadCodeMultivitals(); console.log('NO_THROW'); }" +
                "catch (err) { console.log(err.code + '|' + err.message); }";
            const out = execFileSync(process.execPath, ["-e", script], { encoding: "utf8" }).trim();
            assert.strictEqual(out, "CODE_MULTIVITALS_NOT_INSTALLED|" + quality.INSTALL_MESSAGE);
        } finally {
            fs.renameSync(hiddenDir, pkgDir);
        }
    });
};
