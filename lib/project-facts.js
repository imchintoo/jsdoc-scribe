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

// Dependency-field marker -> framework display name. Intentionally the
// same 6 frameworks epic-v2.4.2-scale-framework-growth Section 2 scoped --
// no new framework surface invented here. Dependency-presence only: this
// is NOT the AST-level parsing/decorator-extraction capability
// adr-framework-aware-docs-spike.md investigated (and found largely
// unbuilt) for doc-card rendering -- see adr-architecture-framework-
// detection.md's Reconciliation section.
const FRAMEWORK_MARKERS = {
    react: "React",
    next: "Next.js",
    "@angular/core": "Angular",
    vue: "Vue",
    express: "Express",
    "@nestjs/core": "NestJS",
};

// File extensions that corroborate (but never solely prove) a
// framework's presence, used only as a fallback when no dependency
// evidence was found anywhere.
const FILE_HEURISTIC_RULES = [
    // .tsx/.jsx alone only supports "React" -- it says nothing specific
    // enough to also infer "Next.js" (that needs its own conventions,
    // e.g. an app/ or pages/ directory, which this fallback deliberately
    // does not attempt to detect -- avoid inferring more than the
    // evidence actually supports).
    { extensions: [".tsx", ".jsx"], names: ["React"] },
    { extensions: [".vue"], names: ["Vue"] },
];

/**
 * Collect every `dependencies`/`devDependencies`/`peerDependencies` key
 * from one `package.json`.
 * @param {string} pkgJsonPath
 * @returns {Set<string>}
 */
function collectDependencyNames(pkgJsonPath) {
    const pkg = readJsonSafe(pkgJsonPath, {});
    const names = new Set();
    ["dependencies", "devDependencies", "peerDependencies"].forEach(function (field) {
        if (pkg[field] && typeof pkg[field] === "object") {
            Object.keys(pkg[field]).forEach(function (name) { names.add(name); });
        }
    });
    return names;
}

/**
 * Walk a `getProjectStructure()` result (including nested `children`)
 * collecting every extension key seen, so the file-heuristic fallback
 * can reuse Phase 1's already-computed walk instead of touching the
 * filesystem a second time.
 * @param {object[]} structure
 * @returns {Set<string>}
 */
function collectExtensionsFromStructure(structure) {
    const exts = new Set();
    (structure || []).forEach(function (node) {
        Object.keys(node.files || {}).forEach(function (ext) { exts.add(ext); });
        if (node.children) {
            collectExtensionsFromStructure(node.children).forEach(function (ext) { exts.add(ext); });
        }
    });
    return exts;
}

/**
 * Dependency-based framework/stack detection: which of a fixed set of
 * frameworks (React, Next.js, Angular, Vue, Express, NestJS) this project
 * appears to use, with evidence for every signal -- never a bare label.
 * Reads `package.json` dependency fields (root + every workspace package
 * from `getWorkspacePackages`) as primary evidence; falls back to
 * `getProjectStructure`'s existing file-extension counts (no second
 * filesystem walk) when a framework-shaped file extension is present but
 * no matching dependency was found anywhere.
 * @param {string} rootDir
 * @returns {{name: string, confidence: ("dependency"|"file-heuristic"), evidence: string}[]}
 */
function getFrameworkSignals(rootDir) {
    const signals = [];
    const foundNames = new Set();

    const roots = [{ label: "package.json", pkgJsonPath: path.join(rootDir, "package.json") }]
        .concat(getWorkspacePackages(rootDir).map(function (pkg) {
            return { label: pkg.path + "/package.json", pkgJsonPath: path.join(rootDir, pkg.path, "package.json") };
        }));

    roots.forEach(function (root) {
        const names = collectDependencyNames(root.pkgJsonPath);
        Object.keys(FRAMEWORK_MARKERS).forEach(function (marker) {
            if (!names.has(marker)) return;
            const displayName = FRAMEWORK_MARKERS[marker];
            foundNames.add(displayName);
            signals.push({
                name: displayName,
                confidence: "dependency",
                evidence: "\"" + marker + "\" in " + root.label + " dependencies",
            });
        });
    });

    const structure = getProjectStructure(rootDir);
    const extensionsSeen = collectExtensionsFromStructure(structure);
    FILE_HEURISTIC_RULES.forEach(function (rule) {
        const matchedExt = rule.extensions.find(function (ext) { return extensionsSeen.has(ext); });
        if (!matchedExt) return;
        rule.names.forEach(function (name) {
            if (foundNames.has(name)) return; // already have stronger dependency evidence
            foundNames.add(name);
            signals.push({
                name: name,
                confidence: "file-heuristic",
                evidence: matchedExt + " files present, no matching dependency found in any package.json",
            });
        });
    });

    return signals;
}

// Directory-name conventions checked by getArchitectureSignals(). Kept as
// data, not inline logic, so the rule table stays legible against
// adr-architecture-pattern-signals.md's own table.
const MVC_DIR_NAMES = ["controllers", "models", "views"];
const LAYERED_DIR_NAME_GROUPS = [
    ["routes", "services", "repositories"],
    ["domain", "application", "infrastructure"],
];

/**
 * Collect every directory name appearing anywhere in a
 * `getProjectStructure()` result (including nested `children`,
 * recursively) into a Set. Reused by getArchitectureSignals() instead of
 * a second filesystem walk.
 * @param {object[]} structure
 * @returns {Set<string>}
 */
function collectDirectoryNamesFromStructure(structure) {
    const names = new Set();
    (structure || []).forEach(function (node) {
        names.add(node.name);
        if (node.children) {
            collectDirectoryNamesFromStructure(node.children).forEach(function (n) { names.add(n); });
        }
    });
    return names;
}

/**
 * Architecture-pattern signals: independent, evidence-backed
 * observations (never a single forced "the architecture is X" label --
 * see adr-architecture-pattern-signals.md). Every rule is deterministic
 * and reuses Phase 1 (`getProjectStructure`, `getWorkspacePackages`) and
 * Phase 2 (`getFrameworkSignals`) output -- zero new filesystem calls.
 * @param {string} rootDir
 * @returns {{name: string, evidence: string}[]}
 */
function getArchitectureSignals(rootDir) {
    const signals = [];
    const pkg = readJsonSafe(path.join(rootDir, "package.json"), {});

    if (pkg.bin && (typeof pkg.bin === "string" || (typeof pkg.bin === "object" && Object.keys(pkg.bin).length > 0))) {
        const binNames = typeof pkg.bin === "string" ? [path.basename(rootDir)] : Object.keys(pkg.bin);
        signals.push({ name: "CLI tool", evidence: "package.json \"bin\": " + binNames.join(", ") });
    }

    if (pkg.main || pkg.exports) {
        signals.push({ name: "Publishable library", evidence: "package.json has a \"" + (pkg.exports ? "exports" : "main") + "\" field" });
    }

    const workspacePackages = getWorkspacePackages(rootDir);
    if (workspacePackages.length > 0) {
        signals.push({
            name: "Monorepo (npm workspaces)",
            evidence: workspacePackages.length + " workspace package(s): " + workspacePackages.map(function (p) { return p.name; }).join(", "),
        });
    }

    const dependencyFrameworks = getFrameworkSignals(rootDir).filter(function (s) { return s.confidence === "dependency"; });
    const dependencyNames = dependencyFrameworks.map(function (s) { return s.name; });

    const backendFrameworks = dependencyNames.filter(function (n) { return n === "Express" || n === "NestJS"; });
    if (backendFrameworks.length > 0) {
        signals.push({ name: "Backend/API service", evidence: "framework dependency: " + backendFrameworks.join(", ") });
    }

    const frontendFrameworks = dependencyNames.filter(function (n) { return ["React", "Next.js", "Angular", "Vue"].indexOf(n) !== -1; });
    if (frontendFrameworks.length > 0) {
        signals.push({ name: "Frontend application", evidence: "framework dependency: " + frontendFrameworks.join(", ") });
    }

    const dirNames = collectDirectoryNamesFromStructure(getProjectStructure(rootDir));

    const matchedMvc = MVC_DIR_NAMES.filter(function (n) { return dirNames.has(n); });
    if (matchedMvc.length >= 2) {
        signals.push({ name: "MVC-influenced layout", evidence: "directories present: " + matchedMvc.join(", ") });
    }

    // One signal, not one per group: the rule is "group A matches OR
    // group B matches", not two independent observations. If both
    // groups happen to match, report both as evidence on the single
    // signal rather than emitting a duplicate-named entry.
    const matchedLayeredGroups = LAYERED_DIR_NAME_GROUPS
        .map(function (group) { return group.filter(function (n) { return dirNames.has(n); }); })
        .filter(function (matched) { return matched.length >= 2; });
    if (matchedLayeredGroups.length > 0) {
        signals.push({
            name: "Layered/service-oriented layout",
            evidence: "directories present: " + matchedLayeredGroups.map(function (g) { return g.join(", "); }).join(" / "),
        });
    }

    return signals;
}

// ---------------------------------------------------------------------------
// Architecture pattern catalog (2026-07-15, Chintan-requested feature): a
// fixed reference table of common software architecture patterns, each with
// a short description, a verified external link (Wikipedia or the
// pattern's own originating/official source -- every URL below was fetched
// and confirmed live before being hardcoded here), and a deterministic
// `detect(ctx)` heuristic. `detect()` only ever reads directory names,
// dependency names, and root-level file existence -- never file *content*
// (no AST parsing) -- consistent with the rest of this module's
// evidence-only, zero-guessing philosophy. Returns an evidence string on a
// match, or null. Order matches the reference table Chintan supplied.
// ---------------------------------------------------------------------------
const ARCHITECTURE_PATTERN_DEFINITIONS = [
    {
        key: "layered",
        name: "Layered (N-Tier)",
        description: "Code is split into horizontal layers -- typically presentation, business logic, and data access -- where each layer only depends on the one beneath it. This keeps concerns separated and layers independently replaceable, at the cost of a change sometimes rippling through every layer.",
        link: "https://en.wikipedia.org/wiki/Multitier_architecture",
        detect: function (ctx) {
            const matched = ["controllers", "services", "repositories", "routes", "models"].filter(function (n) { return ctx.dirNames.has(n); });
            if (matched.length >= 2) return "directories present: " + matched.join(", ");
            return null;
        },
    },
    {
        key: "mvc",
        name: "MVC (Model-View-Controller)",
        description: "Splits an application into Models (data/business rules), Views (what the user sees), and Controllers (routes user input to the right model/view). One of the oldest and most widely used UI architecture patterns, still the default in most web frameworks.",
        link: "https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller",
        detect: function (ctx) {
            const matched = ["controllers", "models", "views"].filter(function (n) { return ctx.dirNames.has(n); });
            if (matched.length >= 2) return "directories present: " + matched.join(", ");
            return null;
        },
    },
    {
        key: "mvvm",
        name: "MVVM (Model-View-ViewModel)",
        description: "Adds a ViewModel between Model and View that exposes state and commands through data binding, so the View updates automatically as the ViewModel changes. Common in reactive UI frameworks and desktop/mobile apps built around two-way data binding.",
        link: "https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel",
        detect: function (ctx) {
            if (ctx.dirNames.has("viewmodels")) return "directory present: viewmodels";
            if (ctx.dirNames.has("view-models")) return "directory present: view-models";
            if (ctx.dependencyNames.has("mobx") && (ctx.dirNames.has("stores") || ctx.dirNames.has("store"))) {
                return "\"mobx\" dependency + a stores/ directory (reactive state exposed to views)";
            }
            return null;
        },
    },
    {
        key: "clean",
        name: "Clean Architecture",
        description: "Concentric rings -- entities, use cases, interface adapters, frameworks/drivers -- where dependencies only ever point inward, so business rules never depend on frameworks, databases, or UI. Proposed by Robert C. Martin, combining ideas from Hexagonal and Onion architecture.",
        link: "https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html",
        detect: function (ctx) {
            const hasUseCases = ctx.dirNames.has("usecases") || ctx.dirNames.has("use-cases");
            if (ctx.dirNames.has("domain") && ctx.dirNames.has("infrastructure") && hasUseCases) {
                return "directories present: domain, infrastructure, " + (ctx.dirNames.has("usecases") ? "usecases" : "use-cases");
            }
            return null;
        },
    },
    {
        key: "hexagonal",
        name: "Hexagonal (Ports & Adapters)",
        description: "The application core exposes \"ports\" (interfaces) that external technology plugs into via \"adapters\", so the core never depends directly on a database, UI, or third-party service. Invented by Alistair Cockburn to keep business logic testable and let infrastructure be swapped without touching it.",
        link: "https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)",
        detect: function (ctx) {
            if (ctx.dirNames.has("ports") && ctx.dirNames.has("adapters")) return "directories present: ports, adapters";
            return null;
        },
    },
    {
        key: "onion",
        name: "Onion Architecture",
        description: "The domain model sits at the very center, surrounded by concentric rings of increasingly infrastructure-facing code; all coupling points inward, so the database, UI, and frameworks are outer details the core knows nothing about. Proposed by Jeffrey Palermo as a refinement of layered architecture.",
        link: "https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/",
        detect: function (ctx) {
            if (ctx.dirNames.has("core") && ctx.dirNames.has("infrastructure")) return "directories present: core, infrastructure";
            return null;
        },
    },
    {
        key: "repository",
        name: "Repository Pattern",
        description: "A Repository class mediates between business logic and the data store, exposing a collection-like interface (add/remove/find) so callers never write persistence code directly. Cleanly separates what data looks like to the app from how it's actually stored.",
        link: "https://martinfowler.com/eaaCatalog/repository.html",
        detect: function (ctx) {
            if (ctx.dirNames.has("repositories")) return "directory present: repositories";
            if (ctx.dirNames.has("repository")) return "directory present: repository";
            return null;
        },
    },
    {
        key: "cqrs",
        name: "CQRS (Command Query Responsibility Segregation)",
        description: "Uses a different model for writes (commands) than for reads (queries), instead of one shared model for both. Useful for complex domains or when read/write load needs to scale independently, but adds real complexity and isn't a default choice for most systems.",
        link: "https://martinfowler.com/bliki/CQRS.html",
        detect: function (ctx) {
            if (ctx.dirNames.has("commands") && ctx.dirNames.has("queries")) return "directories present: commands, queries";
            if (ctx.dirNames.has("command") && ctx.dirNames.has("query")) return "directories present: command, query";
            return null;
        },
    },
    {
        key: "event-driven",
        name: "Event-Driven Architecture",
        description: "Components communicate by producing and reacting to events instead of calling each other directly, decoupling producers from consumers. Enables asynchronous, reactive systems that scale well, at the cost of harder-to-trace control flow.",
        link: "https://en.wikipedia.org/wiki/Event-driven_architecture",
        detect: function (ctx) {
            const hasEvents = ctx.dirNames.has("events");
            if (hasEvents && ctx.dirNames.has("publishers")) return "directories present: events, publishers";
            if (hasEvents && ctx.dirNames.has("subscribers")) return "directories present: events, subscribers";
            if (hasEvents && ctx.dirNames.has("handlers")) return "directories present: events, handlers";
            const eventLibs = ["kafkajs", "amqplib", "nats", "bullmq", "@aws-sdk/client-sns", "@aws-sdk/client-sqs"].filter(function (d) { return ctx.dependencyNames.has(d); });
            if (eventLibs.length > 0) return "dependency: " + eventLibs.join(", ");
            return null;
        },
    },
    {
        key: "microservices",
        name: "Microservices",
        description: "The system is split into multiple independently deployable services, each owning its own data and communicating over the network (APIs or events) rather than in-process calls. Trades operational complexity for independent scaling, deployment, and team ownership.",
        link: "https://en.wikipedia.org/wiki/Microservices",
        detect: function (ctx) {
            if (ctx.workspacePackages.length < 2) return null;
            const serverish = ctx.workspacePackages.filter(function (p) {
                return p.dependencyNames.has("express") || p.dependencyNames.has("@nestjs/core") || p.dependencyNames.has("fastify") || p.dependencyNames.has("koa");
            });
            if (serverish.length >= 2) {
                return serverish.length + " independently-deployable service-shaped workspace packages: " + serverish.map(function (p) { return p.name; }).join(", ");
            }
            return null;
        },
    },
    {
        key: "monolith",
        name: "Monolith",
        description: "The entire application -- UI, business logic, and data access -- ships and deploys as one single unit, rather than as independent services. Simpler to develop, test, and deploy for small-to-medium systems; can become harder to scale or change piece-by-piece as it grows.",
        link: "https://en.wikipedia.org/wiki/Monolithic_application",
        detect: function (ctx) {
            if (ctx.workspacePackages.length === 0 && ctx.pkg && (ctx.pkg.name || ctx.pkg.main || ctx.pkg.exports)) {
                return "single package.json, no workspace packages -- one deployable unit";
            }
            return null;
        },
    },
    {
        key: "modular-monolith",
        name: "Modular Monolith",
        description: "A single deployable application internally organized into well-separated, loosely-coupled modules -- each module owns its own logic and boundaries -- without paying the network/deployment overhead of full microservices. A common middle ground between a tangled monolith and microservices.",
        link: "https://en.wikipedia.org/wiki/Monolithic_application",
        detect: function (ctx) {
            if (ctx.workspacePackages.length > 0) return null; // that shape is Microservices/Monorepo territory instead
            const modulesNode = ctx.findTopNode("modules");
            if (modulesNode && (modulesNode.children || []).length >= 2) {
                return "modules/ directory with " + modulesNode.children.length + " self-contained module subfolders";
            }
            return null;
        },
    },
    {
        key: "ddd",
        name: "Domain-Driven Design (DDD)",
        description: "Models software around the business domain itself -- entities, value objects, aggregates, and bounded contexts -- built in close collaboration with domain experts using a shared \"ubiquitous language\". Best suited to genuinely complex business domains, not simple CRUD apps.",
        link: "https://en.wikipedia.org/wiki/Domain-driven_design",
        detect: function (ctx) {
            const matched = ["entities", "aggregates", "value-objects", "valueobjects", "bounded-contexts"].filter(function (n) { return ctx.dirNames.has(n); });
            if (matched.length >= 2) return "directories present: " + matched.join(", ");
            return null;
        },
    },
    {
        key: "serverless",
        name: "Serverless",
        description: "Application logic runs as short-lived, independently-deployed functions (Lambda, Cloud Functions, etc.) managed by a cloud provider, with no server process to keep running or scale manually. Trades infrastructure control for automatic scaling and pay-per-invocation billing.",
        link: "https://en.wikipedia.org/wiki/Serverless_computing",
        detect: function (ctx) {
            if (ctx.rootFiles.has("serverless.yml")) return "serverless.yml present at the project root";
            if (ctx.rootFiles.has("serverless.yaml")) return "serverless.yaml present at the project root";
            if (ctx.dirNames.has("functions")) return "directory present: functions";
            if (ctx.dirNames.has("lambda")) return "directory present: lambda";
            const serverlessDeps = ["aws-lambda", "serverless", "@vercel/node", "netlify-lambda", "firebase-functions"].filter(function (d) { return ctx.dependencyNames.has(d); });
            if (serverlessDeps.length > 0) return "dependency: " + serverlessDeps.join(", ");
            return null;
        },
    },
    {
        key: "plugin",
        name: "Plugin Architecture",
        description: "A stable core application loads independently-developed plugins at runtime to add functionality, without the core needing to know about any specific plugin in advance. Lets third parties (or other teams) extend the system without modifying its source.",
        link: "https://en.wikipedia.org/wiki/Plug-in_(computing)",
        detect: function (ctx) {
            if (ctx.dirNames.has("plugins")) return "directory present: plugins";
            return null;
        },
    },
    {
        key: "pipeline",
        name: "Pipeline Architecture",
        description: "Data flows through a fixed sequence of independent processing stages, where each stage transforms its input and passes the result to the next. Common in build tools, compilers, and data-processing systems -- each stage can be developed, tested, and replaced in isolation.",
        link: "https://en.wikipedia.org/wiki/Pipeline_(software)",
        detect: function (ctx) {
            const matched = ["pipeline", "pipelines", "stages"].filter(function (n) { return ctx.dirNames.has(n); });
            if (matched.length > 0) return "directory present: " + matched.join(", ");
            return null;
        },
    },
    {
        key: "pubsub",
        name: "Pub/Sub",
        description: "Publishers send messages to named topics without knowing who (if anyone) is listening; subscribers register interest in topics without knowing who publishes to them. A specific, broker-mediated form of event-driven communication built around topics rather than direct events.",
        link: "https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern",
        detect: function (ctx) {
            if (ctx.dirNames.has("pubsub")) return "directory present: pubsub";
            if (ctx.dirNames.has("topics") && ctx.dirNames.has("subscribers")) return "directories present: topics, subscribers";
            const pubsubDeps = ["@google-cloud/pubsub", "mqtt"].filter(function (d) { return ctx.dependencyNames.has(d); });
            if (pubsubDeps.length > 0) return "dependency: " + pubsubDeps.join(", ");
            return null;
        },
    },
    {
        key: "actor-model",
        name: "Actor Model",
        description: "Independent \"actors\" each hold their own private state and communicate only by sending asynchronous messages to each other, never by sharing memory directly. Well suited to highly concurrent or distributed systems where isolating state per unit avoids shared-state bugs.",
        link: "https://en.wikipedia.org/wiki/Actor_model",
        detect: function (ctx) {
            if (ctx.dirNames.has("actors")) return "directory present: actors";
            return null;
        },
    },
    {
        key: "component-based",
        name: "Component-Based",
        description: "The UI (or system) is built from independent, reusable components, each encapsulating its own markup/logic/state behind a well-defined interface. The default organizing principle in React, Vue, and Angular applications.",
        link: "https://en.wikipedia.org/wiki/Component-based_software_engineering",
        detect: function (ctx) {
            if (ctx.dirNames.has("components")) return "directory present: components";
            return null;
        },
    },
    {
        key: "feature-based",
        name: "Feature-Based",
        description: "Code is grouped by feature or business capability rather than by technical role -- so everything related to one feature lives together, instead of being spread across separate controllers/, services/, models/ folders. Makes it easier to find and change everything one feature touches.",
        link: "https://www.jimmybogard.com/vertical-slice-architecture/",
        detect: function (ctx) {
            const node = ctx.findTopNode("features") || ctx.findTopNode("modules");
            if (!node) return null;
            if (isVerticalSliceNode(node)) return null; // reported as the more specific Vertical Slice pattern instead
            return "directory present: " + node.name;
        },
    },
    {
        key: "vertical-slice",
        name: "Vertical Slice",
        description: "Each feature gets its own folder containing everything needed to fulfill it end-to-end -- UI, logic, and data access together -- rather than spreading one feature across shared technical layers. Popularized by Jimmy Bogard as a reaction against rigid, over-layered architectures.",
        link: "https://www.jimmybogard.com/vertical-slice-architecture/",
        detect: function (ctx) {
            const node = ctx.findTopNode("features") || ctx.findTopNode("modules");
            if (!node || !isVerticalSliceNode(node)) return null;
            return "directory \"" + node.name + "\" contains per-feature subfolders that each bundle their own controller/service/model-shaped files";
        },
    },
    {
        key: "bff",
        name: "BFF (Backend for Frontend)",
        description: "Each frontend (web, iOS, Android, etc.) gets its own dedicated backend, tailored to exactly what that specific client needs, instead of every client sharing one general-purpose API. Popularized by Sam Newman to stop a single shared backend from becoming a bottleneck between frontend and backend teams.",
        link: "https://samnewman.io/patterns/architectural/bff/",
        detect: function (ctx) {
            const dirMatch = Array.from(ctx.dirNames).find(function (n) { return /bff/i.test(n); });
            if (dirMatch) return "directory present: " + dirMatch;
            const pkgMatch = ctx.workspacePackages.find(function (p) { return /bff/i.test(p.name); });
            if (pkgMatch) return "workspace package name: " + pkgMatch.name;
            return null;
        },
    },
    {
        key: "api-gateway",
        name: "API Gateway",
        description: "A single entry point sits in front of multiple backend services, routing (and sometimes composing) client requests to the right one, so clients never call individual services directly. Common in microservice systems to hide internal service topology from consumers.",
        link: "https://microservices.io/patterns/apigateway.html",
        detect: function (ctx) {
            if (ctx.dirNames.has("gateway")) return "directory present: gateway";
            if (ctx.dirNames.has("api-gateway")) return "directory present: api-gateway";
            const pkgMatch = ctx.workspacePackages.find(function (p) { return /gateway/i.test(p.name); });
            if (pkgMatch) return "workspace package name: " + pkgMatch.name;
            return null;
        },
    },
];

/**
 * Recursively find the first structure node matching `name` at any depth
 * (e.g. "features" nested as src/features/, not just a rootDir-level
 * directory) -- most real projects put this kind of folder under src/,
 * not at the repo root, so a depth-1-only search would miss them.
 * @param {object[]} structure
 * @param {string} name
 * @returns {object|null}
 */
function findStructureNodeByName(structure, name) {
    for (let i = 0; i < (structure || []).length; i++) {
        if (structure[i].name === name) return structure[i];
        if (structure[i].children) {
            const found = findStructureNodeByName(structure[i].children, name);
            if (found) return found;
        }
    }
    return null;
}

// Layer-shaped subdirectory names checked against a candidate
// "features"/"modules" child's OWN children -- distinguishes Vertical
// Slice from the more general Feature-Based signal (see
// ARCHITECTURE_PATTERN_DEFINITIONS above): Vertical Slice wins when a
// feature folder itself bundles its own mini-stack, not just related files.
const VERTICAL_SLICE_LAYER_DIR_NAMES = ["controllers", "services", "models", "routes", "components", "handlers"];

/**
 * A features/modules node "is" Vertical Slice (rather than plain
 * Feature-Based) when at least one of its own child directories itself
 * contains 2+ of the layer-shaped subdirectory names above.
 * @param {object} node - a getProjectStructure() node (already has .children).
 * @returns {boolean}
 */
function isVerticalSliceNode(node) {
    return (node.children || []).some(function (child) {
        const childDirNames = (child.children || []).map(function (c) { return c.name; });
        const matched = VERTICAL_SLICE_LAYER_DIR_NAMES.filter(function (n) { return childDirNames.indexOf(n) !== -1; });
        return matched.length >= 2;
    });
}

/**
 * Detects which of a fixed reference catalog of common architectural
 * patterns (ARCHITECTURE_PATTERN_DEFINITIONS) this project's own directory
 * names, dependencies, and root-level files match. Every returned entry
 * carries the same evidence-or-nothing discipline as
 * getArchitectureSignals() -- a pattern only appears here when `detect()`
 * found real, cited evidence, never a guess. This is the deeper companion
 * to getArchitectureSignals()'s lighter "what kind of project is this"
 * signals -- "what architecture pattern does this codebase actually use".
 * @param {string} rootDir
 * @param {object[]} [precomputedStructure] - a `getProjectStructure()` result
 *   to reuse instead of walking the filesystem again (getAllFacts() passes
 *   its own already-computed `structure` field here). Falls back to a fresh
 *   depth-4 walk when omitted, e.g. when this function is called standalone.
 *   Depth is capped at 4, not deeper: measured directly against this repo's
 *   own tree, depth 3->4 cost ~700ms extra (709ms -> 1413ms) but depth 4->5
 *   cost ~6.4s more (7.8s) and depth 6 took ~19s -- a generated/versioned
 *   output directory sitting inside the scanned root (this repo's own
 *   docs-dashboard/site-versions/, which nests full copies of prior site
 *   generations) blows up combinatorially past depth 4. A real user's
 *   --out directory can just as easily live inside the directory being
 *   documented, so this cap protects every caller, not just this repo's
 *   own dogfooding case.
 * @returns {{name: string, description: string, link: string, evidence: string}[]}
 */
function getArchitecturePatterns(rootDir, precomputedStructure) {
    const pkg = readJsonSafe(path.join(rootDir, "package.json"), {});
    const workspacePackages = getWorkspacePackages(rootDir).map(function (p) {
        return Object.assign({}, p, { dependencyNames: collectDependencyNames(path.join(rootDir, p.path, "package.json")) });
    });

    const structureDeep = precomputedStructure || getProjectStructure(rootDir, { depth: 4 });
    const dirNames = collectDirectoryNamesFromStructure(structureDeep);

    let rootFileNames = [];
    try {
        rootFileNames = fs.readdirSync(rootDir, { withFileTypes: true })
            .filter(function (e) { return e.isFile(); })
            .map(function (e) { return e.name; });
    } catch (err) {
        rootFileNames = [];
    }
    const rootFiles = new Set(rootFileNames);

    const dependencyNames = new Set();
    collectDependencyNames(path.join(rootDir, "package.json")).forEach(function (n) { dependencyNames.add(n); });
    workspacePackages.forEach(function (p) { p.dependencyNames.forEach(function (n) { dependencyNames.add(n); }); });

    const ctx = {
        dirNames: dirNames,
        rootFiles: rootFiles,
        pkg: pkg,
        workspacePackages: workspacePackages,
        dependencyNames: dependencyNames,
        findTopNode: function (name) { return findStructureNodeByName(structureDeep, name); },
    };

    return ARCHITECTURE_PATTERN_DEFINITIONS
        .map(function (def) {
            const evidence = def.detect(ctx);
            if (evidence == null) return null;
            return { name: def.name, description: def.description, link: def.link, evidence: evidence };
        })
        .filter(Boolean);
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
    // Walked once at depth 4 (one level deeper than getProjectStructure()'s
    // own default of 3) and reused for both the `structure` field and
    // getArchitecturePatterns() below -- avoids a second, redundant
    // filesystem walk purely for pattern detection (see
    // getArchitecturePatterns()'s own doc comment for why depth is capped
    // at 4, not deeper).
    const structure = getProjectStructure(dir, { depth: 4 });
    return {
        node: getNodeVersions(dir),
        packageManager: getPackageManager(dir),
        globalDependencies: getGlobalDependencies(dir),
        structure: structure,
        workspacePackages: getWorkspacePackages(dir),
        frameworkSignals: getFrameworkSignals(dir),
        architectureSignals: getArchitectureSignals(dir),
        architecturePatterns: getArchitecturePatterns(dir, structure),
        test: getTestInfo(dir),
    };
}

module.exports = {
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
};
