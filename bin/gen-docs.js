#!/usr/bin/env node
"use strict";

const fs   = require("fs");
const path = require("path");
const { collectFiles }   = require("../lib/index.js");
const { extractModule }  = require("../lib/extractor.js");
const { buildSite, moduleLabel, moduleHtmlPath } = require("../lib/renderer.js");
const { loadConfig, mergeConfig } = require("../lib/config.js");
const { buildImportGraph, findOrphanFiles } = require("../lib/import-graph.js");
const { getAllFacts } = require("../lib/project-facts.js");
const quality = require("../lib/quality.js");
const siteData = require("../lib/site-data.js");
const pkg = require("../package.json");


function printHelp() {
    console.log(`
${pkg.name} v${pkg.version} -- gen-docs
Generate a multi-page HTML documentation site from JS/TS source files.

Usage:
  gen-docs <path> [path2 ...] [options]

Options:
  --out <dir>,        -o <dir>   Output directory              (default: ./docs)
  --title <name>,     -t <name>  Project title                 (default: package name)
  --json,             -j         Also write docs.json
  --readme,           -r         Also write README.md
  --ignore <glob>,    -I <glob>  Exclude files matching glob   (repeatable)
  --source-url <url>, -s <url>   GitHub base URL for source links
  --config <file>,    -c <file>  Path to config file           (default: .jsdoc-scribe.json)
  --watch,            -W         Watch for changes and rebuild automatically
  --help,             -h         Show this help.
  --version,          -v         Show version.

Quality reporting (optional -- requires a separate install):
  --quality                       Analyse the same files with code-multivitals and
                                   embed a "Code Health" section directly into the
                                   generated index.html. No extra file is written.
  --quality-reporter <type>       console|json|html|sarif|badge|dashboard
                                   Opt out of the embedded section above and instead
                                   write ONE standalone report in this format (useful
                                   for CI: SARIF for code scanning, JSON/badge for
                                   automation). Skips the doc-site build.
  --quality-profile <name>        strict|default|relaxed                   (default: default)
  --quality-config <path>         Path to a .code-multivitals.json file
  --quality-baseline <path>       Only report regressions vs. a saved baseline
  --quality-save-baseline <path>  Save current analysis as a baseline JSON file
  --quality-snapshot <dir>        Save a timestamped snapshot for trend tracking
  --quality-trend <dir>           Load snapshots and include trend/hotspot data --
                                   with --quality-reporter dashboard this drives the
                                   standalone dashboard's trend/hotspot tabs; with plain
                                   --quality it drives the embedded index-page sparkline

  Quality reporting requires code-multivitals as a separate, optional install
  (npm install --save-dev code-multivitals) -- it is NOT installed by
  "npm install jsdoc-scribe" and never affects default gen-docs behavior.

Site-data JSON (optional -- separate from, and does not change, --json/docs.json):
  --data                           Also write <out>/site-data.json: everything
                                   buildSite() needs (modules + quality/import-graph/
                                   snapshot data) in one file. Never overwrites a
                                   prior site-data.json -- the previous one is moved
                                   into <out>/site-data-history/ first, so successive
                                   generations can be compared later.
  --from-data <path>               Build the site directly from a previously-written
                                   site-data.json, skipping source parsing and quality
                                   analysis entirely -- fast path for iterating on
                                   templates/CSS. <path>'s inputs (positional args) are
                                   not required in this mode.

Config file (.jsdoc-scribe.json):
  { "out": "docs", "title": "My API", "json": true,
    "readme": true, "sourceUrl": "https://github.com/user/repo/blob/main",
    "ignore": ["**/*.test.ts", "src/generated/"] }

Examples:
  gen-docs src
  gen-docs src --ignore "**/*.test.ts" --ignore "dist/"
  gen-docs src --source-url https://github.com/user/repo/blob/main
  gen-docs src --watch
  gen-docs src --quality                                  # index.html gets an embedded Code Health section
  gen-docs src --quality --quality-reporter console        # console-only report, no site changes
  gen-docs src --quality --quality-reporter sarif --out ci # standalone SARIF file for CI (no site build)
  gen-docs src --quality --quality-profile strict
  gen-docs src --quality --data                            # also writes docs/site-data.json
  gen-docs --from-data docs/site-data.json --out docs       # fast re-render, no re-parsing/re-analysis
`);
}

function parseArgs(argv) {
    const args = {
        inputs: [], out: undefined, title: undefined,
        json: undefined, readme: undefined, watch: false,
        ignore: [], sourceUrl: undefined, configPath: undefined,
        help: false, version: false,
        quality: false, qualityReporter: undefined, qualityProfile: undefined,
        qualityConfig: undefined, qualityBaseline: undefined, qualitySaveBaseline: undefined,
        qualitySnapshot: undefined, qualityTrend: undefined,
        data: false, fromData: undefined,
    };
    let i = 0;
    while (i < argv.length) {
        const a = argv[i];
        if      (a === "--help"       || a === "-h") { args.help    = true; }
        else if (a === "--version"    || a === "-v") { args.version = true; }
        else if (a === "--watch"      || a === "-W") { args.watch   = true; }
        else if (a === "--json"       || a === "-j") { args.json    = true; }
        else if (a === "--readme"     || a === "-r") { args.readme  = true; }
        else if (a === "--quality") { args.quality = true; }
        else if (a === "--quality-reporter"      && argv[i+1]) { args.qualityReporter     = argv[++i]; }
        else if (a === "--quality-profile"       && argv[i+1]) { args.qualityProfile      = argv[++i]; }
        else if (a === "--quality-config"        && argv[i+1]) { args.qualityConfig       = argv[++i]; }
        else if (a === "--quality-baseline"      && argv[i+1]) { args.qualityBaseline     = argv[++i]; }
        else if (a === "--quality-save-baseline" && argv[i+1]) { args.qualitySaveBaseline = argv[++i]; }
        else if (a === "--quality-snapshot"      && argv[i+1]) { args.qualitySnapshot     = argv[++i]; }
        else if (a === "--quality-trend"         && argv[i+1]) { args.qualityTrend        = argv[++i]; }
        else if (a === "--data") { args.data = true; }
        else if (a === "--from-data"             && argv[i+1]) { args.fromData             = argv[++i]; }
        else if ((a === "--out"       || a === "-o") && argv[i+1]) { args.out       = argv[++i]; }
        else if ((a === "--title"     || a === "-t") && argv[i+1]) { args.title     = argv[++i]; }
        else if ((a === "--config"    || a === "-c") && argv[i+1]) { args.configPath= argv[++i]; }
        else if ((a === "--source-url"|| a === "-s") && argv[i+1]) { args.sourceUrl = argv[++i]; }
        else if ((a === "--ignore"    || a === "-I") && argv[i+1]) { args.ignore.push(argv[++i]); }
        else if (!a.startsWith("-")) args.inputs.push(a);
        i++;
    }
    return args;
}

// ---------------------------------------------------------------------------
// Quality reporting (Track C -- see docs/backlog/adr-phase-j-project-dashboard.md)
//
// Two modes:
//   1. Embedded (default, no --quality-reporter given): compute quality +
//      import-graph data and pass it into the normal doc-site build so
//      index.html gets a "Code Health" section. No extra file is written --
//      this is the mode most users want and the one gen-docs now defaults to.
//   2. Standalone (--quality-reporter <type> explicitly given): unchanged
//      from the original design -- skips the doc-site build entirely and
//      writes one report file in the requested format. Kept for CI/tooling
//      use cases (SARIF upload, JSON export, badge SVGs) where a dedicated
//      artifact, not a doc page, is what's actually needed.
// ---------------------------------------------------------------------------

/**
 * Resolves a project's own entry points (bin/main/exports) from the
 * package.json in the current working directory, if any. Used to keep
 * findOrphanFiles from flagging a project's own public entry points.
 * @returns {string[]} absolute file paths, deduplicated.
 */
function resolveEntryPoints() {
    let pkgJson;
    try {
        pkgJson = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8"));
    } catch (_) {
        return [];
    }
    const rootDir = process.cwd();
    const points = [];
    if (pkgJson.bin) {
        const binVal = typeof pkgJson.bin === "string" ? { _: pkgJson.bin } : pkgJson.bin;
        Object.values(binVal).forEach((p) => points.push(path.resolve(rootDir, p)));
    }
    if (pkgJson.main) points.push(path.resolve(rootDir, pkgJson.main));
    if (pkgJson.exports) {
        Object.values(pkgJson.exports).forEach((entry) => {
            const target = typeof entry === "string" ? entry : (entry && entry.default);
            if (target) points.push(path.resolve(rootDir, target.replace(/\.d\.ts$/, ".js")));
        });
    }
    return [...new Set(points)];
}

/**
 * Runs code-multivitals + the import-graph analysis for embedding into the
 * doc site. Applies baseline/snapshot side effects (these are meaningful
 * regardless of embedded vs. standalone mode) before returning the data
 * buildSite() needs.
 * @param {string[]} files
 * @param {object} cliArgs
 * @returns {{result: object, graph: object, orphans: string[], snapshots?: object[]}}
 */
function computeQualityEmbedData(files, cliArgs) {
    let result = quality.runQuality(files, { profile: cliArgs.qualityProfile, configPath: cliArgs.qualityConfig });

    if (cliArgs.qualityBaseline) {
        const baseline = JSON.parse(fs.readFileSync(cliArgs.qualityBaseline, "utf8"));
        result = quality.applyQualityBaseline(result, baseline);
    }
    if (cliArgs.qualitySaveBaseline) {
        fs.mkdirSync(path.dirname(path.resolve(cliArgs.qualitySaveBaseline)), { recursive: true });
        fs.writeFileSync(cliArgs.qualitySaveBaseline, JSON.stringify(result, null, 2), "utf8");
        console.log(`Wrote quality baseline: ${cliArgs.qualitySaveBaseline}`);
    }
    if (cliArgs.qualitySnapshot) {
        const snapPath = quality.saveQualitySnapshot(cliArgs.qualitySnapshot, result);
        console.log(`Saved quality snapshot: ${snapPath}`);
    }

    const graph = buildImportGraph(files);
    const orphans = findOrphanFiles(graph, resolveEntryPoints());

    // story-code-health-redesign: the embedded index-page hero panel's trend
    // sparkline reuses the same `--quality-trend <dir>` flag that already
    // powered the standalone dashboard reporter's trend view (see
    // runQualityStandalone below) -- no new CLI flag. Snapshot loading is
    // best-effort: a missing/unreadable dir just means "no trend yet", not a
    // build failure.
    let snapshots;
    if (cliArgs.qualityTrend) {
        try {
            snapshots = quality.loadQualitySnapshots(cliArgs.qualityTrend);
        } catch (err) {
            console.error(`Quality trend history unavailable (${err.message}) -- rendering without a sparkline.`);
            snapshots = [];
        }
    }

    if (result.errorCount > 0) process.exitCode = 1;
    return { result, graph, orphans, snapshots };
}

/**
 * Handles the standalone/export --quality-reporter modes (console, json,
 * sarif, badge, html, dashboard) -- entirely separate from the doc-site
 * build, same contract as the original design. Only invoked when the user
 * explicitly passes --quality-reporter; the plain `--quality` case is
 * handled by computeQualityEmbedData() + the normal build() call instead.
 * @param {string[]} files
 * @param {object} cliArgs
 * @param {string} outDir
 * @returns {boolean} true (always handles the run when called).
 */
function runQualityStandalone(files, cliArgs, outDir) {
    let result;
    try {
        result = quality.runQuality(files, { profile: cliArgs.qualityProfile, configPath: cliArgs.qualityConfig });
    } catch (err) {
        console.error(err.message);
        process.exitCode = 1;
        return true;
    }

    if (cliArgs.qualityBaseline) {
        let baseline;
        try {
            baseline = JSON.parse(fs.readFileSync(cliArgs.qualityBaseline, "utf8"));
        } catch (err) {
            console.error(`Failed to read quality baseline at ${cliArgs.qualityBaseline}: ${err.message}`);
            process.exitCode = 1;
            return true;
        }
        result = quality.applyQualityBaseline(result, baseline);
    }

    if (cliArgs.qualitySaveBaseline) {
        fs.mkdirSync(path.dirname(path.resolve(cliArgs.qualitySaveBaseline)), { recursive: true });
        fs.writeFileSync(cliArgs.qualitySaveBaseline, JSON.stringify(result, null, 2), "utf8");
        console.log(`Wrote quality baseline: ${cliArgs.qualitySaveBaseline}`);
    }

    if (cliArgs.qualitySnapshot) {
        const snapPath = quality.saveQualitySnapshot(cliArgs.qualitySnapshot, result);
        console.log(`Saved quality snapshot: ${snapPath}`);
    }

    const reporterName = cliArgs.qualityReporter;

    if (cliArgs.qualityTrend && reporterName === "dashboard") {
        const snapshots = quality.loadQualitySnapshots(cliArgs.qualityTrend);
        const trends = quality.computeQualityTrends(snapshots);
        const churnMap = quality.getQualityChurnMap(files);
        const hotspots = quality.rankQualityHotspots(trends, churnMap, 10);
        const cm = quality.loadCodeMultivitals();
        const html = cm.reportDashboard(result, snapshots, trends, hotspots);
        const outPath = path.join(outDir, "quality-dashboard.html");
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(outPath, html, "utf8");
        console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
        if (result.errorCount > 0) process.exitCode = 1;
        return true;
    }

    if (reporterName === "console") {
        quality.renderQualityReport(result, "console");
        if (result.errorCount > 0) process.exitCode = 1;
        return true;
    }

    if (reporterName === "badge") {
        fs.mkdirSync(outDir, { recursive: true });
        quality.renderQualityReport(result, "badge", { outputDir: outDir });
        console.log(`Wrote quality badges to ${path.relative(process.cwd(), outDir)}`);
        if (result.errorCount > 0) process.exitCode = 1;
        return true;
    }

    const ext = { json: "json", sarif: "sarif", html: "html", dashboard: "html" }[reporterName];
    if (!ext) {
        console.error(`Unknown --quality-reporter: ${reporterName}`);
        process.exitCode = 1;
        return true;
    }
    const output = quality.renderQualityReport(result, reporterName);
    const outPath = path.join(outDir, `quality-report.${ext}`);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, output, "utf8");
    console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
    if (result.errorCount > 0) process.exitCode = 1;
    return true;
}

function resolveTitle(titleArg) {
    if (titleArg) return titleArg;
    try { return JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8")).name || "Documentation"; }
    catch (_) { return "Documentation"; }
}

function resolveVersion() {
    try { return JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8")).version || ""; }
    catch (_) { return ""; }
}

function collectAllFiles(inputs, ignorePatterns) {
    let files = [];
    for (const input of inputs) {
        if (!fs.existsSync(input)) { console.error(`skip: path not found -- ${input}`); continue; }
        files.push(...collectFiles(input, undefined, undefined, ignorePatterns));
    }
    return [...new Set(files)];
}

// ---------------------------------------------------------------------------
// README generator
// ---------------------------------------------------------------------------

function generateReadme(modules, projectName, version, outDir) {
    let md = `# ${projectName}${version ? ` v${version}` : ""}\n\n`;
    md += `> Auto-generated API reference. ${modules.length} module(s).\n\n`;
    md += `## Table of Contents\n\n`;
    modules.forEach(mod => {
        const label = moduleLabel(mod.filePath, modules);
        const anchor = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        md += `- [${label}](#${anchor})\n`;
    });
    md += "\n---\n\n";

    modules.forEach(mod => {
        const label = moduleLabel(mod.filePath, modules);
        md += `## ${label}\n\n\`${mod.filePath}\`\n\n`;

        function row(kind, item, sig) {
            const dep  = item.deprecated != null ? " ⚠️ *deprecated*" : "";
            const snc  = item.since ? ` *(since v${item.since})*` : "";
            const desc = item.description ? ` — ${item.description}` : "";
            return `| \`${sig}\` | ${kind}${dep}${snc}${desc} |\n`;
        }

        if (mod.functions.length) {
            md += `### Functions\n\n| Signature | Description |\n|-----------|-------------|\n`;
            mod.functions.forEach(f => {
                const ps = (f.params||[]).map(p => p.name+": "+p.type).join(", ");
                md += row("function", f, `${f.name}(${ps}): ${f.returnType}`);
            });
            md += "\n";
        }
        if (mod.classes.length) {
            md += `### Classes\n\n| Name | Description |\n|------|-------------|\n`;
            mod.classes.forEach(c => md += row("class", c, c.name));
            md += "\n";
        }
        if (mod.interfaces.length) {
            md += `### Interfaces\n\n| Name | Description |\n|------|-------------|\n`;
            mod.interfaces.forEach(i => md += row("interface", i, i.name));
            md += "\n";
        }
        if (mod.typeAliases.length) {
            md += `### Types\n\n| Name | Definition |\n|------|------------|\n`;
            mod.typeAliases.forEach(t => md += `| \`${t.name}\` | \`${t.type}\`${t.description?" — "+t.description:""} |\n`);
            md += "\n";
        }
        if (mod.enums.length) {
            md += `### Enums\n\n| Name | Description |\n|------|-------------|\n`;
            mod.enums.forEach(e => md += row("enum", e, e.name));
            md += "\n";
        }
        if (mod.variables.length) {
            md += `### Variables & Constants\n\n| Name | Type | Description |\n|------|------|-------------|\n`;
            mod.variables.forEach(v => {
                const dep  = v.deprecated != null ? " ⚠️ *deprecated*" : "";
                md += `| \`${v.name}\` | \`${v.type}\` | ${dep}${v.description||""} |\n`;
            });
            md += "\n";
        }
        md += "---\n\n";
    });

    md += `*Generated by [jsdoc-scribe](https://www.npmjs.com/package/jsdoc-scribe) v${version}*\n`;
    const dest = path.join(outDir, "README.md");
    fs.writeFileSync(dest, md, "utf8");
    return dest;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

/**
 * story-doc-version-switcher: extracts the version-id out of a
 * `site-data-history/site-data-<id>.json` filename. Pure string-parse of
 * the ISO-timestamp (dashes standing in for colons/dot) `writeSiteData()`
 * (lib/site-data.js) already generates -- no new convention invented, and
 * this never needs to change if that convention doesn't.
 * @param {string} historyFilePath - a `site-data-history/*.json` path or bare filename.
 * @returns {string} the version-id (e.g. "2026-07-01T14-22-03-123Z", or with
 *   a "-1"-style collision suffix in the rare case two writes landed in the
 *   same millisecond).
 */
function deriveVersionId(historyFilePath) {
    const base = path.basename(historyFilePath, ".json");
    return base.replace(/^site-data-/, "");
}

/**
 * story-doc-version-switcher: lists existing `site-versions/<id>/`
 * directories, most-recent-first. Version-ids are fixed-width ISO-timestamp
 * strings (dashes for colons/dot), so a plain reverse lexical sort is
 * chronological too, without needing to re-parse each into a Date here --
 * `lib/renderer.js`'s `buildVersionSwitcher()`/`formatVersionLabel()` does
 * that parsing purely for display, this function only enumerates ids.
 * @param {string} outDir
 * @returns {string[]}
 */
function listVersionSnapshots(outDir) {
    const dir = path.join(outDir, "site-versions");
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .filter((name) => { try { return fs.statSync(path.join(dir, name)).isDirectory(); } catch (_) { return false; } })
        .sort()
        .reverse();
}

/**
 * story-doc-version-switcher (TICKET-2): renders ONE historical
 * `site-data-*.json` into its own `<outDir>/site-versions/<versionId>/`
 * snapshot -- a complete, self-contained copy of the site as it looked at
 * that generation (requirement 2/5). Reuses `writeSite()` verbatim (no new
 * render path): `versionOpts` tells that call this is a snapshot render,
 * not the live/main run, so it skips re-writing its own site-data.json/
 * history/backfill (that would recurse and pollute every historical
 * snapshot with a nested copy of the data layer, which isn't part of "a
 * complete copy of the site" per requirement 2's own listed contents --
 * index.html/modules/assets/health-detail pages, not docs.json/README/
 * site-data.json). `docs.json`/`README.md` are likewise switched off for
 * snapshot renders for the same reason -- kept minimal and focused on the
 * browsable site itself, not duplicated once per historical generation.
 * @param {string} dataPath - the `site-data-*.json` file to render.
 * @param {string} outDir - the LIVE output root (site-versions/ is created under this).
 * @param {string} versionId
 * @param {object} opts
 * @param {string[]} versions - full version-id list (for that snapshot's own switcher).
 * @param {boolean} silent
 * @returns {boolean} true if rendered, false if the source JSON couldn't be read.
 */
function renderVersionSnapshot(dataPath, outDir, versionId, opts, versions, silent) {
    let data;
    try {
        data = siteData.loadSiteData(dataPath);
    } catch (err) {
        console.error(`  skipping version snapshot ${versionId} (${dataPath}): ${err.message}`);
        return false;
    }
    const snapshotOutDir = path.join(outDir, "site-versions", versionId);
    const snapshotOpts = Object.assign({}, opts, { json: false, readme: false, data: false });
    writeSite(data.modules, snapshotOutDir, data.projectName, data.version, snapshotOpts, true, data.quality || null, {
        isSnapshot: true, currentVersionId: versionId, versions: versions,
    });
    if (!silent) console.log(`  wrote site-versions/${versionId}/ (snapshot)`);
    return true;
}

/**
 * story-doc-version-switcher (TICKET-3): render-only-missing backfill.
 * `site-data-history/*.json` entries are immutable once moved there (Phase
 * L Decision 5) -- once a version-id's snapshot exists, re-rendering it has
 * zero correctness benefit and is pure wasted cost at realistic history
 * depth (solutions-architect's estimate: O(1) per run after a one-time
 * backfill, see the story's architect sign-off). `fs.existsSync` on the
 * target directory is the entire "already rendered" check.
 * @param {string} outDir
 * @param {object} opts
 * @param {boolean} silent
 */
function renderMissingVersionSnapshots(outDir, opts, silent) {
    const histDir = siteData.historyDirFor(path.join(outDir, "site-data.json"));
    if (!fs.existsSync(histDir)) return;
    // Bug caught during live verification: this must be the full set of
    // version-ids implied by EVERY history file, not just `listVersionSnapshots()`
    // (which only reflects site-versions/ dirs that already exist on disk). Using
    // the disk-only list meant a snapshot being rendered for the first time in
    // this very pass never saw its OWN id in the list passed to its switcher --
    // its own page couldn't show itself as the current selection. All history
    // files always end up with a snapshot dir (either already present, or about
    // to be created below), so deriving the list from history files themselves
    // is the correct set for every snapshot rendered in this pass.
    const versions = fs.readdirSync(histDir)
        .filter((f) => f.endsWith(".json"))
        .map(deriveVersionId)
        .sort()
        .reverse();
    fs.readdirSync(histDir)
        .filter((f) => f.endsWith(".json"))
        .forEach((f) => {
            const versionId = deriveVersionId(f);
            const snapshotDir = path.join(outDir, "site-versions", versionId);
            if (fs.existsSync(snapshotDir)) return; // render-only-missing
            renderVersionSnapshot(path.join(histDir, f), outDir, versionId, opts, versions, silent);
        });
}

/**
 * Writes the full site (+ optional docs.json / README.md / site-data.json)
 * from an already-in-hand `modules` array. Split out from `build()` so
 * `--from-data` (story-file-detail-redesign) can reuse this exact same
 * write path without re-parsing source files -- `modules` there comes from
 * a saved site-data.json instead of `extractModule()`.
 * @param {object[]} modules
 * @param {string} outDir
 * @param {string} projectName
 * @param {string} projectVersion
 * @param {object} opts
 * @param {boolean} silent
 * @param {object|null} qualityData
 * @param {{isSnapshot: boolean, currentVersionId: string, versions: string[]}|null} versionOpts -
 *   story-doc-version-switcher: set by `renderVersionSnapshot()` when this call is
 *   rendering ONE historical snapshot rather than the live/main site. `null`/omitted
 *   means "this is the live/main run" -- compute everything fresh below.
 * @returns {number} pages written.
 */
function writeSite(modules, outDir, projectName, projectVersion, opts, silent, qualityData, versionOpts) {
    let switcherVersions = [];
    let currentVersionId = null;
    let isSnapshot = false;

    if (versionOpts) {
        // Rendering one historical snapshot (via renderVersionSnapshot() above) --
        // reuse the caller-computed version list; never re-trigger this snapshot's
        // own site-data.json/history/backfill (snapshotOpts already forces
        // opts.data=false for this nested call, see renderVersionSnapshot()).
        switcherVersions = versionOpts.versions || [];
        currentVersionId = versionOpts.currentVersionId || null;
        isSnapshot = true;
    } else if (opts.data) {
        // Live/main run with --data: evict the prior site-data.json to history FIRST
        // (siteData.writeSiteData() -- unchanged mechanism, per this story's own
        // constraint), so THIS run's own live pages' switcher already reflects that
        // eviction, then backfill any site-versions/ snapshots still missing for
        // history entries (including the one just evicted).
        //
        // Deliberate deviation from the architect's Decision 3, disclosed: Decision 3
        // also called for pre-rendering a site-versions/<id>/ copy of the CURRENT
        // generation "so it can later be listed and browsed once superseded." That
        // doesn't hold up against `writeSiteData()`'s actual (unchanged) rename-at-
        // EVICTION-time timestamp (`new Date().toISOString()` captured on some FUTURE
        // run, not this one) -- a version-id derived now from this run's own
        // `generatedAt` would NOT match the version-id `deriveVersionId()` computes
        // later from the real history filename, producing an orphaned duplicate
        // directory under the wrong id. Not implemented for that reason. The live
        // `outDir` root already always represents "Current" (requirement 3,
        // unchanged); once a generation is genuinely superseded, the NEXT run's
        // backfill scan renders it under its one true, stable version-id -- fully
        // satisfying "listed and browsable once superseded" without the mismatch.
        const dataPath = path.join(outDir, "site-data.json");
        const payload = siteData.buildSiteData(modules, qualityData || null, {
            projectName, version: projectVersion, sourceUrl: opts.sourceUrl,
        });
        const written = siteData.writeSiteData(dataPath, payload);
        if (!silent) {
            console.log(`  wrote ${path.relative(process.cwd(), written.path)}`);
            if (written.preserved) console.log(`  preserved prior generation: ${path.relative(process.cwd(), written.preserved)}`);
        }
        renderMissingVersionSnapshots(outDir, opts, silent);
        switcherVersions = listVersionSnapshots(outDir);
    }

    const pages = buildSite(modules, {
        projectName,
        version: projectVersion,
        sourceUrl: opts.sourceUrl,
        quality: qualityData || null,
        versions: switcherVersions,
        currentVersionId: currentVersionId,
        isSnapshot: isSnapshot,
        // task-arch-04 / ADR Decision 6: never surface facts on a historical
        // snapshot render -- versionOpts is only set by renderVersionSnapshot().
        facts: versionOpts ? null : (opts.facts || null),
    });
    fs.mkdirSync(path.join(outDir, "modules"), { recursive: true });

    for (const p of pages) {
        const dest = path.join(outDir, p.path);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, p.html, "utf8");
        if (!silent) console.log(`  wrote ${path.relative(process.cwd(), dest)}`);
    }

    if (opts.json) {
        const jsonOut = path.join(outDir, "docs.json");
        const payload = {
            version: projectVersion, title: projectName,
            generatedAt: new Date().toISOString(),
            modules: modules.map(m => ({
                filePath: m.filePath,
                functions: m.functions, classes: m.classes,
                interfaces: m.interfaces, typeAliases: m.typeAliases,
                enums: m.enums, variables: m.variables,
            })),
        };
        fs.writeFileSync(jsonOut, JSON.stringify(payload, null, 2), "utf8");
        if (!silent) console.log(`  wrote ${path.relative(process.cwd(), jsonOut)}`);
    }

    if (opts.readme) {
        const dest = generateReadme(modules, projectName, projectVersion, outDir);
        if (!silent) console.log(`  wrote ${path.relative(process.cwd(), dest)}`);
    }

    return pages.length;
}

function build(files, outDir, projectName, projectVersion, opts, silent, qualityData) {
    const modules = [];
    for (const file of files) {
        try { modules.push(extractModule(file)); }
        catch (err) { console.error(`  ${file} -> FAILED: ${err.message}`); }
    }
    return writeSite(modules, outDir, projectName, projectVersion, opts, silent, qualityData);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    const argv = process.argv.slice(2);
    const cliArgs = parseArgs(argv);

    if (cliArgs.version) { console.log(pkg.version); return; }
    // --from-data legitimately has zero positional inputs (story-file-detail-redesign)
    // -- it reads a previously-written site-data.json instead of source files.
    if (cliArgs.help || (cliArgs.inputs.length === 0 && !cliArgs.fromData)) {
        printHelp();
        process.exitCode = cliArgs.inputs.length === 0 && !cliArgs.help && !cliArgs.fromData ? 1 : 0;
        return;
    }

    // Load config file and merge with CLI (CLI wins)
    const fileConfig = loadConfig(cliArgs.configPath);
    const opts = mergeConfig(fileConfig, cliArgs);
    opts.data = !!cliArgs.data; // one-off generation flag, not a persisted config-file option

    const outDir        = path.resolve(opts.out || "docs");
    const projectName   = resolveTitle(opts.title);
    const projectVersion = resolveVersion();

    // task-arch-04: computed once per live/main run (ADR Decision 6). Never
    // persisted to opts (config file), same "one-off flag" pattern as
    // opts.data above. writeSite() is the single place that decides whether
    // to actually use it -- it forces facts to null for a historical
    // site-versions/ snapshot render (versionOpts set) regardless of this
    // value, so no exclusion logic is needed here.
    opts.facts = getAllFacts(process.cwd());

    // --from-data: fast path -- skip collectAllFiles()/extractModule()/
    // runQuality()/buildImportGraph() entirely, load a previously-written
    // site-data.json instead (ADR Decision 4/5). Mutually exercised
    // independently of --quality/--data below; a caller can still pass
    // --data alongside --from-data to re-emit (and history-preserve)
    // site-data.json from the loaded content, e.g. after hand-editing it.
    if (cliArgs.fromData) {
        let data;
        try {
            data = siteData.loadSiteData(path.resolve(cliArgs.fromData));
        } catch (err) {
            console.error(err.message);
            process.exitCode = 1;
            return;
        }
        const dataProjectName = opts.title ? projectName : (data.projectName || projectName);
        const dataVersion = data.version || projectVersion;
        const n = writeSite(data.modules, outDir, dataProjectName, dataVersion, opts, false, data.quality || null);
        console.log(`\nDone (from ${path.relative(process.cwd(), path.resolve(cliArgs.fromData))}). ${n} page(s) written to ${path.relative(process.cwd(), outDir) || outDir}`);
        console.log(`Open ${path.join(path.relative(process.cwd(), outDir) || outDir, "index.html")} in a browser.`);
        return;
    }

    const files = collectAllFiles(cliArgs.inputs, opts.ignore);
    if (files.length === 0) { console.log("No matching .js/.jsx/.ts/.tsx files found."); return; }

    const extras = [opts.json && "docs.json", opts.readme && "README.md", opts.data && "site-data.json"].filter(Boolean);
    const extraStr = extras.length ? " + " + extras.join(" + ") : "";

    // --quality: default (no --quality-reporter) embeds a Code Health section
    // into the normal doc-site build below -- no extra file, no skipped
    // build. --quality-reporter <type> explicitly opts into the old
    // standalone-file behavior instead (CI/export use cases), which DOES
    // skip the doc-site build, same as before.
    let qualityEmbedData = null;
    if (cliArgs.quality) {
        if (cliArgs.qualityReporter) {
            if (runQualityStandalone(files, cliArgs, outDir)) return;
        } else {
            try {
                qualityEmbedData = computeQualityEmbedData(files, cliArgs);
            } catch (err) {
                console.error(err.message);
                process.exitCode = 1;
                return;
            }
        }
    }

    if (!cliArgs.watch) {
        console.log(`Extracting ${files.length} file(s)...`);
        if (opts.ignore.length) console.log(`  ignoring: ${opts.ignore.join(", ")}`);
        const n = build(files, outDir, projectName, projectVersion, opts, false, qualityEmbedData);
        console.log(`\nDone. ${n} page(s)${extraStr} written to ${path.relative(process.cwd(), outDir) || outDir}`);
        if (qualityEmbedData) {
            const r = qualityEmbedData.result;
            console.log(`  code health: avg score ${r.averageHealthScore}, avg MI ${r.averageMI}, ${r.errorCount} error(s), ${r.warnCount} warning(s) -- see index.html#code-health`);
        }
        console.log(`Open ${path.join(path.relative(process.cwd(), outDir) || outDir, "index.html")} in a browser.`);
        return;
    }

    // ── Watch mode ───────────────────────────────────────────────
    function stamp() { return new Date().toLocaleTimeString(); }
    console.log(`[watch] Watching ${files.length} file(s). Output: ${path.relative(process.cwd(), outDir) || outDir}`);
    if (opts.ignore.length) console.log(`[watch] ignoring: ${opts.ignore.join(", ")}`);
    console.log(`[watch] Press Ctrl+C to stop.\n`);

    try {
        const n = build(files, outDir, projectName, projectVersion, opts, true, qualityEmbedData);
        console.log(`[${stamp()}] Built ${n} page(s)${extraStr}`);
    } catch (err) { console.error(`[${stamp()}] Build failed: ${err.message}`); }

    let timer = null;
    function scheduleBuild() {
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
            timer = null;
            try {
                const freshFiles = collectAllFiles(cliArgs.inputs, opts.ignore);
                let freshQualityData = null;
                if (cliArgs.quality && !cliArgs.qualityReporter) {
                    try { freshQualityData = computeQualityEmbedData(freshFiles, cliArgs); }
                    catch (err) { console.error(`[${stamp()}] Quality analysis failed: ${err.message}`); }
                }
                const n = build(freshFiles, outDir, projectName, projectVersion, opts, true, freshQualityData);
                console.log(`[${stamp()}] Rebuilt ${n} page(s)${extraStr}`);
            } catch (err) { console.error(`[${stamp()}] Rebuild failed: ${err.message}`); }
        }, 150);
    }

    const watched = new Set();
    for (const input of cliArgs.inputs) {
        if (!fs.existsSync(input)) continue;
        const absInput = path.resolve(input);
        if (watched.has(absInput)) continue;
        watched.add(absInput);
        fs.watch(absInput, { recursive: true }, function (event, filename) {
            if (!filename) return;
            const ext = path.extname(filename).toLowerCase();
            if (![".js", ".jsx", ".ts", ".tsx"].includes(ext)) return;
            if (/\.commented\.[jt]sx?$/.test(filename)) return;
            console.log(`[${stamp()}] Changed: ${filename}`);
            scheduleBuild();
        });
    }
}

main();
