---
slug: programmatic-api
title: Programmatic API
description: Call jsdoc-scribe from Node when a script or tool needs direct control.
command: require('jsdoc-scribe/docs')
---

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
