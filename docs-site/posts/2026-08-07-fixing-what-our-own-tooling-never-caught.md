---
slug: fixing-what-our-own-tooling-never-caught
title: 'The Changelog Page Was Silently Hiding 24 Releases — What We Found Auditing Our Own Tooling'
description: A full self-audit of jsdoc-scribe's own repo turned up a hardcoded 220-line cap quietly truncating the public changelog, a release that shipped with no changelog entry, a plugin whose install instructions 404, one real npm vulnerability, and zero ESLint or Prettier setup on the codebase itself. Here is every fix, and exactly how to use the result.
date: 2026-08-07
readingTime: 10 min read
tags: [ESLint, Prettier, ChangeLog, DeveloperTools, OpenSource, Maintenance]
image: ../assets/fixing-what-our-own-tooling-never-caught.png
---

We build a tool whose entire pitch is "deterministic, verifiable, nothing invented." So it's a fair question to ask what happens when you point that same standard back at the project itself — not the code `gen-docs` documents, but the repo `gen-docs` lives in. Today we did exactly that, end to end: audited the public docs site, the npm dependency tree, and the total absence of a linting setup on our own source. Four real problems came out of it, none of them cosmetic. This post is the detailed record of what was broken, why, and — since the point of writing any of this down is that someone else can use it — exactly how to use the result today.

## The changelog page was quietly truncating itself

The GitHub Pages changelog (`/docs/changelog.html`) is supposed to render straight from `CHANGELOG.md` — no separate hand-maintained copy, no drift between what's in the repo and what's on the public site. That was the entire design intent when the page shipped back in `2.4.5`. What it actually did, since that same commit, was this:

```js
const excerpt = source.split(/\r?\n/).slice(0, 220).join("\n");
```

A hardcoded cap at the first 220 lines of the file, before handing it to the markdown renderer. On a small changelog that's invisible — you'd never notice the cap exists. On this project's real `CHANGELOG.md`, which has grown to 33 released versions and 550+ lines, 220 lines covers roughly the newest eight or nine releases and silently drops everything older than that. Anyone who opened the public changelog page looking for what changed in, say, `1.9.0` or `2.1.0` would find nothing — not an error, not a "load more" link, just a page that stopped mid-history with no indication it was incomplete. The page's own copy claimed to show "the complete release history." It didn't.

The fix removes the cap entirely:

```js
const html = markdownToHtml(source, { headingOffset: 1, maxHeadingLevel: 3 });
```

We verified this the only way that actually counts for a bug like this — not by reading the diff and assuming it's right, but by running `node scripts/build-pages-docs.js` and grepping the output:

```bash
grep -oE '<h3>\[[^]]*\]' _site/docs/changelog.html | wc -l
# 33
```

All 33 versions, from the newest release down to `1.4.0`. Before the fix, that same command returned 9.

## A release that shipped with no changelog entry at all

While tracing the truncation bug we found a second, unrelated gap sitting right next to it: the most recent patch release (`2.5.1`, a README rewrite and a preview-image format swap) had bumped `package.json`'s version field and merged to `main` with **zero corresponding lines in `CHANGELOG.md`**. Not a thin entry, not a placeholder — nothing. A real, published version with no record of what changed in it.

This is the second time this exact class of gap has happened on this project; back in July, six earlier versions (`2.4.1`, `2.4.3` through `2.4.7`) had to be reconstructed retroactively from git history for the same reason. The pattern is clear enough to name directly: a version bump and a changelog update are two separate manual steps, and it's easy to do one without the other when they're not enforced together. We added the missing `2.5.1` entry, grounded in the actual PR diff rather than reconstructed from memory — same standard the July backfill used. The longer-term fix isn't written yet: a CI check that fails a release if `package.json`'s version changed but `CHANGELOG.md` didn't is the obvious next step, and it's now tracked as a real follow-up instead of something we'll rediscover the next time this happens.

## Zero vulnerabilities, one honest dependency fix

`npm audit` flagged one real issue: `brace-expansion`, a transitive dependency several layers down (`code-multivitals` → `@typescript-eslint/typescript-estree` → `minimatch` → `brace-expansion`), carrying a high-severity denial-of-service advisory — an unbounded expansion length that can crash a process on malicious input ([GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg), [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895)). The registry's own fix is a two-patch bump, `5.0.7` to `5.0.9`, and `npm audit fix` confirmed it as a clean, non-breaking resolution before we applied it. `npm audit` now reports zero vulnerabilities against the full dependency tree, dev and runtime both.

Worth being precise about what this vulnerability could and couldn't have touched: `brace-expansion` sits underneath `code-multivitals`, an optional peer dependency only ever loaded when someone explicitly passes `--quality` to `gen-docs`. It was never reachable through `gen-comments` or a default `gen-docs` run. Still a real fix worth shipping — an unused attack surface is still an attack surface — just not one that changes anything about the tool's default behavior.

## ESLint and Prettier, running against our own rules

This is the biggest structural change, and the most overdue one. Despite `eslint-plugin-jsdoc-scribe` existing as a shipped package in this monorepo, and despite the CLI's own README describing `--lint` in terms of "the same category of checks `eslint-plugin-jsdoc`'s recommended config does" — nothing in this repository actually ran ESLint, or Prettier, against `lib/`, `bin/`, or `scripts/`. The plugin had its own `eslint` devDependency, but purely to run its own `RuleTester` suite against itself. The project that ships a JSDoc linter had never linted itself with it.

Fixing that meant answering a design question first: what rules, exactly? The decision was to add nothing beyond what the plugin already ships. Root `eslint.config.js` now does exactly one thing:

```js
const jsdocScribe = require("eslint-plugin-jsdoc-scribe");

module.exports = [
    { ignores: [/* generated output, sample fixtures, node_modules */] },
    jsdocScribe.configs.recommended
];
```

No project-specific overrides, no bespoke severity tuning, no second config layered on top. The plugin's `configs.recommended` preset is the same one documented in its own README and used by anyone installing it externally — running it here, unmodified, is the actual test of whether that preset holds up against a real, non-trivial codebase rather than a hand-picked example.

`eslint-plugin-jsdoc-scribe` isn't published to npm — more on that below — so it's resolved through npm workspaces instead:

```json
"devDependencies": {
    "eslint-plugin-jsdoc-scribe": "^0.2.0"
}
```

Because `packages/eslint-plugin-jsdoc-scribe` is a workspace member with a matching version, npm resolves that dependency to the local package directly. No registry round-trip, no publish step required for this to work.

**How to use it today**, if you're working in this repo:

```bash
npm run eslint          # lint lib/, bin/, scripts/, packages/*
npm run eslint:fix      # apply what's auto-fixable
npm run format          # prettier --write .
npm run format:check    # prettier --check ., no writes
```

Running `eslint .` against the full tree for the first time surfaced 543 findings — the large majority of them `require-jsdoc` warnings on test files, which were never held to the same documentation standard as shipped source, plus a small number of genuinely interesting false positives: a handful of `check-tag-names` errors on comments that use `@tag` or `@enum-style` as literal example text inside a doc-comment explaining what an unrecognized tag looks like. Neither category blocks anything right now. Both ESLint and Prettier run in CI (`test.yml`'s new `lint` job) in report-only mode — `continue-on-error: true` — deliberately, because there's no team-agreed baseline yet for what should actually fail a PR. That's the same rollout pattern already established for `quality.yml`'s code-multivitals integration: ship it visible first, decide on a real gate once a few runs have actually been reviewed.

Prettier's `--check` flagged 24 files that would reformat under the new `.prettierrc.json` (4-space indent, double quotes, matching the codebase's existing convention). We deliberately didn't run `--write` across all 24 in the same change — a repo-wide reformat mixed into a bug-fix diff makes the actual fix hard to review. That's queued as its own single-purpose commit.

## The install command that was always going to fail

Here's the finding that started this whole audit: `eslint-plugin-jsdoc-scribe` returns a plain 404 from `registry.npmjs.org`.

```bash
curl -s https://registry.npmjs.org/eslint-plugin-jsdoc-scribe
# {"error":"Not found"}
```

It has never been published as a standalone package. And yet four separate places in this repository told a reader to run `npm install --save-dev eslint-plugin-jsdoc-scribe`: the plugin's own README, the root project README, the GitHub Pages "ESLint Plugin Integration" doc, and a blog post from two weeks ago about the plugin itself. Every one of those instructions would fail the moment someone actually tried them outside this repo.

The decision here was deliberately not to publish it standalone right now — the workspace-resolution setup above is sufficient for the one place it's actually used, and a second published package is a second thing to version, tag, and keep in sync with the main one. Instead, all four references were corrected to say plainly what's true today: this package lives inside the `jsdoc-scribe` monorepo, is consumed via npm workspaces, and the only way to use it outside this repo right now is to clone the repo and reference `packages/eslint-plugin-jsdoc-scribe` directly, or copy the directory into your own project.

If that changes — if there's ever a real, external, non-monorepo consumer who needs it as an independent install — publishing it is a small, well-understood step: its own `package.json` is already correctly scoped (`files`, `main`, `exports`, `peerDependencies` on `eslint@>=9.0.0`), and the root project's existing `publish.yml` (OIDC trusted publishing, no stored npm token) is a direct template to copy. Just not today, and not silently implied by four pieces of documentation that were quietly wrong.

## What's actually supported, spelled out instead of implied

The last piece was less a bug than a gap in onboarding. `gen-docs`'s Architecture Insight page has, since `2.5.0`, detected six frameworks from a project's real dependencies — React, Next.js, Angular, Vue, Express, and NestJS, each backed by actual `package.json` evidence, not a guess. None of that was surfaced anywhere a new reader would see it before installing. The root README talked about "real-world sample code" in the abstract without saying which stacks were actually represented or where to find them.

The README now has a direct **Supported** section, laid out as a straightforward table: each detected stack, exactly what dependency or file-extension evidence triggers detection, and a direct link to a real fixture under `sample/` to try it against immediately.

| Stack | Try it |
|---|---|
| React | [`sample/react/`](https://github.com/imchintoo/jsdoc-scribe/tree/main/sample/react) |
| Next.js | [`sample/nextjs/`](https://github.com/imchintoo/jsdoc-scribe/tree/main/sample/nextjs) |
| Angular | [`sample/angular/`](https://github.com/imchintoo/jsdoc-scribe/tree/main/sample/angular) |
| Express | [`sample/express/`](https://github.com/imchintoo/jsdoc-scribe/tree/main/sample/express) |
| NestJS | [`sample/nestjs/`](https://github.com/imchintoo/jsdoc-scribe/tree/main/sample/nestjs) |
| Plain JavaScript | [`sample/vanilla-js/`](https://github.com/imchintoo/jsdoc-scribe/tree/main/sample/vanilla-js) |
| Plain TypeScript | [`sample/*.ts`](https://github.com/imchintoo/jsdoc-scribe/tree/main/sample) (top-level) |

One entry is listed honestly rather than padded out: Vue is detected (via the `vue` dependency or `.vue` file extensions), but there's no dedicated `sample/vue/` fixture yet, unlike the other five. Better to say that directly than let a reader click through to a folder that isn't there.

## How to use everything above, right now

If you're pulling `jsdoc-scribe` fresh today, nothing about the CLI itself changed — `gen-comments` and `gen-docs` behave exactly as before:

```bash
npx jsdoc-scribe . --write            # insert missing JSDoc, no install
npm install --save-dev jsdoc-scribe   # add it to your project
gen-docs sample --out docs --quality  # try it against a real fixture from the table above
```

If you're working *in* this repo specifically, the new commands worth knowing:

```bash
npm audit                # confirm: 0 vulnerabilities
npm run eslint            # lint against eslint-plugin-jsdoc-scribe's own rules
npm run format:check      # see what Prettier would change, without changing it
npm run docs:pages        # rebuild the GitHub Pages site locally, changelog now complete
```

And if you're evaluating whether to adopt the ESLint plugin pattern for your own project: the workspace-resolution approach here — declare the plugin as a `devDependency` pointing at a local workspace package instead of a published one — is a reasonable pattern to borrow directly if you're building a lint plugin alongside the tool it lints, before you're ready to commit to publishing and versioning it as its own artifact.

None of these four fixes change what the CLI outputs for a documented file. What they change is whether the project's own public surface — its changelog, its install instructions, its lint story, its README — actually tells the truth about itself. For a tool whose whole premise is "verify, don't guess," that's not a side project. It's the same standard, just pointed inward for a day.

Full docs: [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/docs/quick-start.html). Package on npm: [`jsdoc-scribe`](https://www.npmjs.com/package/jsdoc-scribe). Source: [github.com/imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe).
