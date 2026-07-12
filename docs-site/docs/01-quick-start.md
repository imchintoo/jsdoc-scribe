---
slug: quick-start
title: Quick Start
description: Install jsdoc-scribe and generate your first comments and docs site.
command: npx gen-comments src --write
---

## Overview

Quick Start takes an existing JavaScript or TypeScript project from undocumented source code to generated JSDoc comments and a browsable static documentation site. It is the recommended first workflow when you want to evaluate jsdoc-scribe before adding CI checks, GitHub Pages deployment, or ESLint rules.

The goal is simple: document the code you already have, review the generated output, then publish reliable docs from the same repository. jsdoc-scribe reads project structure, generates repeatable JSDoc blocks, and builds static HTML that can be served by GitHub Pages or any static host.

## Recommended workflow

Start with a dry run so you can inspect the generated comments without modifying files. This is especially useful in repositories with an existing documentation style, active pull requests, or multiple maintainers who need to review the first automation pass.

After the preview looks correct, run the write command and commit the generated comments like regular source changes. From there, use CLI checks in CI to keep documentation coverage, drift, and lint quality consistent.

## Install

Run once with npx for a quick trial, install it as a dev dependency for team projects, or install it globally for personal command-line usage. For production repositories, the project-level dev dependency is usually the best option because local development and CI use the same version.

```bash
npx jsdoc-scribe . --write
npm install --save-dev jsdoc-scribe
npm install -g jsdoc-scribe
```

## Add JSDoc comments

Generate comments against a project folder, a source folder, or a specific file. Start narrow when introducing the tool to an existing repository, then expand to the full source tree after the output matches your expectations.

```bash
npx gen-comments src --dry-run
```

When the preview is ready, write the comments in place. Review the diff carefully, make any human edits that improve clarity, and commit the result so future drift checks have a stable baseline.

```bash
npx gen-comments src --write
```

## Generate a docs site

Build static HTML into an output folder that can be previewed locally, uploaded as a CI artifact, or deployed to GitHub Pages. The docs site becomes the public reading experience for maintainers, package users, and contributors.

```bash
npx gen-docs src --out docs --title "My Project"
```

Open docs/index.html locally to review the site. After this first pass, continue to CLI Usage to choose the right commands for coverage checks, drift detection, linting, fixes, and automated publishing.
