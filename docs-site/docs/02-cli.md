---
slug: cli
title: CLI Usage
description: Use gen-comments, gen-docs, lint, and fix from the terminal or CI.
command: gen-docs src --out docs
---

## gen-comments

Generate JSDoc comments from source files. By default it writes sibling .out files for review; --write edits files in place.

```bash
gen-comments src --dry-run
gen-comments src --write
gen-comments src --force --write
```

## Coverage and drift checks

--check fails when public symbols are missing JSDoc. --check-drift fails when existing JSDoc no longer matches the AST.

```bash
gen-comments src --check
gen-comments src --check-drift
```

## Lint and fix

--lint validates existing JSDoc content. Add --fix to rewrite issues that can be corrected safely.

```bash
gen-comments src --lint
gen-comments src --lint --fix
```

## gen-docs

Build a static documentation site from documented files. Use --source-url to link symbols back to GitHub.

```bash
gen-docs src --out docs --title "My API" --source-url https://github.com/user/repo/blob/main
```
