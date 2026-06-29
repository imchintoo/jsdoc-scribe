#!/usr/bin/env node
"use strict";

const fs   = require("fs");
const path = require("path");
const { collectFiles }   = require("../lib/index.js");
const { extractModule }  = require("../lib/extractor.js");
const { buildSite, moduleLabel, moduleHtmlPath } = require("../lib/renderer.js");
const { loadConfig, mergeConfig } = require("../lib/config.js");
const pkg = require("../package.json");

const VALID_THEMES = ["default", "minimal", "dark"];

function printHelp() {
    console.log(`
${pkg.name} v${pkg.version} -- gen-docs
Generate a multi-page HTML documentation site from JS/TS source files.

Usage:
  gen-docs <path> [path2 ...] [options]

Options:
  --out <dir>,        -o <dir>   Output directory              (default: ./docs)
  --title <name>,     -t <name>  Project title                 (default: package name)
  --theme <name>,     -T <name>  Theme: default|minimal|dark   (default: default)
  --json,             -j         Also write docs.json
  --readme,           -r         Also write README.md
  --ignore <glob>,    -I <glob>  Exclude files matching glob   (repeatable)
  --source-url <url>, -s <url>   GitHub base URL for source links
  --config <file>,    -c <file>  Path to config file           (default: .jsdoc-scribe.json)
  --watch,            -W         Watch for changes and rebuild automatically
  --help,             -h         Show this help.
  --version,          -v         Show version.

Config file (.jsdoc-scribe.json):
  { "out": "docs", "title": "My API", "theme": "minimal", "json": true,
    "readme": true, "sourceUrl": "https://github.com/user/repo/blob/main",
    "ignore": ["**/*.test.ts", "src/generated/"] }

Examples:
  gen-docs src
  gen-docs . --out site --json --readme --theme minimal
  gen-docs src --ignore "**/*.test.ts" --ignore "dist/"
  gen-docs src --source-url https://github.com/user/repo/blob/main
  gen-docs src --watch
`);
}

function parseArgs(argv) {
    const args = {
        inputs: [], out: undefined, title: undefined, theme: undefined,
        json: undefined, readme: undefined, watch: false,
        ignore: [], sourceUrl: undefined, configPath: undefined,
        help: false, version: false,
    };
    let i = 0;
    while (i < argv.length) {
        const a = argv[i];
        if      (a === "--help"       || a === "-h") { args.help    = true; }
        else if (a === "--version"    || a === "-v") { args.version = true; }
        else if (a === "--watch"      || a === "-W") { args.watch   = true; }
        else if (a === "--json"       || a === "-j") { args.json    = true; }
        else if (a === "--readme"     || a === "-r") { args.readme  = true; }
        else if ((a === "--out"       || a === "-o") && argv[i+1]) { args.out       = argv[++i]; }
        else if ((a === "--title"     || a === "-t") && argv[i+1]) { args.title     = argv[++i]; }
        else if ((a === "--config"    || a === "-c") && argv[i+1]) { args.configPath= argv[++i]; }
        else if ((a === "--source-url"|| a === "-s") && argv[i+1]) { args.sourceUrl = argv[++i]; }
        else if ((a === "--ignore"    || a === "-I") && argv[i+1]) { args.ignore.push(argv[++i]); }
        else if ((a === "--theme"     || a === "-T") && argv[i+1]) {
            const t = argv[++i];
            if (!VALID_THEMES.includes(t)) { console.error(`Unknown theme "${t}". Valid: ${VALID_THEMES.join(", ")}`); process.exit(1); }
            args.theme = t;
        }
        else if (!a.startsWith("-")) args.inputs.push(a);
        i++;
    }
    return args;
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

function build(files, outDir, projectName, projectVersion, opts, silent) {
    const modules = [];
    for (const file of files) {
        try { modules.push(extractModule(file)); }
        catch (err) { console.error(`  ${file} -> FAILED: ${err.message}`); }
    }

    const pages = buildSite(modules, {
        projectName,
        version: projectVersion,
        theme: opts.theme,
        sourceUrl: opts.sourceUrl,
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    const argv = process.argv.slice(2);
    const cliArgs = parseArgs(argv);

    if (cliArgs.version) { console.log(pkg.version); return; }
    if (cliArgs.help || cliArgs.inputs.length === 0) {
        printHelp();
        process.exitCode = cliArgs.inputs.length === 0 && !cliArgs.help ? 1 : 0;
        return;
    }

    // Load config file and merge with CLI (CLI wins)
    const fileConfig = loadConfig(cliArgs.configPath);
    const opts = mergeConfig(fileConfig, cliArgs);

    const files = collectAllFiles(cliArgs.inputs, opts.ignore);
    if (files.length === 0) { console.log("No matching .js/.jsx/.ts/.tsx files found."); return; }

    const outDir        = path.resolve(opts.out || "docs");
    const projectName   = resolveTitle(opts.title);
    const projectVersion = resolveVersion();
    const extras = [opts.json && "docs.json", opts.readme && "README.md"].filter(Boolean);
    const extraStr = extras.length ? " + " + extras.join(" + ") : "";

    if (!cliArgs.watch) {
        console.log(`Extracting ${files.length} file(s)...`);
        if (opts.ignore.length) console.log(`  ignoring: ${opts.ignore.join(", ")}`);
        const n = build(files, outDir, projectName, projectVersion, opts, false);
        console.log(`\nDone. ${n} page(s)${extraStr} written to ${path.relative(process.cwd(), outDir) || outDir}`);
        console.log(`Open ${path.join(path.relative(process.cwd(), outDir) || outDir, "index.html")} in a browser.`);
        return;
    }

    // ── Watch mode ────────────────────────────────────────────────────────────
    function stamp() { return new Date().toLocaleTimeString(); }
    console.log(`[watch] Watching ${files.length} file(s). Output: ${path.relative(process.cwd(), outDir) || outDir}`);
    if (opts.ignore.length) console.log(`[watch] ignoring: ${opts.ignore.join(", ")}`);
    console.log(`[watch] Press Ctrl+C to stop.\n`);

    try {
        const n = build(files, outDir, projectName, projectVersion, opts, true);
        console.log(`[${stamp()}] Built ${n} page(s)${extraStr}`);
    } catch (err) { console.error(`[${stamp()}] Build failed: ${err.message}`); }

    let timer = null;
    function scheduleBuild() {
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
            timer = null;
            try {
                const freshFiles = collectAllFiles(cliArgs.inputs, opts.ignore);
                const n = build(freshFiles, outDir, projectName, projectVersion, opts, true);
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
