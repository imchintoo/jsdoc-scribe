#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const site = require("../docs-site/site.js");
const pkg = require("../package.json");
// TASK-F14-03B: consumes TASK-F14-03A's generator in-process via require() —
// never reads the optional docs-site/data/examples.json debug artifact, per
// the ADR's "never stale, regenerated every build" requirement.
const { generateExamplesData } = require("./generate-examples-data.js");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "_site");
const docsDir = path.join(outDir, "docs");
const blogDir = path.join(outDir, "blog");
const docsSourceDir = path.join(root, "docs-site", "docs");
const postsSourceDir = path.join(root, "docs-site", "posts");

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

function absoluteUrl(relativePath) {
    if (!relativePath || relativePath === "index.html") return site.baseUrl;
    return new URL(relativePath.replace(/\\/g, "/"), site.baseUrl).toString();
}

function pageUrl(depth, currentPath) {
    return absoluteUrl(currentPath || (depth ? "docs/quick-start.html" : "index.html"));
}

function imageUrl(imagePath, currentPath) {
    if (/^https?:\/\//.test(imagePath || "")) return imagePath;
    if (!imagePath || imagePath === site.image) return absoluteUrl(site.image);
    const base = currentPath ? new URL(".", absoluteUrl(currentPath)).toString() : site.baseUrl;
    return new URL(imagePath || site.image, base).toString();
}

function jsonLd(data) {
    return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function slugify(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseFrontMatter(source, filePath) {
    const raw = source.replace(/^\uFEFF/, "");
    if (!raw.startsWith("---\n") && !raw.startsWith("---\r\n")) {
        return { data: {}, body: raw };
    }
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match) throw new Error(`Invalid frontmatter in ${filePath}`);
    const data = {};
    match[1].split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const idx = trimmed.indexOf(":");
        if (idx === -1) return;
        const key = trimmed.slice(0, idx).trim();
        data[key] = parseFrontMatterValue(trimmed.slice(idx + 1).trim());
    });
    return { data, body: raw.slice(match[0].length) };
}

function parseFrontMatterValue(value) {
    if (value === "true") return true;
    if (value === "false") return false;
    if (/^\[.*\]$/.test(value)) {
        return value.slice(1, -1).split(",").map((item) => item.trim()).filter(Boolean);
    }
    return value.replace(/^["']|["']$/g, "");
}

function readMarkdownFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .filter((name) => name.endsWith(".md"))
        .sort()
        .map((name) => {
            const filePath = path.join(dir, name);
            const parsed = parseFrontMatter(fs.readFileSync(filePath, "utf8"), filePath);
            return { filePath, fileName: name, ...parsed.data, markdown: parsed.body.trim() };
        });
}

function loadMarkdownContent() {
    site.pages = readMarkdownFiles(docsSourceDir).map((doc) => ({
        slug: doc.slug || slugify(doc.title || path.basename(doc.fileName, ".md")),
        title: doc.title || doc.slug,
        description: doc.description || "",
        command: doc.command,
        changelog: Boolean(doc.changelog),
        sections: parseDocSections(doc.markdown)
    }));
    site.posts = readMarkdownFiles(postsSourceDir).map((post) => ({
        slug: post.slug || slugify(post.title || path.basename(post.fileName, ".md")),
        title: post.title || post.slug,
        description: post.description || "",
        date: post.date || new Date().toISOString().slice(0, 10),
        readingTime: post.readingTime || estimateReadingTime(post.markdown),
        tags: Array.isArray(post.tags) ? post.tags : [],
        image: post.image || `../assets/${post.slug}.png`,
        content: parsePostBlocks(post.markdown)
    })).sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

/**
 * Minimal, opt-in markdown convention for the two Guide callout boxes:
 * `> [!TIP] ...`/`> [!INFO] ...`, optionally continued on following `>`
 * lines. Deliberately narrow -- a plain blockquote (`> ` without the
 * `[!TIP]`/`[!INFO]` marker) is left as an ordinary paragraph line exactly
 * as before, so this is additive parser scope, not a change to how any of
 * the 9 existing `.md` files already render (none of them use this syntax
 * today). Flagged as new parser scope per the UX handoff note, kept to the
 * smallest regex-based hook that satisfies the AC rather than a general
 * blockquote/markdown-extension system.
 */
function parseDocSections(markdown) {
    const sections = [];
    let current = null;
    let paragraph = [];
    let code = [];
    let inCode = false;
    let calloutType = null;
    let calloutLines = [];

    function ensureSection() {
        if (!current) current = { title: "Overview", body: [] };
        return current;
    }
    function flushParagraph() {
        if (paragraph.length) {
            ensureSection().body.push(paragraph.join(" "));
            paragraph = [];
        }
    }
    function flushCode() {
        ensureSection().body.push({ code: code.join("\n") });
        code = [];
    }
    function flushCallout() {
        if (calloutType) {
            ensureSection().body.push({ callout: calloutType, text: calloutLines.join(" ").trim() });
            calloutType = null;
            calloutLines = [];
        }
    }
    markdown.split(/\r?\n/).forEach((line) => {
        if (line.startsWith("```")) {
            if (inCode) {
                flushCode();
                inCode = false;
            } else {
                flushParagraph();
                flushCallout();
                inCode = true;
            }
            return;
        }
        if (inCode) {
            code.push(line);
            return;
        }
        const calloutStart = line.match(/^>\s*\[!(TIP|INFO)\]\s*(.*)$/i);
        if (calloutStart) {
            flushParagraph();
            flushCallout();
            calloutType = calloutStart[1].toLowerCase();
            if (calloutStart[2].trim()) calloutLines.push(calloutStart[2].trim());
            return;
        }
        if (calloutType && line.startsWith(">")) {
            calloutLines.push(line.replace(/^>\s?/, "").trim());
            return;
        }
        if (calloutType && !line.trim()) {
            flushCallout();
            return;
        }
        if (line.startsWith("## ")) {
            flushParagraph();
            flushCallout();
            if (current) sections.push(current);
            current = { title: line.replace(/^##\s+/, "").trim(), body: [] };
        } else if (line.trim()) {
            paragraph.push(line.trim());
        } else {
            flushParagraph();
        }
    });
    if (inCode) flushCode();
    flushParagraph();
    flushCallout();
    if (current) sections.push(current);
    return sections;
}

function parsePostBlocks(markdown) {
    const blocks = [];
    let paragraph = [];
    let code = [];
    let list = null;
    let inCode = false;

    function flushParagraph() {
        if (paragraph.length) {
            blocks.push({ type: "paragraph", text: paragraph.join(" ") });
            paragraph = [];
        }
    }
    function flushCode() {
        blocks.push({ type: "code", code: code.join("\n") });
        code = [];
    }
    function flushList() {
        if (list) {
            blocks.push(list);
            list = null;
        }
    }
    markdown.split(/\r?\n/).forEach((line) => {
        if (line.startsWith("```")) {
            if (inCode) {
                flushCode();
                inCode = false;
            } else {
                flushParagraph();
                flushList();
                inCode = true;
            }
            return;
        }
        if (inCode) {
            code.push(line);
            return;
        }
        const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        const video = line.match(/^@\[video\]\((.*)\)$/);
        const ulItem = line.match(/^\s*[-*]\s+(.*)$/);
        const olItem = line.match(/^\s*\d+\.\s+(.*)$/);
        if (line.startsWith("## ")) {
            flushParagraph();
            flushList();
            blocks.push({ type: "heading", text: line.replace(/^##\s+/, "").trim() });
        } else if (line.startsWith("> ")) {
            flushParagraph();
            flushList();
            blocks.push({ type: "quote", text: line.replace(/^>\s+/, "").trim() });
        } else if (image) {
            flushParagraph();
            flushList();
            blocks.push({ type: "image", alt: image[1], src: image[2] });
        } else if (video) {
            flushParagraph();
            flushList();
            blocks.push({ type: "video", ...parseInlineAttrs(video[1]) });
        } else if (ulItem || olItem) {
            flushParagraph();
            const ordered = Boolean(olItem);
            if (!list || list.ordered !== ordered) {
                flushList();
                list = { type: "list", ordered: ordered, items: [] };
            }
            list.items.push((olItem || ulItem)[1].trim());
        } else if (line.trim()) {
            flushList();
            paragraph.push(line.trim());
        } else {
            flushParagraph();
            flushList();
        }
    });
    if (inCode) flushCode();
    flushParagraph();
    flushList();
    return blocks;
}

function parseInlineAttrs(source) {
    const attrs = {};
    source.replace(/(\w+)="([^"]*)"/g, (_, key, value) => {
        attrs[key] = value;
        return "";
    });
    return attrs;
}

function estimateReadingTime(markdown) {
    const words = markdown.replace(/```[\s\S]*?```/g, "").trim().split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(words / 220))} min read`;
}

function navSectionFor(currentPath) {
    const value = currentPath || "";
    if (/^docs\//.test(value) || /^api\//.test(value)) return "guide";
    if (/^blog\//.test(value)) return "blog";
    if (value === "examples.html") return "examples";
    return "";
}

/**
 * Builds the 10-topic Guide sidebar link list (the 9 markdown-sourced
 * topics from `site.pages` plus "API Reference") as a single set of
 * `.nav-link` anchors sharing one active-state rule. API Reference used to
 * be a hardcoded `<a>` appended outside this loop with no active-state
 * logic at all -- folded in here per UX/ADR's finding so every sidebar item
 * (including API Reference) participates in the same highlighting. Reused
 * by both the desktop `.docs-sidebar` and the mobile `.guide-switcher`
 * dropdown so the two never drift out of sync.
 * @param {string} activeSlug - the current Guide topic's slug, or "" outside the Guide section
 * @param {string} [currentPath] - current page's site-relative path, used to detect `api/**` pages
 * @returns {string}
 */
function guideSidebarLinks(activeSlug, currentPath) {
    const items = [
        ...site.pages.map((page) => ({ slug: page.slug, title: page.title, href: `${page.slug}.html` })),
        { slug: "api-reference", title: "API Reference", href: "../api/index.html" }
    ];
    return items.map((item) => {
        const active = item.slug === "api-reference" ? /^api\//.test(currentPath || "") : item.slug === activeSlug;
        return `<a class="nav-link${active ? " active" : ""}" href="${item.href}">${esc(item.title)}</a>`;
    }).join("");
}

function navHtml(depth, activeSlug, currentPath) {
    const prefix = depth ? "../" : "";
    const docHref = depth ? "../docs/quick-start.html" : "docs/quick-start.html";
    const blogHref = depth ? "../blog/index.html" : "blog/index.html";
    const examplesHref = depth ? "../examples.html" : "examples.html";
    const section = navSectionFor(currentPath);
    const navLink = (href, label, key) => `<a href="${href}"${section === key ? ' class="active"' : ""}>${label}</a>`;
    const topLinks = `${navLink(docHref, "Guide", "guide")}${navLink(blogHref, "Blog", "blog")}${navLink(examplesHref, "Examples", "examples")}`;
    const iconRow = `<a class="icon-link" href="https://github.com/imchintoo/jsdoc-scribe" target="_blank" rel="noopener" aria-label="jsdoc-scribe on GitHub">${iconGitHub()}</a><a class="npm-badge" href="https://www.npmjs.com/package/jsdoc-scribe" target="_blank" rel="noopener" aria-label="jsdoc-scribe on npm">npm</a>`;
    return `<header class="site-header">
        <a class="brand" href="${prefix}index.html" aria-label="jsdoc-scribe home">📘 JSDoc Scribe</a>
        <nav class="top-links" aria-label="Primary">${topLinks}</nav>
        <div class="nav-right">${iconRow}</div>
        <button id="nav-toggle" class="hamburger" type="button" aria-expanded="false" aria-controls="mobile-drawer" aria-label="Open menu"><span></span><span></span><span></span></button>
    </header>
    <div id="drawer-backdrop" class="drawer-backdrop" hidden></div>
    <nav id="mobile-drawer" class="mobile-drawer" aria-label="Mobile" hidden>
        ${topLinks}
        <hr>
        <div class="drawer-icons">${iconRow}</div>
    </nav>
    ${activeSlug ? `<aside class="docs-sidebar" aria-label="Documentation">${guideSidebarLinks(activeSlug, currentPath)}</aside>` : ""}`;
}

function breadcrumbHtml(items) {
    return `<nav class="site-breadcrumb" aria-label="Breadcrumb">
        ${items.map((item, index) => {
            const label = esc(item.label);
            const current = index === items.length - 1;
            if (current || !item.href) return `<span aria-current="${current ? "page" : "false"}">${label}</span>`;
            return `<a href="${esc(item.href)}">${label}</a><span class="crumb-separator">/</span>`;
        }).join("")}
    </nav>`;
}

function pageShell({ title, description, body, depth = 0, activeSlug = "", currentPath = "index.html", type = "website", image, published, structuredData }) {
    const cssHref = depth ? "../assets/site.css" : "assets/site.css";
    const jsHref = depth ? "../assets/site.js" : "assets/site.js";
    const canonical = pageUrl(depth, currentPath);
    const metaTitle = `${title} | jsdoc-scribe`;
    const metaDescription = description || site.description;
    const socialImage = imageUrl(image || site.image, currentPath);
    const schema = structuredData || {
        "@context": "https://schema.org",
        "@type": type === "article" ? "Article" : "WebPage",
        headline: title,
        description: metaDescription,
        url: canonical,
        image: socialImage,
        author: { "@type": "Person", name: site.author },
        publisher: { "@type": "Organization", name: site.title },
        datePublished: published || undefined
    };
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(metaTitle)}</title>
    <meta name="description" content="${esc(metaDescription)}">
    <meta name="keywords" content="${esc(site.keywords.join(", "))}">
    <meta name="author" content="${esc(site.author)}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="${esc(canonical)}">
    <meta property="og:type" content="${esc(type)}">
    <meta property="og:site_name" content="${esc(site.title)}">
    <meta property="og:title" content="${esc(metaTitle)}">
    <meta property="og:description" content="${esc(metaDescription)}">
    <meta property="og:url" content="${esc(canonical)}">
    <meta property="og:image" content="${esc(socialImage)}">
    <meta property="og:locale" content="${esc(site.locale)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(metaTitle)}">
    <meta name="twitter:description" content="${esc(metaDescription)}">
    <meta name="twitter:image" content="${esc(socialImage)}">
    <link rel="alternate" type="application/rss+xml" title="jsdoc-scribe blog" href="${esc(absoluteUrl("blog/rss.xml"))}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${cssHref}">
    <script src="${jsHref}" defer></script>
    ${jsonLd(schema)}
</head>
<body>
    ${navHtml(depth, activeSlug, currentPath)}
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
        <div class="landing-breadcrumb">${breadcrumbHtml([{ label: "Home" }])}</div>
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
        title: "JSDoc & TypeScript Documentation Generator",
        description: site.description,
        body,
        currentPath: "index.html",
        structuredData: {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: site.title,
            description: site.description,
            url: absoluteUrl("index.html"),
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Cross-platform",
            author: { "@type": "Person", name: site.author }
        }
    }));
}

function renderDocPage(page) {
    const sections = page.changelog ? renderChangelog() : page.sections.map(renderSection).join("");
    const body = `<main class="docs-layout">
        <article class="docs-content">
            ${breadcrumbHtml([
                { label: "Home", href: "../index.html" },
                { label: "Documentation", href: "quick-start.html" },
                { label: page.title }
            ])}
            <details class="guide-switcher">
                <summary>📚 On this page: <strong>${esc(page.title)}</strong> ▾</summary>
                <nav>${guideSidebarLinks(page.slug, `docs/${page.slug}.html`)}</nav>
            </details>
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
        activeSlug: page.slug,
        currentPath: `docs/${page.slug}.html`
    }));
}

function renderBlogIndex() {
    const cards = site.posts.map((post) => `<article class="medium-row reveal">
        <div class="medium-row-main">
            <div class="medium-author-line">
                <span class="author-avatar">${esc(authorInitials(site.author))}</span>
                <span>${esc(site.author)}</span>
                <span>${esc(formatDate(post.date))}</span>
            </div>
            <h2><a href="${esc(post.slug)}.html">${esc(post.title)}</a></h2>
            <p>${esc(post.description)}</p>
            <div class="medium-row-footer">
                <span>${esc(post.readingTime)}</span>
                ${post.tags.slice(0, 2).map((tag) => `<span class="topic-pill">${esc(tag)}</span>`).join("")}
            </div>
        </div>
        <a class="medium-row-media" href="${esc(post.slug)}.html" aria-label="${esc(post.title)}">
            <img src="${esc(post.image)}" alt="${esc(post.title)}" loading="lazy">
        </a>
    </article>`).join("");
    const body = `<main class="medium-shell">
        ${breadcrumbHtml([
            { label: "Home", href: "../index.html" },
            { label: "Blog" }
        ])}
        <section class="medium-list-header reveal">
            <div>
                <p class="medium-kicker">jsdoc-scribe blog</p>
                <h1>Stories</h1>
                <p>Guides, product notes, and practical writing about documentation automation.</p>
            </div>
            <a class="medium-outline-btn" href="../docs/quick-start.html">Read docs</a>
        </section>
        <nav class="medium-tabs" aria-label="Blog sections">
            <a class="active" href="index.html">Published</a>
            <a href="../docs/quick-start.html">Documentation</a>
            <a href="../api/index.html">API Reference</a>
        </nav>
        <section class="medium-list">${cards}</section>
    </main>`;
    writeFile(path.join(blogDir, "index.html"), pageShell({
        title: "Blog",
        description: "Guides and articles about JavaScript documentation, TypeScript documentation, JSDoc automation, and GitHub Pages publishing.",
        body,
        depth: 1,
        currentPath: "blog/index.html",
        structuredData: {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "jsdoc-scribe Blog",
            description: "Guides and articles about JavaScript documentation and jsdoc-scribe.",
            url: absoluteUrl("blog/index.html"),
            publisher: { "@type": "Organization", name: site.title }
        }
    }));
}

function relatedPosts(post, limit) {
    const max = limit || 3;
    const others = site.posts.filter((candidate) => candidate.slug !== post.slug);
    const tagged = others.filter((candidate) => candidate.tags.some((tag) => post.tags.includes(tag)));
    const picked = tagged.slice(0, max);
    if (picked.length < max) {
        for (const candidate of others) {
            if (picked.length >= max) break;
            if (!picked.includes(candidate)) picked.push(candidate);
        }
    }
    return picked.slice(0, max);
}

function relatedPostsHtml(post) {
    const picks = relatedPosts(post);
    if (!picks.length) return "";
    const cards = picks.map((related) => `<a class="related-card" href="${esc(related.slug)}.html">
        ${related.tags[0] ? `<span class="related-kicker">${esc(related.tags[0])}</span>` : ""}
        <strong>${esc(related.title)}</strong>
        <span class="related-meta">${esc(related.readingTime)}</span>
    </a>`).join("");
    return `<section class="related-posts" aria-label="Related reading">
        <h2>Continue reading</h2>
        <div class="related-grid">${cards}</div>
    </section>`;
}

function renderBlogPost(post) {
    const body = `<main class="medium-article-shell">
        ${breadcrumbHtml([
            { label: "Home", href: "../index.html" },
            { label: "Blog", href: "index.html" },
            { label: post.title }
        ])}
        <article class="medium-article">
            <header class="medium-article-header">
                <div class="tag-row">${post.tags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>
                <h1>${esc(post.title)}</h1>
                <p class="lead">${esc(post.description)}</p>
                <div class="medium-byline">
                    <span class="author-avatar large">${esc(authorInitials(site.author))}</span>
                    <span><strong>${esc(site.author)}</strong><small>${esc(post.readingTime)} · ${esc(formatDate(post.date))}</small></span>
                </div>
            </header>
            <figure class="medium-hero-image">
                <img src="${esc(post.image)}" alt="${esc(post.title)}" loading="eager">
            </figure>
            <div class="medium-action-rail" aria-label="Article actions">
                <button type="button" data-copy="${attr(absoluteUrl(`blog/${post.slug}.html`))}" data-copy-mode="icon" title="Copy article link" aria-label="Copy article link">${iconCopy()}</button>
                <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(absoluteUrl(`blog/${post.slug}.html`))}&text=${encodeURIComponent(post.title)}" title="Share on X" aria-label="Share on X">${iconX()}</a>
                <a href="https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(absoluteUrl(`blog/${post.slug}.html`))}" title="Share on LinkedIn" aria-label="Share on LinkedIn">${iconLinkedIn()}</a>
            </div>
            ${renderPostBlocks(post.content)}
            ${relatedPostsHtml(post)}
        </article>
        <a class="medium-back-link" href="index.html">Back to stories</a>
    </main>`;
    writeFile(path.join(blogDir, `${post.slug}.html`), pageShell({
        title: post.title,
        description: post.description,
        body,
        depth: 1,
        currentPath: `blog/${post.slug}.html`,
        type: "article",
        image: post.image,
        published: post.date,
        structuredData: {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            image: imageUrl(post.image, `blog/${post.slug}.html`),
            datePublished: post.date,
            dateModified: post.date,
            author: { "@type": "Person", name: site.author },
            publisher: { "@type": "Organization", name: site.title },
            mainEntityOfPage: absoluteUrl(`blog/${post.slug}.html`)
        }
    }));
}

function renderPostBlocks(blocks) {
    return blocks.map((block) => {
        if (block.type === "paragraph") return `<p>${inlineMarkdown(block.text)}</p>`;
        if (block.type === "heading") return `<h2 id="${esc(slugify(block.text))}">${esc(block.text)}</h2>`;
        if (block.type === "quote") return `<blockquote>${inlineMarkdown(block.text)}</blockquote>`;
        if (block.type === "list") {
            const tag = block.ordered ? "ol" : "ul";
            return `<${tag}>${block.items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${tag}>`;
        }
        if (block.type === "code") {
            return `<div class="code-wrap article-code">
                <button class="copy-btn" type="button" data-copy="${attr(block.code)}">Copy</button>
                <pre class="code-block"><code>${esc(block.code)}</code></pre>
            </div>`;
        }
        if (block.type === "image") {
            return `<figure class="article-figure">
                <img src="${esc(block.src)}" alt="${esc(block.alt || "")}" loading="lazy">
                ${block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : ""}
            </figure>`;
        }
        if (block.type === "video") {
            if (!block.src) {
                return `<figure class="article-figure video-placeholder">
                    <img src="${esc(block.poster || "../assets/preview.png")}" alt="${esc(block.caption || "Video preview")}" loading="lazy">
                    <figcaption>${esc(block.caption || "Add a video src to publish a playable video.")}</figcaption>
                </figure>`;
            }
            return `<figure class="article-figure">
                <video controls preload="metadata" ${block.poster ? `poster="${esc(block.poster)}"` : ""}>
                    <source src="${esc(block.src)}">
                </video>
                ${block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : ""}
            </figure>`;
        }
        return "";
    }).join("");
}

function formatDate(value) {
    const date = new Date(`${value}T00:00:00Z`);
    return date.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

function authorInitials(name) {
    return String(name || site.title)
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");
}

function iconCopy() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
}

function iconX() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20"></path></svg>';
}

function iconLinkedIn() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 9.5V20"></path><path d="M6.5 5.5v.1"></path><path d="M11 20v-6.2c0-2.4 1.5-4.1 3.8-4.1s3.7 1.5 3.7 4.3v6"></path><path d="M11 10v10"></path></svg>';
}

function iconGitHub() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c-5.3 0-9.5 4.3-9.5 9.6 0 4.2 2.7 7.8 6.5 9 .5.1.7-.2.7-.5v-1.8c-2.7.6-3.2-1.1-3.2-1.1-.4-1.1-1-1.4-1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .8 1.5 2.2 1.1 2.7.8.1-.6.3-1.1.6-1.3-2.1-.2-4.4-1.1-4.4-4.7 0-1 .4-1.9 1-2.6-.1-.2-.4-1.2.1-2.5 0 0 .8-.3 2.6 1 .8-.2 1.6-.3 2.4-.3.8 0 1.6.1 2.4.3 1.8-1.2 2.6-1 2.6-1 .5 1.3.2 2.3.1 2.5.6.7 1 1.5 1 2.6 0 3.6-2.2 4.4-4.4 4.7.4.3.7.9.7 1.8v2.6c0 .3.2.6.7.5 3.8-1.3 6.5-4.8 6.5-9 .1-5.3-4.2-9.6-9.4-9.6z"></path></svg>';
}

/**
 * Wraps `//`/`#`-prefixed comment lines of an already-HTML-escaped code
 * block in a `.tok-cmt` span so Guide code blocks render them in the teal
 * comment-color token. Deliberately a lightweight regex line-wrap, not a
 * real tokenizer -- per UX spec, that's sufficient here.
 * @param {string} escapedCode - HTML-escaped code text (post `esc()`)
 * @returns {string}
 */
function wrapCommentLines(escapedCode) {
    return escapedCode.split("\n").map((line) => {
        const match = line.match(/^(\s*)(\/\/.*|#.*)$/);
        return match ? `${match[1]}<span class="tok-cmt">${match[2]}</span>` : line;
    }).join("\n");
}

function renderSection(section) {
    const id = slugify(section.title);
    const body = section.body.map((item) => {
        if (typeof item === "string") return `<p>${inlineMarkdown(item)}</p>`;
        if (item.code) {
            return `<div class="code-wrap">
                <button class="copy-btn" type="button" data-copy="${attr(item.code)}">Copy</button>
                <pre class="code-block"><code>${wrapCommentLines(esc(item.code))}</code></pre>
            </div>`;
        }
        if (item.callout) {
            return `<div class="callout ${esc(item.callout)}">${inlineMarkdown(item.text)}</div>`;
        }
        return "";
    }).join("");
    return `<section class="doc-section reveal" id="${esc(id)}">
        <h2>${esc(section.title)}</h2>
        ${body}
    </section>`;
}

function inlineMarkdown(text) {
    const escaped = esc(text);
    const codeSpans = [];
    let result = escaped.replace(/`([^`]+)`/g, (_, code) => {
        codeSpans.push(code);
        return `@@CODESPAN${codeSpans.length - 1}@@`;
    });
    result = result
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => `<a href="${url}">${label}</a>`)
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
    return result.replace(/@@CODESPAN(\d+)@@/g, (_, idx) => `<code>${codeSpans[Number(idx)]}</code>`);
}

/**
 * General-purpose markdown -> HTML block converter. Handles headings,
 * paragraphs, unordered/ordered lists, blockquotes, and fenced code blocks
 * (rendered with the same `.code-wrap`/copy-button markup used elsewhere on
 * the site). Inline formatting (bold/italic/code/links) is delegated to
 * `inlineMarkdown` so both stay in sync.
 *
 * `headingOffset`/`maxHeadingLevel` let a caller demote heading levels (used
 * by the changelog page, whose own `#`/`##`/`###` markers should never
 * outrank the page's own `<h1>`).
 */
function markdownToHtml(markdown, options) {
    const opts = options || {};
    const headingOffset = opts.headingOffset || 0;
    const maxHeadingLevel = opts.maxHeadingLevel || 6;
    const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
    const html = [];
    let paragraph = [];
    let list = null;

    function flushParagraph() {
        if (paragraph.length) {
            html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
            paragraph = [];
        }
    }
    function closeList() {
        if (list) {
            html.push(`</${list.type}>`);
            list = null;
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith("```")) {
            flushParagraph();
            closeList();
            const code = [];
            i++;
            while (i < lines.length && !lines[i].startsWith("```")) {
                code.push(lines[i]);
                i++;
            }
            html.push(`<div class="code-wrap">
                <button class="copy-btn" type="button" data-copy="${attr(code.join("\n"))}">Copy</button>
                <pre class="code-block"><code>${wrapCommentLines(esc(code.join("\n")))}</code></pre>
            </div>`);
            continue;
        }

        const heading = line.match(/^(#{1,6})\s+(.*)$/);
        if (heading) {
            flushParagraph();
            closeList();
            const level = Math.min(heading[1].length + headingOffset, maxHeadingLevel);
            html.push(`<h${level}>${inlineMarkdown(heading[2].trim())}</h${level}>`);
            continue;
        }

        if (/^\s*>\s?/.test(line) && line.trim() !== "") {
            flushParagraph();
            closeList();
            const quote = [line.replace(/^\s*>\s?/, "")];
            while (i + 1 < lines.length && /^\s*>\s?/.test(lines[i + 1])) {
                i++;
                quote.push(lines[i].replace(/^\s*>\s?/, ""));
            }
            html.push(`<blockquote>${inlineMarkdown(quote.join(" ").trim())}</blockquote>`);
            continue;
        }

        const ulItem = line.match(/^\s*[-*]\s+(.*)$/);
        const olItem = line.match(/^\s*\d+\.\s+(.*)$/);
        if (ulItem || olItem) {
            flushParagraph();
            const type = olItem ? "ol" : "ul";
            if (!list || list.type !== type) {
                closeList();
                html.push(`<${type}>`);
                list = { type: type };
            }
            html.push(`<li>${inlineMarkdown((olItem || ulItem)[1].trim())}</li>`);
            continue;
        }

        if (!line.trim()) {
            flushParagraph();
            closeList();
            continue;
        }

        closeList();
        paragraph.push(line.trim());
    }
    flushParagraph();
    closeList();
    return html.join("\n");
}

function renderChangelog() {
    const changelogPath = path.join(root, "CHANGELOG.md");
    const source = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, "utf8") : "";
    // Renders the full file -- previously hard-capped to the first 220 lines
    // (`.slice(0, 220)`), which on this project's real CHANGELOG.md only ever
    // covered the newest ~8-9 of 30+ released versions, silently dropping the
    // rest from the public GitHub Pages changelog page. No cap now: every
    // version in CHANGELOG.md renders, matching "the complete release
    // history" the page's own copy already claimed to show.
    const html = markdownToHtml(source, { headingOffset: 1, maxHeadingLevel: 3 });
    return `<section class="doc-section changelog-note reveal" id="latest-entries">
        <h2>Release history</h2>
        <p>Every release, rendered directly from CHANGELOG.md -- nothing excerpted or hidden.</p>
    </section>
    <section class="doc-section changelog reveal" id="release-notes">${html}</section>`;
}

// ---------------------------------------------------------------------
// TASK-F14-03B — Examples page (examples.html, new template).
// Consumes TASK-F14-03A's generateExamplesData() (8 entries: 7 real + 1 Vue
// stub, fixed Figma order) in-process. Scope: this block + the matching
// writeCss() rulesets appended at the end of that function's stylesheet +
// the two call-list additions in main()/writeSeoFiles(). Does not touch
// navHtml()/header code (TASK-F14-01) or the Guide sidebar code (TASK-F14-02).
// ---------------------------------------------------------------------

// Icon badge colors, per ux-figma-site-redesign-implementation.md §2.5 table
// exactly (includes the Express text-heading-on-yellow contrast fix).
const EXAMPLE_ICON_COLORS = {
    "React": "var(--brand-coral)",
    "Next.js": "var(--brand-indigo)",
    "Angular": "var(--brand-pink)",
    "Vue": "var(--brand-teal)",
    "Express": "var(--brand-yellow)",
    "NestJS": "var(--brand-indigo-700)",
    "Plain JS": "var(--text-muted)",
    "Plain TS": "var(--brand-coral)"
};

// Short decorative glyph shown in the icon badge — aria-hidden, the real
// accessible name is the adjacent <h2> framework name.
const EXAMPLE_ICON_ABBR = {
    "React": "Re",
    "Next.js": "Nx",
    "Angular": "Ng",
    "Vue": "Vue",
    "Express": "Ex",
    "NestJS": "Ns",
    "Plain JS": "JS",
    "Plain TS": "TS"
};

// Anchor IDs per seo-figma-site-redesign-implementation.md §4/§5.2 — exact
// slugs required for the framework-keyword internal-anchor opportunity.
const EXAMPLE_SLUGS = {
    "React": "react",
    "Next.js": "nextjs",
    "Angular": "angular",
    "Vue": "vue",
    "Express": "express",
    "NestJS": "nestjs",
    "Plain JS": "plain-js",
    "Plain TS": "plain-ts"
};

/**
 * Wraps every JSDoc comment line (a block-open, block-close, or star
 * continuation line) in a `.added-line` span so only the genuinely-
 * generated documentation lines get the teal highlight in the "after"
 * compare panel — never the whole panel. Every other line is still
 * HTML-escaped, just unwrapped.
 * @param {string} text
 * @returns {string}
 */
function highlightJsDocLines(text) {
    return text.split("\n").map((line) => {
        const trimmed = line.trim();
        const isDocLine = trimmed.startsWith("/**") || trimmed.startsWith("*/") || trimmed.startsWith("*");
        const escaped = esc(line);
        return isDocLine ? `<span class="added-line">${escaped}</span>` : escaped;
    }).join("\n");
}

/**
 * Renders one framework/target grid card. Real entries show detection
 * method + sample path; the Vue stub (generated:false) renders as a clean
 * detection-only card — no before/after panel, no chrome-mock preview —
 * per the resolved scope call in task-f14-tickets.md's frontmatter.
 * @param {object} entry - one record from generateExamplesData().entries
 * @returns {string}
 */
function renderExampleCard(entry) {
    const slug = EXAMPLE_SLUGS[entry.name] || slugify(entry.name);
    const color = EXAMPLE_ICON_COLORS[entry.name] || "var(--brand-indigo)";
    const abbr = EXAMPLE_ICON_ABBR[entry.name] || entry.name.slice(0, 2);
    const contrastClass = entry.name === "Express" ? " icon-contrast" : "";
    const detected = entry.detectionMethod ? `<p class="example-detected">${esc(entry.detectionMethod)}</p>` : "";
    const pathLine = entry.generated
        ? `<p class="example-path">${esc(entry.demoFile)}</p>`
        : `<p class="example-stub-note">Full generated sample coming soon</p>`;
    return `<section class="example-card" id="${esc(slug)}" aria-labelledby="${esc(slug)}-heading">
        <span class="example-icon${contrastClass}" style="background:${color}" aria-hidden="true">${esc(abbr)}</span>
        <h2 id="${esc(slug)}-heading">${esc(entry.name)}</h2>
        ${detected}
        ${pathLine}
    </section>`;
}

/**
 * Renders the single before/after code-comparison section, using ONE
 * representative real entry from `entries` (NestJS, falling back to the
 * first real entry if the data shape ever changes) — not all 7, per this
 * ticket's explicit scope. Pill copy is the literal Figma text
 * ("AFTER — gen-comments --write"), and only the genuinely-generated JSDoc
 * lines get the `.added-line` teal highlight.
 * @param {object[]} entries
 * @returns {string}
 */
function renderComparisonSection(entries) {
    const rep = entries.find((e) => e.name === "NestJS" && e.generated) || entries.find((e) => e.generated);
    if (!rep) return "";
    const beforeHtml = esc(rep.before);
    const afterHtml = highlightJsDocLines(rep.after);
    return `<section class="examples-section" aria-labelledby="before-after-heading">
        <h2 id="before-after-heading">Before &amp; After: Real Generated JSDoc</h2>
        <p class="compare-intro">Captured from a real run of the CLI against jsdoc-scribe's own checked-in <code>${esc(rep.demoFile)}</code> fixture (${esc(rep.name)}) &mdash; genuine output, not hand-authored to look plausible. See the full <a href="docs/cli.html">CLI Usage guide</a> for every flag shown here.</p>
        <div class="compare">
            <div class="compare-panel">
                <span class="compare-pill before">Before</span>
                <pre><code>${beforeHtml}</code></pre>
            </div>
            <div class="compare-panel">
                <span class="compare-pill after">AFTER &mdash; gen-comments --write</span>
                <pre><code>${afterHtml}</code></pre>
            </div>
        </div>
    </section>`;
}

/**
 * Renders the generated-docs-site browser-chrome preview mockup. Static,
 * representative markup (not data-driven, per this ticket's explicit
 * scope) — reuses the `.traffic-dot` 3-dot pattern as a second, newly
 * scoped CSS instance (`.chrome-dots .traffic-dot`), leaving the homepage
 * hero's own `.traffic-dot` rule/colors untouched.
 * @returns {string}
 */
function renderChromeMockSection() {
    return `<section class="examples-section" aria-labelledby="preview-heading">
        <h2 id="preview-heading">What the Generated Docs Site Looks Like</h2>
        <p class="compare-intro">A representative preview of the static reference site <code>gen-docs</code> builds from JSDoc like the above &mdash; illustrative markup, not a live embed.</p>
        <div class="chrome-mock" role="img" aria-label="Preview mockup of a generated API reference page: a mini sidebar of module links, a function signature, and a parameter table">
            <div class="chrome-bar">
                <div class="chrome-dots"><span class="traffic-dot"></span><span class="traffic-dot"></span><span class="traffic-dot"></span></div>
                <span class="chrome-url-pill">yourproject.github.io/docs/api/roles-guard.html</span>
            </div>
            <div class="chrome-body">
                <nav class="chrome-mini-sidebar" aria-hidden="true">
                    <div>Overview</div>
                    <div class="chrome-active">RolesGuard</div>
                    <div>AuthModule</div>
                    <div>UsersService</div>
                </nav>
                <div class="chrome-content" aria-hidden="true">
                    <code class="chrome-signature">canActivate(context: ExecutionContext): boolean</code>
                    <table class="chrome-param-table">
                        <thead><tr><th>Param</th><th>Type</th><th>Description</th></tr></thead>
                        <tbody>
                            <tr><td>context</td><td>ExecutionContext</td><td>Nest execution context for the current request.</td></tr>
                            <tr><td>roles</td><td>string[]</td><td>Roles allowed to access the route.</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </section>`;
}

/**
 * Renders and writes `_site/examples.html`. Framework grid (8 cards, all in
 * Figma order) + one representative before/after comparison + one
 * browser-chrome preview mockup. Title/description hit seo-specialist's
 * 50-60/150-160 char targets with real framework names, single H1
 * ("Real-World Examples"), one H2 per framework with the required anchor
 * IDs for the framework-keyword internal-anchor opportunity.
 * @param {object[]} entries - generateExamplesData().entries (8 records)
 */
function renderExamplesPage(entries) {
    const cards = entries.map(renderExampleCard).join("");
    const body = `<main class="examples-page">
        ${breadcrumbHtml([{ label: "Home", href: "index.html" }, { label: "Examples" }])}
        <section class="examples-hero">
            <p class="eyebrow">React, Vue, Angular, Express &amp; more</p>
            <h1>Real-World Examples</h1>
            <p class="lead">See jsdoc-scribe detect your framework and generate real JSDoc &mdash; genuine CLI output captured from this repo's own sample fixtures, not hand-authored copy. New here? Start with the <a href="docs/quick-start.html">Quick Start guide</a>.</p>
        </section>
        <section class="examples-section" aria-label="Supported frameworks and targets">
            <div class="examples-grid">${cards}</div>
        </section>
        ${renderComparisonSection(entries)}
        ${renderChromeMockSection()}
    </main>`;
    writeFile(path.join(outDir, "examples.html"), pageShell({
        title: "Framework Examples: React, Angular & NestJS",
        description: "See jsdoc-scribe detect and document React, Next.js, Angular, Vue, Express, NestJS, and plain JS/TS projects, with real before/after JSDoc output for each.",
        body,
        currentPath: "examples.html",
        structuredData: {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Real-World Examples",
            description: "See jsdoc-scribe detect and document React, Next.js, Angular, Vue, Express, NestJS, and plain JS/TS projects, with real before/after JSDoc output for each.",
            url: absoluteUrl("examples.html"),
            author: { "@type": "Person", name: site.author },
            publisher: { "@type": "Organization", name: site.title }
        }
    }));
}

function writeCss() {
    const css = `
:root{--bg:#f5f4f0;--surface:#fff;--ink:#111;--muted:#5f5d57;--soft:#ebe8de;--line:rgba(17,17,17,.12);--accent:#5b4fe8;--accent-dark:#473bd0;--lime:#c6ff3d;--coral:#ff4b2e;--code:#111113;--code-text:#d7d2c8;--sidebar:#111113;--sidebar-text:#d7d2c8;--shadow:0 18px 50px rgba(17,17,17,.10);--brand-indigo:#4F46E5;--brand-indigo-700:#3730A3;--brand-coral:#FF6B4A;--brand-yellow:#FFC93C;--brand-teal:#14B8A6;--brand-pink:#F472B6;--npm-red:#CB3837;--surface-bg:#F8F9FC;--surface-white:#FFFFFF;--surface-border:#E5E7F0;--surface-code-bg:#1A1A2E;--text-heading:#14142B;--text-body:#4E4B66;--text-muted:#A0A3BD;--text-inverse:#FFFFFF;--guide-active-bg:#ECEAFB;--callout-tip-bg:#FFF6E0;--callout-tip-border:var(--brand-yellow);--callout-info-bg:#EEF2FF;--callout-info-border:var(--brand-indigo);--focus-ring:#4F46E5;font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 var(--font-family,inherit)}
a{color:inherit;text-decoration:none}
.site-header{height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 64px;background:var(--surface-white);border-bottom:1px solid var(--surface-border);position:sticky;top:0;z-index:20}
.brand{display:flex;align-items:center;gap:8px;font:800 20px/1 "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text-heading);min-width:0}
.top-links{display:flex;align-items:center;gap:24px}
.top-links a{font:500 14px/1 "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text-body)}
.top-links a:hover{color:var(--text-heading)}
.top-links a.active{color:var(--brand-indigo)}
.nav-right{display:flex;align-items:center;gap:16px}
.icon-link{display:grid;place-items:center;color:var(--text-heading)}
.icon-link svg{width:22px;height:22px;fill:currentColor}
.npm-badge{display:inline-flex;align-items:center;justify-content:center;height:24px;padding:0 10px;border-radius:999px;background:var(--npm-red);color:var(--text-inverse);font:800 12px/1 "Inter",sans-serif}
.hamburger{display:none;position:relative;z-index:41;flex-direction:column;justify-content:center;align-items:center;gap:5px;width:36px;height:36px;background:transparent;border:none;padding:6px;cursor:pointer;border-radius:6px}
.hamburger span{width:20px;height:2px;background:var(--text-heading);border-radius:2px;display:block;transition:transform .2s,opacity .2s}
.hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.hamburger.open span:nth-child(2){opacity:0}
.hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.drawer-backdrop{position:fixed;inset:0;background:rgba(20,20,43,.4);z-index:39}
.drawer-backdrop[hidden]{display:none}
.mobile-drawer{position:fixed;top:0;right:0;bottom:0;width:280px;background:var(--surface-white);box-shadow:-8px 0 24px rgba(20,20,43,.12);z-index:40;display:flex;flex-direction:column;padding:88px 24px 24px;transform:translateX(100%);transition:transform .25s ease}
.mobile-drawer[hidden]{display:none}
.mobile-drawer.open{transform:translateX(0)}
.mobile-drawer a{display:block;padding:14px 0;font:400 15px/1.2 "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text-heading)}
.mobile-drawer hr{border:none;border-top:1px solid var(--surface-border);margin:12px 0}
.drawer-icons{display:flex;align-items:center;gap:16px;margin-top:8px}
.top-links a:focus-visible,.icon-link:focus-visible,.npm-badge:focus-visible,.hamburger:focus-visible,.mobile-drawer a:focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}
.site-breadcrumb{display:flex;align-items:center;flex-wrap:wrap;gap:8px;color:#75716a;font-size:13px;margin:0 0 22px}
.site-breadcrumb a{color:#75716a}
.site-breadcrumb a:hover{color:var(--accent)}
.site-breadcrumb span[aria-current="page"]{color:#111;font-weight:700}
.crumb-separator{color:#b7b1a7;font-weight:400}
.landing-breadcrumb{padding:22px 7vw 0}
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
.docs-sidebar{position:fixed;top:64px;bottom:0;left:0;width:300px;padding:40px 24px;background:var(--surface-bg);overflow:auto}
.nav-link{display:block;padding:8px 16px;border-radius:999px;color:var(--text-body);font-size:13.5px;font-weight:400}
.nav-link:hover{color:var(--text-heading)}
.nav-link.active{background:var(--guide-active-bg);color:var(--brand-indigo);font-weight:600}
.docs-layout{margin-left:300px;max-width:900px;padding:64px 64px 96px}
.docs-content{min-width:0}
.docs-content h1{font-size:clamp(38px,6vw,68px);line-height:1;margin:0 0 16px}
.lead{font-size:20px;line-height:1.5;color:var(--muted);margin:0 0 34px}
.guide-switcher{display:none;margin:0 0 24px}
.guide-switcher>summary{list-style:none;cursor:pointer;padding:12px 16px;border-radius:999px;background:var(--surface-bg);border:1px solid var(--surface-border);font-size:14px;color:var(--text-heading);min-height:44px;display:flex;align-items:center}
.guide-switcher>summary::-webkit-details-marker{display:none}
.guide-switcher nav{padding:8px 4px;display:grid;gap:4px}
.doc-section{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:28px;margin:16px 0;scroll-margin-top:92px;box-shadow:0 10px 28px rgba(17,17,17,.04)}
.doc-section h2{font-size:24px;margin:0 0 12px}
.doc-section h3{font-size:18px;margin:24px 0 10px}
.doc-section p{color:var(--muted);margin:10px 0}
.doc-section ul{margin:10px 0 0;padding-left:22px;color:var(--muted)}
.doc-section li{margin:6px 0}
.doc-section code{background:#ece9df;padding:2px 5px;border-radius:4px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#222}
.code-wrap{position:relative}
.code-block{background:var(--code);color:var(--code-text);border-radius:8px;padding:18px;overflow:auto;margin:14px 0 0;font:13px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace}
.code-block code{background:transparent;color:inherit;padding:0}
.doc-section .code-block{background:var(--surface-code-bg);border-radius:10px;font:12px/1.6 "Roboto Mono",ui-monospace,SFMono-Regular,Menlo,monospace}
.doc-section .code-block .tok-cmt{color:var(--brand-teal)}
.callout{border-radius:12px;padding:16px 20px;margin:16px 0;font-size:15px;line-height:1.6;color:var(--text-body)}
.callout.tip{background:var(--callout-tip-bg);border-left:4px solid var(--callout-tip-border)}
.callout.info{background:var(--callout-info-bg);border-left:4px solid var(--callout-info-border)}
.copy-btn{border:1px solid var(--line);border-radius:7px;background:white;color:var(--ink);font-weight:700;font-size:12px;padding:7px 10px;cursor:pointer}
.code-wrap .copy-btn{position:absolute;right:10px;top:10px;background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.14);color:var(--code-text)}
.copy-btn.copied{background:var(--lime);color:var(--ink)}
.blog-home{padding:62px 7vw 90px}
.blog-hero{max-width:860px;margin-bottom:34px}
.blog-hero h1{font-size:clamp(42px,6vw,78px);line-height:.98;margin:0 0 18px}
.post-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.post-card{display:grid;grid-template-columns:220px 1fr;gap:0;background:var(--surface);border:1px solid var(--line);border-radius:8px;overflow:hidden;transition:transform .18s,box-shadow .18s,border-color .18s}
.post-card:hover{transform:translateY(-4px);border-color:var(--accent);box-shadow:0 14px 38px rgba(91,79,232,.12)}
.post-media{background:var(--soft);min-height:210px}
.post-media img{width:100%;height:100%;object-fit:cover;display:block}
.post-card-body{padding:22px}
.post-meta{color:var(--muted);font:700 12px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.04em}
.post-card h2{font-size:24px;line-height:1.15;margin:12px 0 10px}
.post-card p{color:var(--muted);margin:0 0 16px}
.tag-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.tag-row span{display:inline-flex;padding:6px 9px;border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.65);color:var(--muted);font-size:12px}
.article-layout{display:grid;grid-template-columns:minmax(0,820px) 300px;gap:38px;align-items:start;padding:62px 7vw 96px}
.article{min-width:0}
.article-header{margin-bottom:30px}
.article-header h1{font-size:clamp(42px,6vw,76px);line-height:.98;margin:0 0 18px}
.article>p{font-size:18px;line-height:1.75;color:var(--muted);margin:20px 0}
.article h2{font-size:34px;line-height:1.12;margin:42px 0 14px;scroll-margin-top:92px}
.article blockquote{margin:30px 0;padding:22px 26px;border-left:4px solid var(--accent);background:var(--surface);border-radius:8px;color:var(--ink);font-size:22px;line-height:1.45}
.article-figure{margin:28px 0;background:var(--surface);border:1px solid var(--line);border-radius:8px;overflow:hidden}
.article-figure img,.article-figure video{width:100%;display:block}
.article-figure figcaption{padding:12px 16px;color:var(--muted);font-size:14px}
.video-placeholder{position:relative}
.article-aside{position:sticky;top:92px;display:grid;gap:14px}
.share-link{display:block;padding:10px 0;color:var(--muted);border-bottom:1px solid var(--line)}
.share-link:hover{color:var(--accent)}
.medium-shell{max-width:1192px;margin:0 auto;padding:34px 24px 96px;background:#fff;min-height:calc(100vh - 68px)}
.medium-list-header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;padding:34px 0 30px;border-bottom:1px solid #e6e6e6}
.medium-kicker{margin:0 0 10px;color:#6b6b6b;font-size:14px}
.medium-list-header h1{font-size:44px;line-height:1.1;margin:0 0 10px;font-weight:800;letter-spacing:0}
.medium-list-header p{margin:0;color:#6b6b6b;max-width:620px;font-size:16px}
.medium-outline-btn{display:inline-flex;align-items:center;justify-content:center;border:1px solid #191919;border-radius:999px;min-height:38px;padding:0 16px;font-size:14px;white-space:nowrap}
.medium-outline-btn:hover{background:#191919;color:#fff}
.medium-tabs{display:flex;gap:30px;border-bottom:1px solid #e6e6e6;margin-bottom:10px;overflow:auto}
.medium-tabs a{padding:16px 0 14px;color:#6b6b6b;font-size:14px;white-space:nowrap}
.medium-tabs a.active{color:#191919;border-bottom:1px solid #191919}
.medium-list{display:grid}
.medium-row{display:grid;grid-template-columns:minmax(0,1fr) 168px;gap:28px;padding:34px 0;border-bottom:1px solid #e6e6e6;background:#fff}
.medium-row-main{min-width:0}
.medium-author-line{display:flex;align-items:center;gap:8px;color:#6b6b6b;font-size:13px;margin-bottom:12px}
.medium-author-line span+span::before{content:"";display:inline-block;width:3px;height:3px;border-radius:50%;background:#8a8a8a;margin-right:8px;vertical-align:middle}
.author-avatar{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#191919;color:#fff;font:700 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;flex:0 0 auto}
.author-avatar.large{width:44px;height:44px;font-size:14px}
.medium-row h2{font-size:22px;line-height:1.2;margin:0 0 8px;font-weight:800;letter-spacing:0}
.medium-row h2 a:hover{text-decoration:underline}
.medium-row p{margin:0;color:#6b6b6b;font-size:15px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.medium-row-footer{display:flex;align-items:center;gap:10px;margin-top:16px;color:#6b6b6b;font-size:13px}
.topic-pill{background:#f2f2f2;color:#6b6b6b;border-radius:999px;padding:5px 10px}
.medium-row-media{display:block;width:168px;height:112px;background:#f2f2f2;align-self:start}
.medium-row-media img{width:100%;height:100%;object-fit:cover;display:block}
.medium-article-shell{background:#fff;min-height:calc(100vh - 68px);padding:34px 24px 96px}
.medium-article{max-width:760px;margin:0 auto;position:relative}
.medium-article-header{margin-bottom:28px}
.medium-article-header .tag-row{margin:0 0 20px}
.medium-article-header .tag-row span{background:#f2f2f2;border-color:#f2f2f2;color:#6b6b6b}
.medium-article-header h1{font-family:Georgia,"Times New Roman",serif;font-size:clamp(40px,6vw,64px);line-height:1.05;font-weight:700;letter-spacing:0;margin:0 0 18px;color:#191919}
.medium-article-header .lead{font-size:22px;line-height:1.35;color:#6b6b6b;margin:0 0 24px}
.medium-byline{display:flex;align-items:center;gap:12px;color:#191919;border-top:1px solid #e6e6e6;border-bottom:1px solid #e6e6e6;padding:16px 0}
.medium-byline strong{display:block;font-size:14px;font-weight:600}
.medium-byline small{display:block;color:#6b6b6b;font-size:13px;margin-top:3px}
.medium-hero-image{margin:36px calc(50% - min(50vw - 24px, 980px) / 2);background:#f2f2f2}
.medium-hero-image img{width:100%;max-height:520px;object-fit:cover;display:block}
.medium-action-rail{position:fixed;right:28px;bottom:28px;display:grid;gap:10px;z-index:30}
.medium-action-rail a,.medium-action-rail button{display:grid;place-items:center;width:48px;height:48px;border:1px solid #e6e6e6;border-radius:999px;background:#fff;color:#6b6b6b;font:700 12px/1 var(--font-family,inherit);cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.08);transition:transform .16s,border-color .16s,color .16s,background .16s}
.medium-action-rail svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.medium-action-rail a:hover,.medium-action-rail button:hover{border-color:#191919;color:#191919;transform:translateY(-2px)}
.medium-action-rail button.copied{background:#191919;color:#fff;border-color:#191919}
.medium-article>p{font-family:Georgia,"Times New Roman",serif;font-size:21px;line-height:1.72;color:#242424;margin:28px 0}
.medium-article ul,.medium-article ol{font-family:Georgia,"Times New Roman",serif;font-size:21px;line-height:1.72;color:#242424;margin:20px 0;padding-left:30px}
.medium-article li{margin:8px 0}
.medium-article h2{font-size:30px;line-height:1.2;margin:52px 0 14px;color:#191919;letter-spacing:0}
.medium-article blockquote{font-family:Georgia,"Times New Roman",serif;margin:34px 0;padding:0 0 0 22px;border-left:3px solid #191919;color:#242424;font-size:26px;line-height:1.45;background:transparent;border-radius:0}
.medium-article .article-figure{margin:38px calc(50% - min(50vw - 24px, 900px) / 2);background:#fff;border:0;border-radius:0}
.medium-article .article-figure img,.medium-article .article-figure video{width:100%;display:block}
.medium-article .article-figure figcaption{text-align:center;color:#6b6b6b;font-size:13px;padding:10px 0 0}
.medium-article .code-wrap{margin:30px 0}
.medium-article .code-block{border-radius:4px}
.medium-back-link{display:block;max-width:760px;margin:46px auto 0;color:#6b6b6b;font-size:14px}
.medium-back-link:hover{color:#191919;text-decoration:underline}
.related-posts{margin:56px 0 8px;padding-top:36px;border-top:1px solid #e6e6e6}
.related-posts h2{font-size:22px;line-height:1.2;margin:0 0 18px;color:#191919;letter-spacing:0}
.related-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.related-card{display:block;padding:18px;border:1px solid var(--line);border-radius:8px;background:var(--surface);transition:transform .18s,box-shadow .18s,border-color .18s}
.related-card:hover{transform:translateY(-3px);border-color:var(--accent);box-shadow:0 12px 30px rgba(91,79,232,.12)}
.related-kicker{display:block;color:var(--accent);font:700 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}
.related-card strong{display:block;font-size:15px;line-height:1.35;color:var(--ink)}
.related-meta{display:block;margin-top:8px;color:var(--muted);font-size:12px}
.changelog h2:first-child{margin-top:0}
.changelog-note{background:#fffbe7}
.reveal{opacity:0;transform:translateY(14px);transition:opacity .5s ease,transform .5s ease;transition-delay:var(--delay,0ms)}
.reveal.visible{opacity:1;transform:none}
@media (max-width:1180px){.article-layout{grid-template-columns:minmax(0,1fr);padding-right:28px}.article-aside{position:static;grid-template-columns:repeat(2,minmax(0,1fr))}.post-grid{grid-template-columns:1fr}.medium-hero-image,.medium-article .article-figure{margin-left:0;margin-right:0}}
@media (max-width:1024px){.site-header{padding:0 20px}.top-links,.nav-right{display:none}.hamburger{display:flex}.docs-sidebar{display:none}.docs-layout{margin-left:0;max-width:none;padding:38px 20px 70px}.guide-switcher{display:block}}
@media (max-width:980px){.hero{grid-template-columns:1fr;min-height:auto;padding-top:54px}.feature-grid,.workflow-grid,.related-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.workflow-band{grid-template-columns:1fr}.workflow-copy{position:static}.article-layout,.blog-home{padding:38px 20px 70px}.medium-shell,.medium-article-shell{padding:38px 20px 70px}}
@media (max-width:640px){.hero{padding:42px 20px}.feature-band,.workflow-band{padding:46px 20px}.feature-grid,.workflow-grid,.article-aside,.related-grid{grid-template-columns:1fr}.hero h1{font-size:46px}.hero-console{font-size:13px}.demo-tabs{grid-template-columns:1fr}.post-card,.medium-row{grid-template-columns:1fr}.post-media{min-height:180px}.medium-row-media{width:100%;height:180px;order:-1}.medium-list-header{display:block}.medium-outline-btn{margin-top:18px}.medium-article-header h1,.blog-hero h1,.medium-list-header h1{font-size:42px}.medium-article>p{font-size:19px}.medium-article blockquote{font-size:23px}.medium-action-rail{right:16px;bottom:16px}.medium-action-rail a,.medium-action-rail button{width:44px;height:44px}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}.reveal{opacity:1;transform:none}}
/* TASK-F14-03B — Examples page (examples.html) */
.examples-hero{padding:64px 7vw 32px}
.examples-hero .eyebrow{margin:0 0 12px;color:var(--brand-indigo);font:700 12px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.08em}
.examples-hero h1{font:800 56px/64px "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0 0 16px;color:var(--text-heading)}
.examples-hero .lead{font:400 18px/28px "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text-body);max-width:760px;margin:0}
.examples-hero .lead a{color:var(--brand-indigo);text-decoration:underline}
.examples-section{padding:0 7vw 64px}
.examples-section h2{font:700 36px/44px "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text-heading);margin:0 0 20px;scroll-margin-top:92px}
.examples-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
@media(max-width:1024px){.examples-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:768px){.examples-grid{grid-template-columns:1fr}}
.example-card{background:var(--surface-white);border:1px solid var(--surface-border);border-radius:12px;padding:20px}
.example-icon{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;color:var(--text-inverse);font:700 13px/1 "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin-bottom:14px}
.example-icon.icon-contrast{color:var(--text-heading)}
.example-card h2{font:700 16px/24px "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0 0 4px;color:var(--text-heading);scroll-margin-top:92px}
.example-detected{font:400 13px/18px "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text-muted);margin:0 0 10px}
.example-path{font:400 13px/20px "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text-body);word-break:break-all;margin:0}
.example-stub-note{font:400 13px/20px "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text-muted);font-style:italic;margin:0}
.compare-intro{max-width:780px;margin:0 0 20px;color:var(--text-body);font-size:15px;line-height:1.6}
.compare-intro a{color:var(--brand-indigo);text-decoration:underline}
.compare-intro code{background:var(--surface-bg);padding:2px 5px;border-radius:4px;font-family:"Roboto Mono",ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--text-heading)}
.compare{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0}
@media(max-width:768px){.compare{grid-template-columns:1fr}}
.compare-panel{background:var(--surface-code-bg);border-radius:10px;padding:18px;overflow:auto}
.compare-pill{display:inline-flex;padding:4px 10px;border-radius:999px;font:600 12px/16px "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.4px;text-transform:uppercase;margin-bottom:12px}
.compare-pill.before{background:var(--brand-coral);color:var(--text-heading)}
.compare-pill.after{background:var(--brand-teal);color:var(--text-heading)}
.compare-panel pre{margin:0;font:12px/1.6 "Roboto Mono",ui-monospace,SFMono-Regular,Menlo,monospace;color:#d7d2c8;white-space:pre}
.compare-panel .added-line{background:rgba(20,184,166,.18);display:block;margin:0 -18px;padding:0 18px}
.chrome-mock{border:1px solid var(--surface-border);border-radius:12px;overflow:hidden;background:var(--surface-white);max-width:780px}
.chrome-bar{display:flex;align-items:center;gap:16px;padding:12px 16px;background:var(--surface-bg);border-bottom:1px solid var(--surface-border)}
.chrome-dots{display:flex;gap:6px}
.chrome-dots .traffic-dot{width:10px;height:10px;border-radius:50%;background:var(--brand-coral)}
.chrome-dots .traffic-dot:nth-child(2){background:var(--brand-yellow)}
.chrome-dots .traffic-dot:nth-child(3){background:var(--brand-teal)}
.chrome-url-pill{flex:1;background:var(--surface-white);border:1px solid var(--surface-border);border-radius:999px;padding:6px 14px;font:400 12px/16px "Roboto Mono",ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--text-muted)}
.chrome-body{display:grid;grid-template-columns:180px 1fr;min-height:220px}
.chrome-mini-sidebar{background:var(--surface-bg);padding:16px;border-right:1px solid var(--surface-border);font:400 12px "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text-body)}
.chrome-mini-sidebar div{padding:6px 0}
.chrome-mini-sidebar .chrome-active{color:var(--brand-indigo);font-weight:600}
.chrome-content{padding:20px}
.chrome-signature{display:inline-block;background:var(--surface-code-bg);color:var(--text-inverse);border-radius:8px;padding:8px 14px;font:12px "Roboto Mono",ui-monospace,SFMono-Regular,Menlo,monospace;margin-bottom:14px}
.chrome-param-table{width:100%;border-collapse:collapse;font-size:13px}
.chrome-param-table th,.chrome-param-table td{text-align:left;padding:6px 10px;border-bottom:1px solid var(--surface-border);color:var(--text-body)}
@media(max-width:768px){.examples-hero h1{font-size:36px;line-height:1.1}.examples-section h2{font-size:26px;line-height:1.2}.chrome-body{grid-template-columns:1fr}.chrome-mini-sidebar{border-right:none;border-bottom:1px solid var(--surface-border)}}
@media(max-width:375px){.examples-hero{padding:40px 20px 24px}.examples-section{padding:0 20px 48px}}
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
                var iconMode = button.getAttribute("data-copy-mode") === "icon";
                var old = iconMode ? button.getAttribute("title") : button.textContent;
                if (!iconMode) button.textContent = "Copied";
                if (iconMode) button.setAttribute("title", "Copied");
                button.classList.add("copied");
                setTimeout(function(){
                    if (!iconMode) button.textContent = old;
                    if (iconMode) button.setAttribute("title", old || "Copy article link");
                    button.classList.remove("copied");
                }, 1300);
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
    var navToggle = document.getElementById("nav-toggle");
    var navDrawer = document.getElementById("mobile-drawer");
    var navBackdrop = document.getElementById("drawer-backdrop");
    if (navToggle && navDrawer && navBackdrop) {
        var drawerLinks = navDrawer.querySelectorAll("a");
        function openDrawer(){
            navDrawer.hidden = false;
            navBackdrop.hidden = false;
            requestAnimationFrame(function(){
                navDrawer.classList.add("open");
                navToggle.classList.add("open");
            });
            navToggle.setAttribute("aria-expanded", "true");
            document.body.style.overflow = "hidden";
            if (drawerLinks.length) drawerLinks[0].focus();
        }
        function closeDrawer(){
            var wasOpen = navToggle.getAttribute("aria-expanded") === "true";
            navDrawer.classList.remove("open");
            navToggle.classList.remove("open");
            navToggle.setAttribute("aria-expanded", "false");
            document.body.style.overflow = "";
            setTimeout(function(){
                navDrawer.hidden = true;
                navBackdrop.hidden = true;
            }, 250);
            if (wasOpen) navToggle.focus();
        }
        navToggle.addEventListener("click", function(){
            var open = navToggle.getAttribute("aria-expanded") === "true";
            if (open) closeDrawer(); else openDrawer();
        });
        navBackdrop.addEventListener("click", closeDrawer);
        document.addEventListener("keydown", function(e){
            if (e.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") closeDrawer();
        });
        drawerLinks.forEach(function(link){
            link.addEventListener("click", closeDrawer);
        });
    }
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
        "--base-url",
        absoluteUrl("api/"),
        "--description",
        "API reference for jsdoc-scribe's gen-comments, gen-docs, and lint modules — generated directly from the source's own JSDoc.",
        "--json"
    ], { cwd: root, stdio: "inherit" });
    if (result.status !== 0) process.exit(result.status || 1);
}

/**
 * Walks the built API section and returns every generated .html page as a
 * sitemap-relative path (e.g. "api/modules/lib__extractor.html"). Runs after
 * buildApiDocs()/enhanceApiDocs() so writeSeoFiles() can list each of the
 * ~30-40 individual module/health-detail/architecture pages instead of just
 * api/index.html — the sitemap gap both SEO audits' page-count didn't catch
 * (they only checked the homepage) but a full-site review should.
 */
function listApiPages() {
    const apiOutDir = path.join(outDir, "api");
    if (!fs.existsSync(apiOutDir)) return [];
    const results = [];
    (function walk(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.isFile() && entry.name.endsWith(".html")) {
                results.push(path.relative(outDir, full).split(path.sep).join("/"));
            }
        }
    })(apiOutDir);
    return results.sort();
}

function enhanceApiDocs() {
    const apiOutDir = path.join(outDir, "api");
    const htmlFiles = [];

    function walk(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            if (entry.isFile() && entry.name.endsWith(".html")) htmlFiles.push(full);
        }
    }

    walk(apiOutDir);
    for (const file of htmlFiles) {
        const isModulePage = file.includes(`${path.sep}modules${path.sep}`);
        let html = fs.readFileSync(file, "utf8")
            .replace(/<span class="version-switcher-static">Current<\/span>/g, `<span class="version-switcher-static">v${esc(pkg.version)}</span>`);

        if (isModulePage) {
            html = html.replace(
                /<div class="breadcrumb"><a href="\.\.\/index\.html">jsdoc-scribe API<\/a> \/ /,
                '<div class="breadcrumb"><a href="../../index.html">Home</a> / <a href="../index.html">API Reference</a> / '
            );
        } else if (!html.includes('<div class="breadcrumb">')) {
            html = html.replace(
                '<div class="page-header">',
                '<div class="page-header"><div class="breadcrumb"><a href="../index.html">Home</a> / API Reference</div>'
            );
        }

        fs.writeFileSync(file, html);
    }

    const cssPath = path.join(apiOutDir, "assets", "style.css");
    fs.appendFileSync(cssPath, `
.topnav{background:#101012;border-bottom-color:rgba(255,255,255,.12);box-shadow:0 10px 28px rgba(0,0,0,.16)}
.topnav-crumb,.topnav-crumb a,.version-switcher-static{color:#d7d2c8}
.topnav-crumb a:hover{color:#fff}
.search-box{background:#18181b;border-color:rgba(255,255,255,.14);color:#f5f4f0}
.search-box:focus{background:#202024;border-color:var(--lime)}
.search-kbd{background:rgba(255,255,255,.12);color:#d7d2c8}
.hamburger span{background:#d7d2c8}
.breadcrumb{display:flex;flex-wrap:wrap;gap:8px;color:#75716a;font-size:13px;margin-bottom:12px}
.breadcrumb a{color:#75716a}
.breadcrumb a:hover{color:var(--accent)}
`);
}

function copyAssetPreviews() {
    const assetsDir = path.join(root, "assets");
    if (!fs.existsSync(assetsDir)) return;
    ensureDir(path.join(outDir, "assets"));
    for (const name of fs.readdirSync(assetsDir)) {
        const src = path.join(assetsDir, name);
        if (fs.statSync(src).isFile()) fs.copyFileSync(src, path.join(outDir, "assets", name));
    }
}

/**
 * Copies every file in docs-site/static/ verbatim to the built site's root
 * (_site/). For static, unmodified files that must live at the domain root
 * to work — search-engine ownership verification files (Google/Bing), a
 * future CNAME for a custom domain, favicon.ico, etc. Anything dropped in
 * docs-site/static/ ships as-is on the next deploy, no code change needed.
 */
function copyStaticRootFiles() {
    const staticDir = path.join(root, "docs-site", "static");
    if (!fs.existsSync(staticDir)) return;
    for (const name of fs.readdirSync(staticDir)) {
        const src = path.join(staticDir, name);
        if (fs.statSync(src).isFile()) fs.copyFileSync(src, path.join(outDir, name));
    }
}

function writeSeoFiles() {
    const apiPages = listApiPages();
    const urls = [
        { loc: "index.html", priority: "1.0" },
        { loc: "blog/index.html", priority: "0.8" },
        // TASK-F14-03B — new Examples page, no legacy URL to preserve (ADR
        // Decision §2: this question doesn't apply to a net-new page).
        { loc: "examples.html", priority: "0.8" },
        ...site.pages.map((page) => ({ loc: `docs/${page.slug}.html`, priority: "0.8" })),
        ...site.posts.map((post) => ({ loc: `blog/${post.slug}.html`, priority: "0.7", lastmod: post.date })),
        // api/index.html gets the higher priority explicitly; every other API
        // page (modules/*, architecture.html, health-*.html) is a real,
        // individually-indexable page and belongs in the sitemap too — not
        // just the section's landing page.
        ...apiPages.map((loc) => ({ loc, priority: loc === "api/index.html" ? "0.7" : "0.5" }))
    ];
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((entry) => `  <url>
    <loc>${esc(absoluteUrl(entry.loc))}</loc>
    ${entry.lastmod ? `<lastmod>${esc(entry.lastmod)}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
    writeFile(path.join(outDir, "sitemap.xml"), sitemap);
    writeFile(path.join(outDir, "robots.txt"), `User-agent: *
Allow: /

Sitemap: ${absoluteUrl("sitemap.xml")}
`);
    const rssItems = site.posts.map((post) => `<item>
    <title>${esc(post.title)}</title>
    <link>${esc(absoluteUrl(`blog/${post.slug}.html`))}</link>
    <guid>${esc(absoluteUrl(`blog/${post.slug}.html`))}</guid>
    <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
    <description>${esc(post.description)}</description>
  </item>`).join("\n");
    writeFile(path.join(blogDir, "rss.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>jsdoc-scribe Blog</title>
  <link>${esc(absoluteUrl("blog/index.html"))}</link>
  <description>${esc(site.description)}</description>
  <language>en</language>
  ${rssItems}
</channel>
</rss>
`);
}

function main() {
    loadMarkdownContent();
    cleanDir(outDir);
    buildApiDocs();
    enhanceApiDocs();
    writeCss();
    writeClientJs();
    copyAssetPreviews();
    copyStaticRootFiles();
    renderLanding();
    site.pages.forEach(renderDocPage);
    renderBlogIndex();
    site.posts.forEach(renderBlogPost);
    // TASK-F14-03B — Examples page: generateExamplesData() shells the real
    // CLI out per framework (in-process require(), never reads the optional
    // docs-site/data/examples.json debug artifact), so this is never stale.
    const examplesData = generateExamplesData();
    renderExamplesPage(examplesData.entries);
    writeSeoFiles();
    writeFile(path.join(outDir, "docs", "index.html"), '<meta http-equiv="refresh" content="0; url=quick-start.html">');
    console.log(`Built ${site.title} documentation site for v${pkg.version} in ${path.relative(root, outDir)}`);
}

main();
