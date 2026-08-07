---
slug: eslint-plugin
title: ESLint Plugin Integration
description: Use jsdoc-scribe lint rules through ESLint flat config.
command: require('eslint-plugin-jsdoc-scribe')
---

## What the ESLint integration does

The ESLint plugin brings documentation rules into the same feedback loop developers already use for code quality. Instead of running a separate command manually, editors and CI can report JSDoc problems through ESLint.

Use this when your team already has ESLint in place and wants documentation quality to appear next to regular lint problems. It helps contributors fix missing params, missing return information, and required JSDoc coverage before review.

## Why use it with jsdoc-scribe

The CLI is strong for generation and full repository checks. The ESLint plugin is strong for continuous feedback while a developer is editing files. Together, they cover both authoring and enforcement.

For strict teams, start with warnings locally and errors in CI. That gives contributors time to adapt while still protecting the main branch.

## Install

**Not yet published to npm** -- `eslint-plugin-jsdoc-scribe` currently only ships as a workspace
package inside this monorepo (`packages/eslint-plugin-jsdoc-scribe`), consumed internally by this
repo's own `eslint.config.js` via npm workspaces. `npm install eslint-plugin-jsdoc-scribe` in an
external project will fail with a 404 until it's published standalone.

Until then, use it in one of two ways:

```bash
# Option 1: clone this repo and depend on the workspace package directly
# (packages/eslint-plugin-jsdoc-scribe), same as this repo's own eslint.config.js does.

# Option 2: copy packages/eslint-plugin-jsdoc-scribe/ into your own repo and
# require it by relative path instead of by package name.
```

## Flat config

Add the plugin to eslint.config.js and enable the rules you want enforced.

```js
const jsdocScribe = require('eslint-plugin-jsdoc-scribe');

module.exports = [
  {
    files: ['**/*.{js,ts,tsx}'],
    plugins: {
      'jsdoc-scribe': jsdocScribe
    },
    rules: {
      'jsdoc-scribe/require-jsdoc': 'warn',
      'jsdoc-scribe/require-param': 'error',
      'jsdoc-scribe/require-returns': 'error'
    }
  }
];
```

## Team rollout

Roll this out folder by folder if the repository has a lot of undocumented legacy code. New packages can use stricter rules immediately, while older packages can start with warnings and move to errors after jsdoc-scribe has generated baseline comments.
