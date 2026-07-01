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
  --help, -h      Show this help.
  --version, -v   Show the installed version.

Examples:
  gen-comments src/utils.ts --dry-run         # preview what would be added
  gen-comments .                              # scan whole project, edit files in place
  gen-comments . --write                      # scan whole project, edit files in place
  gen-comments src --write --force            # re-document files that already have JSDoc
  gen-comments src --check                    # CI gate: exit 1 if any symbols undocumented
`);
}

function parseArgs(argv) {
    const args = { inputs: [], write: false, force: false, help: false, version: false, dryRun: false, check: false };
    for (const a of argv) {
        if (a === "--write" || a === "-w") args.write = true;
        else if (a === "--force" || a === "-f") args.force = true;
        else if (a === "--dry-run" || a === "-n") args.dryRun = true;
        else if (a === "--check" || a === "-C") args.check = true;
        else if (a === "--help" || a === "-h") args.help = true;
        else if (a === "--version" || a === "-v") args.version = true;
        else args.inputs.push(a);
    }
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
    const { inputs, write, force, help, version, dryRun, check } = parseArgs(argv);

    if (version) {
        console.log(pkg.version);
        return;
    }
    if (help || inputs.length === 0) {
        printHelp();
        process.exitCode = inputs.length === 0 && !help ? 1 : 0;
        return;
    }

    if (write && !isInsideGitRepo(process.cwd())) {
        console.warn(
            "⚠ --write will edit files in place and this folder is not (or you are not inside) a git repo.\n" +
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

    // --check and --dry-run: report coverage without writing files
    if (check || dryRun) {
        console.log(`Analysing ${files.length} file(s)...\n`);
        let totalSymbols = 0;
        let documentedSymbols = 0;
        let undocumentedSymbols = 0;
        for (const file of files) {
            try {
                const { documented, total, undocumented } = analyseFile(file);
                totalSymbols += total;
                documentedSymbols += documented;
                undocumentedSymbols += undocumented;
                if (undocumented > 0) {
                    // Show per-file what would be added
                    processFile(file, { dryRun: true, force: false });
                }
            } catch (err) {
                console.error(`  ${file} -> FAILED: ${err.message}`);
            }
        }
        const pct = totalSymbols ? Math.round((documentedSymbols / totalSymbols) * 100) : 100;
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
