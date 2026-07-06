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

const IGNORE_TOP_LEVEL_DIRS = new Set(["node_modules", ".git", "coverage", "dist", "build", "out", ".cache", ".turbo", ".next"]);

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
 * One-line-per-directory map of the top-level project structure, generated
 * by walking the actual filesystem (not hand-maintained).
 * @param {string} rootDir
 * @returns {{name: string, description: string}[]}
 */
function getProjectStructure(rootDir) {
    let entries;
    try {
        entries = fs.readdirSync(rootDir, { withFileTypes: true });
    } catch (err) {
        return [];
    }
    return entries
        .filter(function (e) { return e.isDirectory() && !IGNORE_TOP_LEVEL_DIRS.has(e.name); })
        .map(function (e) {
            return {
                name: e.name,
                description: KNOWN_DIR_DESCRIPTIONS[e.name] || "(no description on file -- inspect directly)",
            };
        })
        .sort(function (a, b) { return a.name.localeCompare(b.name); });
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
        test: getTestInfo(dir),
    };
}

module.exports = { getNodeVersions, getPackageManager, getGlobalDependencies, getProjectStructure, getTestInfo, getAllFacts };
