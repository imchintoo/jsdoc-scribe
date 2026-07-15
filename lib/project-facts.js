"use strict";

/**
 * lib/project-facts.js
 * ----------------------------------------
 * Onboarding-facts generator for the internal project dashboard (Track A,
 * see docs/backlog/adr-phase-j-project-dashboard.md). Every fact is derived
 * by reading the repo's actual current state -- package.json, CI workflow
 * YAML, the real directory tree -- never hand-typed prose that can drift
 * out of sync with reality.
 */

const fs = require("fs");
const path = require("path");

const KNOWN_DIR_DESCRIPTIONS = {
    bin: "CLI entry points (gen-comments, gen-docs, gen-dashboard).",
    lib: "Core library -- pure, deterministic modules (extractor, renderer, coverage, drift, lint, fix, import-graph, project-facts, quality).",
    packages: "npm workspaces -- sibling packages published alongside the root package (e.g. eslint-plugin-jsdoc-scribe).",
    docs: "Generated documentation site output (gen-docs) plus this project's own backlog (docs/backlog).",
    test: "Hand-rolled deterministic test suite, run via `npm test` (node test/run.js). No test framework.",
    sample: "Fixture source files used by `npm run demo`/`npm run docs` to exercise the tool against real-ish code.",
    assets: "Static assets referenced by generated documentation (images, etc.).",
    ".github": "CI workflows (test/docs/publish) and issue/PR templates.",
};

// Applies at every depth, not just the top level -- same convention as
// lib/index.js's DEFAULT_IGNORE_DIRS, kept as a separate constant here
// since this module has its own file (no shared import to avoid coupling
// the dashboard's fact-gathering to the extraction engine's internals).
const IGNORE_DIR_NAMES = new Set(["node_modules", ".git", "coverage", "dist", "build", "out", ".cache", ".turbo", ".next"]);

/**
 * Read and JSON-parse a file, returning `fallback` on any error.
 * @param {string} filePath
 * @param {*} fallback
 * @returns {*}
 */
function readJsonSafe(filePath, fallback) {
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (err) {
        return fallback;
    }
}

/**
 * Node version facts: the package's declared minimum vs. what CI actually
 * tests against. Surfaced separately and explicitly -- not collapsed into
 * one answer -- because they may legitimately differ (see story-dev-onboarding-dashboard AC1).
 * @param {string} rootDir
 * @returns {{declaredMin: (string|null), ciTested: number[], matches: boolean}}
 */
function getNodeVersions(rootDir) {
    const pkg = readJsonSafe(path.join(rootDir, "package.json"), {});
    const declaredMin = (pkg.engines && pkg.engines.node) || null;

    let ciTested = [];
    try {
        const ciText = fs.readFileSync(path.join(rootDir, ".github", "workflows", "test.yml"), "utf8");
        const match = ciText.match(/node-version:\s*\[([^\]]+)\]/);
        if (match) {
            ciTested = match[1].split(",").map(function (s) { return parseInt(s.trim(), 10); }).filter(function (n) { return !isNaN(n); });
        }
    } catch (err) {
        ciTested = [];
    }

    const declaredMinNumber = declaredMin ? parseInt(declaredMin.replace(/[^\d.]/g, ""), 10) : null;
    const matches = declaredMinNumber != null && ciTested.length > 0 && ciTested.every(function (v) { return v >= declaredMinNumber; }) && ciTested.indexOf(declaredMinNumber) !== -1;

    return { declaredMin: declaredMin, ciTested: ciTested, matches: matches };
}

/**
 * Which package manager this repo uses, detected from lockfile presence.
 * @param {string} rootDir
 * @returns {{manager: string, lockfile: (string|null)}}
 */
function getPackageManager(rootDir) {
    const candidates = [
        { manager: "npm", lockfile: "package-lock.json" },
        { manager: "pnpm", lockfile: "pnpm-lock.yaml" },
        { manager: "yarn", lockfile: "yarn.lock" },
    ];
    for (let i = 0; i < candidates.length; i++) {
        if (fs.existsSync(path.join(rootDir, candidates[i].lockfile))) {
            return { manager: candidates[i].manager, lockfile: candidates[i].lockfile };
        }
    }
    return { manager: "unknown", lockfile: null };
}

/**
 * Global (machine-wide) dependencies required to work on this repo.
 * Static, but reasoned from the same repo-state signals as the rest of this
 * module -- zero devDependencies historically meant zero global tooling
 * beyond Node/npm/git; the new code-multivitals devDependency doesn't
 * change that (it's invoked via its programmatic API, never a global install
 * or npx network fetch in CI since `npm ci` already resolves it).
 * @param {string} rootDir
 * @returns {{required: string[], conditionallyRequired: string[]}}
 */
function getGlobalDependencies(rootDir) {
    return {
        required: ["Node.js", "npm (or the package manager reported by getPackageManager)"],
        conditionallyRequired: [
            "git -- only needed for code-multivitals's --trend/hotspot mode (git log-based churn data); not required for basic gen-comments/gen-docs/gen-dashboard use.",
        ],
    };
}

/**
 * Count files directly inside `dirPath`, grouped by extension (e.g.
 * `{ ".ts": 12, ".test.js": 3 }`). Non-recursive -- one directory's own
 * files only, computed in the same readdir pass the walk already does.
 * @param {string} dirPath
 * @returns {object}
 */
function summarizeFileExtensions(dirPath) {
    let entries;
    try {
        entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch (err) {
        return {};
    }
    const counts = {};
    entries.forEach(function (e) {
        if (!e.isFile()) return;
        const base = e.name;
        // Prefer a two-part suffix like ".test.js" over the bare extension
        // when the file follows that convention -- more useful in a
        // structure report than collapsing every *.test.js into ".js".
        const twoPart = base.match(/(\.[^.]+\.[^.]+)$/);
        const ext = (twoPart && /\.test\.|\.spec\.|\.d\./.test(twoPart[1])) ? twoPart[1] : (path.extname(base) || "(no ext)");
        counts[ext] = (counts[ext] || 0) + 1;
    });
    return counts;
}

/**
 * Recursively describe one directory: its known/fallback description, a
 * file-extension summary, and (while under `maxDepth`) its child
 * directories in the same shape.
 * @param {string} dirPath
 * @param {string} name
 * @param {number} depth - 1-based depth of this directory from rootDir.
 * @param {number} maxDepth
 * @returns {object}
 */
function describeDirectory(dirPath, name, depth, maxDepth) {
    const node = {
        name: name,
        description: KNOWN_DIR_DESCRIPTIONS[name] || "(no description on file -- inspect directly)",
        files: summarizeFileExtensions(dirPath),
    };
    if (depth < maxDepth) {
        let entries;
        try {
            entries = fs.readdirSync(dirPath, { withFileTypes: true });
        } catch (err) {
            entries = [];
        }
        const children = entries
            .filter(function (e) { return e.isDirectory() && !IGNORE_DIR_NAMES.has(e.name); })
            .map(function (e) { return describeDirectory(path.join(dirPath, e.name), e.name, depth + 1, maxDepth); })
            .sort(function (a, b) { return a.name.localeCompare(b.name); });
        if (children.length > 0) node.children = children;
    }
    return node;
}

/**
 * Nested map of the project structure, generated by walking the actual
 * filesystem (not hand-maintained). Each entry reports its own
 * description, a per-extension file-count summary, and -- while under the
 * configured depth -- its child directories in the same shape.
 * @param {string} rootDir
 * @param {{depth: number}} [options] - max walk depth from rootDir, default 3.
 * @returns {{name: string, description: string, files: object, children: (Array|undefined)}[]}
 */
function getProjectStructure(rootDir, options) {
    const maxDepth = (options && typeof options.depth === "number") ? options.depth : 3;
    let entries;
    try {
        entries = fs.readdirSync(rootDir, { withFileTypes: true });
    } catch (err) {
        return [];
    }
    return entries
        .filter(function (e) { return e.isDirectory() && !IGNORE_DIR_NAMES.has(e.name); })
        .map(function (e) { return describeDirectory(path.join(rootDir, e.name), e.name, 1, maxDepth); })
        .sort(function (a, b) { return a.name.localeCompare(b.name); });
}

/**
 * Resolve npm workspace packages declared in the root `package.json`'s
 * `workspaces` field into concrete facts, read from each package's own
 * `package.json` -- never hand-typed. Supports `"dir/*"` glob-style
 * patterns (this repo's own convention, and the overwhelmingly common
 * shape in practice) plus exact directory entries.
 * @param {string} rootDir
 * @returns {{name: string, path: string, description: (string|null)}[]}
 */
function getWorkspacePackages(rootDir) {
    const pkg = readJsonSafe(path.join(rootDir, "package.json"), {});
    const raw = pkg.workspaces;
    const patterns = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.packages) ? raw.packages : []);
    const results = [];

    function addIfPackage(pkgDir) {
        const pkgJson = readJsonSafe(path.join(pkgDir, "package.json"), null);
        if (!pkgJson) return;
        results.push({
            name: pkgJson.name || path.basename(pkgDir),
            path: path.relative(rootDir, pkgDir).split(path.sep).join("/"),
            description: pkgJson.description || null,
        });
    }

    patterns.forEach(function (pattern) {
        if (pattern.endsWith("/*")) {
            const baseDir = path.join(rootDir, pattern.slice(0, -2));
            let entries;
            try {
                entries = fs.readdirSync(baseDir, { withFileTypes: true });
            } catch (err) {
                entries = [];
            }
            entries
                .filter(function (e) { return e.isDirectory(); })
                .forEach(function (e) { addIfPackage(path.join(baseDir, e.name)); });
        } else {
            addIfPackage(path.join(rootDir, pattern));
        }
    });

    return results.sort(function (a, b) { return a.name.localeCompare(b.name); });
}

/**
 * Test-tooling facts: no framework, hand-rolled runner, no HTTP API.
 * @param {string} rootDir
 * @returns {{framework: (string|null), runner: string, suiteCount: (number|null), hasHttpApi: boolean}}
 */
function getTestInfo(rootDir) {
    let suiteCount = null;
    try {
        const runnerText = fs.readFileSync(path.join(rootDir, "test", "run.js"), "utf8");
        const matches = runnerText.match(/require\(".\/[\w-]+\.test\.js"\)\(check\)/g);
        if (matches) suiteCount = matches.length;
    } catch (err) {
        suiteCount = null;
    }
    return {
        framework: null,
        runner: "node test/run.js (hand-rolled assertion runner, invoked via `npm test`)",
        suiteCount: suiteCount,
        hasHttpApi: false,
    };
}

/**
 * Compose all onboarding facts into one object for the dashboard renderer.
 * @param {string} [rootDir] - defaults to process.cwd().
 * @returns {object}
 */
function getAllFacts(rootDir) {
    const dir = rootDir || process.cwd();
    return {
        node: getNodeVersions(dir),
        packageManager: getPackageManager(dir),
        globalDependencies: getGlobalDependencies(dir),
        structure: getProjectStructure(dir),
        workspacePackages: getWorkspacePackages(dir),
        test: getTestInfo(dir),
    };
}

module.exports = {
    getNodeVersions,
    getPackageManager,
    getGlobalDependencies,
    getProjectStructure,
    getWorkspacePackages,
    getTestInfo,
    getAllFacts,
};
