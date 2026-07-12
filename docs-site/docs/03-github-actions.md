---
slug: github-actions
title: GitHub Actions Integration
description: Run JSDoc coverage, drift, lint, and docs publishing from CI.
command: npx gen-comments src --check
---

## What CI integration gives you

GitHub Actions turns documentation from a best-effort habit into a visible quality gate. Every pull request can prove that public functions, classes, and modules are documented before the code is merged.

This is useful for maintainers, reviewers, and contributors. Maintainers get predictable standards, reviewers get smaller manual review burden, and contributors get immediate feedback with the exact command that failed.

## Why separate checks

Keep coverage, drift, and lint as separate workflow steps. Separate steps make the Actions UI easier to understand because a contributor can see whether the problem is missing comments, outdated comments, or invalid JSDoc content.

Coverage checks answer "is documentation present?" Drift checks answer "does documentation still match the code?" Lint checks answer "is the documentation structured correctly enough for tools and readers?"

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

The docs build can be uploaded as a Pages artifact or kept as a CI artifact for review. Use an artifact when you want reviewers to inspect generated HTML before publishing, and use Pages deployment when main branch should always publish the latest docs.
