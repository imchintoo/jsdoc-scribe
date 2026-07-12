---
slug: features
title: Features
description: A compact map of the main jsdoc-scribe capabilities.
command: gen-comments src --lint --fix
---

## What jsdoc-scribe covers

jsdoc-scribe covers the full documentation lifecycle for JavaScript and TypeScript projects: generate comments, check coverage, detect drift, lint existing docs, fix safe issues, and publish static documentation.

It is for people who want documentation to be part of engineering workflow instead of a separate writing project. Package authors, SDK teams, platform teams, and maintainers can all use it to keep public APIs understandable.

## Comment generation

Generates JSDoc for named functions, classes, methods, interfaces, enums, types, and variables using syntax only. The goal is to create a consistent baseline that humans can review, improve, and keep in source control.

Because generation is deterministic, it is easier to trust in repeatable workflows. There are no AI calls and no network calls during generation.

## Documentation generation

Builds static multi-page documentation with module navigation, symbol cards, search data, and optional quality dashboard data. Static output works well for GitHub Pages, package documentation, and internal portals.

The generated docs are meant to help readers answer practical questions: what exists, what it accepts, what it returns, where it lives, and how it connects to source code.

## Quality tools

Supports check, drift, lint, fix, coverage badges, JSON output, quality reports, import graph analysis, and GitHub source links. These tools help maintainers catch missing or stale documentation before release.

Use checks in CI, use fix locally, and use generated reports when you need a bigger view of documentation health across a project.

## Deterministic by design

No AI calls, no network calls during generation, and the same input should produce the same output. That design makes jsdoc-scribe suitable for regulated repositories, private packages, and CI environments where repeatability matters.
