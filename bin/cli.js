#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { processFile, analyseFile, collectFiles } = require("../lib/index.js");
const pkg = require("../package.json");

function printHelp() {
    console.log(`
${pkg.name} v${pkg.version}
Pure, AST-based JSDoc comment generator for JavaScript & TypeScript. No AI involved.

Usage:
  gen-comments <path> [path2 ...] [options]

  <path> can be a single file OR a directory (scanned recursively for
  .js/.jsx/.ts/.tsx files; node_modules, .git, dist, build, etc. are skipped).

Options:
  --write, -w     Overwrite files in place.
  --force, -f     Add comment blocks even on nodes that already have one.
  --dry-run, -n   Show what would be documented without writing any files.
  --check, -C     Like --dry-run but exits with code 1 if any symbols are undocumented.
                  Use in CI to enforce documentation coverage.
  --check-drift   Compare existing JSDoc blocks against current AST (missing/removed params,
                   return-type mismatches). Exits 1 if drift found. Read-only, CI-gateable.
  --lint          Validate JSDoc content — missing tags, unknown tag names, blank descriptions,
                   comment formatting. Same category of checks as eslint-plugin-jsdoc's
                   recommended config, no ESLint required. Exits 1 if issues found. Read-only.
  --fix           Rewrite EXISTING JSDoc blocks to resolve --lint findings (implies --lint).
                   Missing params/returns/descriptions are filled with a fixed "TODO: ..."
                   placeholder — never invented prose — and mechanical issues (param order,
                   stray asterisks, unnecessary tags) are corrected outright. Does not add
                   JSDoc to undocumented symbols (use --write for that) and never renames an
                   unknown/typo'd tag (check-tag-names findings always remain — there's no
                   safe default for what the tag should have been). Edits files in place.
  --coverage-badge <dir>  Aggregate coverage across target path, write coverage-badge.svg
                          and coverage-summary.json to <dir>. Read-only w.r.t. source files.
  --help, -h      Show this help.
  --version, -v   Show the installed version.

Examples:
  gen-comments src/utils.ts --dry-run         # preview what would be added
  gen-comments .                              # scan whole project, edit files in place
  gen-comments . --write                      # scan whole project, edit files in place
  gen-comments src --write --force            # re-document files that already have JSDoc
  gen-comments src --check                    # CI gate: exit 1 if any symbols undocumented
  gen-comments src --check-drift              # CI gate: exit 1 if JSDoc blocks drifted from AST
  gen-comments src --lint                     # CI gate: exit 1 if JSDoc content is invalid
  gen-comments src --lint --fix               # rewrite existing JSDoc to resolve lint findings
  gen-comments src --coverage-badge docs      # write docs/coverage-badge.svg + coverage-summary.json
`);
}

function parseArgs(argv) {
    const args = { inputs: [], write: false, force: false, help: false, version: false, dryRun: false, check: false, checkDrift: false, lint: false, fix: false, coverageBadge: null };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--write" || a === "-w") args.write = true;
        else if (a === "--force" || a === "-f") args.force = true;
        else if (a === "--dry-run" || a === "-n") args.dryRun = true;
        else if (a === "--check" || a === "-C") args.check = true;
        else if (a === "--check-drift") args.checkDrift = true;
        else if (a === "--lint") args.lint = true;
        else if (a === "--fix") args.fix = true;
        else if (a === "--coverage-badge") { args.coverageBadge = argv[++i] || null; }
        else if (a === "--help" || a === "-h") args.help = true;
        else if (a === "--version" || a === "-v") args.version = true;
        else args.inputs.push(a);
    }
    // --fix implies --lint: there is no separate "just fix, don't tell me what's left" mode —
    // the whole point is seeing what got fixed vs. what still needs a human (e.g. check-tag-names).
    if (args.fix) args.lint = true;
    return args;
}

function isInsideGitRepo(startDir) {
    let dir = path.resolve(startDir);
    while (true) {
        if (fs.existsSync(path.join(dir, ".git"))) return true;
        const parent = path.dirname(dir);
        if (parent === dir) return false;
        dir = parent;
    }
}

function main() {
    const argv = process.argv.slice(2);
    const { inputs, write, force, help, version, dryRun, check, checkDrift, lint, fix, coverageBadge } = parseArgs(argv);

    if (version) {
        console.log(pkg.version);
        return;
    }
    if (help || inputs.length === 0) {
        printHelp();
        process.exitCode = inputs.length === 0 && !help ? 1 : 0;
        return;
    }

    if ((write || fix) && !isInsideGitRepo(process.cwd())) {
        console.warn(
            "⚠ " + (fix ? "--fix" : "--write") + " will edit files in place and this folder is not (or you are not inside) a git repo.\n" +
                "  Consider committing your work first so you have something to diff/revert against.\n",
        );
    }

    let files = [];
    for (const input of inputs) {
        if (!fs.existsSync(input)) {
            console.error(`skip: path not found - ${input}`);
            continue;
        }
        files.push(...collectFiles(input));
    }
    files = [...new Set(files)];

    if (files.length === 0) {
        console.log("No matching .js/.jsx/.ts/.tsx files found.");
        return;
    }

    // --check-drift / --lint: both read extractModule() per file — share one call per
    // file when both flags are passed together, rather than parsing twice.
    if (checkDrift || lint) {
        const { extractModule } = require("../lib/extractor.js");
        const { detectDrift } = checkDrift ? require("../lib/drift.js") : {};
        const { lintModule } = lint ? require("../lib/lint.js") : {};
        const { fixModule } = fix ? require("../lib/fix.js") : {};
        if (checkDrift) console.log(`Checking drift across ${files.length} file(s)...\n`);
        if (fix) console.log(`Fixing JSDoc lint issues across ${files.length} file(s)...\n`);
        else if (lint) console.log(`Linting JSDoc across ${files.length} file(s)...\n`);

        let driftTotal = 0;
        let lintTotal = 0;
        let fixedTotal = 0;
        let filesFixed = 0;

        for (const file of files) {
            if (checkDrift) {
                let moduleData;
                try {
                    moduleData = extractModule(file);
                } catch (err) {
                    console.error(`  ${file} -> FAILED: ${err.message}`);
                    continue;
                }
                const issues = detectDrift(moduleData);
                if (issues.length) {
                    console.log(`  ${file}  (drift)`);
                    issues.forEach((issue) => {
                        const loc = issue.line != null ? `${file}:${issue.line}` : file;
                        const detail =
                            issue.kind === "return-type-mismatch"
                                ? `expected ${issue.detail.astType}, documented ${issue.detail.docType}`
                                : issue.detail.param;
                        console.log(`    ${loc}  ${issue.symbol}  ${issue.kind}  ${detail}`);
                        driftTotal += 1;
                    });
                }
            }

            if (lint) {
                if (fix) {
                    let result;
                    try {
                        result = fixModule(file);
                    } catch (err) {
                        console.error(`  ${file} -> FAILED: ${err.message}`);
                        continue;
                    }
                    if (result.fixedCount > 0) {
                        filesFixed += 1;
                        fixedTotal += result.fixedCount;
                        console.log(`  ${file}  (fixed ${result.fixedCount}/${result.totalBefore} issue(s))`);
                    }
                    if (result.remainingIssues.length) {
                        console.log(`  ${file}  (lint — ${result.remainingIssues.length} remaining)`);
                        result.remainingIssues.forEach((issue) => {
                            const loc = issue.line != null ? `${file}:${issue.line}` : file;
                            console.log(`    ${loc}  ${issue.symbol}  ${issue.rule}  ${issue.message}`);
                            lintTotal += 1;
                        });
                    }
                } else {
                    let moduleData;
                    try {
                        moduleData = extractModule(file);
                    } catch (err) {
                        console.error(`  ${file} -> FAILED: ${err.message}`);
                        continue;
                    }
                    const issues = lintModule(moduleData);
                    if (issues.length) {
                        console.log(`  ${file}  (lint)`);
                        issues.forEach((issue) => {
                            const loc = issue.line != null ? `${file}:${issue.line}` : file;
                            console.log(`    ${loc}  ${issue.symbol}  ${issue.rule}  ${issue.message}`);
                            lintTotal += 1;
                        });
                    }
                }
            }
        }

        if (checkDrift) {
            if (driftTotal === 0) console.log("No drift detected. All existing JSDoc blocks match their AST.");
            else console.log(`\n${driftTotal} drift issue(s) found.`);
        }
        if (fix) {
            console.log(`\n${fixedTotal} issue(s) fixed across ${filesFixed} file(s).`);
            if (lintTotal === 0) console.log("No remaining lint issues.");
            else console.log(`${lintTotal} issue(s) remain — see above (typically check-tag-names, which --fix never auto-corrects).`);
        } else if (lint) {
            if (lintTotal === 0) console.log("No lint issues found.");
            else console.log(`\n${lintTotal} lint issue(s) found.`);
        }
        if (driftTotal > 0 || lintTotal > 0) process.exitCode = 1;
        return;
    }

    // --coverage-badge <dir>: write coverage-badge.svg + coverage-summary.json (read-only re: source)
    if (coverageBadge) {
        const { aggregateCoverage, renderBadgeSvg } = require("../lib/coverage.js");
        const fileResults = [];
        for (const file of files) {
            try {
                fileResults.push(analyseFile(file));
            } catch (err) {
                console.error(`  ${file} -> FAILED: ${err.message}`);
            }
        }
        const agg = aggregateCoverage(fileResults);
        if (!fs.existsSync(coverageBadge)) fs.mkdirSync(coverageBadge, { recursive: true });
        const svgPath = path.join(coverageBadge, "coverage-badge.svg");
        const jsonPath = path.join(coverageBadge, "coverage-summary.json");
        fs.writeFileSync(svgPath, renderBadgeSvg(agg.pct), "utf8");
        fs.writeFileSync(jsonPath, JSON.stringify({ documented: agg.documented, total: agg.total, undocumented: agg.undocumented, pct: agg.pct, generatedAt: null }, null, 2), "utf8");
        console.log(`Coverage: ${agg.documented}/${agg.total} symbols documented (${agg.pct}%)`);
        console.log(`Wrote ${svgPath}`);
        console.log(`Wrote ${jsonPath}`);
        return;
    }

    // --check and --dry-run: report coverage without writing files
    if (check || dryRun) {
        console.log(`Analysing ${files.length} file(s)...\n`);
        const { aggregateCoverage } = require("../lib/coverage.js");
        const fileResults = [];
        for (const file of files) {
            try {
                const stats = analyseFile(file);
                fileResults.push(stats);
                if (stats.undocumented > 0) {
                    // Show per-file what would be added
                    processFile(file, { dryRun: true, force: false });
                }
            } catch (err) {
                console.error(`  ${file} -> FAILED: ${err.message}`);
            }
        }
        const agg = aggregateCoverage(fileResults);
        const { documented: documentedSymbols, total: totalSymbols, undocumented: undocumentedSymbols, pct } = agg;
        console.log(`\nCoverage: ${documentedSymbols}/${totalSymbols} symbols documented (${pct}%)`);
        if (undocumentedSymbols === 0) {
            console.log("All symbols are documented.");
        } else {
            console.log(`${undocumentedSymbols} symbol(s) missing documentation.`);
            if (check) {
                console.log("\nFailing: run gen-comments --write to add missing blocks.");
                process.exitCode = 1;
            } else {
                console.log("\nRun gen-comments --write to add the blocks shown above.");
            }
        }
        return;
    }

    console.log(`Scanning ${files.length} file(s)...`);
    let totalBlocks = 0;
    let touchedFiles = 0;
    for (const file of files) {
        try {
            const count = processFile(file, { write, force });
            totalBlocks += count;
            if (count > 0) touchedFiles += 1;
        } catch (err) {
            console.error(`  ${file} -> FAILED: ${err.message}`);
        }
    }

    console.log(
        `\nDone. ${totalBlocks} comment block(s) added across ${touchedFiles} file(s) ` + `(${files.length} scanned).`,
    );
    if (!write) {
        console.log("This was a preview run — pass --write to edit the original files in place.");
    }
}

main();
