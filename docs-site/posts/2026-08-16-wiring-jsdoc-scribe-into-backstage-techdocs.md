---
slug: wiring-jsdoc-scribe-into-backstage-techdocs
title: 'MkDocs Is Being Replaced Under Backstage TechDocs — Fix the Staleness Gap While You''re in the Config'
description: Backstage TechDocs is migrating off an end-of-life MkDocs toward Zensical, which means every team running it now has a reason to open mkdocs.yml and catalog-info.yaml before November 2026. Here is exactly how to use that same visit to wire in generated, drift-checked documentation.
date: 2026-08-16
readingTime: 7 min read
tags: [PlatformEngineering, Backstage, DevOps, Documentation, TechDocs, DeveloperTools]
image: ../assets/wiring-jsdoc-scribe-into-backstage-techdocs.png
---

If your team runs Backstage TechDocs, you have a reason to open `mkdocs.yml` and `catalog-info.yaml` sometime in the next few months whether you want to or not. On April 17, 2026, Backstage's TechDocs maintainers opened [RFC #33990](https://github.com/backstage/backstage/issues/33990) proposing a replacement for the engine TechDocs is built on. The reason is blunt: MkDocs has been effectively unmaintained since its last 1.x release in August 2024, its proposed 2.0 rewrite drops the plugin system entirely (breaking `mkdocs-techdocs-core` along with 300-plus other plugins), and [Material for MkDocs](https://github.com/squidfunk/mkdocs-material/issues/8523) — the theme TechDocs renders with — entered maintenance mode on November 5, 2025 and reaches end of life exactly one year later, November 5, 2026. After that, no committed maintenance, only fixes for exceptional circumstances.

The proposed successor is [Zensical](https://github.com/zensical/zensical), a ground-up rewrite from the same team that built Material for MkDocs. The good news is it reads `mkdocs.yml` natively, so existing Markdown, template overrides, and config mostly carry over unchanged. The less convenient news is that "mostly unchanged" still means every team with a TechDocs setup has a concrete, dated reason to go back into that config before the clock runs out.

That forced touch-point is worth using for something more than a version bump.

## The gap TechDocs never actually closed

TechDocs solves one specific problem well: *where* documentation lives. Markdown sits next to the service in the same repo, ships in the same pull request, gets the same code review as the implementation. That's a real improvement over docs scattered across a wiki nobody remembers to update.

What it doesn't solve is *whether the docs are still true*. Nothing in the TechDocs pipeline checks that a Markdown page describing an API still matches the API's actual current shape. A page can be perfectly co-located, perfectly reviewed at merge time, and six months stale the moment the underlying code changes without a matching doc update — because nothing forces that second commit to happen. Co-location fixes a logistics problem, not a correctness problem.

This is exactly the gap generated documentation is built to close, and it's a mechanical fix rather than a cultural one: instead of asking every engineer to remember to update a Markdown page by hand, a tool reads the actual AST of the actual source file on every run and produces documentation from what's really there. There's no separate "did someone remember" step to fail.

## What jsdoc-scribe actually generates

Worth being precise here, because TechDocs and jsdoc-scribe don't slot together as directly as a "just point TechDocs at it" pitch would suggest. TechDocs' `docs_dir` expects a folder of Markdown source files that MkDocs (soon Zensical) builds into HTML. jsdoc-scribe's `gen-docs` CLI doesn't produce Markdown — it walks your TypeScript/JavaScript source with the TypeScript compiler API (used purely as a parser, no LLM calls, nothing leaves the machine or CI runner) and builds a complete static HTML documentation site directly: module pages, an automatic Architecture Insight page describing folder structure and detected framework/architecture patterns, and an optional `--quality` code-health dashboard if the `code-multivitals` peer dependency is installed.

So the honest integration isn't "make jsdoc-scribe output feed the TechDocs Markdown pipeline" — it's running both side by side and linking them, which is a supported, first-class pattern in Backstage's own catalog format.

## The concrete setup

**1. Generate the site in CI, gated on drift.** Add a step ahead of (or parallel to) your TechDocs build:

```bash
npx gen-comments . --check-drift      # CI gate: fail the build if JSDoc has drifted from the AST
npx gen-docs . --out ./generated-docs # build the HTML site (module pages + Architecture Insight)
```

`--check-drift` is the `gen-comments` CLI's gate, and it's the piece that matters most here — it's what turns this from a one-time generation step into an enforced check. If someone changes a function's signature without the corresponding doc comment catching up, the build fails instead of quietly shipping a stale page.

**2. Publish the generated site.** This repo's own docs site already runs a GitHub Actions + Pages workflow that does exactly this on every push to `main` (covered in an earlier post on this blog) — the same pattern works for an internal artifact bucket or static host if Pages isn't an option internally.

**3. Add it as a linked entity in `catalog-info.yaml`**, using Backstage's standard `metadata.links` field rather than the TechDocs-specific annotation, since this is a separately-built HTML site, not Markdown source for TechDocs to render:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  links:
    - url: https://internal-docs.example.com/my-service/
      title: Generated API Docs (Architecture Insight)
      icon: docs
  annotations:
    backstage.io/techdocs-ref: dir:.
spec:
  type: service
  # ...
```

The `techdocs-ref: dir:.` annotation stays exactly as it is today — that's your existing hand-written Markdown, unaffected by any of this. The `links` entry is additive: it puts the generated, drift-checked site one click away from the same entity page, without asking anyone to restructure the TechDocs docs they already have.

**4. Do this while you're already touching `mkdocs.yml` for the Zensical transition.** That's the actual point of the timing. Nobody opens a working config file to add an unrelated feature. Everyone running TechDocs is about to open this one anyway, for a reason that has nothing to do with documentation freshness. Piggybacking a five-minute addition onto a migration that's already mandatory is a much easier sell than a cold pitch to touch infrastructure that currently isn't broken from anyone's perspective.

## What this doesn't claim to be

This isn't a TechDocs plugin, and jsdoc-scribe doesn't ship one. It's a generated artifact linked next to TechDocs' Markdown output, kept honest by a CI gate. If a native Zensical/TechDocs plugin path for AST-generated content becomes viable later, that's a different, larger integration — worth watching given the RFC explicitly asks the community for edge cases and gaps, but not something to build ahead of an actual need.

## Bottom line

The MkDocs-to-Zensical migration gives every TechDocs-running team a real, dated reason to open their doc config in the next few months. That's a better moment than most to also close the gap TechDocs never solved — not by replacing anything, but by linking a generated, drift-checked site next to the Markdown that's already there.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

More at the [docs site](https://imchintoo.github.io/jsdoc-scribe/blog/index.html), on [npm](https://www.npmjs.com/package/jsdoc-scribe), and on [GitHub](https://github.com/imchintoo/jsdoc-scribe).
