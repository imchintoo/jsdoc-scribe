---
slug: cli
title: CLI Usage
description: Use gen-comments, gen-docs, lint, and fix from the terminal or CI.
command: gen-docs src --out docs
---

## What the CLI does

The CLI is the daily interface for jsdoc-scribe. It is designed for local development, pull request checks, release scripts, and documentation publishing. You can generate comments, verify coverage, detect drift, lint JSDoc quality, fix safe issues, and build a static docs site.

Use the CLI when you want repeatable behavior that can be copied into package scripts or GitHub Actions. It gives clear exit codes, so a failing documentation rule can stop a CI job before incomplete docs reach main.

## Who should use each command

Use `gen-comments` when source files need JSDoc comments or when existing comments need validation. Use `gen-docs` when documented source needs to become a static website. Use lint and fix modes when you want documentation quality to be enforced the same way formatting or tests are enforced.

Most teams start with dry-run generation locally, then add check and lint commands in CI, then publish docs from the same source on every main branch push.

## gen-comments

Generate JSDoc comments from source files. By default it writes sibling .out files for review; --write edits files in place. Use --force only when you intentionally want to replace existing generated blocks.

```bash
gen-comments src --dry-run
gen-comments src --write
gen-comments src --force --write
```

## Coverage and drift checks

--check fails when public symbols are missing JSDoc. --check-drift fails when existing JSDoc no longer matches the AST. These commands are ideal pull request gates because they tell contributors whether docs were forgotten.

```bash
gen-comments src --check
gen-comments src --check-drift
```

## Lint and fix

--lint validates existing JSDoc content. Add --fix to rewrite issues that can be corrected safely. Keep --fix as a local command or a controlled maintenance script, and keep --lint as the CI command.

```bash
gen-comments src --lint
gen-comments src --lint --fix
```

## gen-docs

Build a static documentation site from documented files. Use --source-url to link symbols back to GitHub, which helps readers jump from docs to implementation.

```bash
gen-docs src --out docs --title "My API" --source-url https://github.com/user/repo/blob/main
```
