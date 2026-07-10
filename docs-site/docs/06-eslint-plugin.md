---
slug: eslint-plugin
title: ESLint Plugin Integration
description: Use jsdoc-scribe lint rules through ESLint flat config.
command: npm install -D eslint-plugin-jsdoc-scribe
---

## Install

Install the plugin package next to ESLint.

```bash
npm install --save-dev eslint eslint-plugin-jsdoc-scribe
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
