---
slug: the-eslint-rule-that-disappeared
title: 'Your ESLint JSDoc Rule Disappeared in v9 — Here''s What Actually Replaces It'
description: ESLint core dropped require-jsdoc and valid-jsdoc in v9. Here's what fills the gap, why catching documentation drift at PR time beats catching it later, and how jsdoc-scribe's ESLint plugin autofixes 10 of its 12 rules.
date: 2026-07-24
readingTime: 7 min read
tags: [ESLint, JSDoc, TypeScript, DeveloperTools, CI]
image: ../assets/the-eslint-rule-that-disappeared.png
---

If your team upgraded to ESLint 9 sometime in the last while and didn't specifically go looking for it, there's a decent chance you lost JSDoc enforcement without noticing. `require-jsdoc` and `valid-jsdoc` — the two core rules that used to catch a missing or malformed comment block during `eslint .` — were removed from ESLint core as of v9.0.0. No deprecation warning that reads as urgent, no CI failure pointing at the cause. The rule just isn't there anymore, and neither is the check.

This post is a technical deep-dive, not a pitch about philosophy or ROI — we've covered those angles before. This one is for the person actually wiring `eslint.config.js`.

## Why this matters more than a routine rule removal

ESLint's own documentation now points teams at the community-maintained `eslint-plugin-jsdoc` to replace what core dropped. That's a reasonable migration path, but it changes the shape of the problem: JSDoc enforcement is no longer a zero-config default, it's a plugin you have to know to install, configure, and keep current — on every repo, every time someone bootstraps a new service.

The cost of *not* doing that migration isn't abstract. The IBM Systems Sciences Institute's cost-of-defect curve — still the most-cited benchmark in 2026 shift-left discussions — puts a defect caught at design time at roughly 1x cost to fix, at coding time around 6.5x, at testing time about 15x, and in production close to 100x. Documentation gaps follow the same curve even though they're not technically "defects": a missing `@param` caught in the same PR that introduced it is a one-line diff. The same gap discovered by a new hire three weeks into onboarding, or by a technical-diligence reviewer during a raise, is a much more expensive conversation to have — not because the fix is hard, but because of everything that happened in between while nobody had a clear picture of what the function actually did.

Teams that shift checks left generally report 60–90% fewer defects reaching production and 40–60% lower total cost of quality. Nothing about JSDoc coverage is exempt from that logic — it's a data-quality problem, and PR time is still the cheapest place to catch it.

## What jsdoc-scribe's ESLint plugin actually does

`jsdoc-scribe` ships its own flat-config-only ESLint plugin, `eslint-plugin-jsdoc-scribe`, built specifically to enforce the same rules the CLI's own `--lint` flag already validates — so a team doesn't need two separate mental models for "what counts as documented" depending on whether they're running `eslint` or `jsdoc-scribe --lint` directly.

It ships 12 rules total, and 10 of them carry a real ESLint autofixer:

| Rule | What it checks | Fixable |
|---|---|---|
| `require-jsdoc` | Function, arrow function, class, and non-accessor method has a leading JSDoc block | No |
| `require-param` | Every parameter has a matching `@param` | Yes |
| `require-param-description` | Every `@param` has a description | Yes |
| `check-param-names` | `@param` order matches the actual parameter order | Yes |
| `require-returns` | A function that returns a value has `@returns` | Yes |
| `require-returns-description` | `@returns` has a description | Yes |
| `require-returns-check` | `@returns` isn't present on a function that never returns | Yes |
| `require-description` | Every block has a description, not just tags | Yes |
| `check-tag-names` | Every `@tag` is a recognized tag, not a typo | No |
| `empty-tags` | Tags like `@readonly`/`@private` don't carry trailing text | Yes |
| `no-multi-asterisks` | No stray `**` inside a comment line | Yes |
| `no-blank-block-descriptions` | A JSDoc block isn't entirely empty | Yes |

Two rules are deliberately never auto-fixed, and the reasoning is worth understanding rather than treating as a gap. `require-jsdoc` doesn't get a fixer because inserting a brand-new block from scratch is `gen-comments --write`'s job, not a lint rule's — mixing "flag it" and "generate a full new block" into one code path was judged a worse design than keeping them separate. `check-tag-names` never auto-fixes an unrecognized tag like `@parm` because there's no safe default to rename it to; guessing the author's intent would break the project's own "no AI, no guessing" rule for itself.

Where a fixer *is* provided, missing prose gets a fixed, deterministic placeholder — never invented text:

```
TODO: describe what this does.
TODO: describe parameter "name".
TODO: describe the return value.
```

Same string every time for the same kind of gap, which means `grep -r "TODO: describe"` finds every placeholder the fixer left behind, in order, across the whole repo. That's a meaningfully different guarantee than an AI-based fixer that writes something plausible-sounding for a function it's never actually seen run.

## Getting it running

> **Update (2026-08-07):** `eslint-plugin-jsdoc-scribe` isn't published to npm yet -- it currently
> only ships inside this repo's own workspace. The command below is aspirational until that
> changes; see the [ESLint Plugin Integration](../docs/eslint-plugin.html) doc for how to use it
> today.

```bash
npm install --save-dev eslint-plugin-jsdoc-scribe
```

Requires `eslint@>=9.0.0` — flat config only, no `.eslintrc` support in this version. Recommended config:

```js
const jsdocScribe = require("eslint-plugin-jsdoc-scribe");

module.exports = [
  jsdocScribe.configs.recommended,
];
```

Or pick rules individually and stage severity by folder:

```js
module.exports = [
  {
    plugins: { "jsdoc-scribe": jsdocScribe },
    rules: {
      "jsdoc-scribe/require-jsdoc": "warn",
      "jsdoc-scribe/require-param": "error",
      "jsdoc-scribe/require-returns": "error",
    },
  },
];
```

For a codebase with a lot of legacy undocumented code, the practical rollout is: warnings everywhere, errors on new packages immediately, then flip old packages to errors once `gen-comments --write` has generated a baseline for them and `eslint --fix` has cleared the mechanical gaps. Run `eslint --fix` and every fixable finding across the repo gets rebuilt from the real function signature — real parameter names, real order, whether the function actually returns something — merged with whatever valid prose already existed. A block with zero lint issues is never touched.

## Where the line sits between the CLI and the plugin

One CLI-only rule, `no-bad-blocks`, isn't in the ESLint plugin at all — it depends on jsdoc-scribe's TypeScript-Compiler-API malformed-comment detection, which has no equivalent in ESLint's own AST model. And `require-returns`/`require-returns-check` behave slightly differently between the two: the CLI reads an actual TypeScript return-type annotation to decide whether a function "really" returns something, while the ESLint plugin — which also has to work against plain `.js` files with no type checker available — infers it by checking whether the function body contains a `return <expr>;`. Both are deterministic; they're just working from different signals depending on which tool is running.

## The bottom line

ESLint quietly moving JSDoc enforcement out of core is a good excuse to actually look at where documentation checks live in your pipeline, not just patch the gap and move on. The version worth setting up is the one that runs at PR time, autofixes what it safely can, and never guesses at prose it can't verify — because the alternative isn't "no cost," it's a cost paid later, by someone else, at a worse moment.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Full docs, including the ESLint plugin reference, live at [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/docs/quick-start.html). Package on npm as [`jsdoc-scribe`](https://www.npmjs.com/package/jsdoc-scribe), source at [github.com/imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe).
