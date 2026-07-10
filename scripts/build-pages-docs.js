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

const demoPanels = [
    {
        id: "comments",
        label: "Generate comments",
        title: "Add JSDoc without hand-writing boilerplate.",
        command: "npx gen-comments src --write",
        lines: ["Scanning 42 source files", "Inserted 128 deterministic blocks", "0 network calls, 0 prompts"]
    },
    {
        id: "docs",
        label: "Build docs",
        title: "Turn source comments into static HTML.",
        command: "npx gen-docs src --out docs --title \"My API\"",
        lines: ["Extracted modules", "Built searchable pages", "Ready for GitHub Pages"]
    },
    {
        id: "ci",
        label: "Gate CI",
        title: "Fail pull requests when documentation drifts.",
        command: "npx gen-comments src --check-drift",
        lines: ["Checked AST signatures", "Compared existing JSDoc", "Exit code is CI-friendly"]
    }
];

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

function attr(value) {
    return esc(value).replace(/\r?\n/g, "&#10;");
}

function slugify(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
    const jsHref = depth ? "../assets/site.js" : "assets/site.js";
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)} | jsdoc-scribe</title>
    <meta name="description" content="${esc(description || site.description)}">
    <link rel="stylesheet" href="${cssHref}">
    <script src="${jsHref}" defer></script>
</head>
<body>
    ${navHtml(depth, activeSlug)}
    ${body}
</body>
</html>
`;
}

function renderLanding() {
    const featureCards = site.features.map((feature, index) => `<article class="feature-card reveal" style="--delay:${index * 80}ms">
        <span class="feature-number">0${index + 1}</span>
        <h3>${esc(feature.title)}</h3>
        <p>${esc(feature.body)}</p>
    </article>`).join("");

    const tabs = demoPanels.map((panel, index) => `<button class="demo-tab${index === 0 ? " active" : ""}" type="button" data-demo-tab="${panel.id}">
        ${esc(panel.label)}
    </button>`).join("");

    const panels = demoPanels.map((panel, index) => `<div class="demo-panel${index === 0 ? " active" : ""}" data-demo-panel="${panel.id}">
        <p class="demo-title">${esc(panel.title)}</p>
        <pre class="demo-command"><code>${esc(panel.command)}</code></pre>
        <div class="demo-output">
            ${panel.lines.map((line) => `<span>${esc(line)}</span>`).join("")}
        </div>
    </div>`).join("");

    const body = `<main>
        <section class="hero">
            <div class="hero-copy reveal">
                <p class="eyebrow">No AI. No LLM. No surprises.</p>
                <h1>What is jsdoc-scribe?</h1>
                <p class="hero-text">${esc(site.description)}</p>
                <div class="hero-actions">
                    <a class="btn primary" href="docs/quick-start.html">Read documentation</a>
                    <a class="btn secondary" href="api/index.html">API reference</a>
                </div>
                <div class="proof-row" aria-label="Product highlights">
                    <span><strong>2</strong> CLIs</span>
                    <span><strong>0</strong> AI calls</span>
                    <span><strong>234</strong> tests</span>
                </div>
            </div>
            <div class="hero-console reveal" style="--delay:120ms">
                <div class="console-header">
                    <span class="traffic-dot"></span>
                    <span class="traffic-dot"></span>
                    <span class="traffic-dot"></span>
                    <strong>Integration preview</strong>
                </div>
                <div class="demo-tabs" role="tablist" aria-label="Integration previews">${tabs}</div>
                ${panels}
            </div>
        </section>
        <section class="feature-band">
            <div class="section-heading reveal">
                <p class="eyebrow">Built for teams</p>
                <h2>Document code without changing how your project ships.</h2>
            </div>
            <div class="feature-grid">${featureCards}</div>
        </section>
        <section class="workflow-band">
            <div class="workflow-copy reveal">
                <p class="eyebrow">Ship path</p>
                <h2>One dependency, two CLIs, many integration paths.</h2>
            </div>
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

function renderDocPage(page, index) {
    const sections = page.changelog ? renderChangelog() : page.sections.map(renderSection).join("");
    const nextPage = site.pages[(index + 1) % site.pages.length];
    const sectionLinks = page.changelog
        ? ["Latest entries", "Release notes"].map((label, i) => ({ id: i === 0 ? "latest-entries" : "release-notes", title: label }))
        : page.sections.map((section) => ({ id: slugify(section.title), title: section.title }));
    const body = `<main class="docs-layout">
        <article class="docs-content">
            <p class="eyebrow">Documentation</p>
            <h1>${esc(page.title)}</h1>
            <p class="lead">${esc(page.description)}</p>
            ${sections}
        </article>
        <aside class="docs-aside" aria-label="Page tools">
            <div class="aside-card progress-card">
                <span class="aside-label">Page progress</span>
                <div class="progress-ring" data-progress-ring><span data-progress-value>0%</span></div>
            </div>
            <div class="aside-card">
                <span class="aside-label">On this page</span>
                <nav class="toc-list">
                    ${sectionLinks.map((item) => `<a href="#${esc(item.id)}">${esc(item.title)}</a>`).join("")}
                </nav>
            </div>
            <div class="aside-card command-card">
                <span class="aside-label">Try next</span>
                <code>${esc(getPageCommand(page.slug))}</code>
                <button class="copy-btn" type="button" data-copy="${attr(getPageCommand(page.slug))}">Copy</button>
            </div>
            <a class="next-card" href="${esc(nextPage.slug)}.html">
                <span>Next guide</span>
                <strong>${esc(nextPage.title)}</strong>
            </a>
        </aside>
    </main>`;
    writeFile(path.join(docsDir, `${page.slug}.html`), pageShell({
        title: page.title,
        description: page.description,
        body,
        depth: 1,
        activeSlug: page.slug
    }));
}

function getPageCommand(slug) {
    const commands = {
        "quick-start": "npx gen-comments src --write",
        cli: "gen-docs src --out docs",
        "github-actions": "npx gen-comments src --check",
        "github-pages": "npm run docs:pages",
        "programmatic-api": "require('jsdoc-scribe/docs')",
        "eslint-plugin": "npm install -D eslint-plugin-jsdoc-scribe",
        features: "gen-comments src --lint --fix",
        changelog: "npm view jsdoc-scribe version"
    };
    return commands[slug] || "npm run docs:pages";
}

function renderSection(section) {
    const id = slugify(section.title);
    const body = section.body.map((item) => {
        if (typeof item === "string") return `<p>${esc(item)}</p>`;
        if (item.code) {
            return `<div class="code-wrap">
                <button class="copy-btn" type="button" data-copy="${attr(item.code)}">Copy</button>
                <pre class="code-block"><code>${esc(item.code)}</code></pre>
            </div>`;
        }
        return "";
    }).join("");
    return `<section class="doc-section reveal" id="${esc(id)}">
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
    return `<section class="doc-section changelog-note reveal" id="latest-entries">
        <h2>Latest entries</h2>
        <p>This page shows the latest entries from CHANGELOG.md. See the repository for the complete release history.</p>
    </section>
    <section class="doc-section changelog reveal" id="release-notes">${html.join("\n")}</section>`;
}

function writeCss() {
    const css = `
:root{--bg:#f5f4f0;--surface:#fff;--ink:#111;--muted:#5f5d57;--soft:#ebe8de;--line:rgba(17,17,17,.12);--accent:#5b4fe8;--accent-dark:#473bd0;--lime:#c6ff3d;--coral:#ff4b2e;--code:#111113;--code-text:#d7d2c8;--sidebar:#111113;--sidebar-text:#d7d2c8;--shadow:0 18px 50px rgba(17,17,17,.10);font-family:"Space Grotesk","Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 var(--font-family,inherit)}
a{color:inherit;text-decoration:none}
.site-header{height:68px;display:flex;align-items:center;justify-content:space-between;padding:0 28px;background:rgba(255,255,255,.92);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:20;backdrop-filter:blur(10px)}
.brand{display:flex;align-items:center;gap:10px;font-weight:800}
.brand-mark{display:grid;place-items:center;width:34px;height:34px;border-radius:8px;background:var(--ink);color:var(--lime);font:700 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace}
.top-links{display:flex;gap:18px;color:var(--muted);font-size:14px}
.top-links a:hover{color:var(--accent)}
.hero{min-height:calc(100vh - 68px);display:grid;grid-template-columns:minmax(0,1.02fr) minmax(390px,.86fr);gap:44px;align-items:center;padding:72px 7vw 56px;position:relative;overflow:hidden}
.hero::before{content:"";position:absolute;inset:auto 5vw 8vh auto;width:360px;height:360px;background:radial-gradient(circle,rgba(198,255,61,.2),transparent 65%);pointer-events:none}
.eyebrow{margin:0 0 12px;color:var(--accent);font:700 12px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.08em}
.hero h1{font-size:clamp(48px,7vw,92px);line-height:.95;margin:0 0 24px;max-width:820px}
.hero-text{font-size:clamp(18px,2vw,23px);line-height:1.45;color:var(--muted);max-width:720px;margin:0}
.hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border-radius:8px;font-weight:700;border:1px solid var(--line);transition:transform .18s,box-shadow .18s,background .18s}
.btn:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(17,17,17,.12)}
.btn.primary{background:var(--accent);color:white;border-color:var(--accent)}
.btn.primary:hover{background:var(--accent-dark)}
.btn.secondary{background:white}
.proof-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}
.proof-row span{display:inline-flex;align-items:center;gap:6px;padding:8px 11px;border:1px solid var(--line);border-radius:8px;background:rgba(255,255,255,.68);color:var(--muted)}
.proof-row strong{color:var(--ink);font-size:20px;line-height:1}
.hero-console{background:var(--code);color:var(--code-text);border-radius:8px;box-shadow:var(--shadow);border:1px solid rgba(255,255,255,.08);overflow:hidden;position:relative}
.console-header{display:flex;align-items:center;gap:8px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.1);color:#fff}
.traffic-dot{width:10px;height:10px;border-radius:50%;background:var(--coral)}
.traffic-dot:nth-child(2){background:#f5c518}
.traffic-dot:nth-child(3){background:var(--lime)}
.demo-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:14px}
.demo-tab{border:1px solid rgba(255,255,255,.12);border-radius:8px;background:rgba(255,255,255,.06);color:var(--code-text);font:700 12px/1.2 inherit;padding:10px;cursor:pointer}
.demo-tab.active,.demo-tab:hover{background:var(--lime);color:var(--ink)}
.demo-panel{display:none;padding:4px 18px 22px}
.demo-panel.active{display:block}
.demo-title{margin:0 0 12px;color:#fff;font-weight:700}
.demo-command{margin:0;background:#050506;border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:16px;overflow:auto;color:var(--lime)}
.demo-output{display:grid;gap:8px;margin-top:14px}
.demo-output span{padding:10px 12px;border-radius:8px;background:rgba(255,255,255,.06);font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.feature-band,.workflow-band{padding:70px 7vw;border-top:1px solid var(--line)}
.section-heading{max-width:760px;margin-bottom:24px}
.section-heading h2,.workflow-band h2{font-size:clamp(30px,4vw,52px);line-height:1.05;margin:0}
.feature-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.feature-card,.workflow-grid a{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:22px;transition:transform .18s,box-shadow .18s,border-color .18s}
.feature-card:hover,.workflow-grid a:hover{transform:translateY(-4px);border-color:var(--accent);box-shadow:0 14px 38px rgba(91,79,232,.12)}
.feature-number{display:inline-flex;margin-bottom:22px;color:var(--accent);font:700 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace}
.feature-card h3{margin:0 0 8px;font-size:18px}
.feature-card p,.workflow-grid span{margin:0;color:var(--muted)}
.workflow-band{display:grid;grid-template-columns:.75fr 1.25fr;gap:32px;align-items:start}
.workflow-copy{position:sticky;top:98px}
.workflow-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.workflow-grid a{display:block}
.workflow-grid strong{display:block;margin-bottom:6px}
.docs-sidebar{position:fixed;top:68px;bottom:0;left:0;width:260px;padding:22px 12px;background:var(--sidebar);overflow:auto}
.nav-link{display:block;padding:9px 12px;border-radius:7px;color:var(--sidebar-text);font-size:14px}
.nav-link:hover,.nav-link.active{background:rgba(255,255,255,.08);color:white}
.docs-layout{margin-left:260px;display:grid;grid-template-columns:minmax(0,880px) 300px;gap:34px;align-items:start;padding:56px 42px 90px}
.docs-content{min-width:0}
.docs-content h1{font-size:clamp(38px,6vw,68px);line-height:1;margin:0 0 16px}
.lead{font-size:20px;line-height:1.5;color:var(--muted);margin:0 0 34px}
.doc-section{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:26px;margin:16px 0;scroll-margin-top:92px}
.doc-section h2{font-size:24px;margin:0 0 12px}
.doc-section h3{font-size:18px;margin:24px 0 10px}
.doc-section p{color:var(--muted);margin:10px 0}
.doc-section ul{margin:10px 0 0;padding-left:22px;color:var(--muted)}
.doc-section li{margin:6px 0}
.doc-section code{background:#ece9df;padding:2px 5px;border-radius:4px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#222}
.code-wrap{position:relative}
.code-block{background:var(--code);color:var(--code-text);border-radius:8px;padding:18px;overflow:auto;margin:14px 0 0;font:13px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace}
.code-block code{background:transparent;color:inherit;padding:0}
.copy-btn{border:1px solid var(--line);border-radius:7px;background:white;color:var(--ink);font-weight:700;font-size:12px;padding:7px 10px;cursor:pointer}
.code-wrap .copy-btn{position:absolute;right:10px;top:10px;background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.14);color:var(--code-text)}
.copy-btn.copied{background:var(--lime);color:var(--ink)}
.docs-aside{position:sticky;top:92px;display:grid;gap:14px}
.aside-card,.next-card{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:18px;box-shadow:0 8px 26px rgba(17,17,17,.05)}
.aside-label{display:block;color:var(--accent);font:700 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px}
.progress-card{display:flex;align-items:center;justify-content:space-between;gap:16px}
.progress-ring{width:72px;height:72px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--accent) var(--progress-angle,0deg),var(--soft) 0);font-weight:800}
.progress-ring span{display:grid;place-items:center;width:54px;height:54px;border-radius:50%;background:var(--surface);font-size:14px}
.toc-list{display:grid;gap:8px}
.toc-list a{color:var(--muted);font-size:14px}
.toc-list a:hover{color:var(--accent)}
.command-card code{display:block;background:var(--soft);border-radius:8px;padding:12px;margin-bottom:12px;word-break:break-word}
.next-card{display:block;background:var(--ink);color:white}
.next-card span{display:block;color:var(--lime);font:700 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
.next-card strong{font-size:20px;line-height:1.2}
.changelog h2:first-child{margin-top:0}
.changelog-note{background:#fffbe7}
.reveal{opacity:0;transform:translateY(14px);transition:opacity .5s ease,transform .5s ease;transition-delay:var(--delay,0ms)}
.reveal.visible{opacity:1;transform:none}
@media (max-width:1180px){.docs-layout{grid-template-columns:minmax(0,1fr);padding-right:28px}.docs-aside{position:static;grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:980px){.hero{grid-template-columns:1fr;min-height:auto;padding-top:54px}.feature-grid,.workflow-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.workflow-band{grid-template-columns:1fr}.workflow-copy{position:static}.docs-sidebar{position:static;width:auto;display:flex;gap:6px;overflow:auto;padding:10px 12px}.docs-layout{margin-left:0;padding:38px 20px 70px}.nav-link{white-space:nowrap}.top-links{gap:12px}}
@media (max-width:640px){.site-header{padding:0 16px}.top-links a:nth-child(3){display:none}.hero{padding:42px 20px}.feature-band,.workflow-band{padding:46px 20px}.feature-grid,.workflow-grid,.docs-aside{grid-template-columns:1fr}.hero h1{font-size:46px}.hero-console{font-size:13px}.demo-tabs{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}.reveal{opacity:1;transform:none}}
`;
    writeFile(path.join(outDir, "assets", "site.css"), css.trimStart());
}

function writeClientJs() {
    const js = `
(function(){
    function selectDemo(id){
        document.querySelectorAll("[data-demo-tab]").forEach(function(tab){
            tab.classList.toggle("active", tab.getAttribute("data-demo-tab") === id);
        });
        document.querySelectorAll("[data-demo-panel]").forEach(function(panel){
            panel.classList.toggle("active", panel.getAttribute("data-demo-panel") === id);
        });
    }
    document.querySelectorAll("[data-demo-tab]").forEach(function(tab){
        tab.addEventListener("click", function(){ selectDemo(tab.getAttribute("data-demo-tab")); });
    });
    document.querySelectorAll("[data-copy]").forEach(function(button){
        button.addEventListener("click", function(){
            var text = button.getAttribute("data-copy") || "";
            navigator.clipboard.writeText(text).then(function(){
                var old = button.textContent;
                button.textContent = "Copied";
                button.classList.add("copied");
                setTimeout(function(){ button.textContent = old; button.classList.remove("copied"); }, 1300);
            }).catch(function(){ button.textContent = "Copy failed"; });
        });
    });
    var revealItems = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
        var observer = new IntersectionObserver(function(entries){
            entries.forEach(function(entry){
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        revealItems.forEach(function(item){ observer.observe(item); });
    } else {
        revealItems.forEach(function(item){ item.classList.add("visible"); });
    }
    function updateProgress(){
        var ring = document.querySelector("[data-progress-ring]");
        var value = document.querySelector("[data-progress-value]");
        if (!ring || !value) return;
        var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        var progress = Math.min(100, Math.max(0, Math.round((window.scrollY / max) * 100)));
        ring.style.setProperty("--progress-angle", (progress * 3.6) + "deg");
        value.textContent = progress + "%";
    }
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
})();
`;
    writeFile(path.join(outDir, "assets", "site.js"), js.trimStart());
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
    writeClientJs();
    copyAssetPreviews();
    renderLanding();
    site.pages.forEach(renderDocPage);
    writeFile(path.join(outDir, "docs", "index.html"), '<meta http-equiv="refresh" content="0; url=quick-start.html">');
    console.log(`Built ${site.title} documentation site for v${pkg.version} in ${path.relative(root, outDir)}`);
}

main();
