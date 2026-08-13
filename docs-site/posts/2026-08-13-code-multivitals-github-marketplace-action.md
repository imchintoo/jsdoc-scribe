---
slug: code-multivitals-github-marketplace-action
title: 'code-multivitals Is Now a GitHub Marketplace Action — Here''s What Actually Changes'
description: code-multivitals just went live on GitHub Marketplace as a composite Action. Not a repackaging exercise — a genuinely different distribution model from the peerDependency jsdoc-scribe has used internally since Track C, and we dogfooded it in our own CI the same day it shipped.
date: 2026-08-13
readingTime: 7 min read
tags: [GitHubActions, CodeQuality, CI/CD, DeveloperTools, OpenSource]
---

`code-multivitals` — the JS/TS code quality analyzer jsdoc-scribe has been quietly depending on since Track C — is now listed on [GitHub Marketplace](https://github.com/marketplace/actions/code-multivitals) as a proper Action, `imchintoo/code-multivitals@v1`, category code-quality. That's a distribution change, not a feature change, and it's worth being precise about the difference, because we already had code-multivitals wired into this repo one way before today. This post is about the second way, and why both are staying.

## The way we already had it

`gen-docs --quality` has called code-multivitals as a `peerDependency` since Track C shipped in July — opt-in, dynamically `require()`'d, zero cost to anyone who doesn't pass the flag. `package.json` declares it under `peerDependenciesMeta` with `optional: true` specifically so `npm install jsdoc-scribe` never pulls it in uninvited. `.github/workflows/quality.yml` runs it the same way in this repo's own CI: `node bin/gen-docs.js lib bin packages/eslint-plugin-jsdoc-scribe --quality --quality-reporter sarif`, uploaded to Code Scanning, deliberately non-blocking until the team picks real thresholds.

That path proves gen-docs's integration works. It doesn't prove the standalone Action works, because it never goes near the Action — it calls code-multivitals as a library, directly, from inside jsdoc-scribe's own process.

## The way that's new today

A Marketplace listing means anyone — using jsdoc-scribe or not, writing JS/TS or not caring what generates their docs — can drop this into a workflow file with zero `npm install`:

```yaml
- uses: imchintoo/code-multivitals@v1
  with:
    patterns: '"lib/**/*.js" "bin/**/*.js"'
    reporter: sarif
    max-errors: '0'
```

No dependency in `package.json`, no lockfile entry, nothing to keep in sync with a version bump — the Action pins its own Node setup and installs its own tooling inside `github.action_path`. That's a fundamentally different shape of dependency than the peerDependency route: one lives in your dependency tree, the other lives entirely in your workflow file.

It's worth noting what "composite" means here, because it's a deliberate choice, not the default: `code-multivitals`'s `action.yml` uses `runs.using: composite` instead of `using: node20`. The action's own dist output is gitignored — never committed — so a `node20`-style action (which expects a pre-built `main` entry point already sitting in the tagged ref) wouldn't work at all. Composite mode runs `npm ci && npm run build` fresh on every invocation, straight from source, via the exact same `scripts/build.mjs` pipeline that builds the published npm package. The Action and the package are never two things that can drift out of sync — there's only one build.

## What we did with it, same day

We didn't just read the listing and move on. `.github/workflows/marketplace-action.yml` now runs the real Marketplace Action against this repo's own source — a second, independent CI signal alongside `quality.yml`, verifying the *published listing* end-to-end rather than the library call path:

```yaml
- name: Run code-multivitals via the published Marketplace Action
  id: quality
  continue-on-error: true
  uses: imchintoo/code-multivitals@v1
  with:
    patterns: '"lib/**/*.js" "bin/**/*.js" "packages/eslint-plugin-jsdoc-scribe/**/*.js"'
    reporter: console
    max-errors: '999'
    max-warnings: '999'
```

Non-blocking, same reasoning as `quality.yml`: this repo hasn't agreed on real error/warning thresholds for its own source yet, so a fresh CI signal doesn't get to fail merges on day one. What it does get to do is publish a job summary — average health, average maintainability index, error/warning/clone counts — pulled straight from the Action's typed outputs (`average-health`, `average-mi`, `error-count`, `warn-count`, `clone-count`) rather than scraped from log text. That's a small thing, but it's the kind of small thing that only exists because the Action defines real outputs instead of just an exit code.

## Why bother running both

It would be easy to treat the Marketplace listing as cosmetic — same tool, new badge, ship it — and skip actually exercising it. We didn't, for one specific reason: a Marketplace Action is a promise to strangers. Someone who's never heard of jsdoc-scribe can land on that listing page and add three lines to their workflow file expecting it to work. The only way to know it actually does — build step included, composite runner included, output wiring included — is to run it somewhere real and watch it produce real numbers. Our own repo was the closest "somewhere real" available, and it was already generating the exact kind of quality signal this Action is built to report.

There's also a trust dimension that's easy to skip past. `runs.using: composite` means every consumer's CI run does `npm ci && npm run build` against whatever's on the `v1` tag at that moment, not against a pre-built artifact someone reviewed once and forgot about. That's a deliberate trade: it guarantees the Action and the npm package can never quietly drift apart, but it also means a consumer is trusting the tagged ref's source tree fresh on every single run, not a pinned build. Worth knowing before you point CI at any composite Action, this one included — pin to a full commit SHA instead of `@v1` if that trust model doesn't sit right for your pipeline.

## The knobs, if you're deciding how to configure it

Beyond `patterns` and `reporter`, the Action exposes a `profile` input (`strict | default | relaxed`) that maps to code-multivitals's own threshold presets, plus explicit override knobs: `max-errors`, `max-warnings`, `max-clones`, and `min-duplicate-lines` for clone detection sensitivity. `max-errors` defaults to `0` — meaning out of the box, on a fresh repo, this Action fails the job the moment it finds one function over threshold. That default is the right one for a project that's already clean; it's the wrong one to adopt blindly on day one against an existing codebase with years of accumulated complexity, which is exactly why our own workflow sets `max-errors`/`max-warnings` high rather than inheriting the strict default. `save-baseline`/`baseline` exist for the middle ground — snapshot today's numbers, then only fail on regressions from here, without needing every historical function to already be clean.

The two workflows will probably converge eventually — once the team has enough non-blocking runs from both to agree on thresholds, one of them likely becomes the blocking gate and the other stays as a secondary check, or `quality.yml` itself gets rewritten to call the Action instead of the raw library. Not today. Today the useful thing was proving the listing works against a codebase with actual, willing-to-be-embarrassing errors in it — not a curated demo repo built to pass.

## If you're deciding which route to use

If your project already depends on jsdoc-scribe (or any Node project that can `npm install` code-multivitals as a devDependency), the library/peerDependency route stays the right default — richer options like `--quality-baseline`/`--quality-snapshot` for trend tracking are easier to script that way. If you're not a Node project at all, or you just want a code-quality gate on a repo without touching its dependency tree, the Marketplace Action is the one-file, zero-install answer. We use both. They're not competing — they're testing two different promises against the same tool.

Either way, start on `relaxed` or with `max-errors`/`max-warnings` set loose, let a few non-blocking runs tell you what your actual numbers look like, and only tighten the gate once you've seen real data from your own repo. That's the same sequencing we're following in our own CI before we flip either workflow to blocking — the fastest way to a threshold nobody trusts is picking one before you've looked at a single real report.
