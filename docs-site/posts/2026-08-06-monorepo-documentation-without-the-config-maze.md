---
slug: monorepo-documentation-without-the-config-maze
title: 'One Docs Site, Every Package: Monorepo Documentation Without the Config Maze'
description: TypeDoc's dedicated monorepo mode still has open issues around cross-package references and per-package config duplication in 2026. Here is what that mode actually requires, and the simpler path jsdoc-scribe already ships for workspace-based repos.
date: 2026-08-06
readingTime: 8 min read
tags: [Monorepo, TypeScript, DeveloperTools, Documentation, PlatformEngineering]
image: ../assets/monorepo-documentation-without-the-config-maze.png
---

If you run a monorepo, you already know the tooling story for 2026 is settled: npm, pnpm, or Yarn workspaces underneath, Turborepo or Nx layered on top for caching and task orchestration. What's noticeably less settled is what happens to documentation once you have twelve packages instead of one. The default answer in most 2026 writeups is still "bolt on a Storybook" or "stand up a separate Next.js docs app that pulls from each package." Documentation gets treated as an app you build next to the monorepo, not something the workspace configuration you already wrote implies.

That gap shows up concretely in the tool most TypeScript teams reach for first.

## What TypeDoc's monorepo mode actually asks of you

TypeDoc, the most widely used TypeScript documentation generator (roughly 1.47M weekly downloads), has a dedicated setting for this: `entryPointStrategy: "packages"`. Point it at `packages/*`, and it runs a full, independent TypeDoc conversion inside each package directory, then merges the resulting outputs into one combined site.

The mechanism is reasonable. The rough edges are the part worth knowing about before you commit to it. TypeDoc's own documentation is explicit that when running in packages mode, "TypeDoc runs with a clean options object for each directory" — meaning configuration set at the monorepo root is not inherited by the child conversions. Anything you want applied consistently (entry point globs, exclude patterns, readme handling) has to be repeated under a `packageOptions` block, once, and kept in sync by hand as packages are added or renamed.

That's the documented behavior. The open GitHub issues describe what goes wrong in practice:

- Cross-package type references frequently don't resolve correctly across the merged output, because each package is converted in isolation before merging (TypeStrong/typedoc #1835).
- There's no built-in way to exclude a single package from the `packages/*` glob — you either document all of them or none, or work around it with directory naming tricks (#1959).
- Users on Nx and other monorepo layouts report inconsistent results generating docs for individual libs versus the whole workspace, because the packages-mode assumptions don't always match how those tools lay out `tsconfig` project references (#2005, #2138).

None of this makes TypeDoc a bad choice for a single package — it remains a solid, widely adopted tool there. It does mean that "we're a monorepo" adds a second layer of configuration and troubleshooting on top of the reference-doc generation you already have to get right once.

## The alternative: let the workspace configuration answer the question once

jsdoc-scribe takes a narrower, more mechanical approach to the same problem, and it starts from a fact your `package.json` already states rather than a directory-glob you have to maintain separately.

Every `gen-docs` run builds an Architecture Insight page automatically — no extra flag — by reading your `package.json` and folder layout directly. One of the signals it checks for is an npm `workspaces` field. If it finds one, the monorepo pattern is reported with the actual evidence (the `workspaces` array itself), and the page lists the workspace packages it found, alongside whatever other architecture signals apply (CLI tool, publishable library, layered/MVC layout — real repos often match more than one, and the page shows all of them rather than forcing a single label). There's no separate monorepo mode to opt into and no separate options object per package to keep synchronized: the same `gen-docs` invocation that documents a single-package project reports the workspace shape for free when one exists.

For the actual multi-package doc build — generating reference pages for each workspace package and publishing them under one site — jsdoc-scribe doesn't try to guess your workspace layout automatically, because layouts vary too much to guess safely. Instead it exposes a programmatic API built for exactly this:

```js
const { generateSite } = require('jsdoc-scribe/docs');

// Run once per workspace package, collect the results,
// and publish them under one site from a single Node script.
for (const pkg of workspacePackages) {
  await generateSite([pkg.srcDir], { projectName: pkg.name });
}
```

This is a documented pattern, not a hidden trick: the programmatic API's own docs describe this exact use case — "a monorepo can collect package folders, run docs generation per package, and publish a combined site from one Node script." The difference from TypeDoc's packages mode isn't capability, it's where the complexity lives. TypeDoc's merge step and per-package options are baked into the tool's own conversion pipeline, which is where the open issues about cross-package references and package exclusion live too. jsdoc-scribe's equivalent is a loop over `generateSite()` calls that you write and fully control — you decide which packages to include, how to order them, and how to name each site section, using plain Node rather than a second layer of tool-specific configuration.

## Why this matters more as the workspace grows

The pain here isn't linear with package count — it's closer to quadratic, because cross-package references are exactly where things break, and cross-package references get more common as a monorepo matures, not less. A workspace with two packages rarely needs one to document a type from the other. A workspace with fifteen packages sharing a `@myorg/types` package almost always does, and that's precisely the case TypeDoc's own issue tracker flags as unreliable in packages mode today.

There's a second, quieter cost: documentation debt compounds unevenly across a monorepo. General monorepo guidance already flags this pattern independent of any specific tool — a single docs folder in a large codebase is hard to maintain, ownership of any one page gets fuzzy fast, and version mismatches between packages updated at different rates make "which doc is current" a real question rather than a rhetorical one. A documentation setup that requires active per-package configuration maintenance is one more thing competing for attention against that drift, on top of the content itself going stale. jsdoc-scribe's `--check-drift` flag on `gen-comments` (compares existing JSDoc blocks against the current AST and exits non-zero on mismatch) at least keeps the second problem — stale comment content — checkable in CI on a per-package basis regardless of how many packages you're documenting; it doesn't solve the first, but it means one less silent failure mode in a repo that already has several.

## What this doesn't solve

To be direct about the limits: jsdoc-scribe's workspace detection tells you *that* you have a monorepo and *what* packages are in it. It does not automatically merge cross-package type references into a single combined reference the way TypeDoc's packages mode attempts to (with the caveats above) — you're writing the orchestration script yourself. For teams that want a single, deeply cross-linked API reference spanning every package with zero custom scripting, TypeDoc's approach, rough edges included, may still be closer to what you want out of the box. The trade-off is the same one that runs through jsdoc-scribe generally: less automatic magic, more visible, editable mechanism.

## Bottom line

If your monorepo's documentation problem is "we don't even know our doc site reflects the fact that we're a monorepo," jsdoc-scribe answers that automatically, today, with zero extra configuration. If your problem is "we need one deeply merged API reference across fifteen interdependent packages," that's a harder problem industry-wide right now, and no tool — TypeDoc included, per its own open issues — has it fully solved without hand-maintained configuration. Knowing which problem you actually have is worth five minutes before you pick a path.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Full docs at the [jsdoc-scribe documentation site](https://imchintoo.github.io/jsdoc-scribe/blog/index.html), package on [npm](https://www.npmjs.com/package/jsdoc-scribe), source on [GitHub](https://github.com/imchintoo/jsdoc-scribe).
