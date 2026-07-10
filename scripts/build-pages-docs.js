#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const site = require("../docs-site/site.js");
const pkg = require("../package.json");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "_site");
const docsDir = path.join(outDir, "docs");

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir) {
    fs.rmSync(dir, { recursive: true, force: true });
    ensureDir(dir);
}

function writeFile(file, contents) {
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, contents, "utf8");
}

function esc(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function navHtml(depth, activeSlug) {
    const prefix = depth ? "../" : "";
    const docPrefix = depth ? "" : "docs/";
    const docs = site.pages.map((page) => {
        const active = page.slug === activeSlug ? " active" : "";
        return `<a class="nav-link${active}" href="${docPrefix}${page.slug}.html">${esc(page.title)}</a>`;
    }).join("");
    return `<header class="site-header">
        <a class="brand" href="${prefix}index.html" aria-label="jsdoc-scribe home">
            <span class="brand-mark">JS</span>
            <span>jsdoc-scribe</span>
        </a>
        <nav class="top-links" aria-label="Primary">
            <a href="${docPrefix}quick-start.html">Docs</a>
            <a href="${prefix}api/index.html">API</a>
            <a href="https://github.com/imchintoo/jsdoc-scribe">GitHub</a>
        </nav>
    </header>
    ${depth ? `<aside class="docs-sidebar" aria-label="Documentation">${docs}<a class="nav-link" href="../api/index.html">API Reference</a></aside>` : ""}`;
}

function pageShell({ title, description, body, depth = 0, activeSlug = "" }) {
    const cssHref = depth ? "../assets/site.css" : "assets/site.css";
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)} | jsdoc-scribe</title>
    <meta name="description" content="${esc(description || site.description)}">
    <link rel="stylesheet" href="${cssHref}">
</head>
<body>
    ${navHtml(depth, activeSlug)}
    ${body}
</body>
</html>
`;
}

function renderLanding() {
    const featureCards = site.features.map((feature) => `<article class="feature-card">
        <h3>${esc(feature.title)}</h3>
        <p>${esc(feature.body)}</p>
    </article>`).join("");
    const terminalLines = [
        "$ npx gen-comments src --write",
        "Inserted deterministic JSDoc blocks",
        "$ npx gen-docs src --out docs",
        "Built static documentation site"
    ].map((line) => `<span class="terminal-line">${esc(line)}</span>`).join("");

    const body = `<main>
        <section class="hero">
            <div class="hero-copy">
                <p class="eyebrow">No AI. No LLM. No surprises.</p>
                <h1>What is jsdoc-scribe?</h1>
                <p class="hero-text">${esc(site.description)}</p>
                <div class="hero-actions">
                    <a class="btn primary" href="docs/quick-start.html">Read documentation</a>
                    <a class="btn secondary" href="api/index.html">API reference</a>
                </div>
            </div>
            <div class="terminal-card" aria-label="Example commands">${terminalLines}</div>
        </section>
        <section class="feature-band">
            <div class="section-heading">
                <p class="eyebrow">Built for teams</p>
                <h2>Document code without changing how your project ships.</h2>
            </div>
            <div class="feature-grid">${featureCards}</div>
        </section>
        <section class="workflow-band">
            <h2>One dependency, two CLIs, many integration paths.</h2>
            <div class="workflow-grid">
                <a href="docs/cli.html"><strong>CLI usage</strong><span>Generate, check, lint, fix, and build docs.</span></a>
                <a href="docs/github-actions.html"><strong>GitHub Actions</strong><span>Use exit codes as PR gates.</span></a>
                <a href="docs/github-pages.html"><strong>GitHub Pages</strong><span>Publish generated HTML from CI.</span></a>
                <a href="docs/eslint-plugin.html"><strong>ESLint plugin</strong><span>Bring JSDoc checks into flat config.</span></a>
            </div>
        </section>
    </main>`;
    writeFile(path.join(outDir, "index.html"), pageShell({
        title: "What is jsdoc-scribe?",
        description: site.description,
        body
    }));
}

function renderDocPage(page) {
    const sections = page.changelog ? renderChangelog() : page.sections.map(renderSection).join("");
    const body = `<main class="docs-layout">
        <article class="docs-content">
            <p class="eyebrow">Documentation</p>
            <h1>${esc(page.title)}</h1>
            <p class="lead">${esc(page.description)}</p>
            ${sections}
        </article>
    </main>`;
    writeFile(path.join(docsDir, `${page.slug}.html`), pageShell({
        title: page.title,
        description: page.description,
        body,
        depth: 1,
        activeSlug: page.slug
    }));
}

function renderSection(section) {
    const body = section.body.map((item) => {
        if (typeof item === "string") return `<p>${esc(item)}</p>`;
        if (item.code) return `<pre class="code-block"><code>${esc(item.code)}</code></pre>`;
        return "";
    }).join("");
    return `<section class="doc-section">
        <h2>${esc(section.title)}</h2>
        ${body}
    </section>`;
}

function inlineMarkdown(text) {
    return esc(text)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function renderChangelog() {
    const changelogPath = path.join(root, "CHANGELOG.md");
    const source = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, "utf8") : "";
    const lines = source.split(/\r?\n/).slice(0, 220);
    const html = [];
    let inList = false;
    let inCode = false;

    function closeList() {
        if (inList) {
            html.push("</ul>");
            inList = false;
        }
    }

    for (const line of lines) {
        if (line.startsWith("```")) {
            closeList();
            html.push(inCode ? "</code></pre>" : '<pre class="code-block"><code>');
            inCode = !inCode;
            continue;
        }
        if (inCode) {
            html.push(esc(line) + "\n");
            continue;
        }
        if (/^#{1,3}\s+/.test(line)) {
            closeList();
            const level = Math.min((line.match(/^#+/) || ["##"])[0].length + 1, 3);
            html.push(`<h${level}>${inlineMarkdown(line.replace(/^#+\s+/, ""))}</h${level}>`);
        } else if (/^\s*[-*]\s+/.test(line)) {
            if (!inList) {
                html.push("<ul>");
                inList = true;
            }
            html.push(`<li>${inlineMarkdown(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
        } else if (line.trim()) {
            closeList();
            html.push(`<p>${inlineMarkdown(line.trim())}</p>`);
        } else {
            closeList();
        }
    }
    closeList();
    if (inCode) html.push("</code></pre>");
    return `<section class="doc-section changelog-note">
        <p>This page shows the latest entries from CHANGELOG.md. See the repository for the complete release history.</p>
    </section>
    <section class="doc-section changelog">${html.join("\n")}</section>`;
}

function writeCss() {
    const css = `:root{--bg:#f5f4f0;--surface:#fff;--ink:#111;--muted:#5f5d57;--line:rgba(17,17,17,.12);--accent:#5b4fe8;--accent-dark:#473bd0;--lime:#c6ff3d;--code:#111113;--code-text:#d7d2c8;--sidebar:#111113;--sidebar-text:#d7d2c8;--shadow:0 18px 50px rgba(17,17,17,.10);font-family:"Space Grotesk","Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 var(--font-family,inherit)}a{color:inherit;text-decoration:none}.site-header{height:68px;display:flex;align-items:center;justify-content:space-between;padding:0 28px;background:rgba(255,255,255,.92);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:20;backdrop-filter:blur(10px)}.brand{display:flex;align-items:center;gap:10px;font-weight:800}.brand-mark{display:grid;place-items:center;width:34px;height:34px;border-radius:8px;background:var(--ink);color:var(--lime);font:700 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace}.top-links{display:flex;gap:18px;color:var(--muted);font-size:14px}.top-links a:hover{color:var(--accent)}.hero{min-height:calc(100vh - 68px);display:grid;grid-template-columns:minmax(0,1.05fr) minmax(360px,.75fr);gap:42px;align-items:center;padding:72px 7vw 56px}.eyebrow{margin:0 0 12px;color:var(--accent);font:700 12px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.08em}.hero h1{font-size:clamp(48px,7vw,92px);line-height:.95;margin:0 0 24px;max-width:820px}.hero-text{font-size:clamp(18px,2vw,23px);line-height:1.45;color:var(--muted);max-width:720px;margin:0}.hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}.btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border-radius:8px;font-weight:700;border:1px solid var(--line)}.btn.primary{background:var(--accent);color:white;border-color:var(--accent)}.btn.primary:hover{background:var(--accent-dark)}.btn.secondary{background:white}.terminal-card{background:var(--code);color:var(--code-text);border-radius:8px;padding:22px;box-shadow:var(--shadow);font:13px/1.8 ui-monospace,SFMono-Regular,Menlo,monospace;border:1px solid rgba(255,255,255,.08)}.terminal-line{display:block;white-space:pre-wrap}.terminal-line:nth-child(odd){color:var(--lime)}.feature-band,.workflow-band{padding:70px 7vw;border-top:1px solid var(--line)}.section-heading{max-width:760px;margin-bottom:24px}.section-heading h2,.workflow-band h2{font-size:clamp(30px,4vw,52px);line-height:1.05;margin:0}.feature-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.feature-card,.workflow-grid a{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:22px}.feature-card h3{margin:0 0 8px;font-size:18px}.feature-card p,.workflow-grid span{margin:0;color:var(--muted)}.workflow-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:24px}.workflow-grid a{display:block}.workflow-grid a:hover{border-color:var(--accent);box-shadow:0 8px 28px rgba(91,79,232,.10)}.workflow-grid strong{display:block;margin-bottom:6px}.docs-sidebar{position:fixed;top:68px;bottom:0;left:0;width:260px;padding:22px 12px;background:var(--sidebar);overflow:auto}.nav-link{display:block;padding:9px 12px;border-radius:7px;color:var(--sidebar-text);font-size:14px}.nav-link:hover,.nav-link.active{background:rgba(255,255,255,.08);color:white}.docs-layout{margin-left:260px}.docs-content{max-width:880px;padding:56px 58px 90px}.docs-content h1{font-size:clamp(38px,6vw,68px);line-height:1;margin:0 0 16px}.lead{font-size:20px;line-height:1.5;color:var(--muted);margin:0 0 34px}.doc-section{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:26px;margin:16px 0}.doc-section h2{font-size:24px;margin:0 0 12px}.doc-section h3{font-size:18px;margin:24px 0 10px}.doc-section p{color:var(--muted);margin:10px 0}.doc-section ul{margin:10px 0 0;padding-left:22px;color:var(--muted)}.doc-section li{margin:6px 0}.doc-section code{background:#ece9df;padding:2px 5px;border-radius:4px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#222}.code-block{background:var(--code);color:var(--code-text);border-radius:8px;padding:18px;overflow:auto;margin:14px 0 0;font:13px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace}.code-block code{background:transparent;color:inherit;padding:0}.changelog h2:first-child{margin-top:0}.changelog-note{background:#fffbe7}@media (max-width:980px){.hero{grid-template-columns:1fr;min-height:auto;padding-top:54px}.feature-grid,.workflow-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.docs-sidebar{position:static;width:auto;display:flex;gap:6px;overflow:auto;padding:10px 12px}.docs-layout{margin-left:0}.docs-content{padding:38px 20px 70px}.nav-link{white-space:nowrap}.top-links{gap:12px}}@media (max-width:640px){.site-header{padding:0 16px}.top-links a:nth-child(3){display:none}.hero{padding:42px 20px}.feature-band,.workflow-band{padding:46px 20px}.feature-grid,.workflow-grid{grid-template-columns:1fr}.terminal-card{font-size:12px}.hero h1{font-size:46px}}`;
    writeFile(path.join(outDir, "assets", "site.css"), css);
}

function buildApiDocs() {
    const result = spawnSync(process.execPath, [
        "bin/gen-docs.js",
        "lib",
        "bin",
        "packages/eslint-plugin-jsdoc-scribe",
        "--out",
        "_site/api",
        "--title",
        "jsdoc-scribe API",
        "--source-url",
        "https://github.com/imchintoo/jsdoc-scribe/blob/main",
        "--json"
    ], { cwd: root, stdio: "inherit" });
    if (result.status !== 0) process.exit(result.status || 1);
}

function copyAssetPreviews() {
    const assetsDir = path.join(root, "assets");
    if (!fs.existsSync(assetsDir)) return;
    for (const name of ["preview.svg", "preview-quality.svg"]) {
        const src = path.join(assetsDir, name);
        if (fs.existsSync(src)) fs.copyFileSync(src, path.join(outDir, "assets", name));
    }
}

function main() {
    cleanDir(outDir);
    buildApiDocs();
    writeCss();
    copyAssetPreviews();
    renderLanding();
    site.pages.forEach(renderDocPage);
    writeFile(path.join(outDir, "docs", "index.html"), '<meta http-equiv="refresh" content="0; url=quick-start.html">');
    console.log(`Built ${site.title} documentation site for v${pkg.version} in ${path.relative(root, outDir)}`);
}

main();
