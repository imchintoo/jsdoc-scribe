"use strict";

const site = {
    title: "jsdoc-scribe",
    tagline: "Deterministic JSDoc comments and static documentation for JavaScript and TypeScript.",
    description: "Generate JSDoc from the AST, validate it in CI, and publish a static documentation site without AI, network calls, or runtime surprises.",
    features: [
        { title: "AST-based comments", body: "gen-comments reads JavaScript and TypeScript syntax trees, then writes stable JSDoc blocks for named declarations." },
        { title: "Static docs site", body: "gen-docs builds a searchable multi-page HTML reference from documented source files." },
        { title: "CI-ready checks", body: "Use check, drift, lint, and fix modes as plain exit-code based gates in GitHub Actions." },
        { title: "ESLint integration", body: "The companion ESLint plugin exposes jsdoc-scribe lint rules inside existing flat-config projects." }
    ],
    pages: [
        {
            slug: "quick-start",
            title: "Quick Start",
            description: "Install jsdoc-scribe and generate your first comments and docs site.",
            sections: [
                { title: "Install", body: ["Run once with npx, add it to one project, or install it globally.", { code: "npx jsdoc-scribe . --write\nnpm install --save-dev jsdoc-scribe\nnpm install -g jsdoc-scribe" }] },
                { title: "Add JSDoc comments", body: ["Start with a dry run when you want to preview generated blocks.", { code: "npx gen-comments src --dry-run" }, "When the output looks right, write the comments in place.", { code: "npx gen-comments src --write" }] },
                { title: "Generate a docs site", body: ["Build static HTML into a folder that can be committed, previewed, or deployed.", { code: "npx gen-docs src --out docs --title \"My Project\"" }, "Open docs/index.html locally, or deploy the folder with GitHub Pages."] }
            ]
        },
        {
            slug: "cli",
            title: "CLI Usage",
            description: "Use gen-comments, gen-docs, lint, and fix from the terminal or CI.",
            sections: [
                { title: "gen-comments", body: ["Generate JSDoc comments from source files. By default it writes sibling .out files for review; --write edits files in place.", { code: "gen-comments src --dry-run\ngen-comments src --write\ngen-comments src --force --write" }] },
                { title: "Coverage and drift checks", body: ["--check fails when public symbols are missing JSDoc. --check-drift fails when existing JSDoc no longer matches the AST.", { code: "gen-comments src --check\ngen-comments src --check-drift" }] },
                { title: "Lint and fix", body: ["--lint validates existing JSDoc content. Add --fix to rewrite issues that can be corrected safely.", { code: "gen-comments src --lint\ngen-comments src --lint --fix" }] },
                { title: "gen-docs", body: ["Build a static documentation site from documented files. Use --source-url to link symbols back to GitHub.", { code: "gen-docs src --out docs --title \"My API\" --source-url https://github.com/user/repo/blob/main" }] }
            ]
        },
        {
            slug: "github-actions",
            title: "GitHub Actions Integration",
            description: "Run JSDoc coverage, drift, lint, and docs publishing from CI.",
            sections: [
                { title: "PR quality gate", body: ["Use separate steps so failed checks are easy to understand in the Actions UI.", { code: "name: JSDoc quality gate\non:\n  pull_request:\n    branches: [main]\njobs:\n  jsdoc:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: npm\n      - run: npm ci\n      - name: Fail if anything is undocumented\n        run: npx gen-comments src --check\n      - name: Fail if JSDoc has drifted\n        run: npx gen-comments src --check-drift\n      - name: Fail if JSDoc content is invalid\n        run: npx gen-comments src --lint" }] },
                { title: "Docs build artifact", body: ["The docs build can be uploaded as a Pages artifact or kept as a CI artifact for review."] }
            ]
        },
        {
            slug: "github-pages",
            title: "GitHub Pages Deployment",
            description: "Publish generated documentation to GitHub Pages with the official Pages actions.",
            sections: [
                { title: "Repository setting", body: ["In GitHub, open Settings, then Pages, and set Source to GitHub Actions."] },
                { title: "Deployment workflow", body: ["Generate into _site, upload the Pages artifact, then deploy it.", { code: "name: Deploy docs\non:\n  push:\n    branches: [main]\n  workflow_dispatch:\npermissions:\n  contents: read\n  pages: write\n  id-token: write\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 24\n          cache: npm\n      - run: npm ci\n      - run: npm run docs:pages\n      - uses: actions/upload-pages-artifact@v3\n        with:\n          path: _site\n  deploy:\n    needs: build\n    runs-on: ubuntu-latest\n    environment:\n      name: github-pages\n      url: ${{ steps.deployment.outputs.page_url }}\n    steps:\n      - id: deployment\n        uses: actions/deploy-pages@v4" }] }
            ]
        },
        {
            slug: "programmatic-api",
            title: "Programmatic API",
            description: "Call jsdoc-scribe from Node when a script or tool needs direct control.",
            sections: [
                { title: "Comments API", body: ["Use the root export for comment generation and file analysis.", { code: "const { processFile, analyseFile, collectFiles } = require('jsdoc-scribe');\n\nawait processFile('src/auth.ts', { write: true });" }] },
                { title: "Docs API", body: ["Use the docs subpath to extract module data or build pages.", { code: "const { generateSite, extractModule } = require('jsdoc-scribe/docs');\n\nconst pages = await generateSite(['src'], { projectName: 'My Project' });" }] },
                { title: "Lint API", body: ["Use the lint subpath when you want to run the same validations in a custom pipeline.", { code: "const { lintModule } = require('jsdoc-scribe/lint');\n\nconst issues = lintModule(moduleData);" }] }
            ]
        },
        {
            slug: "eslint-plugin",
            title: "ESLint Plugin Integration",
            description: "Use jsdoc-scribe lint rules through ESLint flat config.",
            sections: [
                { title: "Install", body: ["Install the plugin package next to ESLint.", { code: "npm install --save-dev eslint eslint-plugin-jsdoc-scribe" }] },
                { title: "Flat config", body: ["Add the plugin to eslint.config.js and enable the rules you want enforced.", { code: "const jsdocScribe = require('eslint-plugin-jsdoc-scribe');\n\nmodule.exports = [\n  {\n    files: ['**/*.{js,ts,tsx}'],\n    plugins: {\n      'jsdoc-scribe': jsdocScribe\n    },\n    rules: {\n      'jsdoc-scribe/require-jsdoc': 'warn',\n      'jsdoc-scribe/require-param': 'error',\n      'jsdoc-scribe/require-returns': 'error'\n    }\n  }\n];" }] }
            ]
        },
        {
            slug: "features",
            title: "Features",
            description: "A compact map of the main jsdoc-scribe capabilities.",
            sections: [
                { title: "Comment generation", body: ["Generates JSDoc for named functions, classes, methods, interfaces, enums, types, and variables using syntax only."] },
                { title: "Documentation generation", body: ["Builds static multi-page documentation with module navigation, symbol cards, search data, and optional quality dashboard data."] },
                { title: "Quality tools", body: ["Supports check, drift, lint, fix, coverage badges, JSON output, quality reports, import graph analysis, and GitHub source links."] },
                { title: "Deterministic by design", body: ["No AI calls, no network calls during generation, and the same input should produce the same output."] }
            ]
        },
        { slug: "changelog", title: "Changelog", description: "Release history from the repository CHANGELOG.md.", changelog: true, sections: [] }
    ]
};

module.exports = site;
