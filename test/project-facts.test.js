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
    getWorkspacePackages,
    getFrameworkSignals,
    getArchitectureSignals,
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

    check("getProjectStructure: reports per-directory file-extension counts", () => {
        const dir = tmpRepo();
        fs.mkdirSync(path.join(dir, "lib"));
        fs.writeFileSync(path.join(dir, "lib", "foo.js"), "");
        fs.writeFileSync(path.join(dir, "lib", "bar.ts"), "");
        fs.writeFileSync(path.join(dir, "lib", "baz.js"), "");
        const structure = getProjectStructure(dir);
        const lib = structure.find((s) => s.name === "lib");
        assert.deepStrictEqual(lib.files, { ".js": 2, ".ts": 1 });
    });

    check("getProjectStructure: recognizes .test.js/.spec.js/.d.ts as their own extension bucket", () => {
        const dir = tmpRepo();
        fs.mkdirSync(path.join(dir, "test"));
        fs.writeFileSync(path.join(dir, "test", "foo.test.js"), "");
        fs.writeFileSync(path.join(dir, "test", "bar.spec.js"), "");
        fs.writeFileSync(path.join(dir, "test", "run.js"), "");
        const structure = getProjectStructure(dir);
        const testDir = structure.find((s) => s.name === "test");
        assert.strictEqual(testDir.files[".test.js"], 1);
        assert.strictEqual(testDir.files[".spec.js"], 1);
        assert.strictEqual(testDir.files[".js"], 1, "run.js should fall into the plain .js bucket, not .test.js/.spec.js");
    });

    check("getProjectStructure: walks nested directories and attaches children up to the default depth", () => {
        const dir = tmpRepo();
        fs.mkdirSync(path.join(dir, "lib", "sub"), { recursive: true });
        fs.writeFileSync(path.join(dir, "lib", "sub", "deep.js"), "");
        const structure = getProjectStructure(dir);
        const lib = structure.find((s) => s.name === "lib");
        assert.ok(Array.isArray(lib.children), "lib should have a children array");
        const sub = lib.children.find((c) => c.name === "sub");
        assert.ok(sub, "nested 'sub' directory should be present");
        assert.strictEqual(sub.files[".js"], 1);
    });

    check("getProjectStructure: respects a custom depth option", () => {
        const dir = tmpRepo();
        fs.mkdirSync(path.join(dir, "a", "b", "c"), { recursive: true });
        const shallow = getProjectStructure(dir, { depth: 1 });
        const a1 = shallow.find((s) => s.name === "a");
        assert.strictEqual(a1.children, undefined, "depth: 1 should not descend into children at all");

        const deep = getProjectStructure(dir, { depth: 3 });
        const a3 = deep.find((s) => s.name === "a");
        const b = a3.children.find((c) => c.name === "b");
        assert.ok(b.children.find((c) => c.name === "c"), "depth: 3 should reach 'c'");
    });

    check("getProjectStructure: excludes ignored directory names at any depth, not just top-level", () => {
        const dir = tmpRepo();
        fs.mkdirSync(path.join(dir, "a", "node_modules"), { recursive: true });
        fs.mkdirSync(path.join(dir, "a", "real-sub"), { recursive: true });
        const structure = getProjectStructure(dir);
        const a = structure.find((s) => s.name === "a");
        const childNames = a.children.map((c) => c.name);
        assert.ok(!childNames.includes("node_modules"));
        assert.ok(childNames.includes("real-sub"));
    });

    check("getWorkspacePackages: resolves 'dir/*' glob-style workspace patterns against real package.json files", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ workspaces: ["packages/*"] }));
        fs.mkdirSync(path.join(dir, "packages", "pkg-a"), { recursive: true });
        fs.writeFileSync(path.join(dir, "packages", "pkg-a", "package.json"), JSON.stringify({ name: "pkg-a", description: "Package A" }));
        fs.mkdirSync(path.join(dir, "packages", "pkg-b"), { recursive: true });
        fs.writeFileSync(path.join(dir, "packages", "pkg-b", "package.json"), JSON.stringify({ name: "pkg-b" }));
        const packages = getWorkspacePackages(dir);
        assert.strictEqual(packages.length, 2);
        assert.strictEqual(packages[0].name, "pkg-a");
        assert.strictEqual(packages[0].description, "Package A");
        assert.strictEqual(packages[0].path, "packages/pkg-a");
        assert.strictEqual(packages[1].name, "pkg-b");
        assert.strictEqual(packages[1].description, null);
    });

    check("getWorkspacePackages: returns an empty array when no workspaces field is present", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({}));
        assert.deepStrictEqual(getWorkspacePackages(dir), []);
    });

    check("getWorkspacePackages: resolves this repo's own real workspace ('packages/eslint-plugin-jsdoc-scribe')", () => {
        const packages = getWorkspacePackages(path.resolve(__dirname, ".."));
        const names = packages.map((p) => p.name);
        assert.ok(names.includes("eslint-plugin-jsdoc-scribe"), "expected this repo's real workspace package to be detected");
    });

    check("getFrameworkSignals: detects a root-level dependency with correct evidence", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { react: "^18.0.0" } }));
        const signals = getFrameworkSignals(dir);
        assert.strictEqual(signals.length, 1);
        assert.strictEqual(signals[0].name, "React");
        assert.strictEqual(signals[0].confidence, "dependency");
        assert.match(signals[0].evidence, /"react" in package\.json dependencies/);
    });

    check("getFrameworkSignals: detects multiple frameworks across dependencies/devDependencies/peerDependencies", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({
            dependencies: { express: "^4.0.0" },
            devDependencies: { "@angular/core": "^17.0.0" },
            peerDependencies: { vue: "^3.0.0" },
        }));
        const signals = getFrameworkSignals(dir);
        const names = signals.map((s) => s.name).sort();
        assert.deepStrictEqual(names, ["Angular", "Express", "Vue"]);
        assert.ok(signals.every((s) => s.confidence === "dependency"));
    });

    check("getFrameworkSignals: detects a framework dependency declared only in a workspace package, not the root", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ workspaces: ["packages/*"] }));
        fs.mkdirSync(path.join(dir, "packages", "web"), { recursive: true });
        fs.writeFileSync(path.join(dir, "packages", "web", "package.json"), JSON.stringify({ name: "web", dependencies: { next: "^14.0.0" } }));
        const signals = getFrameworkSignals(dir);
        assert.strictEqual(signals.length, 1);
        assert.strictEqual(signals[0].name, "Next.js");
        assert.match(signals[0].evidence, /packages\/web\/package\.json/);
    });

    check("getFrameworkSignals: falls back to a file-heuristic signal when JSX files exist with no matching dependency", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({}));
        fs.mkdirSync(path.join(dir, "src"));
        fs.writeFileSync(path.join(dir, "src", "App.jsx"), "");
        const signals = getFrameworkSignals(dir);
        assert.strictEqual(signals.length, 1);
        assert.strictEqual(signals[0].name, "React");
        assert.strictEqual(signals[0].confidence, "file-heuristic");
    });

    check("getFrameworkSignals: does not emit a file-heuristic signal when dependency evidence already covers it", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { react: "^18.0.0" } }));
        fs.mkdirSync(path.join(dir, "src"));
        fs.writeFileSync(path.join(dir, "src", "App.jsx"), "");
        const signals = getFrameworkSignals(dir);
        assert.strictEqual(signals.length, 1, "should not double-report React via both dependency and file-heuristic");
        assert.strictEqual(signals[0].confidence, "dependency");
    });

    check("getFrameworkSignals: returns an empty array on a plain repo with no framework signals", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { lodash: "^4.0.0" } }));
        fs.mkdirSync(path.join(dir, "lib"));
        fs.writeFileSync(path.join(dir, "lib", "index.js"), "");
        assert.deepStrictEqual(getFrameworkSignals(dir), []);
    });

    check("getFrameworkSignals: this repo's own real facts report exactly one file-heuristic React signal, no dependency-based false positives", () => {
        // jsdoc-scribe itself is plain Node/TS tooling with no framework
        // dependency in any package.json (root or the eslint-plugin
        // workspace) -- but sample/react/*.tsx fixtures do exist, so the
        // file-heuristic fallback is expected to fire for React and
        // nothing else (no .vue anywhere, no @nestjs/core/@angular/core/
        // express/next dependency anywhere). Asserting the exact signal
        // (not just "some signals exist") so a future false positive
        // from an unrelated new dependency/fixture would fail this test.
        const signals = getFrameworkSignals(path.resolve(__dirname, ".."));
        assert.deepStrictEqual(signals, [
            { name: "React", confidence: "file-heuristic", evidence: ".tsx files present, no matching dependency found in any package.json" },
        ]);
    });

    check("getArchitectureSignals: detects 'CLI tool' from a non-empty package.json bin field", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ bin: { "my-cli": "./bin/cli.js" } }));
        const signals = getArchitectureSignals(dir);
        assert.strictEqual(signals.length, 1);
        assert.strictEqual(signals[0].name, "CLI tool");
        assert.match(signals[0].evidence, /my-cli/);
    });

    check("getArchitectureSignals: detects 'Publishable library' from main/exports, preferring exports in the evidence text", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ main: "index.js", exports: { ".": "./index.js" } }));
        const signals = getArchitectureSignals(dir);
        assert.strictEqual(signals.length, 1);
        assert.strictEqual(signals[0].name, "Publishable library");
        assert.match(signals[0].evidence, /"exports"/);
    });

    check("getArchitectureSignals: detects 'Monorepo (npm workspaces)' and names the resolved packages in evidence", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ workspaces: ["packages/*"] }));
        fs.mkdirSync(path.join(dir, "packages", "pkg-a"), { recursive: true });
        fs.writeFileSync(path.join(dir, "packages", "pkg-a", "package.json"), JSON.stringify({ name: "pkg-a" }));
        const signals = getArchitectureSignals(dir);
        assert.strictEqual(signals.length, 1);
        assert.strictEqual(signals[0].name, "Monorepo (npm workspaces)");
        assert.match(signals[0].evidence, /pkg-a/);
    });

    check("getArchitectureSignals: detects 'Backend/API service' only from a dependency-confidence framework signal", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { express: "^4.0.0" } }));
        const signals = getArchitectureSignals(dir);
        assert.strictEqual(signals.length, 1);
        assert.strictEqual(signals[0].name, "Backend/API service");
    });

    check("getArchitectureSignals: 'Backend/API service' does NOT fire from a file-heuristic-only framework signal", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({}));
        fs.mkdirSync(path.join(dir, "src"));
        fs.writeFileSync(path.join(dir, "src", "App.jsx"), ""); // file-heuristic React only, no dependency
        const signals = getArchitectureSignals(dir);
        assert.ok(!signals.some((s) => s.name === "Frontend application"), "file-heuristic-only signals must not promote to an architecture claim");
    });

    check("getArchitectureSignals: detects 'MVC-influenced layout' when at least 2 of controllers/models/views exist", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({}));
        fs.mkdirSync(path.join(dir, "src", "controllers"), { recursive: true });
        fs.mkdirSync(path.join(dir, "src", "models"), { recursive: true });
        const signals = getArchitectureSignals(dir);
        assert.strictEqual(signals.length, 1);
        assert.strictEqual(signals[0].name, "MVC-influenced layout");
        assert.match(signals[0].evidence, /controllers/);
        assert.match(signals[0].evidence, /models/);
    });

    check("getArchitectureSignals: does NOT fire MVC on just 1 matching directory name", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({}));
        fs.mkdirSync(path.join(dir, "src", "controllers"), { recursive: true });
        assert.deepStrictEqual(getArchitectureSignals(dir), []);
    });

    check("getArchitectureSignals: detects 'Layered/service-oriented layout' from either directory-name group, reported as one signal even if both groups match", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({}));
        fs.mkdirSync(path.join(dir, "src", "routes"), { recursive: true });
        fs.mkdirSync(path.join(dir, "src", "services"), { recursive: true });
        fs.mkdirSync(path.join(dir, "src", "domain"), { recursive: true });
        fs.mkdirSync(path.join(dir, "src", "application"), { recursive: true });
        const signals = getArchitectureSignals(dir);
        assert.strictEqual(signals.length, 1, "both matching groups should still produce exactly one 'Layered/service-oriented layout' signal, not two");
        assert.strictEqual(signals[0].name, "Layered/service-oriented layout");
        assert.match(signals[0].evidence, /routes/);
        assert.match(signals[0].evidence, /domain/);
    });

    check("getArchitectureSignals: multiple independent signals co-occur on one fixture (never collapsed into a single label)", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ bin: { cli: "./bin/cli.js" }, main: "index.js", dependencies: { "@nestjs/core": "^10.0.0" } }));
        fs.mkdirSync(path.join(dir, "src", "controllers"), { recursive: true });
        fs.mkdirSync(path.join(dir, "src", "models"), { recursive: true });
        const signals = getArchitectureSignals(dir);
        const names = signals.map((s) => s.name).sort();
        assert.deepStrictEqual(names, ["Backend/API service", "CLI tool", "MVC-influenced layout", "Publishable library"]);
    });

    check("getArchitectureSignals: returns an empty array on a plain repo with none of the 7 signals", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { lodash: "^4.0.0" } }));
        fs.mkdirSync(path.join(dir, "lib"));
        assert.deepStrictEqual(getArchitectureSignals(dir), []);
    });

    check("getArchitectureSignals: this repo's own real signals report CLI tool + Publishable library + Monorepo + Layered/service-oriented layout", () => {
        // Verified against this repo's actual real directory tree (`find .
        // -mindepth 1 -maxdepth 3 -type d`) before writing this assertion,
        // not assumed: root package.json has both bin.gen-comments/
        // bin.gen-docs and exports, one real npm workspace
        // (eslint-plugin-jsdoc-scribe), and sample/express/ genuinely has
        // both routes/ and services/ directories (fixture data, but the
        // detector has no way to know that -- and per the ADR it
        // shouldn't guess intent, only report what it found). No MVC
        // signal (only controllers/ exists, not 2 of the 3 names), no
        // Backend/API service or Frontend application (no framework
        // dependency at confidence: "dependency" anywhere in this repo).
        const signals = getArchitectureSignals(path.resolve(__dirname, ".."));
        assert.deepStrictEqual(signals, [
            { name: "CLI tool", evidence: "package.json \"bin\": gen-comments, gen-docs" },
            { name: "Publishable library", evidence: "package.json has a \"exports\" field" },
            { name: "Monorepo (npm workspaces)", evidence: "1 workspace package(s): eslint-plugin-jsdoc-scribe" },
            { name: "Layered/service-oriented layout", evidence: "directories present: routes, services" },
        ]);
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
        assert.ok("workspacePackages" in facts);
        assert.ok("frameworkSignals" in facts);
        assert.ok("architectureSignals" in facts);
        assert.ok("test" in facts);
    });
};
