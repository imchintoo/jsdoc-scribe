"use strict";

/**
 * Project-facts unit tests — tests lib/project-facts.js against real tmp
 * fixture repos (small hand-built package.json/CI-yaml/directory trees),
 * so facts are verified against known inputs rather than this repo's own
 * (which can legitimately change over time).
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");
const {
    getNodeVersions,
    getPackageManager,
    getGlobalDependencies,
    getProjectStructure,
    getTestInfo,
    getAllFacts,
} = require("../lib/project-facts.js");

function tmpRepo() {
    return fs.mkdtempSync(path.join(os.tmpdir(), "cbg-projectfacts-"));
}

module.exports = function runProjectFactsTests(check) {

    check("getNodeVersions: reads engines.node and CI matrix, flags a mismatch", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ engines: { node: ">=14" } }));
        fs.mkdirSync(path.join(dir, ".github", "workflows"), { recursive: true });
        fs.writeFileSync(path.join(dir, ".github", "workflows", "test.yml"), "matrix:\n  node-version: [18, 20, 22]\n");
        const facts = getNodeVersions(dir);
        assert.strictEqual(facts.declaredMin, ">=14");
        assert.deepStrictEqual(facts.ciTested, [18, 20, 22]);
        assert.strictEqual(facts.matches, false, "declared >=14 is not itself in the CI matrix, so this should be flagged as a mismatch");
    });

    check("getNodeVersions: matches is true when declared min is itself CI-tested", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ engines: { node: ">=18" } }));
        fs.mkdirSync(path.join(dir, ".github", "workflows"), { recursive: true });
        fs.writeFileSync(path.join(dir, ".github", "workflows", "test.yml"), "matrix:\n  node-version: [18, 20, 22]\n");
        const facts = getNodeVersions(dir);
        assert.strictEqual(facts.matches, true);
    });

    check("getNodeVersions: handles a repo with no CI workflow gracefully", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ engines: { node: ">=14" } }));
        const facts = getNodeVersions(dir);
        assert.deepStrictEqual(facts.ciTested, []);
        assert.strictEqual(facts.matches, false);
    });

    check("getPackageManager: detects npm from package-lock.json", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package-lock.json"), "{}");
        assert.strictEqual(getPackageManager(dir).manager, "npm");
    });

    check("getPackageManager: detects pnpm from pnpm-lock.yaml", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "pnpm-lock.yaml"), "");
        assert.strictEqual(getPackageManager(dir).manager, "pnpm");
    });

    check("getPackageManager: returns 'unknown' when no lockfile is present", () => {
        const dir = tmpRepo();
        assert.strictEqual(getPackageManager(dir).manager, "unknown");
    });

    check("getGlobalDependencies: never claims zero requirements (Node/npm always required)", () => {
        const facts = getGlobalDependencies(tmpRepo());
        assert.ok(facts.required.length >= 1);
        assert.ok(facts.conditionallyRequired.some((s) => /git/i.test(s)));
    });

    check("getProjectStructure: walks real directories and skips node_modules/.git", () => {
        const dir = tmpRepo();
        fs.mkdirSync(path.join(dir, "lib"));
        fs.mkdirSync(path.join(dir, "node_modules"));
        fs.mkdirSync(path.join(dir, ".git"));
        const structure = getProjectStructure(dir);
        const names = structure.map((s) => s.name);
        assert.ok(names.includes("lib"));
        assert.ok(!names.includes("node_modules"));
        assert.ok(!names.includes(".git"));
    });

    check("getProjectStructure: known directories get a real description, unknown ones get a fallback", () => {
        const dir = tmpRepo();
        fs.mkdirSync(path.join(dir, "lib"));
        fs.mkdirSync(path.join(dir, "some-custom-dir"));
        const structure = getProjectStructure(dir);
        const lib = structure.find((s) => s.name === "lib");
        const custom = structure.find((s) => s.name === "some-custom-dir");
        assert.ok(lib.description.length > 0 && !/no description/.test(lib.description));
        assert.match(custom.description, /no description/);
    });

    check("getTestInfo: reports no framework and no HTTP API", () => {
        const facts = getTestInfo(tmpRepo());
        assert.strictEqual(facts.framework, null);
        assert.strictEqual(facts.hasHttpApi, false);
        assert.match(facts.runner, /run\.js/);
    });

    check("getTestInfo: counts real suite registrations from this repo's own test/run.js", () => {
        const facts = getTestInfo(path.resolve(__dirname, ".."));
        assert.strictEqual(typeof facts.suiteCount, "number");
        assert.ok(facts.suiteCount >= 10, "expected at least the 10 registered suites (extractor..quality)");
    });

    check("getAllFacts: composes every category into one object", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ engines: { node: ">=14" } }));
        const facts = getAllFacts(dir);
        assert.ok("node" in facts);
        assert.ok("packageManager" in facts);
        assert.ok("globalDependencies" in facts);
        assert.ok("structure" in facts);
        assert.ok("test" in facts);
    });
};
