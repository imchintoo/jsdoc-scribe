"use strict";

const site = {
    title: "jsdoc-scribe",
    baseUrl: "https://imchintoo.github.io/jsdoc-scribe/",
    author: "Chintan Goswami",
    locale: "en_US",
    image: "assets/preview.svg",
    keywords: [
        "jsdoc generator",
        "javascript documentation",
        "typescript documentation",
        "static documentation generator",
        "JSDoc CLI",
        "GitHub Pages documentation",
        "ESLint JSDoc"
    ],
    tagline: "Deterministic JSDoc comments and static documentation for JavaScript and TypeScript.",
    description: "Generate JSDoc from the AST, validate it in CI, and publish a static documentation site without AI, network calls, or runtime surprises.",
    features: [
        { title: "AST-based comments", body: "gen-comments reads JavaScript and TypeScript syntax trees, then writes stable JSDoc blocks for named declarations." },
        { title: "Static docs site", body: "gen-docs builds a searchable multi-page HTML reference from documented source files." },
        { title: "CI-ready checks", body: "Use check, drift, lint, and fix modes as plain exit-code based gates in GitHub Actions." },
        { title: "ESLint integration", body: "The companion ESLint plugin exposes jsdoc-scribe lint rules inside existing flat-config projects." }
    ]
};

module.exports = site;
