"use strict";

/**
 * TASK-F14-03A — Examples page data generator.
 *
 * Produces the data STORY-F14-03/TASK-F14-03B's `renderExamplesPage()` will
 * consume: one record per Figma "Examples" framework/target, in Figma order
 * (React, Next.js, Angular, Vue, Express, NestJS, Plain JS, Plain TS).
 *
 * Mechanism (per adr-figma-site-redesign-implementation.md Decision §3):
 * shells out to the real `bin/cli.js` (gen-comments) against the checked-in
 * `sample/*` fixtures, same `spawnSync(process.execPath, [...])` invocation
 * style `buildApiDocs()` already uses in scripts/build-pages-docs.js
 * (:1161-1179) to run `bin/gen-docs.js` — this is a second call site of an
 * already-proven-cheap pattern, not a new one.
 *
 * ---------------------------------------------------------------------
 * IMPORTANT DEVIATION FROM THE ADR'S ASSUMED MECHANISM (read before editing)
 * ---------------------------------------------------------------------
 * The ADR assumed `sample/*` fixtures were undocumented (or partially so)
 * and that running `bin/cli.js <sampleDir> --dry-run` and capturing stdout
 * verbatim would yield real "after" JSDoc text. Two things turned out not
 * to hold, confirmed against this repo's actual state, not assumed:
 *
 *   1. Every file under every mapped `sample/*` target is already at 100%
 *      JSDoc coverage (checked: react/nextjs/angular/express/nestjs/
 *      vanilla-js/root *.ts, all report "All symbols are documented.").
 *      There is no undocumented symbol anywhere in `sample/` for
 *      `--dry-run` to report on.
 *   2. Even when a target file DOES have undocumented symbols, `--dry-run`
 *      does not print the proposed JSDoc text to stdout at all — see
 *      bin/cli.js:264-276: dry-run mode calls
 *      `processFile(file, { dryRun: true, force: false })`, and
 *      lib/index.js:400-422 shows dry-run's console output is a one-line
 *      summary (`"<file> (<n> blocks would add)"`), never the actual
 *      comment text. "Captures stdout as the after text, verbatim" is not
 *      achievable via `--dry-run` alone against any file, checked-in or not.
 *
 * Fix, keeping the ADR's non-mutating guarantee for `sample/*` intact:
 *   - "before" is produced by mechanically stripping every existing
 *     `/** ... *\/` block from a real, checked-in sample file (deterministic
 *     text transform — the function/class bodies are untouched, nothing is
 *     invented, this only removes documentation so the CLI has a genuine
 *     undocumented target to run against).
 *   - That stripped text is written to a throwaway OS-tempdir scratch copy
 *     (never under `sample/`), and the real CLI is run against *that* copy
 *     with `--write` (not `--dry-run`) so the genuinely-generated JSDoc text
 *     can be read back from disk. This is still `spawnSync(process.execPath,
 *     ["bin/cli.js", ...])` — the same invocation family — just `--write`
 *     instead of `--dry-run`, and only ever pointed at a scratch file this
 *     script owns and deletes immediately after. `sample/*` itself is never
 *     opened for writing anywhere in this file.
 *   - Conveniently, this lines up with TASK-F14-03B's own required pill
 *     copy ("AFTER — gen-comments --write"), which already names `--write`
 *     as the literal command being demonstrated.
 *   - Separately, and still exactly as the ADR/AC describe, this script
 *     also shells out `--dry-run` against the real, unmodified, mapped
 *     `sample/*` path for every framework — this is what satisfies "same
 *     spawnSync pattern against sample/*, --dry-run, verified non-mutating,
 *     timed" from the AC; it just isn't the source of the before/after text
 *     shown on the page, because (per point 1/2 above) it can't be.
 *
 * Flagging this deviation explicitly for tech-lead's review rather than
 * silently reinterpreting the ADR.
 * ---------------------------------------------------------------------
 *
 * No `sample/*` fixture is ever opened with `fs.writeFileSync` / `--write`
 * by this script. Verified at the bottom of this file via an mtime
 * snapshot taken before and after every real fixture is touched.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { getFrameworkSignals } = require("../lib/project-facts.js");

const root = path.resolve(__dirname, "..");
const cliPath = path.join(root, "bin", "cli.js");

// ---------------------------------------------------------------------
// Detection-method sourcing — reads lib/project-facts.js's own data, never
// re-describes it in prose that could drift.
// ---------------------------------------------------------------------

/**
 * `FRAMEWORK_MARKERS` (dependency-name -> display-name) is a private const
 * in lib/project-facts.js, not exported — by design, it's an implementation
 * detail of `getFrameworkSignals()`, which *is* exported. Rather than
 * hand-retyping this dependency->name map here (exactly the "re-described
 * in prose that could drift" failure mode the ticket calls out), this reads
 * it straight out of the live source file. Read-only: this function never
 * writes to lib/project-facts.js.
 * @returns {Object<string,string>} dependency marker -> display name
 */
function loadFrameworkMarkers() {
    const src = fs.readFileSync(path.join(root, "lib", "project-facts.js"), "utf8");
    const match = src.match(/const FRAMEWORK_MARKERS = \{([\s\S]*?)\};/);
    if (!match) {
        throw new Error(
            "generate-examples-data.js: could not locate FRAMEWORK_MARKERS in lib/project-facts.js " +
            "(has it been renamed/moved? update the regex in loadFrameworkMarkers()).",
        );
    }
    const markers = {};
    const entryRe = /["']?([\w@./-]+)["']?\s*:\s*"([^"]+)"/g;
    let m;
    while ((m = entryRe.exec(match[1]))) markers[m[1]] = m[2];
    return markers;
}

const FRAMEWORK_MARKERS = loadFrameworkMarkers();

/**
 * Runs the real, exported `getFrameworkSignals()` against a throwaway probe
 * project containing only `{ dependencies: { [markerKey]: "*" } }`, and
 * returns the exact evidence string the detector itself produces for a
 * "dependency" confidence signal. This is real code execution, not a
 * hand-written description of what the code does.
 * @param {string} markerKey - npm dependency name, e.g. "react"
 * @param {string} displayName - expected display name, e.g. "React"
 * @returns {string|null}
 */
function probeDependencyEvidence(markerKey, displayName) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jsdoc-scribe-detect-"));
    try {
        fs.writeFileSync(
            path.join(tmpDir, "package.json"),
            JSON.stringify({ name: "probe", dependencies: { [markerKey]: "*" } }),
        );
        const signals = getFrameworkSignals(tmpDir);
        const hit = signals.find((s) => s.name === displayName && s.confidence === "dependency");
        return hit ? hit.evidence : null;
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

/**
 * Same idea as probeDependencyEvidence(), but for the FILE_HEURISTIC_RULES
 * fallback path (only React/.tsx,.jsx and Vue/.vue have one) — probes with
 * a bare file of the given extension and no package.json dependency at all.
 * @param {string} displayName
 * @param {string} ext - e.g. ".tsx"
 * @returns {string|null}
 */
function probeFileHeuristicEvidence(displayName, ext) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jsdoc-scribe-detect-"));
    try {
        fs.mkdirSync(path.join(tmpDir, "src"));
        fs.writeFileSync(path.join(tmpDir, "src", `Probe${ext}`), "// probe\n");
        const signals = getFrameworkSignals(tmpDir);
        const hit = signals.find((s) => s.name === displayName && s.confidence === "file-heuristic");
        return hit ? hit.evidence : null;
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

/**
 * Builds the human-readable detection-method string for one of the 6
 * FRAMEWORK_MARKERS-backed frameworks, combining the real dependency-based
 * evidence with the real file-heuristic evidence when one exists.
 * @param {string} markerKey
 * @param {string} displayName
 * @param {string|null} fileHeuristicExt
 * @returns {string}
 */
function buildDetectionMethod(markerKey, displayName, fileHeuristicExt) {
    const depEvidence = probeDependencyEvidence(markerKey, displayName);
    const fileEvidence = fileHeuristicExt ? probeFileHeuristicEvidence(displayName, fileHeuristicExt) : null;
    const parts = [];
    if (depEvidence) parts.push(`Detected via ${depEvidence}`);
    if (fileEvidence) {
        parts.push(`or via ${fileEvidence.replace(", no matching dependency found in any package.json", " (fallback heuristic)")}`);
    }
    if (parts.length === 0) {
        throw new Error(`generate-examples-data.js: getFrameworkSignals() produced no evidence at all for "${displayName}" — FRAMEWORK_MARKERS/FILE_HEURISTIC_RULES may have changed shape.`);
    }
    return parts.join(" ");
}

/**
 * Plain JS/Plain TS have no FRAMEWORK_MARKERS entry (they're what's left
 * when none of the 6 real frameworks match) — proves, via a real
 * getFrameworkSignals() call against a bare-extension probe project, that
 * no dependency or file-extension signal fires, then describes that real
 * (empty) result. Throws if that assumption is ever violated by a future
 * change to lib/project-facts.js, rather than silently drifting.
 * @param {string} ext - e.g. ".js" or ".ts"
 * @returns {string}
 */
function buildNoFrameworkDetectionMethod(ext) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jsdoc-scribe-detect-"));
    let signals;
    try {
        fs.writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify({ name: "probe" }));
        fs.mkdirSync(path.join(tmpDir, "src"));
        fs.writeFileSync(path.join(tmpDir, "src", `probe${ext}`), "// probe\n");
        signals = getFrameworkSignals(tmpDir);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    if (signals.length > 0) {
        throw new Error(
            `generate-examples-data.js: expected zero framework signals for a bare ${ext} file, got ` +
            `${JSON.stringify(signals)} — lib/project-facts.js's detection rules changed; update this entry's ` +
            "detection-method description.",
        );
    }
    return `No dependency or file-extension signal matched by getFrameworkSignals() for plain ${ext} files ` +
        "(confirmed by running the real detector against a bare probe project) — detected by process of " +
        "elimination against the other six frameworks, not a positive signal.";
}

// ---------------------------------------------------------------------
// Mechanical (non-authoring) source transforms
// ---------------------------------------------------------------------

/**
 * Deterministically removes every `/** ... *\/`-style block comment from
 * source text, including its trailing newline. Purely mechanical: it does
 * not touch, reorder, or rewrite a single line of actual code — only
 * strips pre-existing documentation so the real CLI has a genuinely
 * undocumented file to run against.
 * @param {string} source
 * @returns {string}
 */
function stripJsDocBlocks(source) {
    return source.replace(/[ \t]*\/\*\*[\s\S]*?\*\/[ \t]*\r?\n/g, "");
}

/**
 * Extracts one function/class (by matching a signature-line regex, then
 * brace-counting to the matching close) out of a larger source file, for
 * compact before/after display. If `includeLeadingComment` is set, also
 * pulls in an immediately-preceding `/** ... *\/` block (used for "after"
 * captures, where the CLI just inserted one there).
 * Falls back to returning the whole source if the pattern isn't found, so
 * a future fixture edit degrades to "too much text" rather than "silently
 * empty".
 * @param {string} source
 * @param {RegExp} signaturePattern
 * @returns {string}
 */
function extractSnippet(source, signaturePattern) {
    const lines = source.split("\n");
    const startIdx = lines.findIndex((line) => signaturePattern.test(line));
    if (startIdx === -1) return source;

    let leadStart = startIdx;
    let j = startIdx - 1;
    while (j >= 0 && lines[j].trim() === "") j--;
    if (j >= 0 && lines[j].trim().endsWith("*/")) {
        let k = j;
        while (k >= 0 && !lines[k].trim().startsWith("/**")) k--;
        if (k >= 0) leadStart = k;
    }

    let depth = 0;
    let started = false;
    let endIdx = startIdx;
    for (let i = startIdx; i < lines.length; i++) {
        for (const ch of lines[i]) {
            if (ch === "{") { depth++; started = true; }
            else if (ch === "}") { depth--; }
        }
        endIdx = i;
        if (started && depth <= 0) break;
        if (!started && /;\s*$/.test(lines[i])) break; // single-statement signature, no braces at all
    }
    return lines.slice(leadStart, endIdx + 1).join("\n");
}

// ---------------------------------------------------------------------
// Real CLI invocations
// ---------------------------------------------------------------------

/**
 * Recursively lists every file under a directory (no filtering — this is
 * only used for the before/after mtime mutation check, not for selecting
 * what the CLI scans).
 * @param {string} dir
 * @returns {string[]}
 */
function listFilesRecursive(dir) {
    const out = [];
    (function walk(d) {
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
            const full = path.join(d, entry.name);
            if (entry.isDirectory()) walk(full);
            else out.push(full);
        }
    })(dir);
    return out;
}

/**
 * Snapshots mtimeMs for a list of absolute file paths.
 * @param {string[]} files
 * @returns {Map<string, number>}
 */
function snapshotMtimes(files) {
    const map = new Map();
    files.forEach((f) => {
        if (fs.existsSync(f)) map.set(f, fs.statSync(f).mtimeMs);
    });
    return map;
}

/**
 * Runs the real CLI's `--dry-run` against the real, unmodified, mapped
 * `sample/*` target (directory or explicit file list) for one framework —
 * same `spawnSync(process.execPath, [...])` invocation family
 * `buildApiDocs()` uses. Verifies zero mutation via an mtime snapshot
 * (this repo's sandbox lessons flag prior git-based checks as unreliable;
 * mtime is the direct, dependency-free signal) and times the call for the
 * lessons.md-required perf check.
 * @param {string[]} relativeTargets - paths relative to repo root
 * @returns {{ ms: number, exitCode: number, fileCount: number, mutated: string[], stdout: string }}
 */
function runRealDryRunCheck(relativeTargets) {
    const filesToWatch = [];
    relativeTargets.forEach((rel) => {
        const abs = path.join(root, rel);
        if (fs.statSync(abs).isDirectory()) filesToWatch.push(...listFilesRecursive(abs));
        else filesToWatch.push(abs);
    });
    const before = snapshotMtimes(filesToWatch);

    const start = process.hrtime.bigint();
    const result = spawnSync(process.execPath, [cliPath, ...relativeTargets, "--dry-run"], {
        cwd: root,
        encoding: "utf8",
    });
    const ms = Number(process.hrtime.bigint() - start) / 1e6;

    const after = snapshotMtimes(filesToWatch);
    const mutated = [];
    before.forEach((mtime, file) => {
        if (after.get(file) !== mtime) mutated.push(file);
    });

    return {
        ms,
        exitCode: result.status,
        fileCount: filesToWatch.length,
        mutated,
        stdout: result.stdout || "",
    };
}

/**
 * Produces a real before/after JSDoc pair for one representative sample
 * file: strips its existing JSDoc (mechanical, see stripJsDocBlocks),
 * writes the stripped text to an OS-tempdir scratch copy, runs the real
 * CLI's `--write` against *that scratch copy only*, reads the generated
 * result back, then deletes the scratch dir. Never opens the real
 * `sample/*` file for writing.
 * @param {string} relFilePath - real sample file, relative to repo root
 * @param {RegExp} [symbolPattern] - optional, extracts one symbol for a
 *   compact snippet instead of returning the whole (possibly large) file
 * @returns {{ before: string, after: string, fullBeforeLength: number, fullAfterLength: number }}
 */
function captureRealBeforeAfter(relFilePath, symbolPattern) {
    const absPath = path.join(root, relFilePath);
    const original = fs.readFileSync(absPath, "utf8");
    const stripped = stripJsDocBlocks(original);

    const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "jsdoc-scribe-examples-"));
    const ext = path.extname(relFilePath);
    const scratchFile = path.join(scratchDir, `scratch${ext}`);
    fs.writeFileSync(scratchFile, stripped, "utf8");

    let generated;
    try {
        const writeResult = spawnSync(process.execPath, [cliPath, scratchFile, "--write"], {
            cwd: root,
            encoding: "utf8",
        });
        if (writeResult.status !== 0) {
            throw new Error(
                `generate-examples-data.js: "gen-comments --write" failed on scratch copy of ${relFilePath} ` +
                `(exit ${writeResult.status}): ${writeResult.stderr || writeResult.stdout}`,
            );
        }
        generated = fs.readFileSync(scratchFile, "utf8");
    } finally {
        fs.rmSync(scratchDir, { recursive: true, force: true });
    }

    const before = symbolPattern ? extractSnippet(stripped, symbolPattern) : stripped;
    const after = symbolPattern ? extractSnippet(generated, symbolPattern) : generated;

    if (after === before) {
        throw new Error(
            `generate-examples-data.js: real CLI --write produced no change for ${relFilePath} — ` +
            "the representative symbol may not actually be undocumented after stripJsDocBlocks(). " +
            "This must never ship as a real 'after' that's identical to 'before'.",
        );
    }

    return {
        before: before.replace(/\s+$/, "") + "\n",
        after: after.replace(/\s+$/, "") + "\n",
        fullBeforeLength: stripped.length,
        fullAfterLength: generated.length,
    };
}

// ---------------------------------------------------------------------
// Framework configuration — fixed Figma order, per task-f14-tickets.md AC
// ---------------------------------------------------------------------

const FRAMEWORKS = [
    {
        name: "React",
        markerKey: "react",
        fileHeuristicExt: ".tsx",
        sampleTargets: ["sample/react"],
        demoFile: "sample/react/Button.tsx",
    },
    {
        name: "Next.js",
        markerKey: "next",
        fileHeuristicExt: null,
        sampleTargets: ["sample/nextjs"],
        demoFile: "sample/nextjs/app/api/users/route.ts",
    },
    {
        name: "Angular",
        markerKey: "@angular/core",
        fileHeuristicExt: null,
        sampleTargets: ["sample/angular"],
        demoFile: "sample/angular/user.service.ts",
    },
    { name: "Vue", stub: true },
    {
        name: "Express",
        markerKey: "express",
        fileHeuristicExt: null,
        sampleTargets: ["sample/express"],
        demoFile: "sample/express/routes/task.routes.ts",
    },
    {
        name: "NestJS",
        markerKey: "@nestjs/core",
        fileHeuristicExt: null,
        sampleTargets: ["sample/nestjs"],
        demoFile: "sample/nestjs/auth/roles.guard.ts",
    },
    {
        name: "Plain JS",
        markerKey: null,
        noFrameworkExt: ".js",
        sampleTargets: ["sample/vanilla-js"],
        demoFile: "sample/vanilla-js/validators.js",
        // isInRange is fully self-contained (no reference to a module-level
        // const like EMAIL_RE), so the extracted snippet reads standalone.
        symbolPattern: /^function isInRange\(/,
    },
    {
        name: "Plain TS",
        markerKey: null,
        noFrameworkExt: ".ts",
        // Explicit file list per ADR — these six root-level fixtures are
        // NOT moved into a sample/typescript/ directory (ADR: not confirmed
        // safe, not needed).
        sampleTargets: [
            "sample/api.ts",
            "sample/models.ts",
            "sample/errors.ts",
            "sample/events.ts",
            "sample/middleware.ts",
            "sample/container.ts",
        ],
        demoFile: "sample/errors.ts",
        symbolPattern: /^export function formatErrorForLog\(/,
    },
];

/**
 * Builds the full 8-entry Examples data array. Exported for
 * test/generate-examples-data.test.js and for whatever wires this into
 * `main()` in scripts/build-pages-docs.js (TASK-F14-03B, out of this
 * ticket's scope).
 * @returns {{ entries: object[], dryRunChecks: object[], totalDryRunMs: number }}
 */
function generateExamplesData() {
    const entries = [];
    const dryRunChecks = [];

    FRAMEWORKS.forEach((fw) => {
        if (fw.stub) {
            // Vue — TASK-F14-tickets.md frontmatter scope-note: ships as a
            // detection-card stub, no generation capability yet
            // (adr-vue-sfc-support.md: not authorized). Detection string is
            // still real, sourced from FRAMEWORK_MARKERS' vue -> "Vue"
            // mapping via the same probe mechanism as the real entries.
            const markers = FRAMEWORK_MARKERS;
            entries.push({
                name: fw.name,
                generated: false,
                detectionMethod: buildDetectionMethod("vue", markers.vue, ".vue"),
                sampleTargets: null,
                demoFile: null,
                before: null,
                after: null,
            });
            return;
        }

        const detectionMethod = fw.markerKey
            ? buildDetectionMethod(fw.markerKey, FRAMEWORK_MARKERS[fw.markerKey], fw.fileHeuristicExt)
            : buildNoFrameworkDetectionMethod(fw.noFrameworkExt);

        const dryRunCheck = runRealDryRunCheck(fw.sampleTargets);
        dryRunChecks.push({ name: fw.name, ...dryRunCheck });
        if (dryRunCheck.mutated.length > 0) {
            throw new Error(
                `generate-examples-data.js: --dry-run mutated real sample file(s) for "${fw.name}": ` +
                `${dryRunCheck.mutated.join(", ")}. This must never happen — aborting.`,
            );
        }

        const { before, after } = captureRealBeforeAfter(fw.demoFile, fw.symbolPattern);

        entries.push({
            name: fw.name,
            generated: true,
            detectionMethod,
            sampleTargets: fw.sampleTargets,
            demoFile: fw.demoFile,
            before,
            after,
        });
    });

    const totalDryRunMs = dryRunChecks.reduce((sum, c) => sum + c.ms, 0);
    return { entries, dryRunChecks, totalDryRunMs };
}

module.exports = { generateExamplesData, stripJsDocBlocks, extractSnippet, FRAMEWORKS };

// ---------------------------------------------------------------------
// CLI entry point — writes docs-site/data/examples.json
// ---------------------------------------------------------------------

if (require.main === module) {
    const outPath = path.join(root, "docs-site", "data", "examples.json");
    const { entries, dryRunChecks, totalDryRunMs } = generateExamplesData();

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), entries }, null, 2) + "\n", "utf8");

    console.log(`Wrote ${entries.length} Examples entries to ${path.relative(root, outPath)}\n`);
    console.log("Per-framework --dry-run check against real sample/* fixtures (non-mutating):");
    dryRunChecks.forEach((c) => {
        console.log(`  ${c.name.padEnd(10)} ${c.fileCount} file(s), ${c.ms.toFixed(1)}ms, exit ${c.exitCode}, mutated: ${c.mutated.length}`);
    });
    console.log(`\nAggregate --dry-run time across ${dryRunChecks.length} real sample dirs/file-lists: ${totalDryRunMs.toFixed(1)}ms`);
}
