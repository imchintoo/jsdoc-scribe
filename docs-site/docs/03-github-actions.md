---
slug: github-actions
title: GitHub Actions Integration
description: Run JSDoc coverage, drift, lint, and docs publishing from CI.
command: npx gen-comments src --check
---

## PR quality gate

Use separate steps so failed checks are easy to understand in the Actions UI.

```yaml
name: JSDoc quality gate
on:
  pull_request:
    branches: [main]
jobs:
  jsdoc:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Fail if anything is undocumented
        run: npx gen-comments src --check
      - name: Fail if JSDoc has drifted
        run: npx gen-comments src --check-drift
      - name: Fail if JSDoc content is invalid
        run: npx gen-comments src --lint
```

## Docs build artifact

The docs build can be uploaded as a Pages artifact or kept as a CI artifact for review.
