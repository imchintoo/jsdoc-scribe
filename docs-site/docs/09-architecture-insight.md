---
slug: architecture-insight
title: Architecture Insight
description: gen-docs now maps your folder structure and detects your stack, right inside the generated site.
command: gen-docs src --out docs
---

## What it is

Every `gen-docs` run now looks at the project it is documenting -- not just the source files you point it at -- and builds an **Architecture** page inside the generated site. It answers the three questions a new contributor (human or AI agent) usually has to answer by hand: what kind of project is this, what is it built with, and how is it organized.

This is read straight off your `package.json` and folder layout. There is no AI involved and nothing is guessed: every line on the page says exactly what it found and where, so you can verify it yourself in seconds.

## What shows up

- **What kind of project is this** -- pattern signals like CLI tool, publishable library, monorepo, or a layered/MVC-style layout, each shown with the actual evidence (a `bin` entry, an `exports` field, an npm `workspaces` list, matching directory names) rather than a single confident label. Real projects usually match more than one pattern at once, and the page shows that plainly instead of forcing a single answer.
- **What it's built with** -- frameworks detected from your dependencies (React, Next.js, Angular, Vue, Express, NestJS), each marked as a dependency match or a lower-confidence file-pattern guess so you always know how sure the tool is.
- **How it's organized** -- a collapsible folder tree with a plain-English file-count summary per directory, plus your npm workspace packages if the repo is a monorepo.

## Why it's there

Documentation is usually written for "what does this function do." This page is for the question that comes before that: "what am I even looking at." A new team member, a contractor picking up a repo for the first time, or an AI coding agent orienting itself in an unfamiliar codebase can open one page and get an accurate, evidence-backed map instead of reading `package.json` and guessing.

## When it appears

The Architecture page is generated automatically -- no new flag needed. If your project has nothing meaningful to report (a truly empty structure with zero detectable signals), the page and its sidebar link are simply left out rather than shown empty. It also never appears on a historical version snapshot, since those represent a past `docs/` output, not the live state of your repo today.
