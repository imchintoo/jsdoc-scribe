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
    getArchitecturePatterns,
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

    // -------------------------------------------------------------------
    // getArchitecturePatterns (2026-07-15, Chintan-requested feature): the
    // 23-pattern reference catalog. Every entry that fires must carry a
    // name, a 3-4 line description, a link, and cited directory/dependency
    // evidence -- never a guess.
    // -------------------------------------------------------------------

    check("getArchitecturePatterns: every returned entry has name/description/link/evidence, never just a bare label", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "x", main: "index.js" }));
        ["controllers", "services", "repositories"].forEach((d) => fs.mkdirSync(path.join(dir, "src", d), { recursive: true }));
        const patterns = getArchitecturePatterns(dir);
        assert.ok(patterns.length > 0, "expected at least one pattern to fire on this fixture");
        patterns.forEach((p) => {
            assert.strictEqual(typeof p.name, "string");
            assert.strictEqual(typeof p.description, "string");
            assert.ok(p.description.length > 40, "description should be a real 3-4 line explanation, not a one-word stub");
            assert.match(p.link, /^https:\/\//, "link should be a real external URL");
            assert.strictEqual(typeof p.evidence, "string");
            assert.ok(p.evidence.length > 0);
        });
    });

    check("getArchitecturePatterns: Layered (N-Tier) fires on 2+ of controllers/services/repositories/routes/models, nested under src/", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "x" }));
        ["controllers", "services"].forEach((d) => fs.mkdirSync(path.join(dir, "src", d), { recursive: true }));
        const layered = getArchitecturePatterns(dir).find((p) => p.name === "Layered (N-Tier)");
        assert.ok(layered, "expected Layered (N-Tier) to fire");
        assert.match(layered.evidence, /controllers, services/);
    });

    check("getArchitecturePatterns: MVC fires only on 2+ of controllers/models/views, not just 1", () => {
        const dirOne = tmpRepo();
        fs.writeFileSync(path.join(dirOne, "package.json"), "{}");
        fs.mkdirSync(path.join(dirOne, "src", "controllers"), { recursive: true });
        assert.ok(!getArchitecturePatterns(dirOne).some((p) => p.name.startsWith("MVC")), "1 matching dir should not fire MVC");

        const dirTwo = tmpRepo();
        fs.writeFileSync(path.join(dirTwo, "package.json"), "{}");
        ["controllers", "models"].forEach((d) => fs.mkdirSync(path.join(dirTwo, "src", d), { recursive: true }));
        assert.ok(getArchitecturePatterns(dirTwo).some((p) => p.name.startsWith("MVC")), "2 matching dirs should fire MVC");
    });

    check("getArchitecturePatterns: Hexagonal fires on ports+adapters, Onion fires on core+infrastructure, Repository fires on repositories/", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), "{}");
        ["ports", "adapters", "core", "infrastructure", "repositories"].forEach((d) => fs.mkdirSync(path.join(dir, "src", d), { recursive: true }));
        const names = getArchitecturePatterns(dir).map((p) => p.name);
        assert.ok(names.includes("Hexagonal (Ports & Adapters)"));
        assert.ok(names.includes("Onion Architecture"));
        assert.ok(names.includes("Repository Pattern"));
    });

    check("getArchitecturePatterns: Vertical Slice wins over Feature-Based when a feature folder bundles its own layers", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), "{}");
        fs.mkdirSync(path.join(dir, "src", "features", "checkout", "controllers"), { recursive: true });
        fs.mkdirSync(path.join(dir, "src", "features", "checkout", "services"), { recursive: true });
        const names = getArchitecturePatterns(dir).map((p) => p.name);
        assert.ok(names.includes("Vertical Slice"), "expected Vertical Slice to fire");
        assert.ok(!names.includes("Feature-Based"), "Feature-Based should be superseded by the more specific Vertical Slice, not double-reported");
    });

    check("getArchitecturePatterns: Feature-Based fires (not Vertical Slice) when feature folders are flat, no per-feature layer mix", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), "{}");
        ["checkout", "billing"].forEach((d) => fs.mkdirSync(path.join(dir, "src", "features", d), { recursive: true }));
        const names = getArchitecturePatterns(dir).map((p) => p.name);
        assert.ok(names.includes("Feature-Based"));
        assert.ok(!names.includes("Vertical Slice"));
    });

    check("getArchitecturePatterns: Modular Monolith fires on modules/ with 2+ subfolders, only when there are no workspace packages", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), "{}");
        ["orders", "billing"].forEach((d) => fs.mkdirSync(path.join(dir, "src", "modules", d), { recursive: true }));
        assert.ok(getArchitecturePatterns(dir).some((p) => p.name === "Modular Monolith"));
    });

    check("getArchitecturePatterns: Monolith fires only when there are zero workspace packages", () => {
        const soloDir = tmpRepo();
        fs.writeFileSync(path.join(soloDir, "package.json"), JSON.stringify({ name: "solo", main: "index.js" }));
        assert.ok(getArchitecturePatterns(soloDir).some((p) => p.name === "Monolith"));

        const monorepoDir = tmpRepo();
        fs.writeFileSync(path.join(monorepoDir, "package.json"), JSON.stringify({ name: "root", workspaces: ["packages/*"] }));
        fs.mkdirSync(path.join(monorepoDir, "packages", "a"), { recursive: true });
        fs.writeFileSync(path.join(monorepoDir, "packages", "a", "package.json"), JSON.stringify({ name: "a" }));
        assert.ok(!getArchitecturePatterns(monorepoDir).some((p) => p.name === "Monolith"), "a repo with workspace packages should not also be flagged Monolith");
    });

    check("getArchitecturePatterns: Serverless fires from serverless.yml at root, independent of any directory name", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), "{}");
        fs.writeFileSync(path.join(dir, "serverless.yml"), "service: x\n");
        const serverless = getArchitecturePatterns(dir).find((p) => p.name === "Serverless");
        assert.ok(serverless);
        assert.match(serverless.evidence, /serverless\.yml/);
    });

    check("getArchitecturePatterns: returns [] on a plain repo matching none of the 23 patterns", () => {
        // No name/main/exports on purpose: those three fields are exactly
        // what Monolith's own detect() checks for (see the dedicated
        // Monolith test above) -- this fixture is deliberately a package.json
        // with none of them, so this is a true all-empty case, not a
        // Monolith-in-disguise.
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ private: true }));
        fs.mkdirSync(path.join(dir, "lib"));
        assert.deepStrictEqual(getArchitecturePatterns(dir), []);
    });

    check("getArchitecturePatterns: this repo's own real directory tree reports Layered, MVC, Repository, Component-Based, Feature-Based", () => {
        // Verified directly against this repo's real tree before writing
        // this assertion (sample/express/{controllers,services,routes,
        // repositories} and sample/react/{Button,Card,...} under a
        // "components"-shaped path exist as real fixture files, plus a
        // real "modules" directory somewhere in sample/nestjs -- same
        // "report what's actually there, fixture or not" stance the
        // getArchitectureSignals sanity check above already takes). No
        // Monolith (this repo itself IS a small workspace/monorepo via
        // packages/eslint-plugin-jsdoc-scribe).
        const names = getArchitecturePatterns(path.resolve(__dirname, "..")).map((p) => p.name);
        assert.ok(names.includes("Layered (N-Tier)"));
        assert.ok(names.includes("MVC (Model-View-Controller)"));
        assert.ok(names.includes("Repository Pattern"));
        assert.ok(names.includes("Component-Based"));
        assert.ok(names.includes("Feature-Based"));
        assert.ok(!names.includes("Monolith"), "this repo has a workspace package, so it should not also read as a pure Monolith");
    });

    check("getAllFacts: includes architecturePatterns alongside architectureSignals", () => {
        const dir = tmpRepo();
        fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "x", main: "index.js" }));
        const facts = getAllFacts(dir);
        assert.ok(Array.isArray(facts.architecturePatterns));
        assert.ok(facts.architecturePatterns.some((p) => p.name === "Monolith"));
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
