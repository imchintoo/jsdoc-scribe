---
slug: programmatic-api
title: Programmatic API
description: Call jsdoc-scribe from Node when a script or tool needs direct control.
command: require('jsdoc-scribe/docs')
---

## What the API is for

The programmatic API is for scripts, build tools, custom CLIs, and repository automation that need jsdoc-scribe behavior without shelling out to terminal commands. It gives direct access to comment generation, file analysis, docs extraction, site generation, and linting.

Use it when you are building a custom workflow around documentation. For example, a monorepo can collect package folders, run docs generation per package, and publish a combined site from one Node script.

## Why choose API over CLI

Choose the CLI when a simple command is enough. Choose the API when you need to compose jsdoc-scribe with other Node logic, transform inputs before generation, collect results, or integrate with an existing release tool.

The API is also useful for maintainers who want deterministic documentation checks inside their own scripts while still keeping CI output readable.

## Comments API

Use the root export for comment generation and file analysis.

```js
const { processFile, analyseFile, collectFiles } = require('jsdoc-scribe');

await processFile('src/auth.ts', { write: true });
```

## Docs API

Use the docs subpath to extract module data or build pages.

```js
const { generateSite, extractModule } = require('jsdoc-scribe/docs');

const pages = await generateSite(['src'], { projectName: 'My Project' });
```

## Lint API

Use the lint subpath when you want to run the same validations in a custom pipeline.

```js
const { lintModule } = require('jsdoc-scribe/lint');

const issues = lintModule(moduleData);
```

## Who maintains this flow

This flow is best owned by the same people who own build and release automation. Keep the script in the repository, document the expected inputs, and run it in CI so every contributor gets the same behavior.
