---
slug: quick-start
title: Quick Start
description: Install jsdoc-scribe and generate your first comments and docs site.
command: npx gen-comments src --write
---

## Install

Run once with npx, add it to one project, or install it globally.

```bash
npx jsdoc-scribe . --write
npm install --save-dev jsdoc-scribe
npm install -g jsdoc-scribe
```

## Add JSDoc comments

Start with a dry run when you want to preview generated blocks.

```bash
npx gen-comments src --dry-run
```

When the output looks right, write the comments in place.

```bash
npx gen-comments src --write
```

## Generate a docs site

Build static HTML into a folder that can be committed, previewed, or deployed.

```bash
npx gen-docs src --out docs --title "My Project"
```

Open docs/index.html locally, or deploy the folder with GitHub Pages.
